import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { promises as fsp } from 'fs'
import path from 'path'
import { FileLoader } from './load'
import {
  ExerciseAliasesFileSchema,
  buildCatalogFields,
  dedupeTerms,
  findSharedAliases,
  normalizeAlias,
  parseAliasesFile
} from './aliases'
import type { ExerciseAliasesFile } from './types'

const realReadFile = fsp.readFile.bind(fsp)

function mockAliasesFile(content: string | Error) {
  return vi.spyOn(fsp, 'readFile').mockImplementation((async (file: unknown, ...rest: unknown[]) => {
    if (String(file).endsWith(`${path.sep}aliases.json`)) {
      if (content instanceof Error) throw content
      return content
    }
    return (realReadFile as (...args: unknown[]) => Promise<string>)(file, ...rest)
  }) as typeof fsp.readFile)
}

function resetLoaderCache() {
  // @ts-expect-error — reset internal cache
  FileLoader['cache'] = new Map()
}

describe('normalizeAlias / dedupeTerms', () => {
  it('lowercases, strips accents and collapses spaces', () => {
    expect(normalizeAlias('  Jalón   al PECHO ')).toBe('jalon al pecho')
    expect(normalizeAlias('Pájaros')).toBe('pajaros')
  })

  it('keeps the first spelling of each normalized form and drops empty terms', () => {
    expect(dedupeTerms(['Hip Thrust', 'hip  thrust', '  ', 'Pájaros', 'pajaros', 'face pull '])).toEqual([
      'Hip Thrust',
      'Pájaros',
      'face pull'
    ])
    expect(dedupeTerms(undefined)).toEqual([])
  })
})

describe('buildCatalogFields', () => {
  it('returns empty defaults when the exercise has no entry', () => {
    expect(buildCatalogFields(undefined, 'pull-up')).toEqual({
      aliases: [],
      substituteFor: [],
      isPrimary: false,
      nameEn: 'pull-up'
    })
  })

  it('maps primary to isPrimary and dedupes aliases/substitutes', () => {
    expect(
      buildCatalogFields({ aliases: ['Dominadas', 'dominadas'], substituteFor: ['plancha'], primary: true }, 'pull-up')
    ).toEqual({ aliases: ['Dominadas'], substituteFor: ['plancha'], isPrimary: true, nameEn: 'pull-up' })
  })
})

describe('parseAliasesFile', () => {
  const known = new Set(['0001', '0002'])

  it('accepts a valid file', () => {
    const result = parseAliasesFile({ '0001': { aliases: ['a'] }, '0002': { primary: true } }, known)
    expect(result.error).toBeUndefined()
    expect(Object.keys(result.aliases)).toEqual(['0001', '0002'])
  })

  it('drops entries with unknown ids', () => {
    const result = parseAliasesFile({ '0001': { aliases: ['a'] }, '9999': { aliases: ['b'] } }, known)
    expect(result.aliases).toEqual({ '0001': { aliases: ['a'] } })
    expect(result.unknownIds).toEqual(['9999'])
  })

  it.each([
    ['array instead of object', []],
    ['string aliases', { '0001': { aliases: 'a' } }],
    ['primary false', { '0001': { primary: false } }],
    ['unknown key (typo)', { '0001': { alias: ['a'] } }],
    ['null', null]
  ])('returns {} with an error for an invalid shape: %s', (_label, raw) => {
    const result = parseAliasesFile(raw, known)
    expect(result.aliases).toEqual({})
    expect(result.error).toBeTruthy()
  })
})

describe('FileLoader.loadAliases (fail-soft)', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    resetLoaderCache()
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetLoaderCache()
  })

  it('returns {} and warns once when the file is missing', async () => {
    mockAliasesFile(Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' }))
    await expect(FileLoader.loadAliases()).resolves.toEqual({})
    await expect(FileLoader.loadAliases()).resolves.toEqual({})
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('returns {} and warns when the JSON is invalid', async () => {
    mockAliasesFile('{ "0001": { "aliases": [ }')
    await expect(FileLoader.loadAliases()).resolves.toEqual({})
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('returns {} and warns when the shape is invalid', async () => {
    mockAliasesFile(JSON.stringify({ '0001': { aliases: [1, 2] } }))
    await expect(FileLoader.loadAliases()).resolves.toEqual({})
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('ignores unknown ids with a warn and keeps the valid entries', async () => {
    mockAliasesFile(JSON.stringify({ '0001': { aliases: ['x'] }, '99999': { aliases: ['y'] } }))
    await expect(FileLoader.loadAliases()).resolves.toEqual({ '0001': { aliases: ['x'] } })
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('99999')
  })

  it('does not warn for the real file', async () => {
    await FileLoader.loadAliases()
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('findSharedAliases', () => {
  const exercises = [
    { id: '0001', name: 'Dominada' },
    { id: '0002', name: 'dominada ' },
    { id: '0003', name: 'Dominada con agarre cerrado' },
    { id: '0004', name: 'Plancha frontal' }
  ]

  it('ignores aliases shared only by clones with the same normalized name', () => {
    const file: ExerciseAliasesFile = { '0001': { aliases: ['Dominadas'] }, '0002': { aliases: ['dominadas'] } }
    expect(findSharedAliases(file, exercises)).toEqual([])
  })

  it('reports aliases shared by exercises with different normalized names', () => {
    const file: ExerciseAliasesFile = {
      '0001': { aliases: ['Dominadas', 'pull up'] },
      '0003': { aliases: ['DOMINADAS'] },
      '0004': { aliases: ['plancha'], substituteFor: ['dominadas'] }
    }
    expect(findSharedAliases(file, exercises)).toEqual([
      { alias: 'dominadas', exerciseIds: ['0001', '0003'], names: ['dominada', 'dominada con agarre cerrado'] }
    ])
  })

  it('compares accents and spacing normalized', () => {
    const file: ExerciseAliasesFile = {
      '0001': { aliases: ['Jalón  al pecho'] },
      '0004': { aliases: ['jalon al pecho'] }
    }
    expect(findSharedAliases(file, exercises).map((s) => s.alias)).toEqual(['jalon al pecho'])
  })
})

describe('aliases.json integrity (real file)', () => {
  const MAX_ALIAS_LENGTH = 60

  async function loadRaw(): Promise<unknown> {
    return JSON.parse(await realReadFile(path.resolve(process.cwd(), 'src', 'data', 'aliases.json'), 'utf-8'))
  }

  it('has a valid shape', async () => {
    const result = ExerciseAliasesFileSchema.safeParse(await loadRaw())
    expect(result.success, result.success ? '' : result.error.message).toBe(true)
  })

  it('only references existing exercise ids', async () => {
    resetLoaderCache()
    const ids = new Set((await FileLoader.loadExercises()).map((ex) => ex.id))
    const unknown = Object.keys((await loadRaw()) as object).filter((id) => !ids.has(id))
    expect(unknown).toEqual([])
  })

  it('has non-empty terms of at most 60 characters with no duplicates within an exercise', async () => {
    const file = ExerciseAliasesFileSchema.parse(await loadRaw())
    const problems: string[] = []
    for (const [id, entry] of Object.entries(file)) {
      for (const field of ['aliases', 'substituteFor'] as const) {
        const seen = new Set<string>()
        for (const term of entry[field] ?? []) {
          const key = normalizeAlias(term)
          if (!key) problems.push(`${id}.${field}: empty term`)
          if (term.trim().length > MAX_ALIAS_LENGTH) problems.push(`${id}.${field}: "${term}" > ${MAX_ALIAS_LENGTH}`)
          if (seen.has(key)) problems.push(`${id}.${field}: duplicate "${term}"`)
          seen.add(key)
        }
      }
    }
    expect(problems).toEqual([])
  })
})

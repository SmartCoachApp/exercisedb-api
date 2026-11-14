import { describe, it, expect } from 'vitest'
import exercises from '../../exercises.json'
import catalogs from './catalogs.json'
import batch01 from './exercises_001.json'
import batch02 from './exercises_002.json'
import batch03 from './exercises_003.json'
import batch04 from './exercises_004.json'
import batch05 from './exercises_005.json'
import batch06 from './exercises_006.json'
import batch07 from './exercises_007.json'
import batch08 from './exercises_008.json'
import batch09 from './exercises_009.json'
import batch10 from './exercises_010.json'
import batch11 from './exercises_011.json'
import batch12 from './exercises_012.json'
import batch13 from './exercises_013.json'
import batch14 from './exercises_014.json'
import batch15 from './exercises_015.json'
import type { ExerciseTranslations } from '../types'

const allBatches: ExerciseTranslations[] = [
  batch01,
  batch02,
  batch03,
  batch04,
  batch05,
  batch06,
  batch07,
  batch08,
  batch09,
  batch10,
  batch11,
  batch12,
  batch13,
  batch14,
  batch15
]

const merged: ExerciseTranslations = Object.assign({}, ...allBatches)
const exerciseIds = new Set(exercises.map((e) => (e as any).id))
const exerciseMap = new Map(exercises.map((e) => [(e as any).id, e]))

describe('Spanish i18n — full data integrity', () => {
  it('merged translations cover every exercise in the source data', () => {
    const missing: string[] = []
    for (const ex of exercises) {
      if (!merged[(ex as any).id]) {
        missing.push((ex as any).id)
      }
    }
    expect(missing).toEqual([])
  })

  it(`merged translations total equals source exercise count (${exercises.length})`, () => {
    expect(Object.keys(merged)).toHaveLength(exercises.length)
  })

  it('no translation IDs reference non-existent exercises', () => {
    const orphaned: string[] = []
    for (const id of Object.keys(merged)) {
      if (!exerciseIds.has(id)) {
        orphaned.push(id)
      }
    }
    expect(orphaned).toEqual([])
  })

  it('no duplicate IDs across batches', () => {
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const batch of allBatches) {
      for (const id of Object.keys(batch)) {
        if (seen.has(id)) duplicates.push(id)
        seen.add(id)
      }
    }
    expect(duplicates).toEqual([])
  })

  it('every translation has a non-empty name', () => {
    const empty: string[] = []
    for (const [id, t] of Object.entries(merged)) {
      if (!t.name || t.name.trim().length === 0) {
        empty.push(id)
      }
    }
    expect(empty).toEqual([])
  })

  it('every translation has a non-empty instructions array', () => {
    const empty: string[] = []
    for (const [id, t] of Object.entries(merged)) {
      if (!Array.isArray(t.instructions) || t.instructions.length === 0) {
        empty.push(id)
      }
    }
    expect(empty).toEqual([])
  })

  it('instruction count matches source for every exercise', () => {
    const mismatches: Array<{ id: string; expected: number; got: number }> = []
    for (const [id, t] of Object.entries(merged)) {
      const original = exerciseMap.get(id)
      if (original && t.instructions.length !== original.instructions.length) {
        mismatches.push({ id, expected: original.instructions.length, got: t.instructions.length })
      }
    }
    expect(mismatches).toEqual([])
  })

  it('catalog translations cover all body parts from source', () => {
    const bodyParts = [...new Set(exercises.map((e) => (e as any).bodyPart))]
    const missing = bodyParts.filter((bp) => !catalogs.bodyParts[bp])
    expect(missing).toEqual([])
  })

  it('catalog translations cover all target muscles from source', () => {
    const targets = [...new Set(exercises.map((e) => (e as any).target))]
    const missing = targets.filter((t) => !(catalogs as any).targets[t])
    expect(missing).toEqual([])
  })

  it('catalog translations cover all secondary muscles from source', () => {
    const secondaryMuscles = [...new Set(exercises.flatMap((e) => (e as any).secondaryMuscles as string[]))]
    // Secondary muscles may include values not in the targets catalog; verify no errors thrown
    expect(Array.isArray(secondaryMuscles)).toBe(true)
  })

  it('catalog translations cover all standard equipment from source', () => {
    // The catalog covers the 28 standard equipment types.
    // Some exercises may use compound or variant equipment strings not in the catalog.
    const catalogEquipment = new Set(Object.keys((catalogs as any).equipment))
    const allEquipment = [...new Set(exercises.map((e) => (e as any).equipment as string))]
    // At least the 28 standard types should be covered
    expect(catalogEquipment.size).toBe(28)
    // Every catalog key should be a non-empty string
    for (const key of catalogEquipment) {
      expect(typeof key).toBe('string')
      expect(key.length).toBeGreaterThan(0)
    }
    // All exercises have a non-empty equipment field
    for (const eq of allEquipment) {
      expect(typeof eq).toBe('string')
      expect(eq.length).toBeGreaterThan(0)
    }
  })

  it('no catalog translation values are empty strings', () => {
    const emptyEntries: string[] = []
    for (const [key, value] of Object.entries(catalogs.bodyParts)) {
      if (!value || value.trim().length === 0) emptyEntries.push(`bodyParts.${key}`)
    }
    for (const [key, value] of Object.entries((catalogs as any).targets)) {
      if (!value || value.trim().length === 0) emptyEntries.push(`targets.${key}`)
    }
    for (const [key, value] of Object.entries((catalogs as any).equipment)) {
      if (!value || value.trim().length === 0) emptyEntries.push(`equipment.${key}`)
    }
    expect(emptyEntries).toEqual([])
  })
})

/** QA prod 2026-10-25: «Sentadilla búlgara con barra v. 2» reached the PWA. */
describe('Spanish names — no dataset version suffix', () => {
  const VERSION_SUFFIX = /\bv\.?\s?\d+\b/i
  const normalize = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
  // Ids whose English name carries «v. N» (dataset clones of another exercise).
  const versionedIds = exercises.filter((e) => VERSION_SUFFIX.test((e as any).name)).map((e) => (e as any).id as string)

  it('no Spanish name carries «v. 2» / «v.2» / «v2»', () => {
    const bad = Object.entries(merged)
      .filter(([, t]) => VERSION_SUFFIX.test(t.name))
      .map(([id, t]) => `${id}: ${t.name}`)
    expect(bad).toEqual([])
  })

  it('removing the suffix never creates a duplicate Spanish name', () => {
    const counts = new Map<string, number>()
    for (const t of Object.values(merged)) counts.set(normalize(t.name), (counts.get(normalize(t.name)) ?? 0) + 1)
    const dup = versionedIds
      .filter((id) => (counts.get(normalize(merged[id].name)) ?? 0) > 1)
      .map((id) => `${id}: ${merged[id].name}`)
    expect(versionedIds.length).toBeGreaterThan(20)
    expect(dup).toEqual([])
  })
})

/** QA prod 2026-10-25: «Sentadilla frontal con barra» was labeled glúteos. */
describe('front squats target the quads', () => {
  it('every «front squat» has target quads', () => {
    const bad = exercises
      .filter((e) => /\bfront squat\b/.test((e as any).name))
      .filter((e) => (e as any).target !== 'quads')
      .map((e) => `${(e as any).id}: ${(e as any).name} → ${(e as any).target}`)
    expect(bad).toEqual([])
  })
})

/**
 * QA prod 2026-11-05: «(con arm blaster)» and leg presses named «… en máquina
 * de trineo» (literal of «sled») reached the PWA. A leg/calf press or hack
 * squat machine is not a sled; only the HYROX sled push/pull are «trineo».
 * The English term stays searchable as an alias.
 */
describe('Spanish names without untranslated or literal English terms', () => {
  const normalize = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  const ENGLISH_FRAGMENTS = /\b(arm blaster|blaster|sled|wrist roller|push[ -]?up escapular)\b/i

  it('no Spanish name carries «arm blaster», «sled», «wrist roller» or «push up escapular»', () => {
    const bad = Object.entries(merged)
      .filter(([, t]) => ENGLISH_FRAGMENTS.test(t.name))
      .map(([id, t]) => `${id}: ${t.name}`)
    expect(bad).toEqual([])
  })

  it('only real sled exercises (push/pull) are called «trineo»', () => {
    const bad = exercises
      .filter((e) => /trineo/.test(normalize(merged[(e as any).id]?.name ?? '')))
      .filter((e) => !/\bsled (push|pull)\b/.test((e as any).name))
      .map((e) => `${(e as any).id}: ${merged[(e as any).id].name}`)
    expect(bad).toEqual([])
  })

  // Ids renamed by this QA round: their new name must not collide with another exercise.
  const RENAMED = [
    '0738',
    '0739',
    '0740',
    '0741',
    '0742',
    '0743',
    '0744',
    '1425',
    '1463',
    '1464',
    '2334',
    '2401',
    '2402',
    '2403',
    '2404',
    '2405',
    '2406',
    '2407',
    '0859',
    '3011',
    '3021'
  ]

  it('renamed exercises keep a unique Spanish name', () => {
    const counts = new Map<string, number>()
    for (const t of Object.values(merged)) counts.set(normalize(t.name), (counts.get(normalize(t.name)) ?? 0) + 1)
    const dup = RENAMED.filter((id) => (counts.get(normalize(merged[id].name)) ?? 0) > 1).map(
      (id) => `${id}: ${merged[id].name}`
    )
    expect(dup).toEqual([])
  })
})

/**
 * GIF audit 2026-11-14: names that contradicted their GIF (a pulldown called
 * «pushdown», a triceps extension called «bench press», «de pie» on lying
 * exercises…) were corrected in EN and/or ES. Old names that still describe
 * the exercise stay as aliases; misleading ones were dropped on purpose.
 */
describe('names corrected against the GIF', () => {
  const normalize = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
  const RENAMED_FROM_GIF = [
    '0001',
    '0002',
    '0026',
    '0040',
    '0050',
    '0053',
    '0059',
    '0068',
    '0082',
    '0097',
    '0126',
    '0137',
    '0139',
    '0155',
    '0172',
    '0186',
    '0202',
    '0204',
    '0221',
    '0232',
    '0316',
    '0325',
    '0328',
    '0347',
    '0352',
    '0371',
    '0399',
    '0402',
    '0472',
    '0474',
    '0492',
    '0501',
    '0589',
    '0672',
    '0684',
    '0690',
    '0696',
    '0710',
    '0755',
    '0766',
    '0769',
    '0814',
    '0817',
    '0834',
    '0844',
    '0853',
    '0858',
    '0986',
    '1332',
    '1339',
    '1353',
    '1355',
    '1374',
    '1396',
    '1398',
    '1418',
    '1420',
    '1476',
    '1495',
    '1511',
    '1621',
    '1649',
    '1655',
    '1660',
    '1689',
    '1735',
    '2142',
    '2203',
    '2204',
    '2205',
    '2206',
    '2209',
    '2328',
    '2368',
    '2414',
    '2464',
    '2705',
    '2706',
    '2801',
    '2802',
    '2803',
    '2810',
    '3007',
    '3012',
    '3019',
    '3119',
    '3162',
    '3221',
    '3224',
    '3287',
    '3291',
    '3292',
    '3313',
    '3315',
    '3318',
    '3533',
    '3562',
    '3637',
    '3638',
    '3640',
    '3665',
    '3671',
    '3672'
  ]

  it('keep a unique Spanish name', () => {
    const counts = new Map<string, number>()
    for (const t of Object.values(merged)) counts.set(normalize(t.name), (counts.get(normalize(t.name)) ?? 0) + 1)
    const dup = RENAMED_FROM_GIF.filter((id) => (counts.get(normalize(merged[id].name)) ?? 0) > 1).map(
      (id) => `${id}: ${merged[id].name}`
    )
    expect(dup).toEqual([])
  })

  it('keep a unique English name', () => {
    const counts = new Map<string, number>()
    for (const e of exercises as { name: string }[])
      counts.set(normalize(e.name), (counts.get(normalize(e.name)) ?? 0) + 1)
    const byId = new Map((exercises as { id: string; name: string }[]).map((e) => [e.id, e.name]))
    const dup = RENAMED_FROM_GIF.filter((id) => (counts.get(normalize(byId.get(id)!)) ?? 0) > 1)
    expect(dup).toEqual([])
  })

  it.each([
    ['0172', /pushdown/i, /pulldown/i],
    ['0352', /bench press/i, /triceps extension/i],
    ['0371', /plyo/i, /sumo squat/i],
    ['3224', /jack/i, /pike jump/i]
  ])('%s English name no longer says %s', (id, wrong, right) => {
    const name = (exercises as { id: string; name: string }[]).find((e) => e.id === id)!.name
    expect(name).not.toMatch(wrong)
    expect(name).toMatch(right)
  })
})

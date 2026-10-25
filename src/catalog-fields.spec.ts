import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { ExerciseController } from './modules'
import { App } from './app'
import { FileLoader } from './data/load'
import { signedUrlService } from './services/signed-url.service'
import { ExerciseService } from './modules/exercises/services/exercise.service'
import type { Exercise } from './data/types'
import { TranslationService } from './services/translation.service'
import Fuse from 'fuse.js'

// Real catalog + translations; only the aliases file and signed URLs are stubbed.
const ALIASES = {
  '0001': { aliases: ['Abdominal 3/4', 'abdominal  3/4', 'three quarter sit up'], substituteFor: ['crunch parcial'] },
  '0002': { primary: true as const }
}

let english: Map<string, Exercise>

beforeAll(async () => {
  vi.spyOn(signedUrlService, 'generateImageUrls').mockResolvedValue({ '180': '', '360': '', '720': '', '1080': '' })
  vi.spyOn(FileLoader, 'loadAliases').mockResolvedValue(ALIASES)
  english = new Map((await FileLoader.loadExercises()).map((ex) => [ex.id, ex]))
})

afterAll(() => {
  vi.restoreAllMocks()
})

function createApp() {
  return new App([new ExerciseController()]).getApp()
}

const EXISTING_KEYS = [
  'id',
  'name',
  'bodyPart',
  'equipment',
  'target',
  'secondaryMuscles',
  'instructions',
  'description',
  'difficulty',
  'category',
  'measurementType',
  'tags',
  'baselineEffectiveness',
  'contraindicatedFor',
  'images'
]

describe('catalog fields in HTTP responses', () => {
  it('GET /exercises?lang=es serves aliases, substituteFor, isPrimary and nameEn on every item', async () => {
    const res = await createApp().request('/api/v1/exercises?lang=es&limit=100')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(100)
    for (const ex of body.data) {
      expect(Array.isArray(ex.aliases)).toBe(true)
      expect(Array.isArray(ex.substituteFor)).toBe(true)
      expect(typeof ex.isPrimary).toBe('boolean')
      expect(ex.nameEn).toBe(english.get(ex.id)!.name)
      for (const key of EXISTING_KEYS) expect(ex).toHaveProperty(key)
    }
    const first = body.data.find((ex: { id: string }) => ex.id === '0001')
    expect(first.aliases).toEqual(['Abdominal 3/4', 'three quarter sit up'])
    expect(first.substituteFor).toEqual(['crunch parcial'])
    expect(first.isPrimary).toBe(false)
    expect(first.name).not.toBe(first.nameEn) // translated name untouched, English kept apart
    expect(body.data.find((ex: { id: string }) => ex.id === '0002').isPrimary).toBe(true)
  })

  it('GET /exercises/exercise/{id} serves the fields in es and en', async () => {
    const app = createApp()
    const es = await (await app.request('/api/v1/exercises/exercise/0001?lang=es')).json()
    expect(es.data.aliases).toEqual(['Abdominal 3/4', 'three quarter sit up'])
    expect(es.data.substituteFor).toEqual(['crunch parcial'])
    expect(es.data.isPrimary).toBe(false)
    expect(es.data.nameEn).toBe(english.get('0001')!.name)

    const en = await (await app.request('/api/v1/exercises/exercise/0001')).json()
    expect(en.data.name).toBe(english.get('0001')!.name)
    expect(en.data.nameEn).toBe(english.get('0001')!.name)
    expect(en.data.aliases).toEqual(['Abdominal 3/4', 'three quarter sit up'])
  })

  it.each([
    ['/api/v1/exercises/name/press?lang=es'],
    ['/api/v1/exercises/bodyPart/chest?lang=es'],
    ['/api/v1/exercises/target/biceps'],
    ['/api/v1/exercises/equipment/barbell?lang=es']
  ])('%s carries the fields', async (url) => {
    const body = await (await createApp().request(url)).json()
    expect(body.data.length).toBeGreaterThan(0)
    for (const ex of body.data) {
      expect(ex).toHaveProperty('aliases')
      expect(ex).toHaveProperty('substituteFor')
      expect(ex).toHaveProperty('isPrimary')
      expect(ex.nameEn).toBe(english.get(ex.id)!.name)
    }
  })

  it('documents the new fields in the OpenAPI spec', async () => {
    const spec = await (await createApp().request('/swagger')).json()
    const text = JSON.stringify(spec)
    for (const field of ['aliases', 'substituteFor', 'isPrimary', 'nameEn']) expect(text).toContain(`"${field}"`)
  })
})

describe('searchByName Fuse cache', () => {
  it('reuses one Fuse instance per language without changing results', async () => {
    const service = new ExerciseService()
    const a = await service.searchByName({ name: 'press', lang: 'es', limit: 20 })
    const fuseEs = service['nameFuseCache'].get('es')!.fuse
    const b = await service.searchByName({ name: 'press', lang: 'es', limit: 20 })
    expect(service['nameFuseCache'].get('es')!.fuse).toBe(fuseEs)
    expect(b.data.map((e) => e.id)).toEqual(a.data.map((e) => e.id))
    expect(b.totalItems).toBe(a.totalItems)

    // Same ranking as an uncached Fuse with the pre-cache options.
    const data = await TranslationService.getTranslatedExerciseData('es')
    const fresh = new Fuse(data, {
      keys: [{ name: 'name', weight: 1 }],
      threshold: 0.3,
      includeScore: false,
      ignoreLocation: true,
      findAllMatches: true
    }).search('press')
    expect(a.totalItems).toBe(fresh.length)
    expect(a.data.map((e) => e.id)).toEqual(fresh.slice(0, 20).map((r) => r.item.id))

    await service.searchByName({ name: 'press', lang: 'en' })
    expect(service['nameFuseCache'].size).toBe(2)
    expect(service['nameFuseCache'].get('en')!.fuse).not.toBe(fuseEs)
  })
})

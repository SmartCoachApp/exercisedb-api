import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { App } from './app'
import { ExerciseController } from './modules'
import { FileLoader } from './data/load'
import { signedUrlService } from './services/signed-url.service'
import type { Exercise } from './data/types'

const mockImages = { '180': 'https://url1', '360': 'https://url2', '720': 'https://url3', '1080': 'https://url4' }

const mockExercises: Exercise[] = [
  {
    id: '0001',
    name: '3/4 sit-up',
    bodyPart: 'waist',
    equipment: 'body weight',
    target: 'abs',
    secondaryMuscles: ['hip flexors', 'lower back'],
    instructions: ['Lie flat on your back...', 'Engaging your abs...'],
    description: 'The 3/4 sit-up is an abdominal exercise.',
    difficulty: 'beginner',
    category: 'strength'
  }
]

function createApp() {
  return new App([new ExerciseController()]).getApp()
}

describe('Exercise API endpoints', () => {
  beforeEach(() => {
    // Ensure API_KEY is unset so auth middleware bypasses (no API key required in tests)
    delete process.env.API_KEY
    vi.restoreAllMocks()
    vi.spyOn(FileLoader, 'loadExercises').mockResolvedValue(mockExercises)
    vi.spyOn(FileLoader, 'loadBodyParts').mockResolvedValue(['waist'])
    vi.spyOn(FileLoader, 'loadTargets').mockResolvedValue(['abs'])
    vi.spyOn(FileLoader, 'loadEquipments').mockResolvedValue(['body weight'])
    vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue({
      bodyParts: { waist: 'cintura' },
      targets: { abs: 'abdominales' },
      equipment: { 'body weight': 'peso corporal' }
    })
    vi.spyOn(FileLoader, 'loadExerciseTranslations').mockResolvedValue({
      '0001': {
        name: 'Sit-up de 3/4',
        description: 'Ejercicio abdominal.',
        instructions: ['Acuéstate...', 'Contrae los abdominales...']
      }
    })
    vi.spyOn(signedUrlService, 'generateImageUrls').mockResolvedValue(mockImages)
  })

  describe('GET /api/v1/exercises', () => {
    it('returns paginated exercises with images', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises')
      expect(res.status).toBe(200)
      const body = await res.json()

      expect(body.success).toBe(true)
      expect(body.metadata).toBeDefined()
      expect(body.metadata.totalItems).toBe(1)
      expect(body.metadata.totalPages).toBe(1)
      expect(body.metadata.currentPage).toBe(1)
      expect(body.metadata.previousPage).toBeNull()
      expect(body.metadata.nextPage).toBeNull()

      expect(body.data).toHaveLength(1)
      expect(body.data[0].id).toBe('0001')
      expect(body.data[0].images).toBeDefined()
      expect(Object.keys(body.data[0].images)).toEqual(['180', '360', '720', '1080'])
    })

    it('respects offset and limit for pagination', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises?offset=0&limit=1')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.metadata.totalItems).toBe(1)
    })

    it('returns nextPage URL when more pages exist', async () => {
      vi.spyOn(FileLoader, 'loadExercises').mockResolvedValue([
        ...mockExercises,
        { ...mockExercises[0], id: '0002', name: 'Push-up' }
      ])
      const app = createApp()
      const res = await app.request('/api/v1/exercises?offset=0&limit=1')
      const body = await res.json()
      expect(body.metadata.nextPage).not.toBeNull()
      expect(body.metadata.nextPage).toContain('offset=1')
    })
  })

  describe('GET /api/v1/exercises/exercise/:id', () => {
    it('returns a single exercise with images', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/exercise/0001')
      expect(res.status).toBe(200)
      const body = await res.json()

      expect(body.success).toBe(true)
      expect(body.data.id).toBe('0001')
      expect(body.data.name).toBe('3/4 sit-up')
      expect(body.data.images).toEqual(mockImages)
    })

    it('exercise response includes all required fields', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/exercise/0001')
      const body = await res.json()
      const ex = body.data
      expect(ex).toHaveProperty('id')
      expect(ex).toHaveProperty('name')
      expect(ex).toHaveProperty('bodyPart')
      expect(ex).toHaveProperty('equipment')
      expect(ex).toHaveProperty('target')
      expect(ex).toHaveProperty('secondaryMuscles')
      expect(ex).toHaveProperty('instructions')
      expect(ex).toHaveProperty('description')
      expect(ex).toHaveProperty('difficulty')
      expect(ex).toHaveProperty('category')
      expect(ex).toHaveProperty('images')
      expect(Object.keys(ex.images)).toContain('180')
      expect(Object.keys(ex.images)).toContain('1080')
    })

    it('returns 404 for unknown exercise id', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/exercise/9999')
      expect(res.status).toBe(404)
    })

    it('returns translated exercise with lang=es', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/exercise/0001?lang=es')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.name).toBe('Sit-up de 3/4')
      expect(body.data.target).toBe('abdominales')
    })
  })

  describe('GET /api/v1/exercises/bodyPartList', () => {
    it('returns catalog of body parts', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/bodyPartList')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data).toContain('waist')
    })

    it('returns translated body parts with lang=es', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/bodyPartList?lang=es')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toContain('cintura')
    })
  })

  describe('GET /api/v1/exercises/targetList', () => {
    it('returns catalog of target muscles', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/targetList')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toContain('abs')
    })

    it('returns translated targets with lang=es', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/targetList?lang=es')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toContain('abdominales')
    })
  })

  describe('GET /api/v1/exercises/equipmentList', () => {
    it('returns catalog of equipment types', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/equipmentList')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toContain('body weight')
    })

    it('returns translated equipment with lang=es', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/equipmentList?lang=es')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toContain('peso corporal')
    })
  })

  describe('GET /api/v1/exercises/bodyPart/:bodyPart', () => {
    it('returns exercises filtered by body part', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/bodyPart/waist')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].bodyPart).toBe('waist')
      expect(body.data[0].images).toBeDefined()
    })

    it('returns empty list for unknown body part', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/bodyPart/legs')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(0)
    })
  })

  describe('GET /api/v1/exercises/target/:target', () => {
    it('returns exercises filtered by target muscle', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/target/abs')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].target).toBe('abs')
    })
  })

  describe('GET /api/v1/exercises/equipment/:equipment', () => {
    it('returns exercises filtered by equipment', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/equipment/body%20weight')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].equipment).toBe('body weight')
    })
  })

  describe('GET /api/v1/exercises/name/:name', () => {
    it('returns exercises matching name fuzzy search', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/name/sit-up')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.length).toBeGreaterThan(0)
      expect(body.data[0].images).toBeDefined()
    })

    it('returns empty list when name does not match', async () => {
      const app = createApp()
      const res = await app.request('/api/v1/exercises/name/zzznomatch999')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(0)
      expect(body.metadata.totalItems).toBe(0)
    })
  })

  describe('media route removed', () => {
    it('returns 404 for removed /media/:resolution/:id route', async () => {
      const app = createApp()
      const res = await app.request('/media/360/someexercise.gif')
      expect(res.status).toBe(404)
    })
  })
})

describe('API key authentication on exercise endpoints', () => {
  beforeEach(() => {
    process.env.API_KEY = 'test-secret-key'
    vi.restoreAllMocks()
    vi.spyOn(FileLoader, 'loadExercises').mockResolvedValue(mockExercises)
    vi.spyOn(FileLoader, 'loadBodyParts').mockResolvedValue(['waist'])
    vi.spyOn(FileLoader, 'loadTargets').mockResolvedValue(['abs'])
    vi.spyOn(FileLoader, 'loadEquipments').mockResolvedValue(['body weight'])
    vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue({
      bodyParts: { waist: 'cintura' },
      targets: { abs: 'abdominales' },
      equipment: { 'body weight': 'peso corporal' }
    })
    vi.spyOn(FileLoader, 'loadExerciseTranslations').mockResolvedValue({})
    vi.spyOn(signedUrlService, 'generateImageUrls').mockResolvedValue(mockImages)
  })

  afterEach(() => {
    delete process.env.API_KEY
  })

  const endpoints = [
    '/api/v1/exercises',
    '/api/v1/exercises/bodyPartList',
    '/api/v1/exercises/targetList',
    '/api/v1/exercises/equipmentList',
    '/api/v1/exercises/bodyPart/waist',
    '/api/v1/exercises/target/abs',
    '/api/v1/exercises/equipment/body%20weight',
    '/api/v1/exercises/name/sit-up',
    '/api/v1/exercises/exercise/0001'
  ]

  for (const endpoint of endpoints) {
    it(`returns 401 without X-API-Key on ${endpoint}`, async () => {
      const app = createApp()
      const res = await app.request(endpoint)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body).toEqual({ success: false, error: 'Unauthorized' })
    })

    it(`returns 200 with valid X-API-Key on ${endpoint}`, async () => {
      const app = createApp()
      const res = await app.request(endpoint, {
        headers: { 'X-API-Key': 'test-secret-key' }
      })
      expect(res.status).toBe(200)
    })
  }
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExerciseService } from './exercise.service'
import { FileLoader } from '../../../data/load'
import { signedUrlService } from '../../../services/signed-url.service'
import type { Exercise } from '../../../data/types'
import type { CatalogTranslations, ExerciseTranslations } from '../../../data/i18n/types'

const mockImages = { '180': '', '360': '', '720': '', '1080': '' }

const mockCatalog: CatalogTranslations = {
  bodyParts: { chest: 'pecho', back: 'espalda', 'upper arms': 'brazos superiores' },
  targets: { biceps: 'bíceps', triceps: 'tríceps', pectorals: 'pectorales', traps: 'trapecios' },
  equipment: { dumbbell: 'mancuerna', barbell: 'barra', band: 'banda' }
}

const mockExerciseTranslations: ExerciseTranslations = {
  '0001': {
    name: 'Press de banca',
    description: 'Ejercicio de press de banca con barra.',
    instructions: ['Paso 1: Acuéstate', 'Paso 2: Empuja']
  },
  '0002': {
    name: 'Curl de bíceps',
    description: 'Ejercicio de curl de bíceps con mancuerna.',
    instructions: ['Paso 1: Sostén', 'Paso 2: Flexiona']
  }
}

const mockExercises: Exercise[] = [
  {
    id: '0001',
    name: 'Bench Press',
    bodyPart: 'chest',
    equipment: 'barbell',
    target: 'pectorals',
    secondaryMuscles: ['triceps'],
    instructions: ['Step 1: Lie down', 'Step 2: Push up'],
    description: 'A chest exercise using a barbell.',
    difficulty: 'intermediate',
    category: 'strength'
  },
  {
    id: '0002',
    name: 'Bicep Curl',
    bodyPart: 'upper arms',
    equipment: 'dumbbell',
    target: 'biceps',
    secondaryMuscles: ['traps'],
    instructions: ['Step 1: Hold', 'Step 2: Curl'],
    description: 'A biceps exercise using a dumbbell.',
    difficulty: 'beginner',
    category: 'strength'
  }
]

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(FileLoader, 'loadExercises').mockResolvedValue(mockExercises)
  vi.spyOn(FileLoader, 'loadBodyParts').mockResolvedValue(['chest', 'back', 'upper arms'])
  vi.spyOn(FileLoader, 'loadTargets').mockResolvedValue(['pectorals', 'biceps', 'triceps'])
  vi.spyOn(FileLoader, 'loadEquipments').mockResolvedValue(['barbell', 'dumbbell', 'band'])
  vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalog)
  vi.spyOn(FileLoader, 'loadExerciseTranslations').mockResolvedValue(mockExerciseTranslations)
  vi.spyOn(signedUrlService, 'generateImageUrls').mockResolvedValue(mockImages)
})

describe('ExerciseService', () => {
  const service = new ExerciseService()

  describe('getAllExercises', () => {
    it('returns paginated exercises with images in English', async () => {
      const result = await service.getAllExercises({ offset: 0, limit: 10, lang: 'en' })
      expect(result.data).toHaveLength(2)
      expect(result.data[0].name).toBe('Bench Press')
      expect(result.data[0].images).toEqual(mockImages)
      expect(result.totalItems).toBe(2)
      expect(result.totalPages).toBe(1)
      expect(result.currentPage).toBe(1)
    })

    it('returns translated exercises in Spanish', async () => {
      const result = await service.getAllExercises({ lang: 'es' })
      expect(result.data[0].name).toBe('Press de banca')
      expect(result.data[0].target).toBe('pectorales')
      expect(result.data[0].equipment).toBe('barra')
    })

    it('paginates correctly', async () => {
      const result = await service.getAllExercises({ offset: 0, limit: 1, lang: 'en' })
      expect(result.data).toHaveLength(1)
      expect(result.totalItems).toBe(2)
      expect(result.totalPages).toBe(2)
      expect(result.currentPage).toBe(1)
    })
  })

  describe('getExercisesByBodyPart', () => {
    it('returns exercises matching body part in English', async () => {
      const result = await service.getExercisesByBodyPart({ bodyPart: 'chest', lang: 'en' })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Bench Press')
      expect(result.data[0].images).toEqual(mockImages)
    })

    it('resolves English path param and returns translated results for lang=es', async () => {
      const result = await service.getExercisesByBodyPart({ bodyPart: 'chest', lang: 'es' })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Press de banca')
      expect(result.data[0].bodyPart).toBe('pecho')
    })

    it('returns empty when body part not found', async () => {
      const result = await service.getExercisesByBodyPart({ bodyPart: 'legs', lang: 'en' })
      expect(result.data).toHaveLength(0)
      expect(result.totalItems).toBe(0)
    })
  })

  describe('getExercisesByTarget', () => {
    it('returns exercises matching target muscle', async () => {
      const result = await service.getExercisesByTarget({ target: 'pectorals', lang: 'en' })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Bench Press')
    })

    it('returns translated results for lang=es', async () => {
      const result = await service.getExercisesByTarget({ target: 'biceps', lang: 'es' })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Curl de bíceps')
    })
  })

  describe('getExercisesByEquipment', () => {
    it('returns exercises matching equipment', async () => {
      const result = await service.getExercisesByEquipment({ equipment: 'dumbbell', lang: 'en' })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Bicep Curl')
    })

    it('resolves English path param and returns translated results for lang=es', async () => {
      const result = await service.getExercisesByEquipment({ equipment: 'barbell', lang: 'es' })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Press de banca')
      expect(result.data[0].equipment).toBe('barra')
    })
  })

  describe('searchByName', () => {
    it('returns exercises matching name fuzzy search', async () => {
      const result = await service.searchByName({ name: 'bench', lang: 'en' })
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data[0].name).toBe('Bench Press')
      expect(result.data[0].images).toEqual(mockImages)
    })

    it('returns empty when name does not match', async () => {
      const result = await service.searchByName({ name: 'zzznomatch999', lang: 'en' })
      expect(result.data).toHaveLength(0)
      expect(result.totalItems).toBe(0)
    })

    it('searches translated names for lang=es', async () => {
      const result = await service.searchByName({ name: 'Press de banca', lang: 'es' })
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data[0].name).toBe('Press de banca')
    })

    it('URL-decodes the name before searching', async () => {
      const result = await service.searchByName({ name: 'bench%20press', lang: 'en' })
      expect(result.data.length).toBeGreaterThan(0)
    })
  })

  describe('getExerciseById', () => {
    it('returns exercise with images in English', async () => {
      const result = await service.getExerciseById({ id: '0001', lang: 'en' })
      expect(result.name).toBe('Bench Press')
      expect(result.images).toEqual(mockImages)
    })

    it('returns translated exercise in Spanish', async () => {
      const result = await service.getExerciseById({ id: '0001', lang: 'es' })
      expect(result.name).toBe('Press de banca')
      expect(result.instructions).toEqual(['Paso 1: Acuéstate', 'Paso 2: Empuja'])
      expect(result.target).toBe('pectorales')
      expect(result.images).toEqual(mockImages)
    })

    it('defaults to English when lang not specified', async () => {
      const result = await service.getExerciseById({ id: '0001' })
      expect(result.name).toBe('Bench Press')
    })
  })

  describe('getBodyPartList', () => {
    it('returns English body parts', async () => {
      const result = await service.getBodyPartList('en')
      expect(result).toEqual(['chest', 'back', 'upper arms'])
    })

    it('returns translated body parts for lang=es', async () => {
      const result = await service.getBodyPartList('es')
      expect(result).toContain('pecho')
      expect(result).toContain('espalda')
    })
  })

  describe('getTargetList', () => {
    it('returns English targets', async () => {
      const result = await service.getTargetList('en')
      expect(result).toEqual(['pectorals', 'biceps', 'triceps'])
    })

    it('returns translated targets for lang=es', async () => {
      const result = await service.getTargetList('es')
      expect(result).toContain('pectorales')
      expect(result).toContain('bíceps')
    })
  })

  describe('getEquipmentList', () => {
    it('returns English equipment', async () => {
      const result = await service.getEquipmentList('en')
      expect(result).toEqual(['barbell', 'dumbbell', 'band'])
    })

    it('returns translated equipment for lang=es', async () => {
      const result = await service.getEquipmentList('es')
      expect(result).toContain('barra')
      expect(result).toContain('mancuerna')
    })
  })
})

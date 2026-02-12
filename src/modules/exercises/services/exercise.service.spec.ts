import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExerciseService } from './exercise.service'
import { TranslationService } from '../../../services/translation.service'
import { FileLoader } from '../../../data/load'
import type { Exercise } from '../../../data/types'
import type { CatalogTranslations, ExerciseTranslations } from '../../../data/i18n/types'

const mockCatalog: CatalogTranslations = {
  bodyParts: { chest: 'pecho', back: 'espalda', 'upper arms': 'brazos superiores' },
  muscles: { biceps: 'bíceps', triceps: 'tríceps', chest: 'pecho', traps: 'trapecios' },
  equipments: { dumbbell: 'mancuerna', barbell: 'barra', band: 'banda' }
}

const mockExerciseTranslations: ExerciseTranslations = {
  ex001: { name: 'Press de banca', instructions: ['Paso 1: Acuéstate', 'Paso 2: Empuja'] },
  ex002: { name: 'Curl de bíceps', instructions: ['Paso 1: Sostén', 'Paso 2: Flexiona'] }
}

const mockExercises: Exercise[] = [
  {
    exerciseId: 'ex001',
    name: 'Bench Press',
    gifUrl: 'https://example.com/bench.gif',
    targetMuscles: ['chest'],
    bodyParts: ['chest'],
    equipments: ['barbell'],
    secondaryMuscles: ['triceps'],
    instructions: ['Step 1: Lie down', 'Step 2: Push up']
  },
  {
    exerciseId: 'ex002',
    name: 'Bicep Curl',
    gifUrl: 'https://example.com/curl.gif',
    targetMuscles: ['biceps'],
    bodyParts: ['upper arms'],
    equipments: ['dumbbell'],
    secondaryMuscles: ['traps'],
    instructions: ['Step 1: Hold', 'Step 2: Curl']
  }
]

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(FileLoader, 'loadExercises').mockResolvedValue(mockExercises)
  vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalog)
  vi.spyOn(FileLoader, 'loadExerciseTranslations').mockResolvedValue(mockExerciseTranslations)
})

describe('ExerciseService i18n integration', () => {
  const service = new ExerciseService()

  describe('searchExercises', () => {
    it('returns English results when lang is en', async () => {
      const result = await service.searchExercises({ query: 'bench', lang: 'en' })
      expect(result.exercises[0]?.name).toBe('Bench Press')
    })

    it('returns translated results when lang is es', async () => {
      const result = await service.searchExercises({ query: 'Press de banca', lang: 'es' })
      // Should search against translated data
      expect(result.exercises.length).toBeGreaterThan(0)
      expect(result.exercises[0].name).toBe('Press de banca')
    })

    it('defaults to English when lang not specified', async () => {
      const result = await service.searchExercises({ query: 'bench' })
      expect(result.exercises[0]?.name).toBe('Bench Press')
    })
  })

  describe('getAllExercises', () => {
    it('returns English results when lang is en', async () => {
      const result = await service.getAllExercises({ lang: 'en' })
      expect(result.exercises[0].name).toBe('Bench Press')
      expect(result.exercises[0].targetMuscles).toEqual(['chest'])
    })

    it('returns translated results when lang is es', async () => {
      const result = await service.getAllExercises({ lang: 'es' })
      expect(result.exercises[0].name).toBe('Press de banca')
      expect(result.exercises[0].targetMuscles).toEqual(['pecho'])
      expect(result.exercises[0].equipments).toEqual(['barra'])
    })

    it('preserves gifUrl and exerciseId when translating', async () => {
      const result = await service.getAllExercises({ lang: 'es' })
      expect(result.exercises[0].exerciseId).toBe('ex001')
      expect(result.exercises[0].gifUrl).toBe('https://example.com/bench.gif')
    })
  })

  describe('filterExercises', () => {
    it('filters with English muscle names when lang is en', async () => {
      const result = await service.filterExercises({
        targetMuscles: ['chest'],
        lang: 'en'
      })
      expect(result.exercises).toHaveLength(1)
      expect(result.exercises[0].name).toBe('Bench Press')
    })

    it('accepts English filter values when lang is es', async () => {
      const result = await service.filterExercises({
        targetMuscles: ['chest'],
        lang: 'es'
      })
      // 'chest' gets resolved to 'pecho' for comparison against translated data
      expect(result.exercises).toHaveLength(1)
      expect(result.exercises[0].name).toBe('Press de banca')
    })

    it('accepts Spanish filter values when lang is es', async () => {
      const result = await service.filterExercises({
        targetMuscles: ['pecho'],
        lang: 'es'
      })
      // 'pecho' is already in target language, matches translated data directly
      expect(result.exercises).toHaveLength(1)
      expect(result.exercises[0].name).toBe('Press de banca')
    })

    it('filters by equipment with translation', async () => {
      const result = await service.filterExercises({
        equipments: ['dumbbell'],
        lang: 'es'
      })
      expect(result.exercises).toHaveLength(1)
      expect(result.exercises[0].name).toBe('Curl de bíceps')
      expect(result.exercises[0].equipments).toEqual(['mancuerna'])
    })

    it('filters by body parts with translation', async () => {
      const result = await service.filterExercises({
        bodyParts: ['upper arms'],
        lang: 'es'
      })
      expect(result.exercises).toHaveLength(1)
      expect(result.exercises[0].bodyParts).toEqual(['brazos superiores'])
    })
  })

  describe('getExercisesByBodyPart', () => {
    it('returns English results when lang is en', async () => {
      const result = await service.getExercisesByBodyPart({ bodyPart: 'chest', lang: 'en' })
      expect(result.exercises).toHaveLength(1)
      expect(result.exercises[0].name).toBe('Bench Press')
    })

    it('resolves English path param and returns translated results for lang=es', async () => {
      const result = await service.getExercisesByBodyPart({ bodyPart: 'chest', lang: 'es' })
      expect(result.exercises).toHaveLength(1)
      expect(result.exercises[0].name).toBe('Press de banca')
      expect(result.exercises[0].bodyParts).toEqual(['pecho'])
    })
  })

  describe('getExercisesByEquipment', () => {
    it('returns English results when lang is en', async () => {
      const result = await service.getExercisesByEquipment({ equipment: 'barbell', lang: 'en' })
      expect(result.exercises).toHaveLength(1)
      expect(result.exercises[0].name).toBe('Bench Press')
    })

    it('resolves English path param and returns translated results for lang=es', async () => {
      const result = await service.getExercisesByEquipment({ equipment: 'barbell', lang: 'es' })
      expect(result.exercises).toHaveLength(1)
      expect(result.exercises[0].name).toBe('Press de banca')
      expect(result.exercises[0].equipments).toEqual(['barra'])
    })
  })

  describe('getExercisesByMuscle', () => {
    it('returns English results when lang is en', async () => {
      const result = await service.getExercisesByMuscle({ muscle: 'chest', lang: 'en' })
      expect(result.exercises).toHaveLength(1)
      expect(result.exercises[0].name).toBe('Bench Press')
    })

    it('resolves English path param and returns translated results for lang=es', async () => {
      const result = await service.getExercisesByMuscle({ muscle: 'chest', lang: 'es' })
      expect(result.exercises).toHaveLength(1)
      expect(result.exercises[0].name).toBe('Press de banca')
      expect(result.exercises[0].targetMuscles).toEqual(['pecho'])
    })

    it('handles includeSecondary with translation', async () => {
      const result = await service.getExercisesByMuscle({
        muscle: 'traps',
        includeSecondary: true,
        lang: 'es'
      })
      // ex002 has traps as secondary muscle -> 'trapecios' in es
      expect(result.exercises.length).toBeGreaterThan(0)
    })
  })

  describe('getExerciseById', () => {
    it('returns English exercise when lang is en', async () => {
      const result = await service.getExerciseById({ exerciseId: 'ex001', lang: 'en' })
      expect(result.name).toBe('Bench Press')
    })

    it('returns translated exercise when lang is es', async () => {
      const result = await service.getExerciseById({ exerciseId: 'ex001', lang: 'es' })
      expect(result.name).toBe('Press de banca')
      expect(result.instructions).toEqual(['Paso 1: Acuéstate', 'Paso 2: Empuja'])
      expect(result.targetMuscles).toEqual(['pecho'])
    })

    it('defaults to English when lang not specified', async () => {
      const result = await service.getExerciseById({ exerciseId: 'ex001' })
      expect(result.name).toBe('Bench Press')
    })
  })
})

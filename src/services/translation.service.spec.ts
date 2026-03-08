import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TranslationService } from './translation.service'
import { FileLoader } from '../data/load'
import type { Exercise } from '../data/types'
import type { CatalogTranslations, ExerciseTranslations } from '../data/i18n/types'

const mockCatalogTranslations: CatalogTranslations = {
  bodyParts: { neck: 'cuello', chest: 'pecho', back: 'espalda' },
  targets: { traps: 'trapecios', delts: 'deltoides', biceps: 'bíceps' },
  equipment: { band: 'banda', dumbbell: 'mancuerna', barbell: 'barra' }
}

const mockExerciseTranslations: ExerciseTranslations = {
  '0123': {
    name: 'encogimiento con banda',
    description: 'Ejercicio de encogimiento con banda para los trapecios.',
    instructions: [
      'Paso 1: Párate con los pies separados al ancho de los hombros.',
      'Paso 2: Mantén los brazos rectos y relajados.'
    ]
  }
}

const mockExercise: Exercise = {
  id: '0123',
  name: 'band shrug',
  bodyPart: 'neck',
  equipment: 'band',
  target: 'traps',
  secondaryMuscles: ['delts'],
  instructions: ['Step 1: Stand with your feet shoulder-width apart.', 'Step 2: Keep your arms straight and relaxed.'],
  description: 'The band shrug is a trapezius exercise using a band.',
  difficulty: 'beginner',
  category: 'strength'
}

describe('TranslationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('translateExercise', () => {
    it('returns exercise unchanged when lang is en', async () => {
      const result = await TranslationService.translateExercise(mockExercise, 'en')
      expect(result).toEqual(mockExercise)
    })

    it('translates exercise fields when lang is es', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)
      vi.spyOn(FileLoader, 'loadExerciseTranslations').mockResolvedValue(mockExerciseTranslations)

      const result = await TranslationService.translateExercise(mockExercise, 'es')

      expect(result.name).toBe('encogimiento con banda')
      expect(result.instructions).toEqual([
        'Paso 1: Párate con los pies separados al ancho de los hombros.',
        'Paso 2: Mantén los brazos rectos y relajados.'
      ])
      expect(result.target).toBe('trapecios')
      expect(result.secondaryMuscles).toEqual(['deltoides'])
      expect(result.bodyPart).toBe('cuello')
      expect(result.equipment).toBe('banda')
    })

    it('falls back to English when translation is missing for an exercise', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)
      vi.spyOn(FileLoader, 'loadExerciseTranslations').mockResolvedValue({})

      const result = await TranslationService.translateExercise(mockExercise, 'es')

      expect(result.name).toBe('band shrug')
      expect(result.instructions).toEqual(mockExercise.instructions)
      // Catalog fields should still translate
      expect(result.target).toBe('trapecios')
    })

    it('preserves id and difficulty', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)
      vi.spyOn(FileLoader, 'loadExerciseTranslations').mockResolvedValue(mockExerciseTranslations)

      const result = await TranslationService.translateExercise(mockExercise, 'es')

      expect(result.id).toBe('0123')
      expect(result.difficulty).toBe('beginner')
      expect(result.category).toBe('strength')
    })
  })

  describe('translateExercises', () => {
    it('returns exercises unchanged when lang is en', async () => {
      const result = await TranslationService.translateExercises([mockExercise], 'en')
      expect(result).toEqual([mockExercise])
    })

    it('translates all exercises in array', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)
      vi.spyOn(FileLoader, 'loadExerciseTranslations').mockResolvedValue(mockExerciseTranslations)

      const result = await TranslationService.translateExercises([mockExercise, mockExercise], 'es')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('encogimiento con banda')
      expect(result[1].name).toBe('encogimiento con banda')
    })
  })

  describe('translateCatalogList', () => {
    it('returns items unchanged when lang is en', async () => {
      const items = ['neck', 'chest']
      const result = await TranslationService.translateCatalogList(items, 'bodyParts', 'en')
      expect(result).toEqual(['neck', 'chest'])
    })

    it('translates body parts', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.translateCatalogList(['neck', 'chest'], 'bodyParts', 'es')
      expect(result).toEqual(['cuello', 'pecho'])
    })

    it('translates targets', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.translateCatalogList(['traps', 'biceps'], 'targets', 'es')
      expect(result).toEqual(['trapecios', 'bíceps'])
    })

    it('translates equipment', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.translateCatalogList(['band', 'dumbbell'], 'equipment', 'es')
      expect(result).toEqual(['banda', 'mancuerna'])
    })

    it('falls back to English key when translation is missing', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.translateCatalogList(['unknown_part'], 'bodyParts', 'es')
      expect(result).toEqual(['unknown_part'])
    })
  })

  describe('resolveFilterValue', () => {
    it('returns value unchanged when lang is en', async () => {
      const result = await TranslationService.resolveFilterValue('chest', 'bodyParts', 'en')
      expect(result).toBe('chest')
    })

    it('returns English key directly if value is already English', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.resolveFilterValue('chest', 'bodyParts', 'es')
      expect(result).toBe('chest')
    })

    it('resolves Spanish value to English key', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.resolveFilterValue('pecho', 'bodyParts', 'es')
      expect(result).toBe('chest')
    })

    it('resolves Spanish value case-insensitively', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.resolveFilterValue('Pecho', 'bodyParts', 'es')
      expect(result).toBe('chest')
    })

    it('returns value as-is when no match found', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.resolveFilterValue('unknown', 'bodyParts', 'es')
      expect(result).toBe('unknown')
    })
  })

  describe('resolveFilterValues', () => {
    it('returns values unchanged when lang is en', async () => {
      const result = await TranslationService.resolveFilterValues(['chest', 'neck'], 'bodyParts', 'en')
      expect(result).toEqual(['chest', 'neck'])
    })

    it('resolves multiple Spanish values to English keys', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.resolveFilterValues(['pecho', 'cuello'], 'bodyParts', 'es')
      expect(result).toEqual(['chest', 'neck'])
    })

    it('handles mixed English and Spanish values', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.resolveFilterValues(['chest', 'cuello'], 'bodyParts', 'es')
      expect(result).toEqual(['chest', 'neck'])
    })
  })

  describe('resolveFilterValuesToTargetLang', () => {
    it('returns values unchanged when lang is en', async () => {
      const result = await TranslationService.resolveFilterValuesToTargetLang(['chest'], 'bodyParts', 'en')
      expect(result).toEqual(['chest'])
    })

    it('translates English keys to target language', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.resolveFilterValuesToTargetLang(['chest', 'neck'], 'bodyParts', 'es')
      expect(result).toEqual(['pecho', 'cuello'])
    })

    it('keeps values already in target language', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.resolveFilterValuesToTargetLang(['pecho'], 'bodyParts', 'es')
      expect(result).toEqual(['pecho'])
    })

    it('handles case-insensitive English keys', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.resolveFilterValuesToTargetLang(['Chest'], 'bodyParts', 'es')
      expect(result).toEqual(['pecho'])
    })

    it('handles mixed English and target language values', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.resolveFilterValuesToTargetLang(['chest', 'cuello'], 'bodyParts', 'es')
      expect(result).toEqual(['pecho', 'cuello'])
    })

    it('returns unknown values as-is', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.resolveFilterValuesToTargetLang(['unknown'], 'bodyParts', 'es')
      expect(result).toEqual(['unknown'])
    })

    it('works for targets', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.resolveFilterValuesToTargetLang(['biceps', 'traps'], 'targets', 'es')
      expect(result).toEqual(['bíceps', 'trapecios'])
    })

    it('works for equipment', async () => {
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)

      const result = await TranslationService.resolveFilterValuesToTargetLang(
        ['dumbbell', 'barbell'],
        'equipment',
        'es'
      )
      expect(result).toEqual(['mancuerna', 'barra'])
    })
  })

  describe('getTranslatedExerciseData', () => {
    it('returns original exercises when lang is en', async () => {
      const exercises = [mockExercise]
      vi.spyOn(FileLoader, 'loadExercises').mockResolvedValue(exercises)

      const result = await TranslationService.getTranslatedExerciseData('en')
      expect(result).toEqual(exercises)
    })

    it('returns translated exercises when lang is es', async () => {
      vi.spyOn(FileLoader, 'loadExercises').mockResolvedValue([mockExercise])
      vi.spyOn(FileLoader, 'loadCatalogTranslations').mockResolvedValue(mockCatalogTranslations)
      vi.spyOn(FileLoader, 'loadExerciseTranslations').mockResolvedValue(mockExerciseTranslations)

      const result = await TranslationService.getTranslatedExerciseData('es')
      expect(result[0].name).toBe('encogimiento con banda')
      expect(result[0].target).toBe('trapecios')
    })
  })
})

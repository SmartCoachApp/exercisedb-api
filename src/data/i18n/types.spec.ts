import { describe, it, expect } from 'vitest'
import type { SupportedLanguage, CatalogTranslations, ExerciseTranslation, ExerciseTranslations } from './types'

describe('i18n types', () => {
  it('SupportedLanguage allows en and es', () => {
    const en: SupportedLanguage = 'en'
    const es: SupportedLanguage = 'es'
    expect(en).toBe('en')
    expect(es).toBe('es')
  })

  it('CatalogTranslations has correct structure', () => {
    const catalog: CatalogTranslations = {
      bodyParts: { chest: 'pecho' },
      targets: { biceps: 'bíceps' },
      equipment: { dumbbell: 'mancuerna' }
    }
    expect(catalog.bodyParts.chest).toBe('pecho')
    expect(catalog.targets.biceps).toBe('bíceps')
    expect(catalog.equipment.dumbbell).toBe('mancuerna')
  })

  it('ExerciseTranslation has name and instructions', () => {
    const translation: ExerciseTranslation = {
      name: 'encogimiento con banda',
      instructions: ['Paso 1: ...', 'Paso 2: ...']
    }
    expect(translation.name).toBe('encogimiento con banda')
    expect(translation.instructions).toHaveLength(2)
  })

  it('ExerciseTranslations is a record keyed by exercise id', () => {
    const translations: ExerciseTranslations = {
      trmte8s: {
        name: 'encogimiento con banda',
        instructions: ['Paso 1: Párate con los pies separados...']
      },
      abc123: {
        name: 'curl de bíceps',
        instructions: ['Paso 1: Toma la mancuerna...']
      }
    }
    expect(translations.trmte8s.name).toBe('encogimiento con banda')
    expect(translations.abc123.name).toBe('curl de bíceps')
  })
})

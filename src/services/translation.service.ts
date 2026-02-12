import { FileLoader } from '../data/load'
import type { Exercise } from '../data/types'
import type { SupportedLanguage, CatalogTranslations, ExerciseTranslations } from '../data/i18n/types'

export class TranslationService {
  static async translateExercise(exercise: Exercise, lang: SupportedLanguage): Promise<Exercise> {
    if (lang === 'en') return exercise

    const [catalogTranslations, exerciseTranslations] = await Promise.all([
      FileLoader.loadCatalogTranslations(lang),
      FileLoader.loadExerciseTranslations(lang)
    ])

    const exerciseTranslation = exerciseTranslations[exercise.exerciseId]

    return {
      ...exercise,
      name: exerciseTranslation?.name ?? exercise.name,
      instructions: exerciseTranslation?.instructions ?? exercise.instructions,
      targetMuscles: exercise.targetMuscles.map((m) => catalogTranslations.muscles[m] ?? m),
      secondaryMuscles: exercise.secondaryMuscles.map((m) => catalogTranslations.muscles[m] ?? m),
      bodyParts: exercise.bodyParts.map((bp) => catalogTranslations.bodyParts[bp] ?? bp),
      equipments: exercise.equipments.map((eq) => catalogTranslations.equipments[eq] ?? eq)
    }
  }

  static async translateExercises(exercises: Exercise[], lang: SupportedLanguage): Promise<Exercise[]> {
    if (lang === 'en') return exercises

    const [catalogTranslations, exerciseTranslations] = await Promise.all([
      FileLoader.loadCatalogTranslations(lang),
      FileLoader.loadExerciseTranslations(lang)
    ])

    return exercises.map((exercise) => {
      const exerciseTranslation = exerciseTranslations[exercise.exerciseId]
      return {
        ...exercise,
        name: exerciseTranslation?.name ?? exercise.name,
        instructions: exerciseTranslation?.instructions ?? exercise.instructions,
        targetMuscles: exercise.targetMuscles.map((m) => catalogTranslations.muscles[m] ?? m),
        secondaryMuscles: exercise.secondaryMuscles.map((m) => catalogTranslations.muscles[m] ?? m),
        bodyParts: exercise.bodyParts.map((bp) => catalogTranslations.bodyParts[bp] ?? bp),
        equipments: exercise.equipments.map((eq) => catalogTranslations.equipments[eq] ?? eq)
      }
    })
  }

  static async translateCatalogList(
    items: string[],
    catalogType: 'bodyParts' | 'muscles' | 'equipments',
    lang: SupportedLanguage
  ): Promise<string[]> {
    if (lang === 'en') return items

    const catalogTranslations = await FileLoader.loadCatalogTranslations(lang)
    const translationMap = catalogTranslations[catalogType]

    return items.map((item) => translationMap[item] ?? item)
  }

  static async resolveFilterValue(
    value: string,
    catalogType: 'bodyParts' | 'muscles' | 'equipments',
    lang: SupportedLanguage
  ): Promise<string> {
    if (lang === 'en') return value

    const catalogTranslations = await FileLoader.loadCatalogTranslations(lang)
    const translationMap = catalogTranslations[catalogType]

    // Check if the value is already an English key
    if (Object.keys(translationMap).includes(value)) {
      return value
    }

    // Reverse lookup: find the English key for a translated value
    const englishKey = Object.entries(translationMap).find(
      ([, translated]) => translated.toLowerCase() === value.toLowerCase()
    )

    return englishKey ? englishKey[0] : value
  }

  static async resolveFilterValues(
    values: string[],
    catalogType: 'bodyParts' | 'muscles' | 'equipments',
    lang: SupportedLanguage
  ): Promise<string[]> {
    if (lang === 'en') return values

    return Promise.all(values.map((v) => this.resolveFilterValue(v, catalogType, lang)))
  }

  static async resolveFilterValuesToTargetLang(
    values: string[],
    catalogType: 'bodyParts' | 'muscles' | 'equipments',
    lang: SupportedLanguage
  ): Promise<string[]> {
    if (lang === 'en') return values

    const catalogTranslations = await FileLoader.loadCatalogTranslations(lang)
    const translationMap = catalogTranslations[catalogType]

    return values.map((value) => {
      // If value is an English key, translate it to target language
      const translated = translationMap[value]
      if (translated) return translated

      // Case-insensitive check for English key
      const entry = Object.entries(translationMap).find(([key]) => key.toLowerCase() === value.toLowerCase())
      if (entry) return entry[1]

      // Already in target language or unknown, return as-is
      return value
    })
  }

  static async getTranslatedExerciseData(lang: SupportedLanguage): Promise<Exercise[]> {
    const exercises = await FileLoader.loadExercises()
    if (lang === 'en') return exercises

    return this.translateExercises(exercises, lang)
  }
}

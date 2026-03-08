import { FileLoader } from '../data/load'
import type { Exercise } from '../data/types'
import type { SupportedLanguage } from '../data/i18n/types'

export class TranslationService {
  static async translateExercise(exercise: Exercise, lang: SupportedLanguage): Promise<Exercise> {
    if (lang === 'en') return exercise

    const [catalogTranslations, exerciseTranslations] = await Promise.all([
      FileLoader.loadCatalogTranslations(lang),
      FileLoader.loadExerciseTranslations(lang)
    ])

    const exerciseTranslation = exerciseTranslations[exercise.id]

    return {
      ...exercise,
      name: exerciseTranslation?.name ?? exercise.name,
      description: exerciseTranslation?.description ?? exercise.description,
      instructions: exerciseTranslation?.instructions ?? exercise.instructions,
      target: catalogTranslations.targets[exercise.target] ?? exercise.target,
      secondaryMuscles: exercise.secondaryMuscles.map((m) => catalogTranslations.targets[m] ?? m),
      bodyPart: catalogTranslations.bodyParts[exercise.bodyPart] ?? exercise.bodyPart,
      equipment: catalogTranslations.equipment[exercise.equipment] ?? exercise.equipment
    }
  }

  static async translateExercises(exercises: Exercise[], lang: SupportedLanguage): Promise<Exercise[]> {
    if (lang === 'en') return exercises

    const [catalogTranslations, exerciseTranslations] = await Promise.all([
      FileLoader.loadCatalogTranslations(lang),
      FileLoader.loadExerciseTranslations(lang)
    ])

    return exercises.map((exercise) => {
      const exerciseTranslation = exerciseTranslations[exercise.id]
      return {
        ...exercise,
        name: exerciseTranslation?.name ?? exercise.name,
        description: exerciseTranslation?.description ?? exercise.description,
        instructions: exerciseTranslation?.instructions ?? exercise.instructions,
        target: catalogTranslations.targets[exercise.target] ?? exercise.target,
        secondaryMuscles: exercise.secondaryMuscles.map((m) => catalogTranslations.targets[m] ?? m),
        bodyPart: catalogTranslations.bodyParts[exercise.bodyPart] ?? exercise.bodyPart,
        equipment: catalogTranslations.equipment[exercise.equipment] ?? exercise.equipment
      }
    })
  }

  static async translateCatalogList(
    items: string[],
    catalogType: 'bodyParts' | 'targets' | 'equipment',
    lang: SupportedLanguage
  ): Promise<string[]> {
    if (lang === 'en') return items

    const catalogTranslations = await FileLoader.loadCatalogTranslations(lang)
    const translationMap = catalogTranslations[catalogType]

    return items.map((item) => translationMap[item] ?? item)
  }

  static async resolveFilterValue(
    value: string,
    catalogType: 'bodyParts' | 'targets' | 'equipment',
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
    catalogType: 'bodyParts' | 'targets' | 'equipment',
    lang: SupportedLanguage
  ): Promise<string[]> {
    if (lang === 'en') return values

    return Promise.all(values.map((v) => this.resolveFilterValue(v, catalogType, lang)))
  }

  static async resolveFilterValuesToTargetLang(
    values: string[],
    catalogType: 'bodyParts' | 'targets' | 'equipment',
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

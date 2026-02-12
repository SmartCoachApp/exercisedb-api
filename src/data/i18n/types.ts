export type SupportedLanguage = 'en' | 'es'

export interface CatalogTranslations {
  bodyParts: Record<string, string>
  muscles: Record<string, string>
  equipments: Record<string, string>
}

export interface ExerciseTranslation {
  name: string
  instructions: string[]
}

export type ExerciseTranslations = Record<string, ExerciseTranslation>

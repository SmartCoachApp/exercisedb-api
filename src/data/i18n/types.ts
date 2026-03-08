export type SupportedLanguage = 'en' | 'es'

export interface CatalogTranslations {
  bodyParts: Record<string, string>
  targets: Record<string, string>
  equipment: Record<string, string>
}

export interface ExerciseTranslation {
  name: string
  description?: string
  instructions: string[]
}

export type ExerciseTranslations = Record<string, ExerciseTranslation>

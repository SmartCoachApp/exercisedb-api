export interface Exercise {
  /**
   * The unique 4-digit id of the exercise
   * @example "0001"
   */
  id: string

  /**
   * The name of the exercise.
   * @example "3/4 sit-up"
   */
  name: string

  /**
   * The body region targeted by the exercise.
   * @example "waist"
   */
  bodyPart: string

  /**
   * Equipment required for the exercise.
   * @example "body weight"
   */
  equipment: string

  /**
   * Primary muscle targeted by the exercise.
   * @example "abs"
   */
  target: string

  /**
   * Secondary muscles engaged during the exercise.
   * @example ["hip flexors", "lower back"]
   */
  secondaryMuscles: string[]

  /**
   * Step-by-step instructions to perform the exercise.
   * @example ["Lie flat on your back...", "Engaging your abs..."]
   */
  instructions: string[]

  /**
   * Summary description of the exercise.
   * @example "The 3/4 sit-up is an abdominal exercise..."
   */
  description: string

  /**
   * Difficulty level of the exercise.
   */
  difficulty: 'beginner' | 'intermediate' | 'advanced'

  /**
   * Movement category.
   * @example "strength"
   */
  category: string

  /**
   * How this exercise is measured.
   * - 'reps': repetitions + weight (default for most exercises)
   * - 'distance': distance in meters (e.g., sled push, farmer's carry)
   * - 'time': duration in seconds (e.g., running, planks)
   * @default 'reps'
   */
  measurementType: 'reps' | 'distance' | 'time'

  /**
   * Classification tags for filtering and recommendation.
   * Dimensions: movement pattern, context, equipment level, familiarity, discipline, intensity.
   * Optional until all exercises are tagged via inference.
   * @example ["compound", "main-lift", "full-gym", "staple", "strength"]
   */
  tags: string[]

  /**
   * Acceptance score (0–100): probability a typical fitness user accepts this exercise
   * without asking to change it. Used for ranking and preference normalization.
   * @example 90
   */
  baselineEffectiveness: number

  /**
   * Injury keys this exercise is contraindicated for.
   * Used as a hard filter when the user has reported injuries.
   * @example ["knee", "lower-back"]
   */
  contraindicatedFor: string[]
}

export interface ExerciseWithImages extends Exercise, Partial<ExerciseCatalogFields> {
  images: {
    '180': string
    '360': string
    '720': string
    '1080': string
  }
}

/**
 * Curated catalog metadata for one exercise (`src/data/aliases.json`).
 * Only NON-compositional names belong here («hip thrust», «face pull», «dominadas»).
 */
export interface ExerciseAliasEntry {
  /** Alternative names users type for this exact exercise. */
  aliases?: string[]
  /** Terms of exercises that do not exist in the catalog and this one honestly covers. */
  substituteFor?: string[]
  /** Canonical variant of its family. */
  primary?: true
}

/** Shape of `src/data/aliases.json`: exercise id → curated metadata. */
export type ExerciseAliasesFile = Record<string, ExerciseAliasEntry>

/** Catalog fields added to every served exercise (both languages). */
export interface ExerciseCatalogFields {
  /** Curated aliases, deduplicated by normalized form. */
  aliases: string[]
  /** Missing-exercise terms this exercise substitutes. */
  substituteFor: string[]
  /** Whether this is the canonical variant of its family. */
  isPrimary: boolean
  /** Original English name, also served with lang=es. */
  nameEn: string
}

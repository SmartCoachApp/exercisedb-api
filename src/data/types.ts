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

export interface ExerciseWithImages extends Exercise {
  images: {
    '180': string
    '360': string
    '720': string
    '1080': string
  }
}

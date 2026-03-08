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
}

export interface ExerciseWithImages extends Exercise {
  images: {
    '180': string
    '360': string
    '720': string
    '1080': string
  }
}

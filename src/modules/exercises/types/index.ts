import { Exercise } from '../../../data/types'
import type { SupportedLanguage } from '../../../data/i18n/types'

export { Exercise } from '../../../data/types'

export interface FetchExerciseByIdReq {
  exerciseId: string
  lang?: SupportedLanguage
}
export interface GetExercisesArgs {
  offset?: number
  limit?: number
  query?: {
    search?: string
    searchThreshold?: number
    target?: string
    equipment?: string
    bodyPart?: string
    includeSecondaryMuscles?: boolean
    [key: string]: any
  }
  sort?: Record<string, 1 | -1>
  exerciseData?: Exercise[]
}
export interface GetExercisesReturnArgs {
  exercises: Exercise[]
  totalPages: number
  totalExercises: number
  currentPage: number
}

export interface SearchExercisesArgs {
  offset?: number
  limit?: number
  query: string
  threshold?: number
  lang?: SupportedLanguage
}

export interface GetAllExercisesArgs {
  offset?: number
  limit?: number
  search?: string
  sort?: Record<string, 1 | -1>
  lang?: SupportedLanguage
}

export interface GetExercisesByMuscleArgs {
  offset?: number
  limit?: number
  muscle: string
  includeSecondary?: boolean
  lang?: SupportedLanguage
}

export interface GetExercisesByEquipmentArgs {
  offset?: number
  limit?: number
  equipment: string
  lang?: SupportedLanguage
}

export interface GetExercisesByBodyPartArgs {
  offset?: number
  limit?: number
  bodyPart: string
  lang?: SupportedLanguage
}

export interface FilterExercisesArgs {
  offset?: number
  limit?: number
  search?: string
  target?: string
  equipment?: string
  bodyPart?: string
  sort?: Record<string, 1 | -1>
  lang?: SupportedLanguage
}

export interface GetExerciseSerivceArgs {
  offset?: number
  limit?: number
  search?: string
  lang?: SupportedLanguage
}

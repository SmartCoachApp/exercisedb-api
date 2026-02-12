import {
  FetchExerciseByIdReq,
  FilterExercisesArgs,
  GetAllExercisesArgs,
  GetExercisesArgs,
  GetExercisesByBodyPartArgs,
  GetExercisesByEquipmentArgs,
  GetExercisesByMuscleArgs,
  SearchExercisesArgs
} from '../types'
import { GetExerciseByIdUseCase } from '../use-cases'
import { GetExercisesUseCase } from '../use-cases/get-exercise.usecase'
import { TranslationService } from '../../../services/translation.service'
export class ExerciseService {
  private readonly getExercisesUseCase: GetExercisesUseCase
  private readonly getExerciseByIdUseCase: GetExerciseByIdUseCase
  constructor() {
    this.getExercisesUseCase = new GetExercisesUseCase()
    this.getExerciseByIdUseCase = new GetExerciseByIdUseCase()
  }
  async searchExercises(params: SearchExercisesArgs) {
    const lang = params.lang ?? 'en'
    const exerciseData = lang !== 'en'
      ? await TranslationService.getTranslatedExerciseData(lang)
      : undefined

    const query: GetExercisesArgs = {
      offset: params.offset,
      limit: params.limit,
      query: {
        search: params.query,
        searchThreshold: params.threshold
      },
      exerciseData
    }

    return this.getExercisesUseCase.execute(query)
  }

  getExerciseById = async (request: FetchExerciseByIdReq) => {
    const exercise = await this.getExerciseByIdUseCase.execute(request)
    if (request.lang && request.lang !== 'en') {
      return TranslationService.translateExercise(exercise, request.lang)
    }
    return exercise
  }
  async getAllExercises(params: GetAllExercisesArgs) {
    const lang = params.lang ?? 'en'
    const exerciseData = lang !== 'en'
      ? await TranslationService.getTranslatedExerciseData(lang)
      : undefined

    const query: GetExercisesArgs = {
      offset: params.offset,
      limit: params.limit,
      query: params.search ? { search: params.search } : {},
      sort: params.sort,
      exerciseData
    }

    return this.getExercisesUseCase.execute(query)
  }
  async filterExercises(params: FilterExercisesArgs) {
    const lang = params.lang ?? 'en'

    let exerciseData = lang !== 'en'
      ? await TranslationService.getTranslatedExerciseData(lang)
      : undefined

    // Resolve filter values to target language when using translated data
    let targetMuscles = params.targetMuscles
    let equipments = params.equipments
    let bodyParts = params.bodyParts

    if (lang !== 'en') {
      if (targetMuscles?.length) {
        targetMuscles = await TranslationService.resolveFilterValuesToTargetLang(targetMuscles, 'muscles', lang)
      }
      if (equipments?.length) {
        equipments = await TranslationService.resolveFilterValuesToTargetLang(equipments, 'equipments', lang)
      }
      if (bodyParts?.length) {
        bodyParts = await TranslationService.resolveFilterValuesToTargetLang(bodyParts, 'bodyParts', lang)
      }
    }

    const queryFilters: any = {}

    if (params.search) {
      queryFilters.search = params.search
    }

    if (targetMuscles && targetMuscles.length > 0) {
      queryFilters.targetMuscles = targetMuscles
    }

    if (equipments && equipments.length > 0) {
      queryFilters.equipments = equipments
    }

    if (bodyParts && bodyParts.length > 0) {
      queryFilters.bodyParts = bodyParts
    }

    const query: GetExercisesArgs = {
      offset: params.offset,
      limit: params.limit,
      query: queryFilters,
      sort: params.sort,
      exerciseData
    }

    return this.getExercisesUseCase.execute(query)
  }

  // Get exercises by body part
  async getExercisesByBodyPart(params: GetExercisesByBodyPartArgs) {
    const lang = params.lang ?? 'en'
    const exerciseData = lang !== 'en'
      ? await TranslationService.getTranslatedExerciseData(lang)
      : undefined

    // Path params are always English; resolve to target language for comparison against translated data
    let bodyPart = params.bodyPart
    if (lang !== 'en') {
      const resolved = await TranslationService.resolveFilterValuesToTargetLang([bodyPart], 'bodyParts', lang)
      bodyPart = resolved[0]
    }

    const query: GetExercisesArgs = {
      offset: params.offset,
      limit: params.limit,
      query: {
        bodyParts: [bodyPart]
      },
      exerciseData
    }

    return this.getExercisesUseCase.execute(query)
  }

  // Get exercises by equipment
  async getExercisesByEquipment(params: GetExercisesByEquipmentArgs) {
    const lang = params.lang ?? 'en'
    const exerciseData = lang !== 'en'
      ? await TranslationService.getTranslatedExerciseData(lang)
      : undefined

    let equipment = params.equipment
    if (lang !== 'en') {
      const resolved = await TranslationService.resolveFilterValuesToTargetLang([equipment], 'equipments', lang)
      equipment = resolved[0]
    }

    const query: GetExercisesArgs = {
      offset: params.offset,
      limit: params.limit,
      query: {
        equipments: [equipment]
      },
      exerciseData
    }

    return this.getExercisesUseCase.execute(query)
  }

  // Get exercises by muscle (with option to include secondary muscles)
  async getExercisesByMuscle(params: GetExercisesByMuscleArgs) {
    const lang = params.lang ?? 'en'
    const exerciseData = lang !== 'en'
      ? await TranslationService.getTranslatedExerciseData(lang)
      : undefined

    let muscle = params.muscle
    if (lang !== 'en') {
      const resolved = await TranslationService.resolveFilterValuesToTargetLang([muscle], 'muscles', lang)
      muscle = resolved[0]
    }

    const query: GetExercisesArgs = {
      offset: params.offset,
      limit: params.limit,
      query: {
        targetMuscles: [muscle],
        includeSecondaryMuscles: params.includeSecondary
      },
      exerciseData
    }

    return this.getExercisesUseCase.execute(query)
  }
}

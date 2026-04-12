import Fuse from 'fuse.js'
import { FileLoader } from '../../../data/load'
import { TranslationService } from '../../../services/translation.service'
import { signedUrlService } from '../../../services/signed-url.service'
import type { Exercise, ExerciseWithImages } from '../../../data/types'
import type { SupportedLanguage } from '../../../data/i18n/types'
import { GetExercisesUseCase } from '../use-cases/get-exercise.usecase'
import { GetExerciseByIdUseCase } from '../use-cases'

export interface PaginatedResult {
  data: ExerciseWithImages[]
  totalItems: number
  totalPages: number
  currentPage: number
}

export class ExerciseService {
  private readonly getExercisesUseCase = new GetExercisesUseCase()
  private readonly getExerciseByIdUseCase = new GetExerciseByIdUseCase()

  private async attachImages(exercises: Exercise[]): Promise<ExerciseWithImages[]> {
    return Promise.all(
      exercises.map(async (ex) => ({
        ...ex,
        images: await signedUrlService.generateImageUrls(ex.id)
      }))
    )
  }

  async getAllExercises(params: {
    offset?: number
    limit?: number
    lang?: SupportedLanguage
    tags?: string[]
    minEffectiveness?: number
    maxEffectiveness?: number
    excludeContraindicated?: string[]
  }): Promise<PaginatedResult> {
    const {
      offset = 0,
      limit = 10,
      lang = 'en',
      tags,
      minEffectiveness,
      maxEffectiveness,
      excludeContraindicated
    } = params
    const exerciseData = lang !== 'en' ? await TranslationService.getTranslatedExerciseData(lang) : undefined

    const { exercises, totalPages, totalExercises, currentPage } = await this.getExercisesUseCase.execute({
      offset,
      limit,
      query: { tags, minEffectiveness, maxEffectiveness, excludeContraindicated },
      exerciseData
    })

    return {
      data: await this.attachImages(exercises),
      totalItems: totalExercises,
      totalPages,
      currentPage
    }
  }

  async getExercisesByBodyPart(params: {
    bodyPart: string
    offset?: number
    limit?: number
    lang?: SupportedLanguage
  }): Promise<PaginatedResult> {
    const { bodyPart, offset = 0, limit = 10, lang = 'en' } = params
    const exerciseData = lang !== 'en' ? await TranslationService.getTranslatedExerciseData(lang) : undefined

    let resolvedBodyPart = bodyPart
    if (lang !== 'en') {
      const resolved = await TranslationService.resolveFilterValuesToTargetLang([bodyPart], 'bodyParts', lang)
      resolvedBodyPart = resolved[0]
    }

    const { exercises, totalPages, totalExercises, currentPage } = await this.getExercisesUseCase.execute({
      offset,
      limit,
      query: { bodyPart: resolvedBodyPart },
      exerciseData
    })

    return {
      data: await this.attachImages(exercises),
      totalItems: totalExercises,
      totalPages,
      currentPage
    }
  }

  async getExercisesByTarget(params: {
    target: string
    offset?: number
    limit?: number
    lang?: SupportedLanguage
  }): Promise<PaginatedResult> {
    const { target, offset = 0, limit = 10, lang = 'en' } = params
    const exerciseData = lang !== 'en' ? await TranslationService.getTranslatedExerciseData(lang) : undefined

    let resolvedTarget = target
    if (lang !== 'en') {
      const resolved = await TranslationService.resolveFilterValuesToTargetLang([target], 'targets', lang)
      resolvedTarget = resolved[0]
    }

    const { exercises, totalPages, totalExercises, currentPage } = await this.getExercisesUseCase.execute({
      offset,
      limit,
      query: { target: resolvedTarget },
      exerciseData
    })

    return {
      data: await this.attachImages(exercises),
      totalItems: totalExercises,
      totalPages,
      currentPage
    }
  }

  async getExercisesByEquipment(params: {
    equipment: string
    offset?: number
    limit?: number
    lang?: SupportedLanguage
  }): Promise<PaginatedResult> {
    const { equipment, offset = 0, limit = 10, lang = 'en' } = params
    const exerciseData = lang !== 'en' ? await TranslationService.getTranslatedExerciseData(lang) : undefined

    let resolvedEquipment = equipment
    if (lang !== 'en') {
      const resolved = await TranslationService.resolveFilterValuesToTargetLang([equipment], 'equipment', lang)
      resolvedEquipment = resolved[0]
    }

    const { exercises, totalPages, totalExercises, currentPage } = await this.getExercisesUseCase.execute({
      offset,
      limit,
      query: { equipment: resolvedEquipment },
      exerciseData
    })

    return {
      data: await this.attachImages(exercises),
      totalItems: totalExercises,
      totalPages,
      currentPage
    }
  }

  async searchByName(params: {
    name: string
    offset?: number
    limit?: number
    lang?: SupportedLanguage
  }): Promise<PaginatedResult> {
    const { name, offset = 0, limit = 10, lang = 'en' } = params
    const safeOffset = Math.max(0, offset)
    const safeLimit = Math.max(1, Math.min(100, limit))

    const allExercises =
      lang !== 'en' ? await TranslationService.getTranslatedExerciseData(lang) : await FileLoader.loadExercises()

    const fuse = new Fuse(allExercises, {
      keys: [{ name: 'name', weight: 1 }],
      threshold: 0.3,
      includeScore: false,
      ignoreLocation: true,
      findAllMatches: true
    })

    const searchResults = fuse.search(decodeURIComponent(name)).map((r) => r.item)
    const totalItems = searchResults.length
    const totalPages = Math.ceil(totalItems / safeLimit)
    const currentPage = Math.floor(safeOffset / safeLimit) + 1
    const paginated = searchResults.slice(safeOffset, safeOffset + safeLimit)

    return {
      data: await this.attachImages(paginated),
      totalItems,
      totalPages,
      currentPage
    }
  }

  async getExerciseById(params: { id: string; lang?: SupportedLanguage }): Promise<ExerciseWithImages> {
    const { id, lang = 'en' } = params
    const exercise = await this.getExerciseByIdUseCase.execute({ exerciseId: id, lang })

    let result: Exercise = exercise
    if (lang !== 'en') {
      result = await TranslationService.translateExercise(exercise, lang)
    }

    const images = await signedUrlService.generateImageUrls(id)
    return { ...result, images }
  }

  async getBodyPartList(lang: SupportedLanguage = 'en'): Promise<string[]> {
    const items = await FileLoader.loadBodyParts()
    if (lang === 'en') return items
    return TranslationService.translateCatalogList(items, 'bodyParts', lang)
  }

  async getTargetList(lang: SupportedLanguage = 'en'): Promise<string[]> {
    const items = await FileLoader.loadTargets()
    if (lang === 'en') return items
    return TranslationService.translateCatalogList(items, 'targets', lang)
  }

  async getEquipmentList(lang: SupportedLanguage = 'en'): Promise<string[]> {
    const items = await FileLoader.loadEquipments()
    if (lang === 'en') return items
    return TranslationService.translateCatalogList(items, 'equipment', lang)
  }
}

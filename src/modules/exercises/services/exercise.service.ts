import Fuse from 'fuse.js'
import { FileLoader } from '../../../data/load'
import { TranslationService } from '../../../services/translation.service'
import { signedUrlService } from '../../../services/signed-url.service'
import { buildCatalogFields } from '../../../data/aliases'
import type { Exercise, ExerciseCatalogFields, ExerciseWithImages } from '../../../data/types'
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

  /** Fuse instance of `searchByName` per language, rebuilt only when the source data changes. */
  private readonly nameFuseCache = new Map<SupportedLanguage, { sources: unknown[]; fuse: Fuse<Exercise> }>()

  /** id → original English name, rebuilt only when the loaded catalog array changes. */
  private nameEnCache: { source: Exercise[]; byId: Map<string, string> } | null = null

  private async getEnglishNames(): Promise<Map<string, string>> {
    const source = await FileLoader.loadExercises()
    if (this.nameEnCache?.source !== source) {
      this.nameEnCache = { source, byId: new Map(source.map((ex) => [ex.id, ex.name])) }
    }
    return this.nameEnCache.byId
  }

  /** Adds the curated catalog fields (aliases, substituteFor, isPrimary, nameEn) without touching existing ones. */
  private async withCatalogFields(exercises: Exercise[]): Promise<(Exercise & ExerciseCatalogFields)[]> {
    const [aliases, englishNames] = await Promise.all([FileLoader.loadAliases(), this.getEnglishNames()])
    return exercises.map((ex) => ({
      ...ex,
      ...buildCatalogFields(aliases[ex.id], englishNames.get(ex.id) ?? ex.name)
    }))
  }

  private async attachImages(exercises: Exercise[]): Promise<ExerciseWithImages[]> {
    const enriched = await this.withCatalogFields(exercises)
    return Promise.all(
      enriched.map(async (ex) => ({
        ...ex,
        images: await signedUrlService.generateImageUrls(ex.id)
      }))
    )
  }

  private async getNameFuse(lang: SupportedLanguage): Promise<Fuse<Exercise>> {
    const base = await FileLoader.loadExercises()
    const sources: unknown[] =
      lang !== 'en'
        ? [base, await FileLoader.loadExerciseTranslations(lang), await FileLoader.loadCatalogTranslations(lang)]
        : [base]
    const cached = this.nameFuseCache.get(lang)
    if (cached && cached.sources.length === sources.length && cached.sources.every((s, i) => s === sources[i])) {
      return cached.fuse
    }
    const allExercises = lang !== 'en' ? await TranslationService.getTranslatedExerciseData(lang) : base
    // Ranking unchanged: same keys and threshold as before the cache.
    const fuse = new Fuse(allExercises, {
      keys: [{ name: 'name', weight: 1 }],
      threshold: 0.3,
      includeScore: false,
      ignoreLocation: true,
      findAllMatches: true
    })
    this.nameFuseCache.set(lang, { sources, fuse })
    return fuse
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

    const fuse = await this.getNameFuse(lang)
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

    const [enriched] = await this.withCatalogFields([result])
    const images = await signedUrlService.generateImageUrls(id)
    return { ...enriched, images }
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

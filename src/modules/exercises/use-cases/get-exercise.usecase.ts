import { IUseCase } from '#common/types/use-case.type.js'
import { FileLoader } from '../../../data/load'
import Fuse from 'fuse.js'
import { Exercise, GetExercisesArgs, GetExercisesReturnArgs } from '../types'

export class GetExercisesUseCase implements IUseCase<GetExercisesArgs, GetExercisesReturnArgs> {
  private exerciseData: Exercise[] | null = null
  private fuse: Fuse<Exercise> | null = null

  constructor() {}

  private async getExerciseData(): Promise<Exercise[]> {
    this.exerciseData = await FileLoader.loadExercises()
    return this.exerciseData
  }

  private getFuseInstance(data: Exercise[], threshold: number = 0.3): Fuse<Exercise> {
    this.fuse = new Fuse(data, {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'target', weight: 0.25 },
        { name: 'bodyPart', weight: 0.2 },
        { name: 'equipment', weight: 0.15 },
        { name: 'secondaryMuscles', weight: 0.1 }
      ],
      threshold,
      includeScore: false,
      ignoreLocation: true,
      findAllMatches: true
    })
    return this.fuse
  }

  private filterByQuery(exercises: Exercise[], query: GetExercisesArgs['query']): Exercise[] {
    if (!query) return exercises

    let filtered = exercises

    // Handle text search with custom threshold
    if (query.search) {
      const threshold = query.searchThreshold || 0.3
      const fuse = this.getFuseInstance(exercises, threshold)
      const result = fuse.search(query.search.toLowerCase())
      filtered = result.map((res) => res.item)
    }

    // Handle target filtering (single value)
    if (query.target) {
      const target = query.target.toLowerCase()
      filtered = filtered.filter((exercise) => {
        const matchesTarget = exercise.target.toLowerCase() === target

        // If includeSecondaryMuscles is true, also check secondary muscles
        if (query.includeSecondaryMuscles && !matchesTarget) {
          return exercise.secondaryMuscles?.some((secondary) => secondary.toLowerCase() === target)
        }

        return matchesTarget
      })
    }

    // Handle equipment filtering (single value)
    if (query.equipment) {
      const equipment = query.equipment.toLowerCase()
      filtered = filtered.filter((exercise) => exercise.equipment.toLowerCase() === equipment)
    }

    // Handle bodyPart filtering (single value)
    if (query.bodyPart) {
      const bodyPart = query.bodyPart.toLowerCase()
      filtered = filtered.filter((exercise) => exercise.bodyPart.toLowerCase() === bodyPart)
    }

    // Handle tag filtering (exercises must have ALL specified tags)
    if (query.tags && query.tags.length > 0) {
      filtered = filtered.filter((exercise) => query.tags!.every((tag) => exercise.tags?.includes(tag)))
    }

    // Handle baseline effectiveness filtering
    if (query.minEffectiveness !== undefined) {
      filtered = filtered.filter((ex) => (ex.baselineEffectiveness ?? 0) >= query.minEffectiveness!)
    }
    if (query.maxEffectiveness !== undefined) {
      filtered = filtered.filter((ex) => (ex.baselineEffectiveness ?? 100) <= query.maxEffectiveness!)
    }

    // Handle contraindication filtering (exclude exercises contraindicated for any specified injury)
    if (query.excludeContraindicated && query.excludeContraindicated.length > 0) {
      filtered = filtered.filter(
        (exercise) => !query.excludeContraindicated!.some((injury) => exercise.contraindicatedFor?.includes(injury))
      )
    }

    return filtered
  }

  private sortExercises(exercises: Exercise[], sort: Record<string, 1 | -1>): Exercise[] {
    const sortKeys = Object.keys(sort || {})
    if (sortKeys.length === 0) return exercises

    return [...exercises].sort((a, b) => {
      for (const key of sortKeys) {
        const order = sort[key]
        const aVal = (a as any)[key]
        const bVal = (b as any)[key]

        if (aVal == null && bVal == null) continue
        if (aVal == null) return order
        if (bVal == null) return -order

        // Handle array fields
        if (Array.isArray(aVal) && Array.isArray(bVal)) {
          const aFirst = aVal[0] || ''
          const bFirst = bVal[0] || ''

          if (aFirst < bFirst) return -1 * order
          if (aFirst > bFirst) return 1 * order

          if (aVal.length < bVal.length) return -1 * order
          if (aVal.length > bVal.length) return 1 * order

          continue
        }

        if (Array.isArray(aVal)) return -1 * order
        if (Array.isArray(bVal)) return 1 * order

        if (aVal < bVal) return -1 * order
        if (aVal > bVal) return 1 * order
      }
      return 0
    })
  }

  private paginateResults(
    exercises: Exercise[],
    offset: number,
    limit: number
  ): { exercises: Exercise[]; totalPages: number; currentPage: number } {
    const safeOffset = Math.max(0, Number(offset) || 0)
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10))

    const totalCount = exercises.length
    const totalPages = Math.ceil(totalCount / safeLimit)
    const currentPage = Math.floor(safeOffset / safeLimit) + 1

    const paginated = exercises.slice(safeOffset, safeOffset + safeLimit)

    return {
      exercises: paginated,
      totalPages,
      currentPage
    }
  }

  async execute({
    offset,
    limit,
    query = {},
    sort = {},
    exerciseData: preloadedData
  }: GetExercisesArgs): Promise<GetExercisesReturnArgs> {
    try {
      const exerciseData = preloadedData ?? (await this.getExerciseData())
      // Apply filters
      const filtered = this.filterByQuery(exerciseData, query)
      // Apply sorting
      const sorted = this.sortExercises(filtered, sort)

      // Apply pagination
      const { exercises, totalPages, currentPage } = this.paginateResults(sorted, offset || 0, limit || 10)

      return {
        exercises,
        totalPages,
        totalExercises: filtered.length,
        currentPage
      }
    } catch (error) {
      console.error('Error in GetExercisesUseCase:', error)
      throw new Error('Failed to fetch exercises')
    }
  }
}

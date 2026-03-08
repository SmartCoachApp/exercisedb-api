import { promises as fs } from 'fs'
import path from 'path'
import { Exercise } from './types'
import { HTTPException } from 'hono/http-exception'
import type { SupportedLanguage, CatalogTranslations, ExerciseTranslations } from './i18n/types'

export class FileLoader {
  private static dataPath = path.resolve(process.cwd(), 'src', 'data')

  private static cache = new Map<string, unknown>()

  private static async loadJSON<T>(filename: string): Promise<T> {
    const filePath = path.resolve(this.dataPath, filename)

    if (this.cache.has(filePath)) {
      return this.cache.get(filePath) as T
    }

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const data = JSON.parse(fileContent) as T
      this.cache.set(filePath, data)
      return data
    } catch (error) {
      console.error(`❌ Error loading JSON file [${filename}]:`, error)
      throw new HTTPException(500, { message: `database not working` })
    }
  }

  public static loadExercises(): Promise<Exercise[]> {
    return this.loadJSON<Exercise[]>('exercises.json')
  }

  public static loadBodyParts(): Promise<string[]> {
    return this.loadJSON<string[]>('body_parts.json')
  }

  public static loadTargets(): Promise<string[]> {
    return this.loadJSON<string[]>('targets.json')
  }

  public static loadEquipments(): Promise<string[]> {
    return this.loadJSON<string[]>('equipment.json')
  }

  public static async loadCatalogTranslations(lang: SupportedLanguage): Promise<CatalogTranslations> {
    const cacheKey = `catalogs_${lang}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as CatalogTranslations
    }

    const data = await this.loadJSON<CatalogTranslations>(`i18n/${lang}/catalogs.json`)
    this.cache.set(cacheKey, data)
    return data
  }

  public static async loadExerciseTranslations(lang: SupportedLanguage): Promise<ExerciseTranslations> {
    const cacheKey = `exercises_${lang}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as ExerciseTranslations
    }

    const merged: ExerciseTranslations = {}
    for (let i = 1; i <= 15; i++) {
      const filename = `i18n/${lang}/exercises_${String(i).padStart(3, '0')}.json`
      try {
        const batch = await this.loadJSON<ExerciseTranslations>(filename)
        Object.assign(merged, batch)
      } catch {
        // File may not exist yet during incremental translation
      }
    }

    this.cache.set(cacheKey, merged)
    return merged
  }
}

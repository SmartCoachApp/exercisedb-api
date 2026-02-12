import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FileLoader } from './load'

describe('FileLoader', () => {
  describe('existing methods still work', () => {
    it('loadExercises returns exercises array', async () => {
      const exercises = await FileLoader.loadExercises()
      expect(Array.isArray(exercises)).toBe(true)
      expect(exercises.length).toBeGreaterThan(0)
      expect(exercises[0]).toHaveProperty('exerciseId')
      expect(exercises[0]).toHaveProperty('name')
      expect(exercises[0]).toHaveProperty('instructions')
    })

    it('loadBodyParts returns body parts array', async () => {
      const bodyParts = await FileLoader.loadBodyParts()
      expect(Array.isArray(bodyParts)).toBe(true)
      expect(bodyParts.length).toBeGreaterThan(0)
      expect(bodyParts[0]).toHaveProperty('name')
    })

    it('loadMuscles returns muscles array', async () => {
      const muscles = await FileLoader.loadMuscles()
      expect(Array.isArray(muscles)).toBe(true)
      expect(muscles.length).toBeGreaterThan(0)
      expect(muscles[0]).toHaveProperty('name')
    })

    it('loadEquipments returns equipment array', async () => {
      const equipments = await FileLoader.loadEquipments()
      expect(Array.isArray(equipments)).toBe(true)
      expect(equipments.length).toBeGreaterThan(0)
      expect(equipments[0]).toHaveProperty('name')
    })
  })

  describe('loadCatalogTranslations', () => {
    it('loads Spanish catalog translations', async () => {
      const catalogs = await FileLoader.loadCatalogTranslations('es')
      expect(catalogs).toHaveProperty('bodyParts')
      expect(catalogs).toHaveProperty('muscles')
      expect(catalogs).toHaveProperty('equipments')
    })

    it('has translations for all body parts', async () => {
      const catalogs = await FileLoader.loadCatalogTranslations('es')
      const bodyParts = await FileLoader.loadBodyParts()

      for (const bp of bodyParts) {
        expect(catalogs.bodyParts[bp.name]).toBeDefined()
        expect(catalogs.bodyParts[bp.name].length).toBeGreaterThan(0)
      }
    })

    it('has translations for all muscles', async () => {
      const catalogs = await FileLoader.loadCatalogTranslations('es')
      const muscles = await FileLoader.loadMuscles()

      for (const muscle of muscles) {
        expect(catalogs.muscles[muscle.name]).toBeDefined()
        expect(catalogs.muscles[muscle.name].length).toBeGreaterThan(0)
      }
    })

    it('has translations for all equipments', async () => {
      const catalogs = await FileLoader.loadCatalogTranslations('es')
      const equipments = await FileLoader.loadEquipments()

      for (const eq of equipments) {
        expect(catalogs.equipments[eq.name]).toBeDefined()
        expect(catalogs.equipments[eq.name].length).toBeGreaterThan(0)
      }
    })

    it('has no extra entries beyond source data', async () => {
      const catalogs = await FileLoader.loadCatalogTranslations('es')
      const bodyParts = (await FileLoader.loadBodyParts()).map((bp) => bp.name)
      const muscles = (await FileLoader.loadMuscles()).map((m) => m.name)
      const equipments = (await FileLoader.loadEquipments()).map((eq) => eq.name)

      expect(Object.keys(catalogs.bodyParts).length).toBe(bodyParts.length)
      expect(Object.keys(catalogs.muscles).length).toBe(muscles.length)
      expect(Object.keys(catalogs.equipments).length).toBe(equipments.length)
    })

    it('has exactly 88 total translations', async () => {
      const catalogs = await FileLoader.loadCatalogTranslations('es')
      const total =
        Object.keys(catalogs.bodyParts).length +
        Object.keys(catalogs.muscles).length +
        Object.keys(catalogs.equipments).length
      expect(total).toBe(88)
    })
  })

  describe('loadExerciseTranslations', () => {
    it('loads Spanish exercise translations from available batch files', async () => {
      const translations = await FileLoader.loadExerciseTranslations('es')
      const ids = Object.keys(translations)
      expect(ids.length).toBeGreaterThan(0)

      // Each entry should have name and instructions
      for (const id of ids) {
        expect(translations[id]).toHaveProperty('name')
        expect(translations[id].name.length).toBeGreaterThan(0)
        expect(translations[id]).toHaveProperty('instructions')
        expect(Array.isArray(translations[id].instructions)).toBe(true)
        expect(translations[id].instructions.length).toBeGreaterThan(0)
      }
    })

    it('translation exerciseIds exist in source data', async () => {
      const translations = await FileLoader.loadExerciseTranslations('es')
      const exercises = await FileLoader.loadExercises()
      const exerciseIds = new Set(exercises.map((e) => e.exerciseId))

      for (const id of Object.keys(translations)) {
        expect(exerciseIds.has(id)).toBe(true)
      }
    })

    it('translation instruction counts match source data', async () => {
      const translations = await FileLoader.loadExerciseTranslations('es')
      const exercises = await FileLoader.loadExercises()
      const exerciseMap = new Map(exercises.map((e) => [e.exerciseId, e]))

      for (const [id, trans] of Object.entries(translations)) {
        const original = exerciseMap.get(id)
        if (original) {
          expect(trans.instructions.length).toBe(original.instructions.length)
        }
      }
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { FileLoader } from './load'

// Clear cache between tests so each test loads fresh data
beforeEach(() => {
  // @ts-expect-error — reset internal cache
  FileLoader['cache'] = new Map()
})

describe('FileLoader', () => {
  describe('loadExercises', () => {
    it('returns a non-empty array', async () => {
      const exercises = await FileLoader.loadExercises()
      expect(Array.isArray(exercises)).toBe(true)
      expect(exercises.length).toBe(1324)
    })

    it('exercises have the new field shape', async () => {
      const exercises = await FileLoader.loadExercises()
      const first = exercises[0]
      expect(first).toHaveProperty('id')
      expect(first).toHaveProperty('name')
      expect(first).toHaveProperty('bodyPart')
      expect(first).toHaveProperty('equipment')
      expect(first).toHaveProperty('target')
      expect(first).toHaveProperty('secondaryMuscles')
      expect(first).toHaveProperty('instructions')
      expect(first).toHaveProperty('description')
      expect(first).toHaveProperty('difficulty')
      expect(first).toHaveProperty('category')
    })

    it('exercise id is a 4-digit zero-padded string', async () => {
      const exercises = await FileLoader.loadExercises()
      expect(exercises[0].id).toMatch(/^\d{4}$/)
    })

    it('difficulty is one of the valid values', async () => {
      const exercises = await FileLoader.loadExercises()
      const valid = new Set(['beginner', 'intermediate', 'advanced'])
      for (const ex of exercises) {
        expect(valid.has(ex.difficulty)).toBe(true)
      }
    })

    it('does not contain old field names', async () => {
      const exercises = await FileLoader.loadExercises()
      const first = exercises[0] as any
      expect(first).not.toHaveProperty('exerciseId')
      expect(first).not.toHaveProperty('gifUrl')
      expect(first).not.toHaveProperty('targetMuscles')
      expect(first).not.toHaveProperty('bodyParts')
      expect(first).not.toHaveProperty('equipments')
    })
  })

  describe('loadBodyParts', () => {
    it('returns a string array of 10 body parts', async () => {
      const bodyParts = await FileLoader.loadBodyParts()
      expect(Array.isArray(bodyParts)).toBe(true)
      expect(bodyParts).toHaveLength(10)
      expect(typeof bodyParts[0]).toBe('string')
    })

    it('contains expected body parts', async () => {
      const bodyParts = await FileLoader.loadBodyParts()
      expect(bodyParts).toContain('back')
      expect(bodyParts).toContain('chest')
      expect(bodyParts).toContain('waist')
    })
  })

  describe('loadTargets', () => {
    it('returns a string array of 19 target muscles', async () => {
      const targets = await FileLoader.loadTargets()
      expect(Array.isArray(targets)).toBe(true)
      expect(targets).toHaveLength(19)
      expect(typeof targets[0]).toBe('string')
    })

    it('contains expected target muscles', async () => {
      const targets = await FileLoader.loadTargets()
      expect(targets).toContain('abs')
      expect(targets).toContain('biceps')
      expect(targets).toContain('glutes')
    })
  })

  describe('loadEquipments', () => {
    it('returns a string array of 28 equipment types', async () => {
      const equipment = await FileLoader.loadEquipments()
      expect(Array.isArray(equipment)).toBe(true)
      expect(equipment).toHaveLength(28)
      expect(typeof equipment[0]).toBe('string')
    })

    it('contains expected equipment types', async () => {
      const equipment = await FileLoader.loadEquipments()
      expect(equipment).toContain('barbell')
      expect(equipment).toContain('dumbbell')
      expect(equipment).toContain('body weight')
    })
  })

  describe('loadCatalogTranslations', () => {
    it('loads Spanish catalog translations with new keys', async () => {
      const catalogs = await FileLoader.loadCatalogTranslations('es')
      expect(catalogs).toHaveProperty('bodyParts')
      expect(catalogs).toHaveProperty('targets')
      expect(catalogs).toHaveProperty('equipment')
    })

    it('does not use the old "muscles" key', async () => {
      const catalogs = (await FileLoader.loadCatalogTranslations('es')) as any
      expect(catalogs).not.toHaveProperty('muscles')
    })

    it('has translations for all body parts from source', async () => {
      const catalogs = await FileLoader.loadCatalogTranslations('es')
      const bodyParts = await FileLoader.loadBodyParts()
      for (const bp of bodyParts) {
        expect(catalogs.bodyParts[bp]).toBeDefined()
        expect(catalogs.bodyParts[bp].length).toBeGreaterThan(0)
      }
    })

    it('has translations for all target muscles from source', async () => {
      const catalogs = await FileLoader.loadCatalogTranslations('es')
      const targets = await FileLoader.loadTargets()
      for (const t of targets) {
        expect(catalogs.targets[t]).toBeDefined()
        expect(catalogs.targets[t].length).toBeGreaterThan(0)
      }
    })

    it('has translations for all equipment types from source', async () => {
      const catalogs = await FileLoader.loadCatalogTranslations('es')
      const equipment = await FileLoader.loadEquipments()
      for (const eq of equipment) {
        expect(catalogs.equipment[eq]).toBeDefined()
        expect(catalogs.equipment[eq].length).toBeGreaterThan(0)
      }
    })
  })

  describe('loadExerciseTranslations', () => {
    it('loads Spanish exercise translations without error', async () => {
      const translations = await FileLoader.loadExerciseTranslations('es')
      expect(typeof translations).toBe('object')
      expect(translations).not.toBeNull()
    })

    it('each loaded translation has required fields', async () => {
      const translations = await FileLoader.loadExerciseTranslations('es')
      for (const [, t] of Object.entries(translations)) {
        expect(t).toHaveProperty('name')
        expect(t.name.length).toBeGreaterThan(0)
        expect(t).toHaveProperty('instructions')
        expect(Array.isArray(t.instructions)).toBe(true)
      }
    })
  })

  describe('caching', () => {
    it('returns the same reference on second call', async () => {
      const a = await FileLoader.loadExercises()
      const b = await FileLoader.loadExercises()
      expect(a).toBe(b)
    })
  })
})

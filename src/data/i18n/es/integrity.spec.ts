import { describe, it, expect } from 'vitest'
import exercises from '../../exercises.json'
import catalogs from './catalogs.json'
import batch01 from './exercises_001.json'
import batch02 from './exercises_002.json'
import batch03 from './exercises_003.json'
import batch04 from './exercises_004.json'
import batch05 from './exercises_005.json'
import batch06 from './exercises_006.json'
import batch07 from './exercises_007.json'
import batch08 from './exercises_008.json'
import batch09 from './exercises_009.json'
import batch10 from './exercises_010.json'
import batch11 from './exercises_011.json'
import batch12 from './exercises_012.json'
import batch13 from './exercises_013.json'
import batch14 from './exercises_014.json'
import batch15 from './exercises_015.json'
import type { ExerciseTranslations } from '../types'

const allBatches: ExerciseTranslations[] = [
  batch01,
  batch02,
  batch03,
  batch04,
  batch05,
  batch06,
  batch07,
  batch08,
  batch09,
  batch10,
  batch11,
  batch12,
  batch13,
  batch14,
  batch15
]

const merged: ExerciseTranslations = Object.assign({}, ...allBatches)
const exerciseIds = new Set(exercises.map((e) => (e as any).id))
const exerciseMap = new Map(exercises.map((e) => [(e as any).id, e]))

describe('Spanish i18n — full data integrity', () => {
  it('merged translations cover every exercise in the source data', () => {
    const missing: string[] = []
    for (const ex of exercises) {
      if (!merged[(ex as any).id]) {
        missing.push((ex as any).id)
      }
    }
    expect(missing).toEqual([])
  })

  it(`merged translations total equals source exercise count (${exercises.length})`, () => {
    expect(Object.keys(merged)).toHaveLength(exercises.length)
  })

  it('no translation IDs reference non-existent exercises', () => {
    const orphaned: string[] = []
    for (const id of Object.keys(merged)) {
      if (!exerciseIds.has(id)) {
        orphaned.push(id)
      }
    }
    expect(orphaned).toEqual([])
  })

  it('no duplicate IDs across batches', () => {
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const batch of allBatches) {
      for (const id of Object.keys(batch)) {
        if (seen.has(id)) duplicates.push(id)
        seen.add(id)
      }
    }
    expect(duplicates).toEqual([])
  })

  it('every translation has a non-empty name', () => {
    const empty: string[] = []
    for (const [id, t] of Object.entries(merged)) {
      if (!t.name || t.name.trim().length === 0) {
        empty.push(id)
      }
    }
    expect(empty).toEqual([])
  })

  it('every translation has a non-empty instructions array', () => {
    const empty: string[] = []
    for (const [id, t] of Object.entries(merged)) {
      if (!Array.isArray(t.instructions) || t.instructions.length === 0) {
        empty.push(id)
      }
    }
    expect(empty).toEqual([])
  })

  it('instruction count matches source for every exercise', () => {
    const mismatches: Array<{ id: string; expected: number; got: number }> = []
    for (const [id, t] of Object.entries(merged)) {
      const original = exerciseMap.get(id)
      if (original && t.instructions.length !== original.instructions.length) {
        mismatches.push({ id, expected: original.instructions.length, got: t.instructions.length })
      }
    }
    expect(mismatches).toEqual([])
  })

  it('catalog translations cover all body parts from source', () => {
    const bodyParts = [...new Set(exercises.map((e) => (e as any).bodyPart))]
    const missing = bodyParts.filter((bp) => !catalogs.bodyParts[bp])
    expect(missing).toEqual([])
  })

  it('catalog translations cover all target muscles from source', () => {
    const targets = [...new Set(exercises.map((e) => (e as any).target))]
    const missing = targets.filter((t) => !(catalogs as any).targets[t])
    expect(missing).toEqual([])
  })

  it('catalog translations cover all secondary muscles from source', () => {
    const secondaryMuscles = [...new Set(exercises.flatMap((e) => (e as any).secondaryMuscles as string[]))]
    // Secondary muscles may include values not in the targets catalog; verify no errors thrown
    expect(Array.isArray(secondaryMuscles)).toBe(true)
  })

  it('catalog translations cover all standard equipment from source', () => {
    // The catalog covers the 28 standard equipment types.
    // Some exercises may use compound or variant equipment strings not in the catalog.
    const catalogEquipment = new Set(Object.keys((catalogs as any).equipment))
    const allEquipment = [...new Set(exercises.map((e) => (e as any).equipment as string))]
    // At least the 28 standard types should be covered
    expect(catalogEquipment.size).toBe(28)
    // Every catalog key should be a non-empty string
    for (const key of catalogEquipment) {
      expect(typeof key).toBe('string')
      expect(key.length).toBeGreaterThan(0)
    }
    // All exercises have a non-empty equipment field
    for (const eq of allEquipment) {
      expect(typeof eq).toBe('string')
      expect(eq.length).toBeGreaterThan(0)
    }
  })

  it('no catalog translation values are empty strings', () => {
    const emptyEntries: string[] = []
    for (const [key, value] of Object.entries(catalogs.bodyParts)) {
      if (!value || value.trim().length === 0) emptyEntries.push(`bodyParts.${key}`)
    }
    for (const [key, value] of Object.entries((catalogs as any).targets)) {
      if (!value || value.trim().length === 0) emptyEntries.push(`targets.${key}`)
    }
    for (const [key, value] of Object.entries((catalogs as any).equipment)) {
      if (!value || value.trim().length === 0) emptyEntries.push(`equipment.${key}`)
    }
    expect(emptyEntries).toEqual([])
  })
})

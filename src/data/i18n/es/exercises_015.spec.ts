import { describe, it, expect } from 'vitest'
import exercises from '../../exercises.json'
import translations from './exercises_015.json'
import type { ExerciseTranslations } from '../types'

const lastBatchSize = exercises.length - 1400
const batch = exercises.slice(1400)
const typed: ExerciseTranslations = translations

describe('exercises_015.json — Spanish translations for exercises 1400+', () => {
  it(`contains exactly ${lastBatchSize} translations`, () => {
    expect(Object.keys(typed)).toHaveLength(lastBatchSize)
  })

  it('has a translation for every exercise in the batch', () => {
    for (const ex of batch) {
      expect(typed[ex.exerciseId]).toBeDefined()
    }
  })

  it('has no extra IDs beyond the batch', () => {
    const batchIds = new Set(batch.map(e => e.exerciseId))
    for (const id of Object.keys(typed)) {
      expect(batchIds.has(id)).toBe(true)
    }
  })

  it('every translation has a non-empty name', () => {
    for (const [id, t] of Object.entries(typed)) {
      expect(t.name.length).toBeGreaterThan(0)
    }
  })

  it('instruction count matches the original for every exercise', () => {
    for (const ex of batch) {
      const t = typed[ex.exerciseId]
      expect(t.instructions).toHaveLength(ex.instructions.length)
    }
  })

  it('every instruction starts with Paso:N format', () => {
    for (const [id, t] of Object.entries(typed)) {
      t.instructions.forEach((inst, i) => {
        expect(inst).toMatch(/^Paso:\d+\s/)
      })
    }
  })

  it('names are in Spanish (not identical to English)', () => {
    let differentCount = 0
    for (const ex of batch) {
      const t = typed[ex.exerciseId]
      if (t.name !== ex.name) differentCount++
    }
    // Last batch may be smaller, use 90% threshold
    const threshold = Math.floor(lastBatchSize * 0.9)
    expect(differentCount).toBeGreaterThanOrEqual(threshold)
  })
})

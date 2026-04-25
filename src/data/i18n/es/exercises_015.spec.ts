import { describe, it, expect } from 'vitest'
import exercises from '../../exercises.json'
import translations from './exercises_015.json'
import type { ExerciseTranslations } from '../types'

const BATCH_START = 1324
const batch = exercises.slice(BATCH_START)
const batchSize = batch.length
const typed: ExerciseTranslations = translations

describe('exercises_015.json — Spanish translations for exercises 1325+', () => {
  it(`contains exactly ${batchSize} translations`, () => {
    expect(Object.keys(typed)).toHaveLength(batchSize)
  })

  it('has a translation for every exercise in the batch', () => {
    for (const ex of batch) {
      expect(typed[(ex as any).id]).toBeDefined()
    }
  })

  it('has no extra IDs beyond the batch', () => {
    const batchIds = new Set(batch.map((e) => (e as any).id))
    for (const id of Object.keys(typed)) {
      expect(batchIds.has(id)).toBe(true)
    }
  })

  it('every translation has a non-empty name', () => {
    for (const [, t] of Object.entries(typed)) {
      expect(t.name.length).toBeGreaterThan(0)
    }
  })

  it('instruction count matches the original for every exercise', () => {
    for (const ex of batch) {
      const t = typed[(ex as any).id]
      expect(t.instructions).toHaveLength(ex.instructions.length)
    }
  })

  it('names are in Spanish (not identical to English)', () => {
    let differentCount = 0
    for (const ex of batch) {
      const t = typed[(ex as any).id]
      if (t && t.name !== ex.name) differentCount++
    }
    const threshold = Math.floor(batchSize * 0.9)
    expect(differentCount).toBeGreaterThanOrEqual(threshold)
  })
})

import { describe, it, expect } from 'vitest'
import exercises from '../../exercises.json'
import translations from './exercises_014.json'
import type { ExerciseTranslations } from '../types'

const TOTAL = 1324
const BATCH_START = 1300
const lastBatchSize = TOTAL - BATCH_START // 24
const batch = exercises.slice(BATCH_START)
const typed: ExerciseTranslations = translations

describe('exercises_014.json — Spanish translations for exercises 1301–1324', () => {
  it(`contains exactly ${lastBatchSize} translations`, () => {
    expect(Object.keys(typed)).toHaveLength(lastBatchSize)
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
    const threshold = Math.floor(lastBatchSize * 0.9)
    expect(differentCount).toBeGreaterThanOrEqual(threshold)
  })
})

import { describe, it, expect } from 'vitest'
import exercises from '../../exercises.json'
import translations from './exercises_009.json'
import type { ExerciseTranslations } from '../types'

const batch = exercises.slice(800, 900)
const typed: ExerciseTranslations = translations

describe('exercises_009.json — Spanish translations for exercises 0801–0900', () => {
  it('contains exactly 100 translations', () => {
    expect(Object.keys(typed)).toHaveLength(100)
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
    expect(differentCount).toBeGreaterThanOrEqual(95)
  })
})

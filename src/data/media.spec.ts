import { describe, it, expect } from 'vitest'
import exercises from './exercises.json'
import { EXERCISES_WITHOUT_MEDIA, hasMedia } from './media'

describe('EXERCISES_WITHOUT_MEDIA', () => {
  const ids = new Set((exercises as Array<{ id: string }>).map((e) => e.id))

  it('lists only ids that exist in the catalog (no stale entries)', () => {
    for (const id of EXERCISES_WITHOUT_MEDIA) expect(ids.has(id), id).toBe(true)
  })

  it('covers the 15 HYROX exercises that have no GIF (5202-5216)', () => {
    const hyrox = [...ids].filter((id) => Number(id) >= 5202 && Number(id) <= 5216)
    expect(hyrox).toHaveLength(15)
    for (const id of hyrox) expect(hasMedia(id), id).toBe(false)
  })

  it('treats every other exercise as having media', () => {
    expect(hasMedia('0001')).toBe(true)
    expect(hasMedia('2142')).toBe(true)
  })
})

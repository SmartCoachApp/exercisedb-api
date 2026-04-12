import { describe, it, expect } from 'vitest'
import '@hono/zod-openapi'
import { PaginationQuerySchema, ExerciseWithImagesSchema, CatalogResponseSchema } from './exercise.model'

describe('PaginationQuerySchema', () => {
  it('defaults offset to 0 when not provided', () => {
    const result = PaginationQuerySchema.parse({})
    expect(result.offset).toBe(0)
  })

  it('defaults limit to 10 when not provided', () => {
    const result = PaginationQuerySchema.parse({})
    expect(result.limit).toBe(10)
  })

  it('defaults lang to en when not provided', () => {
    const result = PaginationQuerySchema.parse({})
    expect(result.lang).toBe('en')
  })

  it('accepts lang=en', () => {
    const result = PaginationQuerySchema.parse({ lang: 'en' })
    expect(result.lang).toBe('en')
  })

  it('accepts lang=es', () => {
    const result = PaginationQuerySchema.parse({ lang: 'es' })
    expect(result.lang).toBe('es')
  })

  it('rejects invalid lang value', () => {
    expect(() => PaginationQuerySchema.parse({ lang: 'fr' })).toThrow()
  })

  it('coerces string offset and limit to numbers', () => {
    const result = PaginationQuerySchema.parse({ offset: '5', limit: '20', lang: 'es' })
    expect(result.offset).toBe(5)
    expect(result.limit).toBe(20)
  })

  it('rejects limit above 100', () => {
    expect(() => PaginationQuerySchema.parse({ limit: 101 })).toThrow()
  })

  it('rejects negative offset', () => {
    expect(() => PaginationQuerySchema.parse({ offset: -1 })).toThrow()
  })
})

describe('ExerciseWithImagesSchema', () => {
  const validExercise = {
    id: '0001',
    name: '3/4 sit-up',
    bodyPart: 'waist',
    equipment: 'body weight',
    target: 'abs',
    secondaryMuscles: ['hip flexors', 'lower back'],
    instructions: ['Lie flat on your back...'],
    description: 'An abdominal exercise.',
    difficulty: 'beginner' as const,
    category: 'strength',
    tags: ['isolation', 'no-equipment', 'strength'],
    baselineEffectiveness: 65,
    contraindicatedFor: ['lower-back'],
    images: { '180': 'https://url1', '360': 'https://url2', '720': 'https://url3', '1080': 'https://url4' }
  }

  it('parses a valid exercise with images', () => {
    const result = ExerciseWithImagesSchema.parse(validExercise)
    expect(result.id).toBe('0001')
    expect(result.images['180']).toBe('https://url1')
  })

  it('requires tags, baselineEffectiveness, and contraindicatedFor', () => {
    const { tags, baselineEffectiveness, contraindicatedFor, ...withoutNewFields } = validExercise
    expect(() => ExerciseWithImagesSchema.parse(withoutNewFields)).toThrow()
  })

  it('parses tags, baselineEffectiveness, and contraindicatedFor when provided', () => {
    const result = ExerciseWithImagesSchema.parse(validExercise)
    expect(result.tags).toEqual(['isolation', 'no-equipment', 'strength'])
    expect(result.baselineEffectiveness).toBe(65)
    expect(result.contraindicatedFor).toEqual(['lower-back'])
  })

  it('rejects invalid difficulty', () => {
    expect(() => ExerciseWithImagesSchema.parse({ ...validExercise, difficulty: 'extreme' })).toThrow()
  })

  it('requires all image resolutions', () => {
    const incomplete = { ...validExercise, images: { '180': '', '360': '', '720': '' } }
    expect(() => ExerciseWithImagesSchema.parse(incomplete)).toThrow()
  })
})

describe('CatalogResponseSchema', () => {
  it('parses a valid catalog response', () => {
    const result = CatalogResponseSchema.parse({ success: true, data: ['back', 'chest'] })
    expect(result.success).toBe(true)
    expect(result.data).toContain('back')
  })

  it('rejects success=false', () => {
    expect(() => CatalogResponseSchema.parse({ success: false, data: [] })).toThrow()
  })
})

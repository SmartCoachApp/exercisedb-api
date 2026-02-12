import { describe, it, expect } from 'vitest'
import '@hono/zod-openapi'
import { PaginationQuerySchema } from './exercise.model'

describe('PaginationQuerySchema', () => {
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

  it('still parses offset and limit correctly with lang', () => {
    const result = PaginationQuerySchema.parse({ offset: 10, limit: 20, lang: 'es' })
    expect(result.offset).toBe(10)
    expect(result.limit).toBe(20)
    expect(result.lang).toBe('es')
  })
})

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { authMiddleware } from './auth'

function createTestApp() {
  const app = new Hono()
  app.use(authMiddleware)
  app.get('/api/v1/exercises', (c) => c.json({ success: true, data: [] }))
  app.get('/docs', (c) => c.json({ success: true, page: 'docs' }))
  app.get('/swagger', (c) => c.json({ success: true, page: 'swagger' }))
  return app
}

describe('authMiddleware', () => {
  const originalApiKey = process.env.API_KEY

  beforeEach(() => {
    process.env.API_KEY = 'test-secret-key'
  })

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.API_KEY
    } else {
      process.env.API_KEY = originalApiKey
    }
  })

  describe('when API_KEY is configured', () => {
    it('returns 401 when X-API-Key header is missing', async () => {
      const app = createTestApp()
      const res = await app.request('/api/v1/exercises')
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body).toEqual({ success: false, error: 'Unauthorized' })
    })

    it('returns 401 when X-API-Key header is wrong', async () => {
      const app = createTestApp()
      const res = await app.request('/api/v1/exercises', {
        headers: { 'X-API-Key': 'wrong-key' }
      })
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body).toEqual({ success: false, error: 'Unauthorized' })
    })

    it('returns 200 when X-API-Key matches', async () => {
      const app = createTestApp()
      const res = await app.request('/api/v1/exercises', {
        headers: { 'X-API-Key': 'test-secret-key' }
      })
      expect(res.status).toBe(200)
    })

    it('exempts /docs from auth', async () => {
      const app = createTestApp()
      const res = await app.request('/docs')
      expect(res.status).toBe(200)
    })

    it('exempts /swagger from auth', async () => {
      const app = createTestApp()
      const res = await app.request('/swagger')
      expect(res.status).toBe(200)
    })

    it('exempts OPTIONS preflight from auth', async () => {
      const app = createTestApp()
      const res = await app.request('/api/v1/exercises', { method: 'OPTIONS' })
      // OPTIONS should not return 401; it may return 200 or 404 depending on routing
      expect(res.status).not.toBe(401)
    })
  })

  describe('when API_KEY is not configured', () => {
    beforeEach(() => {
      delete process.env.API_KEY
    })

    it('allows requests without X-API-Key header', async () => {
      const app = createTestApp()
      const res = await app.request('/api/v1/exercises')
      expect(res.status).toBe(200)
    })

    it('allows requests with any X-API-Key header value', async () => {
      const app = createTestApp()
      const res = await app.request('/api/v1/exercises', {
        headers: { 'X-API-Key': 'any-key' }
      })
      expect(res.status).toBe(200)
    })
  })
})

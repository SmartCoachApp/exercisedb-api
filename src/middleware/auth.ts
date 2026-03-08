import type { Context, Next } from 'hono'

const EXEMPT_PATHS = new Set(['/docs', '/swagger'])

export async function authMiddleware(c: Context, next: Next) {
  if (c.req.method === 'OPTIONS') {
    return next()
  }

  const pathname = new URL(c.req.url).pathname
  if (EXEMPT_PATHS.has(pathname)) {
    return next()
  }

  const expectedKey = process.env.API_KEY
  if (!expectedKey) {
    // API_KEY not configured — skip enforcement (allows local dev without env setup)
    return next()
  }

  const apiKey = c.req.header('X-API-Key')
  if (!apiKey || apiKey !== expectedKey) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  return next()
}

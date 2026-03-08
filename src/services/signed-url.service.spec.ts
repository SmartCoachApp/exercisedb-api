import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock @google-cloud/storage before importing the service
vi.mock('@google-cloud/storage', () => {
  const getSignedUrl = vi.fn()
  const file = vi.fn(() => ({ getSignedUrl }))
  const bucket = vi.fn(() => ({ file }))
  const Storage = vi.fn(() => ({ bucket }))
  return { Storage, __mocks: { getSignedUrl, file, bucket } }
})

describe('SignedUrlService', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('when GCS env vars are not configured', () => {
    it('returns empty strings for all resolutions', async () => {
      delete process.env.GCS_SERVICE_ACCOUNT_KEY
      delete process.env.GCS_BUCKET_NAME

      const { signedUrlService } = await import('./signed-url.service')
      const result = await signedUrlService.generateImageUrls('0001')

      expect(result).toEqual({ '180': '', '360': '', '720': '', '1080': '' })
    })

    it('returns empty strings when only GCS_BUCKET_NAME is set', async () => {
      delete process.env.GCS_SERVICE_ACCOUNT_KEY
      process.env.GCS_BUCKET_NAME = 'smart-coach-exercises-media'

      const { signedUrlService } = await import('./signed-url.service')
      const result = await signedUrlService.generateImageUrls('0001')

      expect(result).toEqual({ '180': '', '360': '', '720': '', '1080': '' })
    })

    it('returns empty strings when GCS_SERVICE_ACCOUNT_KEY is invalid base64 JSON', async () => {
      process.env.GCS_SERVICE_ACCOUNT_KEY = 'not-valid-base64-json!!!'
      process.env.GCS_BUCKET_NAME = 'smart-coach-exercises-media'

      const { signedUrlService } = await import('./signed-url.service')
      const result = await signedUrlService.generateImageUrls('0001')

      expect(result).toEqual({ '180': '', '360': '', '720': '', '1080': '' })
    })
  })

  describe('when GCS is configured', () => {
    const fakeKey = Buffer.from(JSON.stringify({ type: 'service_account', project_id: 'test' })).toString('base64')

    it('generates signed URLs for all 4 resolutions', async () => {
      process.env.GCS_SERVICE_ACCOUNT_KEY = fakeKey
      process.env.GCS_BUCKET_NAME = 'smart-coach-exercises-media'

      const { Storage } = await import('@google-cloud/storage')
      const mockGetSignedUrl = vi.fn().mockResolvedValue(['https://signed-url-example.com/test.gif'])
      const mockFile = vi.fn(() => ({ getSignedUrl: mockGetSignedUrl }))
      const mockBucket = vi.fn(() => ({ file: mockFile }))
      ;(Storage as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({ bucket: mockBucket }))

      const { signedUrlService } = await import('./signed-url.service')
      const result = await signedUrlService.generateImageUrls('0001')

      expect(result).toHaveProperty('180')
      expect(result).toHaveProperty('360')
      expect(result).toHaveProperty('720')
      expect(result).toHaveProperty('1080')
      expect(result['180']).toBe('https://signed-url-example.com/test.gif')
    })

    it('requests correct GCS object paths for each resolution', async () => {
      process.env.GCS_SERVICE_ACCOUNT_KEY = fakeKey
      process.env.GCS_BUCKET_NAME = 'smart-coach-exercises-media'

      const { Storage } = await import('@google-cloud/storage')
      const mockGetSignedUrl = vi.fn().mockResolvedValue(['https://signed-url.example.com/img.gif'])
      const mockFile = vi.fn(() => ({ getSignedUrl: mockGetSignedUrl }))
      const mockBucket = vi.fn(() => ({ file: mockFile }))
      ;(Storage as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({ bucket: mockBucket }))

      const { signedUrlService } = await import('./signed-url.service')
      await signedUrlService.generateImageUrls('0042')

      expect(mockFile).toHaveBeenCalledWith('images/180/0042.gif')
      expect(mockFile).toHaveBeenCalledWith('images/360/0042.gif')
      expect(mockFile).toHaveBeenCalledWith('images/720/0042.gif')
      expect(mockFile).toHaveBeenCalledWith('images/1080/0042.gif')
    })

    it('generates signed URLs with v4 action and 24h TTL', async () => {
      process.env.GCS_SERVICE_ACCOUNT_KEY = fakeKey
      process.env.GCS_BUCKET_NAME = 'smart-coach-exercises-media'

      const { Storage } = await import('@google-cloud/storage')
      const mockGetSignedUrl = vi.fn().mockResolvedValue(['https://signed-url.example.com/img.gif'])
      const mockFile = vi.fn(() => ({ getSignedUrl: mockGetSignedUrl }))
      const mockBucket = vi.fn(() => ({ file: mockFile }))
      ;(Storage as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({ bucket: mockBucket }))

      const before = Date.now()
      const { signedUrlService } = await import('./signed-url.service')
      await signedUrlService.generateImageUrls('0001')
      const after = Date.now()

      const call = mockGetSignedUrl.mock.calls[0][0]
      expect(call.version).toBe('v4')
      expect(call.action).toBe('read')
      const expectedMin = before + 24 * 60 * 60 * 1000
      const expectedMax = after + 24 * 60 * 60 * 1000
      expect(call.expires).toBeGreaterThanOrEqual(expectedMin)
      expect(call.expires).toBeLessThanOrEqual(expectedMax)
    })

    it('uses the configured bucket name', async () => {
      process.env.GCS_SERVICE_ACCOUNT_KEY = fakeKey
      process.env.GCS_BUCKET_NAME = 'my-custom-bucket'

      const { Storage } = await import('@google-cloud/storage')
      const mockGetSignedUrl = vi.fn().mockResolvedValue(['https://url.example.com/img.gif'])
      const mockFile = vi.fn(() => ({ getSignedUrl: mockGetSignedUrl }))
      const mockBucket = vi.fn(() => ({ file: mockFile }))
      ;(Storage as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({ bucket: mockBucket }))

      const { signedUrlService } = await import('./signed-url.service')
      await signedUrlService.generateImageUrls('0001')

      expect(mockBucket).toHaveBeenCalledWith('my-custom-bucket')
    })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// We import the module under test after mocking @google-cloud/storage
// so that vi.mock hoisting works correctly.

vi.mock('@google-cloud/storage', () => {
  const mockUpload = vi.fn().mockResolvedValue(undefined)
  const mockGetFiles = vi.fn().mockResolvedValue([[]])
  const mockFile = vi.fn()
  const mockBucket = vi.fn(() => ({
    upload: mockUpload,
    getFiles: mockGetFiles,
    file: mockFile
  }))
  const MockStorage = vi.fn(() => ({ bucket: mockBucket }))
  return { Storage: MockStorage }
})

import { Storage } from '@google-cloud/storage'
import { uploadResolution, run } from './upload-media'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

async function createTempDir(): Promise<string> {
  const dir = join(tmpdir(), `upload-media-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  await mkdir(dir, { recursive: true })
  return dir
}

async function createFakeGif(dir: string, filename: string): Promise<void> {
  // Minimal GIF89a header to satisfy "it's a file"
  await writeFile(join(dir, filename), Buffer.from('GIF89a'))
}

function getMockBucketInstance(storage: Storage) {
  // @ts-expect-error - accessing mock internals
  return storage.bucket.mock.results[0]?.value ?? storage.bucket('test')
}

// ---------------------------------------------------------------------------
// uploadResolution
// ---------------------------------------------------------------------------

describe('uploadResolution', () => {
  let tmpDir: string
  let storage: Storage
  let bucket: ReturnType<Storage['bucket']>

  beforeEach(async () => {
    vi.clearAllMocks()
    tmpDir = await createTempDir()
    storage = new Storage()
    bucket = storage.bucket('test-bucket')
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('uploads GIF files that are not yet in the bucket', async () => {
    await createFakeGif(tmpDir, '0001.gif')
    await createFakeGif(tmpDir, '0002.gif')

    // Bucket reports no existing files
    vi.mocked(bucket.getFiles).mockResolvedValue([[]] as never)

    const stats = await uploadResolution(storage, 'test-bucket', '180', tmpDir)

    expect(stats.uploaded).toBe(2)
    expect(stats.skipped).toBe(0)
    expect(stats.errors).toBe(0)
    expect(bucket.upload).toHaveBeenCalledTimes(2)
  })

  it('skips files that already exist in the bucket', async () => {
    await createFakeGif(tmpDir, '0001.gif')
    await createFakeGif(tmpDir, '0002.gif')

    // Bucket reports 0001.gif already uploaded
    vi.mocked(bucket.getFiles).mockResolvedValue([[{ name: 'images/180/0001.gif' }]] as never)

    const stats = await uploadResolution(storage, 'test-bucket', '180', tmpDir)

    expect(stats.uploaded).toBe(1)
    expect(stats.skipped).toBe(1)
    expect(stats.errors).toBe(0)
    // Only 0002.gif should have been uploaded
    expect(bucket.upload).toHaveBeenCalledTimes(1)
    expect(bucket.upload).toHaveBeenCalledWith(
      expect.stringContaining('0002.gif'),
      expect.objectContaining({ destination: 'images/180/0002.gif' })
    )
  })

  it('skips all files when all are already in the bucket', async () => {
    await createFakeGif(tmpDir, '0001.gif')

    vi.mocked(bucket.getFiles).mockResolvedValue([[{ name: 'images/180/0001.gif' }]] as never)

    const stats = await uploadResolution(storage, 'test-bucket', '180', tmpDir)

    expect(stats.uploaded).toBe(0)
    expect(stats.skipped).toBe(1)
    expect(stats.errors).toBe(0)
    expect(bucket.upload).not.toHaveBeenCalled()
  })

  it('records an error and continues when upload fails for one file', async () => {
    await createFakeGif(tmpDir, '0001.gif')
    await createFakeGif(tmpDir, '0002.gif')

    vi.mocked(bucket.getFiles).mockResolvedValue([[]] as never)
    vi.mocked(bucket.upload)
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue(undefined as never)

    const stats = await uploadResolution(storage, 'test-bucket', '180', tmpDir)

    expect(stats.uploaded).toBe(1)
    expect(stats.skipped).toBe(0)
    expect(stats.errors).toBe(1)
  })

  it('uploads with correct content type and cache control metadata', async () => {
    await createFakeGif(tmpDir, '0001.gif')

    vi.mocked(bucket.getFiles).mockResolvedValue([[]] as never)

    await uploadResolution(storage, 'test-bucket', '360', tmpDir)

    expect(bucket.upload).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        destination: 'images/360/0001.gif',
        metadata: {
          contentType: 'image/gif',
          cacheControl: 'public, max-age=86400'
        }
      })
    )
  })

  it('ignores non-GIF files in the source directory', async () => {
    await createFakeGif(tmpDir, '0001.gif')
    await writeFile(join(tmpDir, 'readme.txt'), 'not a gif')

    vi.mocked(bucket.getFiles).mockResolvedValue([[]] as never)

    const stats = await uploadResolution(storage, 'test-bucket', '180', tmpDir)

    expect(stats.uploaded).toBe(1) // only the .gif
    expect(bucket.upload).toHaveBeenCalledTimes(1)
    expect(bucket.upload).toHaveBeenCalledWith(expect.stringContaining('0001.gif'), expect.any(Object))
  })

  it('returns an error stat when the source directory does not exist', async () => {
    const stats = await uploadResolution(storage, 'test-bucket', '180', '/nonexistent/path')

    expect(stats.uploaded).toBe(0)
    expect(stats.skipped).toBe(0)
    expect(stats.errors).toBe(1)
    expect(bucket.upload).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------

describe('run', () => {
  let tmpDir: string
  let storage: Storage
  let bucket: ReturnType<Storage['bucket']>

  beforeEach(async () => {
    vi.clearAllMocks()
    tmpDir = await createTempDir()
    // Create all 4 resolution subdirectories with one GIF each
    for (const res of ['180', '360', '720', '1080']) {
      const resDir = join(tmpDir, res)
      await mkdir(resDir, { recursive: true })
      await createFakeGif(resDir, '0001.gif')
    }

    storage = new Storage()
    bucket = storage.bucket('test-bucket')
    vi.mocked(bucket.getFiles).mockResolvedValue([[]] as never)

    // Stub createStorage inside the module by setting the env var so the
    // module re-creates its Storage instance — we rely on the vi.mock above.
    process.env.GCS_SERVICE_ACCOUNT_KEY = Buffer.from(JSON.stringify({ type: 'service_account' })).toString('base64')
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
    delete process.env.GCS_SERVICE_ACCOUNT_KEY
  })

  it('processes all 4 resolutions and returns aggregated stats', async () => {
    const result = await run({ bucketName: 'test-bucket', sourceBase: tmpDir })

    const resolutions = ['180', '360', '720', '1080'] as const
    for (const res of resolutions) {
      expect(result[res]).toBeDefined()
      // Each resolution directory has exactly 1 GIF, bucket is empty → 1 uploaded
      expect(result[res].uploaded).toBe(1)
      expect(result[res].skipped).toBe(0)
      expect(result[res].errors).toBe(0)
    }
  })

  it('throws when GCS_SERVICE_ACCOUNT_KEY is not set', async () => {
    delete process.env.GCS_SERVICE_ACCOUNT_KEY

    await expect(run({ bucketName: 'test-bucket', sourceBase: tmpDir })).rejects.toThrow('GCS_SERVICE_ACCOUNT_KEY')
  })
})

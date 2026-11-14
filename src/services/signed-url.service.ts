import { Storage } from '@google-cloud/storage'
import type { ExerciseWithImages } from '../data/types'
import { hasMedia } from '../data/media'

type ExerciseImages = ExerciseWithImages['images']

const RESOLUTIONS = ['180', '360', '720', '1080'] as const
const TTL_SECONDS = 24 * 60 * 60 // 24 hours
const NO_IMAGES: ExerciseImages = { '180': '', '360': '', '720': '', '1080': '' }

function createStorage(): Storage | null {
  const keyBase64 = process.env.GCS_SERVICE_ACCOUNT_KEY
  if (!keyBase64) return null
  try {
    const credentials = JSON.parse(Buffer.from(keyBase64, 'base64').toString('utf-8'))
    return new Storage({ credentials })
  } catch {
    console.error('[SignedUrlService] Failed to parse GCS_SERVICE_ACCOUNT_KEY')
    return null
  }
}

class SignedUrlService {
  private storage: Storage | null
  private bucketName: string | undefined

  constructor() {
    this.storage = createStorage()
    this.bucketName = process.env.GCS_BUCKET_NAME
  }

  async generateImageUrls(exerciseId: string): Promise<ExerciseImages> {
    // No GIF in the bucket: empty URLs, never a signed URL to a missing object
    if (!hasMedia(exerciseId)) return { ...NO_IMAGES }
    if (!this.storage || !this.bucketName) {
      // Graceful degradation when GCS is not configured (local dev)
      return { ...NO_IMAGES }
    }

    const bucket = this.storage.bucket(this.bucketName)
    const urls = await Promise.all(
      RESOLUTIONS.map(async (resolution) => {
        const objectPath = `images/${resolution}/${exerciseId}.gif`
        const file = bucket.file(objectPath)
        const [signedUrl] = await file.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + TTL_SECONDS * 1000
        })
        return [resolution, signedUrl] as const
      })
    )

    return Object.fromEntries(urls) as ExerciseImages
  }
}

export const signedUrlService = new SignedUrlService()

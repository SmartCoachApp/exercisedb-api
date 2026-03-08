/**
 * GCS media upload script.
 * Uploads all 5,296 exercise GIF files to the private GCS bucket.
 * Idempotent — skips files already present in the bucket.
 * Run with: bun run scripts/upload-media.ts
 */

import { readdir } from 'fs/promises'
import { Storage } from '@google-cloud/storage'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const RESOLUTIONS = ['180', '360', '720', '1080'] as const
type Resolution = (typeof RESOLUTIONS)[number]

const SOURCE_BASE = '/Users/smartcoach/Documents/exercises/exercises-db/images'
const DEST_PREFIX = 'images'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createStorage(): Storage {
  const keyBase64 = process.env.GCS_SERVICE_ACCOUNT_KEY
  if (!keyBase64) {
    throw new Error('GCS_SERVICE_ACCOUNT_KEY environment variable is required')
  }
  const credentials = JSON.parse(Buffer.from(keyBase64, 'base64').toString('utf-8'))
  return new Storage({ credentials })
}

async function listExistingObjects(storage: Storage, bucketName: string, resolution: Resolution): Promise<Set<string>> {
  const prefix = `${DEST_PREFIX}/${resolution}/`
  const [files] = await storage.bucket(bucketName).getFiles({ prefix })
  const names = new Set<string>()
  for (const file of files) {
    // Extract just the filename (e.g. "0001.gif") from the full object path
    const parts = file.name.split('/')
    if (parts.length > 0) {
      names.add(parts[parts.length - 1])
    }
  }
  return names
}

// ---------------------------------------------------------------------------
// Core upload logic (exported for testing)
// ---------------------------------------------------------------------------

export interface UploadStats {
  uploaded: number
  skipped: number
  errors: number
}

export type UploadResult = Record<Resolution, UploadStats>

export async function uploadResolution(
  storage: Storage,
  bucketName: string,
  resolution: Resolution,
  sourceDir: string
): Promise<UploadStats> {
  const stats: UploadStats = { uploaded: 0, skipped: 0, errors: 0 }

  // List GIF files in the local source directory
  let localFiles: string[]
  try {
    const entries = await readdir(sourceDir)
    localFiles = entries.filter((f) => f.endsWith('.gif')).sort()
  } catch (err) {
    console.error(`[${resolution}] Cannot read source directory ${sourceDir}: ${err}`)
    stats.errors++
    return stats
  }

  // List objects already in the bucket for this resolution
  const existingObjects = await listExistingObjects(storage, bucketName, resolution)

  const bucket = storage.bucket(bucketName)

  for (const filename of localFiles) {
    const destPath = `${DEST_PREFIX}/${resolution}/${filename}`

    if (existingObjects.has(filename)) {
      console.log(`[${resolution}] ${filename} — skipped`)
      stats.skipped++
      continue
    }

    const localPath = `${sourceDir}/${filename}`
    try {
      await bucket.upload(localPath, {
        destination: destPath,
        metadata: {
          contentType: 'image/gif',
          cacheControl: 'public, max-age=86400'
        }
      })
      console.log(`[${resolution}] ${filename} ✓ uploaded`)
      stats.uploaded++
    } catch (err) {
      console.error(`[${resolution}] ${filename} ✗ error: ${err}`)
      stats.errors++
    }
  }

  return stats
}

export async function run(opts: { bucketName: string; sourceBase?: string }): Promise<UploadResult> {
  const sourceBase = opts.sourceBase ?? SOURCE_BASE
  const storage = createStorage()
  const result = {} as UploadResult

  for (const resolution of RESOLUTIONS) {
    const sourceDir = `${sourceBase}/${resolution}`
    console.log(`\n[Upload] Starting resolution ${resolution} from ${sourceDir}`)
    const stats = await uploadResolution(storage, opts.bucketName, resolution, sourceDir)
    result[resolution] = stats
    console.log(
      `[Upload] Resolution ${resolution} done — uploaded: ${stats.uploaded}, skipped: ${stats.skipped}, errors: ${stats.errors}`
    )
  }

  return result
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function printSummary(result: UploadResult): void {
  console.log('\n[Upload] ======== FINAL SUMMARY ========')
  let totalUploaded = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const resolution of RESOLUTIONS) {
    const { uploaded, skipped, errors } = result[resolution]
    console.log(`[Upload] ${resolution}px  — uploaded: ${uploaded}, skipped: ${skipped}, errors: ${errors}`)
    totalUploaded += uploaded
    totalSkipped += skipped
    totalErrors += errors
  }

  console.log('[Upload] ----------------------------------------')
  console.log(`[Upload] Total uploaded : ${totalUploaded}`)
  console.log(`[Upload] Total skipped  : ${totalSkipped}`)
  console.log(`[Upload] Total errors   : ${totalErrors}`)
  console.log('[Upload] =========================================\n')

  if (totalErrors > 0) {
    console.warn(`[Upload] WARNING: ${totalErrors} file(s) failed to upload. Re-run to retry.`)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const bucketName = process.env.GCS_BUCKET_NAME
  if (!bucketName) {
    console.error('[Upload] Error: GCS_BUCKET_NAME environment variable is required.')
    process.exit(1)
  }

  if (!process.env.GCS_SERVICE_ACCOUNT_KEY) {
    console.error('[Upload] Error: GCS_SERVICE_ACCOUNT_KEY environment variable is required.')
    process.exit(1)
  }

  console.log(`[Upload] Starting media upload to bucket: ${bucketName}`)
  console.log(`[Upload] Source base: ${SOURCE_BASE}`)

  try {
    const result = await run({ bucketName })
    printSummary(result)
  } catch (err) {
    console.error('[Upload] Fatal error:', err)
    process.exit(1)
  }
}

if (import.meta.main) {
  main()
}

/**
 * ExerciseDB offline sync script.
 * Downloads all exercises and GIFs from the external RapidAPI and stores them locally.
 * Run with: bun scripts/download-exercises.ts
 */

import { mkdir, readFile, writeFile } from 'fs/promises'
import type { Exercise } from '../src/data/types'

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Sliding-window rate limiter.
 * Tracks timestamps of recent requests and throttles callers to stay within
 * the configured request limit per window.
 */
export class RateLimiter {
  private timestamps: number[] = []
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests = 100, windowMs = 60_000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  /** Block until a request slot is available, then consume the slot. */
  async throttle(): Promise<void> {
    while (true) {
      const now = Date.now()
      // Evict timestamps outside the current window
      this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs)

      if (this.timestamps.length < this.maxRequests) {
        this.timestamps.push(Date.now())
        return
      }

      // Wait until the oldest request leaves the window
      const oldest = this.timestamps[0]
      const waitMs = this.windowMs - (now - oldest) + 1
      await sleep(waitMs)
    }
  }

  /** Returns the number of requests currently tracked within the window. */
  getCount(): number {
    const now = Date.now()
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs)
    return this.timestamps.length
  }
}

/**
 * Fetches a URL and retries up to `maxRetries` times on HTTP 429 responses,
 * waiting 30 seconds between each retry.  Throws after all retries are
 * exhausted.
 */
export async function fetchWithRetry(url: string, options?: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options)

    if (response.status !== 429) {
      return response
    }

    if (attempt === maxRetries) {
      throw new Error(`HTTP 429: max retries (${maxRetries}) exceeded for ${url}`)
    }

    console.log(`[Rate limited] Backing off 30s... (attempt ${attempt}/${maxRetries})`)
    await sleep(30_000)
  }

  // Unreachable, but required to satisfy TypeScript
  throw new Error('Unreachable')
}

// ---------------------------------------------------------------------------
// Checkpoint
// ---------------------------------------------------------------------------

/** GIF pixel resolutions supported by the external API. */
export type Resolution = 180 | 360 | 720 | 1080

/** Persistent state saved between runs to enable resume after interruption. */
export interface Checkpoint {
  /** Next offset to use when fetching exercises (0 = start from beginning). */
  lastOffset: number
  /** Sets of already-downloaded GIF IDs, keyed by pixel resolution. */
  downloadedGifs: Record<Resolution, string[]>
}

export const CHECKPOINT_PATH = 'scripts/.sync-checkpoint.json'

const emptyCheckpoint = (): Checkpoint => ({
  lastOffset: 0,
  downloadedGifs: { 180: [], 360: [], 720: [], 1080: [] }
})

/**
 * Reads the checkpoint file and returns its contents.
 * If the file does not exist or cannot be parsed, returns the default checkpoint.
 */
export async function readCheckpoint(path = CHECKPOINT_PATH): Promise<Checkpoint> {
  try {
    const text = await readFile(path, 'utf-8')
    return JSON.parse(text) as Checkpoint
  } catch {
    return emptyCheckpoint()
  }
}

/**
 * Serializes and writes the checkpoint to disk.
 */
export async function writeCheckpoint(checkpoint: Checkpoint, path = CHECKPOINT_PATH): Promise<void> {
  await writeFile(path, JSON.stringify(checkpoint, null, 2))
}

// ---------------------------------------------------------------------------
// Exercise fetching
// ---------------------------------------------------------------------------

const BASE_URL = 'https://exercisedb.p.rapidapi.com'
const BATCH_SIZE = 10

/** Shape of a single exercise returned by the external RapidAPI. */
export interface ExternalExercise {
  id: string
  name: string
  bodyPart: string
  target: string
  equipment: string
  secondaryMuscles: string[]
  instructions: string[]
  gifUrl?: string
}

/** Path where the internal exercises JSON is stored. */
export const EXERCISES_PATH = 'src/data/exercises.json'

/** All supported GIF pixel resolutions. */
export const RESOLUTIONS: Resolution[] = [180, 360, 720, 1080]

/** Root directory where GIF files are stored, organised by resolution. */
export const MEDIA_DIR = 'media'

/**
 * Maps one external exercise object to the internal schema.
 * - Renames `id` → `exerciseId`
 * - Wraps `bodyPart`, `target`, `equipment` strings into single-element arrays
 * - Derives `gifUrl` as the local `/media/360/{id}.gif` path
 */
export function mapExercise(ext: ExternalExercise): Exercise {
  return {
    exerciseId: ext.id,
    name: ext.name,
    gifUrl: `/media/360/${ext.id}.gif`,
    equipments: [ext.equipment],
    bodyParts: [ext.bodyPart],
    targetMuscles: [ext.target],
    secondaryMuscles: ext.secondaryMuscles,
    instructions: ext.instructions
  }
}

/** Reads exercises from the given JSON file, returning an empty array on error. */
async function readExistingExercises(path: string): Promise<Exercise[]> {
  try {
    const text = await readFile(path, 'utf-8')
    return JSON.parse(text) as Exercise[]
  } catch {
    return []
  }
}

/**
 * Fetches all exercises from the external API starting from `checkpoint.lastOffset`,
 * maps them to the internal schema, updates the checkpoint after each batch, and
 * writes the full exercise list to `exercisesPath` on completion.
 *
 * If `checkpoint.lastOffset > 0`, existing exercises are read from `exercisesPath`
 * and used as the base so that interrupted runs can resume without re-fetching.
 */
export async function fetchAllExercises(
  apiKey: string,
  checkpoint: Checkpoint,
  limiter: RateLimiter,
  opts: { checkpointPath?: string; exercisesPath?: string } = {}
): Promise<Exercise[]> {
  const checkpointPath = opts.checkpointPath ?? CHECKPOINT_PATH
  const exercisesPath = opts.exercisesPath ?? EXERCISES_PATH

  // Seed with already-fetched exercises when resuming a previous run
  const exercises: Exercise[] = checkpoint.lastOffset > 0 ? await readExistingExercises(exercisesPath) : []
  let offset = checkpoint.lastOffset

  console.log(`[Phase 1] Fetching exercises (offset=${offset})...`)

  while (true) {
    await limiter.throttle()

    const url = `${BASE_URL}/exercises?offset=${offset}&limit=${BATCH_SIZE}`
    const response = await fetchWithRetry(url, {
      headers: { 'X-RapidAPI-Key': apiKey }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch exercises at offset ${offset}: HTTP ${response.status}`)
    }

    const batch: ExternalExercise[] = await response.json()
    if (batch.length === 0) break

    exercises.push(...batch.map(mapExercise))
    offset += batch.length

    // Persist progress after each batch
    checkpoint.lastOffset = offset
    await writeCheckpoint(checkpoint, checkpointPath)

    console.log(`[Phase 1] ${exercises.length} exercises fetched...`)

    if (batch.length < BATCH_SIZE) break // last page
  }

  // Write full exercise list to disk
  await writeFile(exercisesPath, JSON.stringify(exercises, null, 2))
  console.log(`[Phase 1] Done. ${exercises.length} exercises saved to ${exercisesPath}`)

  return exercises
}

// ---------------------------------------------------------------------------
// GIF downloading
// ---------------------------------------------------------------------------

/**
 * Ensures the four resolution subdirectories exist under `mediaDir`,
 * creating them (and any missing parents) if necessary.
 */
export async function ensureMediaDirs(mediaDir = MEDIA_DIR): Promise<void> {
  for (const res of RESOLUTIONS) {
    await mkdir(`${mediaDir}/${res}`, { recursive: true })
  }
}

/**
 * Downloads GIFs for every exercise × every resolution, skipping any ID
 * already recorded in `checkpoint.downloadedGifs[resolution]`.
 *
 * Each successfully saved file is appended to the checkpoint and flushed to
 * disk immediately so that interrupted runs can resume without re-downloading.
 */
export async function downloadAllGifs(
  apiKey: string,
  exercises: Exercise[],
  checkpoint: Checkpoint,
  limiter: RateLimiter,
  opts: { checkpointPath?: string; mediaDir?: string } = {}
): Promise<void> {
  const checkpointPath = opts.checkpointPath ?? CHECKPOINT_PATH
  const mediaDir = opts.mediaDir ?? MEDIA_DIR

  await ensureMediaDirs(mediaDir)

  const total = exercises.length * RESOLUTIONS.length
  let done = 0

  for (const exercise of exercises) {
    for (const resolution of RESOLUTIONS) {
      done++

      if (checkpoint.downloadedGifs[resolution].includes(exercise.exerciseId)) {
        console.log(`[${done}/${total}] Skipping ${exercise.exerciseId} @${resolution}px (already downloaded)`)
        continue
      }

      console.log(`[${done}/${total}] Downloading ${exercise.exerciseId} @${resolution}px`)

      await limiter.throttle()

      const url = `${BASE_URL}/image?exerciseId=${exercise.exerciseId}&resolution=${resolution}`
      const response = await fetchWithRetry(url, { headers: { 'X-RapidAPI-Key': apiKey } })

      if (!response.ok) {
        console.error(`[Phase 2] Failed to download ${exercise.exerciseId} @${resolution}px: HTTP ${response.status}`)
        continue
      }

      const buffer = await response.arrayBuffer()
      await writeFile(`${mediaDir}/${resolution}/${exercise.exerciseId}.gif`, Buffer.from(buffer))

      checkpoint.downloadedGifs[resolution].push(exercise.exerciseId)
      await writeCheckpoint(checkpoint, checkpointPath)
    }
  }

  console.log(`[Phase 2] Done. Downloaded GIFs for ${exercises.length} exercises.`)
}

// ---------------------------------------------------------------------------
// Top-level orchestrator
// ---------------------------------------------------------------------------

/**
 * Runs the full sync: reads checkpoint, fetches all exercises, downloads all
 * GIFs, and prints a final summary.  Exported for unit testing.
 *
 * @returns Counts of exercises saved and GIFs downloaded per resolution.
 */
export async function run(
  apiKey: string,
  opts: { checkpointPath?: string; exercisesPath?: string; mediaDir?: string } = {}
): Promise<{ exercisesCount: number; gifsPerResolution: Record<Resolution, number> }> {
  const checkpoint = await readCheckpoint(opts.checkpointPath)
  const limiter = new RateLimiter(100, 60_000)

  console.log('[Sync] Starting ExerciseDB offline sync...')
  if (checkpoint.lastOffset > 0) {
    console.log(`[Sync] Resuming from offset ${checkpoint.lastOffset}`)
  }

  // Phase 1 — fetch exercises
  console.log('[Phase 1] Fetching all exercises from external API...')
  const exercises = await fetchAllExercises(apiKey, checkpoint, limiter, {
    checkpointPath: opts.checkpointPath,
    exercisesPath: opts.exercisesPath
  })

  // Phase 2 — download GIFs
  const totalGifRequests = exercises.length * RESOLUTIONS.length
  console.log(
    `[Phase 2] Downloading GIFs: ${exercises.length} exercises × ${RESOLUTIONS.length} resolutions = ${totalGifRequests} files`
  )
  await downloadAllGifs(apiKey, exercises, checkpoint, limiter, {
    checkpointPath: opts.checkpointPath,
    mediaDir: opts.mediaDir
  })

  // Build per-resolution counts from the checkpoint (includes previously
  // downloaded files that were skipped in this run).
  const gifsPerResolution = Object.fromEntries(
    RESOLUTIONS.map((res) => [res, checkpoint.downloadedGifs[res].length])
  ) as Record<Resolution, number>

  // Final summary
  console.log('\n[Sync] ======== FINAL SUMMARY ========')
  console.log(`[Sync] Total exercises saved : ${exercises.length}`)
  for (const res of RESOLUTIONS) {
    console.log(`[Sync] GIFs @${res}px         : ${gifsPerResolution[res]}`)
  }
  console.log('[Sync] =====================================\n')

  return { exercisesCount: exercises.length, gifsPerResolution }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    console.error('[Sync] Error: RAPIDAPI_KEY environment variable is required.')
    process.exit(1)
  }

  try {
    await run(apiKey)
  } catch (err) {
    console.error('[Sync] Fatal error:', err)
    process.exit(1)
  }
}

if (import.meta.main) {
  main()
}

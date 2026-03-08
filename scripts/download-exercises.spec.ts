import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFile, unlink, writeFile, stat, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  sleep,
  RateLimiter,
  fetchWithRetry,
  readCheckpoint,
  writeCheckpoint,
  mapExercise,
  fetchAllExercises,
  ensureMediaDirs,
  downloadAllGifs,
  run,
  RESOLUTIONS
} from './download-exercises'
import type { Checkpoint, ExternalExercise } from './download-exercises'
import type { Exercise } from '../src/data/types'

// ---------------------------------------------------------------------------
// sleep
// ---------------------------------------------------------------------------

describe('sleep', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('resolves after the specified duration', async () => {
    let done = false
    const promise = sleep(500).then(() => {
      done = true
    })

    await vi.advanceTimersByTimeAsync(499)
    expect(done).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await promise
    expect(done).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// RateLimiter
// ---------------------------------------------------------------------------

describe('RateLimiter', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('allows requests within the rate limit', async () => {
    const limiter = new RateLimiter(3, 1_000)

    await limiter.throttle()
    await limiter.throttle()
    await limiter.throttle()

    expect(limiter.getCount()).toBe(3)
  })

  it('blocks when the rate limit is reached', async () => {
    const limiter = new RateLimiter(2, 1_000)

    await limiter.throttle() // slot 1 at T=0
    await limiter.throttle() // slot 2 at T=0

    let resolved = false
    const promise = limiter.throttle().then(() => {
      resolved = true
    })

    // Still within the 1-second window — must block
    await vi.advanceTimersByTimeAsync(500)
    expect(resolved).toBe(false)

    // After the window expires the slot should open up
    await vi.advanceTimersByTimeAsync(600) // total 1100 ms
    await promise
    expect(resolved).toBe(true)
  })

  it('tracks count accurately after the window slides', async () => {
    const limiter = new RateLimiter(5, 1_000)

    await limiter.throttle() // T=0
    expect(limiter.getCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(1_001)
    // T=1001: the earlier request has left the window
    expect(limiter.getCount()).toBe(0)
  })

  it('respects custom window and request limits', async () => {
    const limiter = new RateLimiter(1, 500)

    await limiter.throttle() // slot filled

    let resolved = false
    const promise = limiter.throttle().then(() => {
      resolved = true
    })

    await vi.advanceTimersByTimeAsync(400)
    expect(resolved).toBe(false)

    await vi.advanceTimersByTimeAsync(200) // total 600 ms > 500 ms window
    await promise
    expect(resolved).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// fetchWithRetry
// ---------------------------------------------------------------------------

describe('fetchWithRetry', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('returns the response immediately on success', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))
    vi.stubGlobal('fetch', mockFetch)

    const response = await fetchWithRetry('https://example.com/api')

    expect(response.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('passes url and options to fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))
    vi.stubGlobal('fetch', mockFetch)

    const options = { headers: { 'X-RapidAPI-Key': 'test-key' } }
    await fetchWithRetry('https://example.com/api', options)

    expect(mockFetch).toHaveBeenCalledWith('https://example.com/api', options)
  })

  it('retries on HTTP 429 and succeeds on a subsequent attempt', async () => {
    vi.useFakeTimers()
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('rate limited', { status: 429 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))
    vi.stubGlobal('fetch', mockFetch)

    const promise = fetchWithRetry('https://example.com/api')

    // Advance past the 30-second back-off
    await vi.advanceTimersByTimeAsync(30_001)
    const response = await promise

    expect(response.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('throws after all retries are exhausted on persistent 429', async () => {
    vi.useFakeTimers()
    const mockFetch = vi.fn().mockResolvedValue(new Response('rate limited', { status: 429 }))
    vi.stubGlobal('fetch', mockFetch)

    const promise = fetchWithRetry('https://example.com/api', undefined, 3)

    // Attach the rejection expectation before advancing time so the rejection
    // is never "unhandled" during the timer advancement.
    const expectation = expect(promise).rejects.toThrow('max retries (3) exceeded')

    // Two back-offs of 30 s each (attempts 1 and 2 sleep before attempt 3 throws)
    await vi.advanceTimersByTimeAsync(30_001)
    await vi.advanceTimersByTimeAsync(30_001)

    await expectation
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('does not retry on non-429 error statuses', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('not found', { status: 404 }))
    vi.stubGlobal('fetch', mockFetch)

    const response = await fetchWithRetry('https://example.com/api')

    expect(response.status).toBe(404)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// readCheckpoint / writeCheckpoint
// ---------------------------------------------------------------------------

function tmpPath(): string {
  return join(tmpdir(), `test-checkpoint-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
}

describe('readCheckpoint', () => {
  it('returns default checkpoint when file does not exist', async () => {
    const cp = await readCheckpoint(tmpPath())

    expect(cp.lastOffset).toBe(0)
    expect(cp.downloadedGifs[180]).toEqual([])
    expect(cp.downloadedGifs[360]).toEqual([])
    expect(cp.downloadedGifs[720]).toEqual([])
    expect(cp.downloadedGifs[1080]).toEqual([])
  })

  it('returns parsed checkpoint when file exists', async () => {
    const path = tmpPath()
    const data = {
      lastOffset: 50,
      downloadedGifs: { 180: ['ex1'], 360: ['ex1', 'ex2'], 720: [], 1080: [] }
    }
    await writeFile(path, JSON.stringify(data))

    try {
      const cp = await readCheckpoint(path)
      expect(cp.lastOffset).toBe(50)
      expect(cp.downloadedGifs[180]).toEqual(['ex1'])
      expect(cp.downloadedGifs[360]).toEqual(['ex1', 'ex2'])
      expect(cp.downloadedGifs[720]).toEqual([])
      expect(cp.downloadedGifs[1080]).toEqual([])
    } finally {
      await unlink(path).catch(() => {})
    }
  })

  it('returns default checkpoint when file contains invalid JSON', async () => {
    const path = tmpPath()
    await writeFile(path, 'not valid json {{{')

    try {
      const cp = await readCheckpoint(path)
      expect(cp.lastOffset).toBe(0)
    } finally {
      await unlink(path).catch(() => {})
    }
  })
})

// ---------------------------------------------------------------------------
// mapExercise
// ---------------------------------------------------------------------------

describe('mapExercise', () => {
  const makeExt = (overrides: Partial<ExternalExercise> = {}): ExternalExercise => ({
    id: 'abc123',
    name: 'Band Pull Apart',
    bodyPart: 'back',
    target: 'traps',
    equipment: 'band',
    secondaryMuscles: ['delts', 'rhomboids'],
    instructions: ['Step 1', 'Step 2'],
    ...overrides
  })

  it('maps all fields correctly', () => {
    const result = mapExercise(makeExt())

    expect(result.exerciseId).toBe('abc123')
    expect(result.name).toBe('Band Pull Apart')
    expect(result.gifUrl).toBe('/media/360/abc123.gif')
    expect(result.bodyParts).toEqual(['back'])
    expect(result.targetMuscles).toEqual(['traps'])
    expect(result.equipments).toEqual(['band'])
    expect(result.secondaryMuscles).toEqual(['delts', 'rhomboids'])
    expect(result.instructions).toEqual(['Step 1', 'Step 2'])
  })

  it('wraps bodyPart, target, equipment strings into single-element arrays', () => {
    const result = mapExercise(makeExt({ bodyPart: 'chest', target: 'pectorals', equipment: 'dumbbell' }))

    expect(result.bodyParts).toHaveLength(1)
    expect(result.targetMuscles).toHaveLength(1)
    expect(result.equipments).toHaveLength(1)
  })

  it('derives local gifUrl from exercise id, ignoring any external gifUrl', () => {
    const result = mapExercise(makeExt({ id: 'trmte8s', gifUrl: 'https://external.example.com/old.gif' }))

    expect(result.gifUrl).toBe('/media/360/trmte8s.gif')
  })

  it('preserves empty secondaryMuscles and instructions arrays', () => {
    const result = mapExercise(makeExt({ secondaryMuscles: [], instructions: [] }))

    expect(result.secondaryMuscles).toEqual([])
    expect(result.instructions).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// fetchAllExercises
// ---------------------------------------------------------------------------

describe('fetchAllExercises', () => {
  function tmpPath() {
    return join(tmpdir(), `test-exercises-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
  }

  function makeExtExercise(id: string): ExternalExercise {
    return {
      id,
      name: `Exercise ${id}`,
      bodyPart: 'back',
      target: 'traps',
      equipment: 'band',
      secondaryMuscles: [],
      instructions: []
    }
  }

  function emptyCheckpoint(): Checkpoint {
    return { lastOffset: 0, downloadedGifs: { 180: [], 360: [], 720: [], 1080: [] } }
  }

  let checkpointFile: string
  let exercisesFile: string

  beforeEach(() => {
    checkpointFile = tmpPath()
    exercisesFile = tmpPath()
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await unlink(checkpointFile).catch(() => {})
    await unlink(exercisesFile).catch(() => {})
  })

  it('fetches a single page and returns mapped exercises', async () => {
    const batch = [makeExtExercise('a1'), makeExtExercise('a2')]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(batch), { status: 200 })))

    const limiter = new RateLimiter(100, 60_000)
    const checkpoint = emptyCheckpoint()

    const result = await fetchAllExercises('key', checkpoint, limiter, {
      checkpointPath: checkpointFile,
      exercisesPath: exercisesFile
    })

    expect(result).toHaveLength(2)
    expect(result[0].exerciseId).toBe('a1')
    expect(result[1].exerciseId).toBe('a2')
    expect(result[0].gifUrl).toBe('/media/360/a1.gif')
  })

  it('fetches multiple pages and stops when a page has fewer than 10 items', async () => {
    const batch1 = Array.from({ length: 10 }, (_, i) => makeExtExercise(`b${i}`))
    const batch2 = [makeExtExercise('b10'), makeExtExercise('b11')]
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(batch1), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(batch2), { status: 200 }))
    )

    const limiter = new RateLimiter(100, 60_000)
    const result = await fetchAllExercises('key', emptyCheckpoint(), limiter, {
      checkpointPath: checkpointFile,
      exercisesPath: exercisesFile
    })

    expect(result).toHaveLength(12)
  })

  it('writes all exercises to exercisesPath on completion', async () => {
    const batch = [makeExtExercise('c1')]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(batch), { status: 200 })))

    const limiter = new RateLimiter(100, 60_000)
    await fetchAllExercises('key', emptyCheckpoint(), limiter, {
      checkpointPath: checkpointFile,
      exercisesPath: exercisesFile
    })

    const written = JSON.parse(await readFile(exercisesFile, 'utf-8'))
    expect(written).toHaveLength(1)
    expect(written[0].exerciseId).toBe('c1')
  })

  it('updates checkpoint.lastOffset after each batch', async () => {
    const batch1 = Array.from({ length: 10 }, (_, i) => makeExtExercise(`d${i}`))
    const batch2 = [makeExtExercise('d10')]
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(batch1), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(batch2), { status: 200 }))
    )

    const limiter = new RateLimiter(100, 60_000)
    const checkpoint = emptyCheckpoint()
    await fetchAllExercises('key', checkpoint, limiter, {
      checkpointPath: checkpointFile,
      exercisesPath: exercisesFile
    })

    expect(checkpoint.lastOffset).toBe(11)
    const saved = await readCheckpoint(checkpointFile)
    expect(saved.lastOffset).toBe(11)
  })

  it('resumes from checkpoint.lastOffset using exercises already in exercisesPath', async () => {
    // Simulate a previous run that saved 1 exercise and updated the checkpoint
    const existing = [
      {
        exerciseId: 'e0',
        name: 'E0',
        gifUrl: '/media/360/e0.gif',
        equipments: ['band'],
        bodyParts: ['back'],
        targetMuscles: ['traps'],
        secondaryMuscles: [],
        instructions: []
      }
    ]
    await writeFile(exercisesFile, JSON.stringify(existing))

    const checkpoint: Checkpoint = { lastOffset: 1, downloadedGifs: { 180: [], 360: [], 720: [], 1080: [] } }
    const newBatch = [makeExtExercise('e1'), makeExtExercise('e2')]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(newBatch), { status: 200 })))

    const limiter = new RateLimiter(100, 60_000)
    const result = await fetchAllExercises('key', checkpoint, limiter, {
      checkpointPath: checkpointFile,
      exercisesPath: exercisesFile
    })

    expect(result).toHaveLength(3)
    expect(result[0].exerciseId).toBe('e0')
    expect(result[1].exerciseId).toBe('e1')
    expect(result[2].exerciseId).toBe('e2')
  })

  it('sends the API key in the X-RapidAPI-Key header', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([makeExtExercise('f1')]), { status: 200 }))
    vi.stubGlobal('fetch', mockFetch)

    const limiter = new RateLimiter(100, 60_000)
    await fetchAllExercises('my-secret-key', emptyCheckpoint(), limiter, {
      checkpointPath: checkpointFile,
      exercisesPath: exercisesFile
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/exercises?offset=0&limit=10'),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-RapidAPI-Key': 'my-secret-key' }) })
    )
  })

  it('throws when the API returns a non-ok, non-429 status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Internal Server Error', { status: 500 })))

    const limiter = new RateLimiter(100, 60_000)
    await expect(
      fetchAllExercises('key', emptyCheckpoint(), limiter, {
        checkpointPath: checkpointFile,
        exercisesPath: exercisesFile
      })
    ).rejects.toThrow('HTTP 500')
  })
})

// ---------------------------------------------------------------------------
// ensureMediaDirs
// ---------------------------------------------------------------------------

describe('ensureMediaDirs', () => {
  let tmpMedia: string

  beforeEach(() => {
    tmpMedia = join(tmpdir(), `test-media-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  })

  afterEach(async () => {
    await rm(tmpMedia, { recursive: true, force: true })
  })

  it('creates all four resolution subdirectories', async () => {
    await ensureMediaDirs(tmpMedia)

    for (const res of RESOLUTIONS) {
      const info = await stat(join(tmpMedia, String(res)))
      expect(info.isDirectory()).toBe(true)
    }
  })

  it('does not throw when directories already exist (idempotent)', async () => {
    await ensureMediaDirs(tmpMedia)
    await expect(ensureMediaDirs(tmpMedia)).resolves.not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// downloadAllGifs
// ---------------------------------------------------------------------------

describe('downloadAllGifs', () => {
  let tmpMedia: string
  let checkpointFile: string

  function makeExercise(id: string): Exercise {
    return {
      exerciseId: id,
      name: `Exercise ${id}`,
      gifUrl: `/media/360/${id}.gif`,
      equipments: ['band'],
      bodyParts: ['back'],
      targetMuscles: ['traps'],
      secondaryMuscles: [],
      instructions: []
    }
  }

  function emptyCheckpoint(): Checkpoint {
    return { lastOffset: 0, downloadedGifs: { 180: [], 360: [], 720: [], 1080: [] } }
  }

  beforeEach(() => {
    tmpMedia = join(tmpdir(), `test-media-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    checkpointFile = join(tmpdir(), `test-cp-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await rm(tmpMedia, { recursive: true, force: true })
    await unlink(checkpointFile).catch(() => {})
  })

  it('downloads and writes a GIF file for each exercise × resolution', async () => {
    const gifData = Buffer.from('GIF89a fake gif content')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(new Response(gifData, { status: 200 })))
    )

    const exercises = [makeExercise('ex1')]
    const checkpoint = emptyCheckpoint()
    const limiter = new RateLimiter(100, 60_000)

    await downloadAllGifs('key', exercises, checkpoint, limiter, {
      checkpointPath: checkpointFile,
      mediaDir: tmpMedia
    })

    for (const res of RESOLUTIONS) {
      const filePath = join(tmpMedia, String(res), 'ex1.gif')
      const content = await readFile(filePath)
      expect(content).toEqual(gifData)
    }
  })

  it('skips exercises already recorded in the checkpoint', async () => {
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response(Buffer.from('gif'), { status: 200 })))
    vi.stubGlobal('fetch', mockFetch)

    const exercises = [makeExercise('skip1')]
    const checkpoint = emptyCheckpoint()
    // Mark all resolutions as already downloaded
    for (const res of RESOLUTIONS) {
      checkpoint.downloadedGifs[res].push('skip1')
    }
    const limiter = new RateLimiter(100, 60_000)

    await downloadAllGifs('key', exercises, checkpoint, limiter, {
      checkpointPath: checkpointFile,
      mediaDir: tmpMedia
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('sends the API key and exercise id in the request', async () => {
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response(Buffer.from('gif'), { status: 200 })))
    vi.stubGlobal('fetch', mockFetch)

    const exercises = [makeExercise('abc')]
    const limiter = new RateLimiter(100, 60_000)

    await downloadAllGifs('secret-key', exercises, emptyCheckpoint(), limiter, {
      checkpointPath: checkpointFile,
      mediaDir: tmpMedia
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('exerciseId=abc'),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-RapidAPI-Key': 'secret-key' }) })
    )
  })

  it('records downloaded IDs in checkpoint after each file', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(new Response(Buffer.from('gif'), { status: 200 })))
    )

    const exercises = [makeExercise('g1'), makeExercise('g2')]
    const checkpoint = emptyCheckpoint()
    const limiter = new RateLimiter(100, 60_000)

    await downloadAllGifs('key', exercises, checkpoint, limiter, {
      checkpointPath: checkpointFile,
      mediaDir: tmpMedia
    })

    for (const res of RESOLUTIONS) {
      expect(checkpoint.downloadedGifs[res]).toContain('g1')
      expect(checkpoint.downloadedGifs[res]).toContain('g2')
    }
  })

  it('persists checkpoint to disk after each download', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(new Response(Buffer.from('gif'), { status: 200 })))
    )

    const exercises = [makeExercise('h1')]
    const checkpoint = emptyCheckpoint()
    const limiter = new RateLimiter(100, 60_000)

    await downloadAllGifs('key', exercises, checkpoint, limiter, {
      checkpointPath: checkpointFile,
      mediaDir: tmpMedia
    })

    const saved = await readCheckpoint(checkpointFile)
    expect(saved.downloadedGifs[180]).toContain('h1')
  })

  it('continues to next item when the API returns a non-ok status', async () => {
    let calls = 0
    const mockFetch = vi.fn().mockImplementation(() => {
      calls++
      if (calls === 1) return Promise.resolve(new Response('Not Found', { status: 404 }))
      return Promise.resolve(new Response(Buffer.from('gif'), { status: 200 }))
    })
    vi.stubGlobal('fetch', mockFetch)

    const exercises = [makeExercise('fail1')]
    const checkpoint = emptyCheckpoint()
    const limiter = new RateLimiter(100, 60_000)

    // Should not throw
    await expect(
      downloadAllGifs('key', exercises, checkpoint, limiter, {
        checkpointPath: checkpointFile,
        mediaDir: tmpMedia
      })
    ).resolves.not.toThrow()

    // The failing resolution should NOT be recorded in checkpoint
    expect(checkpoint.downloadedGifs[180]).not.toContain('fail1')
    // The subsequent successful resolutions should be recorded
    expect(checkpoint.downloadedGifs[360]).toContain('fail1')
  })
})

// ---------------------------------------------------------------------------
// writeCheckpoint
// ---------------------------------------------------------------------------

describe('writeCheckpoint', () => {
  it('writes checkpoint as formatted JSON', async () => {
    const path = tmpPath()
    const checkpoint: Checkpoint = {
      lastOffset: 10,
      downloadedGifs: { 180: ['abc'], 360: ['abc', 'def'], 720: [], 1080: [] }
    }

    await writeCheckpoint(checkpoint, path)

    try {
      const text = await readFile(path, 'utf-8')
      const parsed = JSON.parse(text)
      expect(parsed.lastOffset).toBe(10)
      expect(parsed.downloadedGifs['360']).toEqual(['abc', 'def'])
    } finally {
      await unlink(path).catch(() => {})
    }
  })

  it('round-trips a checkpoint through write then read', async () => {
    const path = tmpPath()
    const original: Checkpoint = {
      lastOffset: 130,
      downloadedGifs: { 180: ['id1', 'id2'], 360: ['id1'], 720: [], 1080: ['id1', 'id2', 'id3'] }
    }

    await writeCheckpoint(original, path)

    try {
      const restored = await readCheckpoint(path)
      expect(restored.lastOffset).toBe(original.lastOffset)
      expect(restored.downloadedGifs[180]).toEqual(original.downloadedGifs[180])
      expect(restored.downloadedGifs[360]).toEqual(original.downloadedGifs[360])
      expect(restored.downloadedGifs[720]).toEqual(original.downloadedGifs[720])
      expect(restored.downloadedGifs[1080]).toEqual(original.downloadedGifs[1080])
    } finally {
      await unlink(path).catch(() => {})
    }
  })
})

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------

describe('run', () => {
  function makeExtExercise(id: string): ExternalExercise {
    return {
      id,
      name: `Exercise ${id}`,
      bodyPart: 'back',
      target: 'traps',
      equipment: 'band',
      secondaryMuscles: [],
      instructions: []
    }
  }

  let tmpCheckpoint: string
  let tmpExercises: string
  let tmpMedia: string

  beforeEach(() => {
    tmpCheckpoint = join(tmpdir(), `test-run-cp-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
    tmpExercises = join(tmpdir(), `test-run-ex-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
    tmpMedia = join(tmpdir(), `test-run-media-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await unlink(tmpCheckpoint).catch(() => {})
    await unlink(tmpExercises).catch(() => {})
    await rm(tmpMedia, { recursive: true, force: true })
  })

  function makeFetch(exercises: ExternalExercise[]) {
    return vi.fn().mockImplementation((url: string) => {
      if (url.includes('/exercises')) {
        return Promise.resolve(new Response(JSON.stringify(exercises), { status: 200 }))
      }
      return Promise.resolve(new Response(Buffer.from('GIF89a'), { status: 200 }))
    })
  }

  it('returns correct exercisesCount and gifsPerResolution', async () => {
    const exercises = [makeExtExercise('r1'), makeExtExercise('r2')]
    vi.stubGlobal('fetch', makeFetch(exercises))

    const result = await run('test-key', {
      checkpointPath: tmpCheckpoint,
      exercisesPath: tmpExercises,
      mediaDir: tmpMedia
    })

    expect(result.exercisesCount).toBe(2)
    for (const res of RESOLUTIONS) {
      expect(result.gifsPerResolution[res]).toBe(2)
    }
  })

  it('prints a final summary containing exercise count', async () => {
    vi.stubGlobal('fetch', makeFetch([makeExtExercise('s1')]))
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await run('test-key', {
      checkpointPath: tmpCheckpoint,
      exercisesPath: tmpExercises,
      mediaDir: tmpMedia
    })

    const output = spy.mock.calls.flat().join('\n')
    expect(output).toMatch(/FINAL SUMMARY/i)
    expect(output).toMatch(/1/)
  })

  it('logs estimated total GIF request count before Phase 2', async () => {
    const exercises = [makeExtExercise('t1'), makeExtExercise('t2')]
    vi.stubGlobal('fetch', makeFetch(exercises))
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await run('test-key', {
      checkpointPath: tmpCheckpoint,
      exercisesPath: tmpExercises,
      mediaDir: tmpMedia
    })

    // 2 exercises × 4 resolutions = 8 total GIF files
    const output = spy.mock.calls.flat().join('\n')
    expect(output).toMatch(/8/)
  })

  it('logs a resume message when the checkpoint has a non-zero offset', async () => {
    const existing = [
      {
        exerciseId: 'u0',
        name: 'U0',
        gifUrl: '/media/360/u0.gif',
        equipments: [],
        bodyParts: [],
        targetMuscles: [],
        secondaryMuscles: [],
        instructions: []
      }
    ]
    await writeFile(tmpExercises, JSON.stringify(existing))
    await writeFile(
      tmpCheckpoint,
      JSON.stringify({ lastOffset: 1, downloadedGifs: { 180: [], 360: [], 720: [], 1080: [] } })
    )

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/exercises')) {
          return Promise.resolve(new Response(JSON.stringify([makeExtExercise('u1')]), { status: 200 }))
        }
        return Promise.resolve(new Response(Buffer.from('GIF89a'), { status: 200 }))
      })
    )

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await run('test-key', {
      checkpointPath: tmpCheckpoint,
      exercisesPath: tmpExercises,
      mediaDir: tmpMedia
    })

    const output = spy.mock.calls.flat().join('\n')
    expect(output).toMatch(/resum/i)
  })
})

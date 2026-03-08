# Offline Data Sync Implementation Plan

## Summary

Build a standalone Bun script (`scripts/download-exercises.ts`) that fetches all ~1,300 exercises from the external ExerciseDB RapidAPI, downloads GIFs in 4 resolutions (180, 360, 720, 1080px), stores everything locally, and updates `src/data/exercises.json` so the API runs fully offline. Also adds a `/media/:resolution/:exerciseId` route to Hono to serve GIF files from disk.

**Key decisions:**
- GIFs stored at `media/{resolution}/{exerciseId}.gif`
- `gifUrl` in exercises points to `/media/360/{exerciseId}.gif`
- Throttled to ~100 req/min with automatic retry on 429
- Checkpoint file at `scripts/.sync-checkpoint.json` enables resume after interruption
- `exercises.json` fully replaced with fresh API data (same schema, updated gifUrl)

([spec: Offline Data Sync](../specs/offline-sync.md)) | ([spec: Media Serving](../specs/media-serving.md)) | ([spec: Data Layer](../specs/data-layer.md))

## Credentials

- `RAPIDAPI_KEY=faa793b089msha23356bf8cb9b57p107ab5jsn7c0feb478b05`

---

## Phase 1: Download Script

- [x] Create `scripts/download-exercises.ts` with a rate-limiter utility: sliding window counter that tracks timestamps of the last N requests, exposes `await rateLimiter.throttle()` that sleeps until a request slot is available (target: 100 req/min). Include a `fetchWithRetry(url, options)` helper that retries up to 3 times on HTTP 429 with a 30-second back-off, throwing after max retries. ([spec: Offline Data Sync § Rate Limiting Strategy](../specs/offline-sync.md#rate-limiting-strategy))

- [x] Add checkpoint logic to the script: on startup, read `scripts/.sync-checkpoint.json` (if it exists) to get `lastOffset` (exercises fetching progress) and `downloadedGifs: { 180: string[], 360: string[], 720: string[], 1080: string[] }` (already-downloaded GIF IDs per resolution). On startup, skip already-completed work. Save checkpoint after each successful batch of 10 exercises and after each GIF download batch. ([spec: Offline Data Sync § Checkpointing](../specs/offline-sync.md#checkpointing))

- [x] Add exercise fetching loop: starting from `lastOffset` in checkpoint, call `GET /exercises?offset=N&limit=10` with `X-RapidAPI-Key` header, map each result from external schema to internal (`id→exerciseId`, `bodyPart→bodyParts[]`, `target→targetMuscles[]`, `equipment→equipments[]`, keep `secondaryMuscles`, `instructions`, set `gifUrl=/media/360/{id}.gif`), accumulate results, stop when a page returns fewer than 10 items. After loop completes, write all exercises to `src/data/exercises.json`. ([spec: Offline Data Sync § External API → Internal Schema Mapping](../specs/offline-sync.md#external-api--internal-schema-mapping))

- [x] Add GIF download loop: create `media/180/`, `media/360/`, `media/720/`, `media/1080/` directories if they don't exist. For each exercise × each resolution, skip if already in checkpoint's `downloadedGifs`. Call `GET /image?exerciseId={id}&resolution={res}`, stream binary response to `media/{resolution}/{exerciseId}.gif` using `Bun.write()`. Update checkpoint after each file saved. Log progress: `[N/total] Downloading {exerciseId} @{resolution}px`. ([spec: Offline Data Sync § GIF Storage](../specs/offline-sync.md))

- [x] Add top-level progress logging and a final summary: print estimated total requests, current phase (fetching exercises / downloading GIFs), count done/remaining, and at the end print total exercises saved + total GIFs downloaded per resolution.

---

## Phase 2: Media Serving Route

- [x] In `src/app.ts`, add a GET route for `/media/:resolution/:exerciseId` before the 404 fallback. Validate `resolution` is one of `180`, `360`, `720`, `1080` (return 400 if not). Resolve the file path to `media/{resolution}/{exerciseId}.gif` relative to project root. If file doesn't exist return 404. Stream file using `Bun.file()` and return with `Content-Type: image/gif` and `Cache-Control: public, max-age=31536000`. ([spec: Media Serving](../specs/media-serving.md))

---

## Phase 3: Run Sync & Validate

- [x] Add `"sync": "bun scripts/download-exercises.ts"` to `package.json` scripts. Create a `.env.example` with `RAPIDAPI_KEY=your_key_here`. Document in README that `RAPIDAPI_KEY` env var is required to run the sync.

- [x] After running the script, verify: `src/data/exercises.json` has ~1,300 entries, all `gifUrl` fields follow the pattern `/media/360/{exerciseId}.gif`, `media/360/` has ~1,300 `.gif` files. Spot-check a few exercises via the running API to confirm GIFs load correctly from the `/media` route.

---

## Verification

- [x] `bun scripts/download-exercises.ts` runs to completion without errors (or can be interrupted and resumed)
- [x] `src/data/exercises.json` contains ~1,300 exercises with correct internal schema
- [x] All `gifUrl` values are `/media/360/{exerciseId}.gif` (no external URLs)
- [x] `media/360/` contains 1,500 GIF files (180/720/1080 dirs created; full 4-resolution download requires re-running `bun run sync`)
- [x] `GET /media/360/trmte8s.gif` returns a valid GIF with `Content-Type: image/gif`
- [x] `GET /media/9999/trmte8s.gif` returns 400 (invalid resolution)
- [x] `GET /media/360/nonexistent.gif` returns 404
- [x] `GET /api/v1/exercises` returns exercises with local `gifUrl` values
- [x] API starts and serves all endpoints without any external network calls

# ExerciseDB API Rebuild

Complete replacement of the existing ExerciseDB API with new data (1,324 exercises), GCS-hosted private media, API key authentication, and ExerciseDB v2-style endpoints.

## Phase 1 — GCS Bucket & Media Upload

([spec: GCS Media](../specs/gcs-media.md)) ([spec: Media Upload](../specs/media-upload.md))

- [x] Create private GCS bucket `smart-coach-exercises-media` in `us-east4` with uniform bucket-level access and all public access blocked:
  ```
  gcloud storage buckets create gs://smart-coach-exercises-media \
    --project=smart-coach-project-app \
    --location=us-east4 \
    --uniform-bucket-level-access
  gcloud storage buckets update gs://smart-coach-exercises-media --no-public-access-prevention=false
  ```

- [x] Create service account `exercisedb-media-reader`, grant it `roles/storage.objectViewer` on the bucket, generate and download JSON key, base64-encode it:
  ```
  gcloud iam service-accounts create exercisedb-media-reader \
    --project=smart-coach-project-app \
    --display-name="ExerciseDB Media Reader"
  gcloud storage buckets add-iam-policy-binding gs://smart-coach-exercises-media \
    --member="serviceAccount:exercisedb-media-reader@smart-coach-project-app.iam.gserviceaccount.com" \
    --role="roles/storage.objectViewer"
  gcloud iam service-accounts keys create /tmp/exercisedb-sa-key.json \
    --iam-account=exercisedb-media-reader@smart-coach-project-app.iam.gserviceaccount.com
  base64 -i /tmp/exercisedb-sa-key.json | tr -d '\n'  # → GCS_SERVICE_ACCOUNT_KEY value
  ```

- [x] Install `@google-cloud/storage` and write `scripts/upload-media.ts`: reads `GCS_BUCKET_NAME` + `GCS_SERVICE_ACCOUNT_KEY` from env, iterates the 4 resolutions, lists existing bucket objects to skip already-uploaded files, uploads remaining GIFs from `/Users/smartcoach/Documents/exercises/exercises-db/images/{resolution}/` to `images/{resolution}/` with `Content-Type: image/gif`, prints per-file progress and final summary.

- [x] Run the upload script: `bun run scripts/upload-media.ts` — verify all 5,296 files appear in the bucket.

---

## Phase 2 — Data & Types Migration

([spec: Data Model](../specs/data-model.md)) ([spec: i18n](../specs/i18n.md))

- [x] Copy new source data into `src/data/`: `exercises.json`, `body_parts.json`, `targets.json`, `equipment.json` from `/Users/smartcoach/Documents/exercises/exercises-db/data/`. Delete old files: old `exercises.json`, `muscles.json`, `bodyparts.json`, `equipments.json`.

- [x] Rewrite `src/data/types.ts` to reflect the new `Exercise` shape (`id`, `name`, `bodyPart`, `equipment`, `target`, `secondaryMuscles`, `instructions`, `description`, `difficulty`, `category`) and add `ExerciseWithImages` type that extends `Exercise` with `images: { "180": string; "360": string; "720": string; "1080": string }`. Update `src/data/load.ts` loader methods (`loadBodyParts`, `loadTargets`, `loadEquipments`) to use new file names.

- [x] Generate Spanish i18n translation files for the 1,324 new exercises into `src/data/i18n/es/exercises_*.json` (keyed by `id` like `"0001"`). Update `src/data/i18n/es/catalogs.json` to use `targets` key (replacing `muscles`) matching the 19 new target muscle names. Update `src/services/translation.service.ts` to work with the new field names (`bodyPart`, `target`, `equipment` vs old arrays).

---

## Phase 3 — Signed URL Service & Auth Middleware

([spec: GCS Media](../specs/gcs-media.md)) ([spec: Authentication](../specs/auth.md))

- [x] Create `src/services/signed-url.service.ts`: initialize `@google-cloud/storage` Storage client from `GCS_SERVICE_ACCOUNT_KEY` (base64-decoded JSON), expose `generateImageUrls(exerciseId: string): Promise<ExerciseImages>` that generates V4 signed URLs with 24h TTL for all 4 resolutions (`images/180/{id}.gif` … `images/1080/{id}.gif`) and returns the `{ "180", "360", "720", "1080" }` object. Add `GCS_BUCKET_NAME`, `GCS_SERVICE_ACCOUNT_KEY`, `API_KEY` to `.env.example`.

- [x] Create `src/middleware/auth.ts`: read `X-API-Key` header, compare against `API_KEY` env var, return `{ success: false, error: "Unauthorized" }` with status 401 if missing or invalid. Register middleware globally in `src/app.ts` (exempt `/docs`, `/swagger`, `OPTIONS`). Update CORS config to restrict `Access-Control-Allow-Origin` to the PWA domain (`https://nextjs-pwa-service-1094597659488.us-east4.run.app`).

---

## Phase 4 — Exercise Module Rewrite

([spec: Exercises API](../specs/exercises-api.md))

- [x] Delete old modules `src/modules/bodyparts/`, `src/modules/muscles/`, `src/modules/equipments/`. Scaffold new file structure inside `src/modules/exercises/`: `exercise.controller.ts`, `exercise.service.ts`, `exercise.model.ts` (Zod schemas). Remove the `/media/:resolution/:exerciseId` route from `src/app.ts`.

- [x] Implement catalog endpoints in the exercise controller — `GET /api/v1/exercises/bodyPartList`, `GET /api/v1/exercises/targetList`, `GET /api/v1/exercises/equipmentList` — each reads the corresponding JSON file, applies `lang=es` translation if requested, returns `{ success: true, data: string[] }`.

- [x] Implement list/filter endpoints: `GET /api/v1/exercises` (paginated), `GET /api/v1/exercises/bodyPart/:bodyPart`, `GET /api/v1/exercises/target/:target`, `GET /api/v1/exercises/equipment/:equipment`. All case-insensitive exact match on the respective field. All paginated with `offset`/`limit`. Each result calls `signedUrlService.generateImageUrls(exercise.id)` and attaches the `images` object before responding.

- [x] Implement `GET /api/v1/exercises/name/:name` fuzzy search using Fuse.js (search on `name` field only). Implement `GET /api/v1/exercises/exercise/:id` exact match returning 404 if not found. Both call `generateImageUrls` and include `images` in the response.

- [x] Wire all routes in `src/app.ts` under `/api/v1`. Ensure `lang=es` query param flows through controller → service → translation service for all endpoints. Remove Fuse.js dependency from filter endpoints (now only used in `/name/:name`).

---

## Phase 5 — Cleanup, Tests & Deploy

- [x] Remove `media/` folder from the repository. Remove any leftover references to old field names (`exerciseId`, `targetMuscles`, `bodyParts`, `equipments`, `gifUrl`, `muscles`) across the codebase. Remove unused dependencies (`axios`, `form-data` if no longer needed).

- [x] Update/rewrite Vitest tests in `src/` to cover the 9 new endpoints: verify 401 without API key, verify correct response shape including `images` with 4 keys, verify pagination metadata, verify 404 on unknown exercise id.

- [x] Set Vercel env vars (`API_KEY`, `GCS_BUCKET_NAME`, `GCS_SERVICE_ACCOUNT_KEY`) and deploy. Run smoke tests against the live URL: hit each of the 9 endpoints with the API key, confirm `images` URLs load valid GIFs. Document the `API_KEY` value for the smart-coach-pwa `.env`.

---

## Verification

- [x] All 9 endpoints return 200 with correct response shape
- [x] Every exercise response contains `images` object with 4 valid signed URLs
- [x] Requests without `X-API-Key` receive 401
- [x] `/api/v1/exercises/exercise/9999` returns 404
- [x] `?lang=es` returns translated names (e.g. "3/4 abdominal" for "3/4 sit-up")
- [x] All 5,296 GIFs are accessible via the signed URLs
- [x] No references to old field names (`gifUrl`, `exerciseId`, `targetMuscles`) remain
- [x] `media/` folder is removed from the repository
- [x] Vercel deployment is live: https://exercisedb-api-nine-omega.vercel.app

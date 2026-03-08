# Specs Index

Quick reference to all system specs. Search-optimized with keywords.

---

## [Exercises API](./exercises-api.md)

REST API, endpoints, exercises, list, filter, search, pagination, body part, target muscle, equipment, name search, fuzzy search, Fuse.js, Hono, OpenAPI, Zod, v2, ExerciseDB, CORS, 401, 404.

**Source**: `src/modules/exercises/`, `src/app.ts`, `src/data/exercises.json`

---

## [Authentication](./auth.md)

API key, X-API-Key header, 401 unauthorized, access control, CORS origin restriction, smart-coach-pwa, static secret, env vars, Vercel.

**Source**: `src/middleware/auth.ts`, `src/app.ts`

---

## [Data Model](./data-model.md)

Exercise fields, id, bodyPart, target, equipment, difficulty, category, description, secondaryMuscles, instructions, images, JSON files, exercises.json, body_parts.json, targets.json, equipment.json, FileLoader, in-memory cache, static data, source data.

**Source**: `src/data/`, `src/data/load.ts`, `src/data/types.ts`

---

## [GCS Media](./gcs-media.md)

Google Cloud Storage, GCS bucket, smart-coach-exercises-media, private bucket, signed URLs, V4 signed URL, image resolutions 180 360 720 1080, GIF, exercise images, service account, TTL 24h, base64 key, GCS_SERVICE_ACCOUNT_KEY, GCS_BUCKET_NAME.

**Source**: `src/services/signed-url.service.ts`

---

## [Media Upload](./media-upload.md)

Upload script, GCS upload, one-time script, idempotent, 5296 files, 1324 exercises, 4 resolutions, progress, skip existing, bun script, GIF upload, bulk upload.

**Source**: `scripts/upload-media.ts`

---

## [Internationalization (i18n)](./i18n.md)

Localization, translations, Spanish, multi-language, locale, lang parameter, lang=es, translated exercises, translated muscles, translated body parts, translated equipment, translated instructions, catalogs.json.

**Source**: `src/data/i18n/`, `src/services/translation.service.ts`

---

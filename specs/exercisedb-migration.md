# ExerciseDB API Migration (v1 theta → nine-omega)

Migration from the old deployed API (`exercisedb-api-theta.vercel.app`) to the new API (`exercisedb-api-nine-omega.vercel.app`) across the frontend and backend.

## User Capabilities

- Users can browse exercises fetched from the new API with richer metadata (description, difficulty, category, multi-resolution images)
- Users can search exercises by name (server-side, via `/exercises/name/{name}`)
- Users can filter exercises by body part, target muscle, or equipment (all server-side, no client-side caching)
- Users can view exercise detail with 360px image
- Users experience Spanish translations via `lang=es` query param

## What Changes

### Frontend (`smart-coach-pwa`)

**Environment**
- `EXERCISE_API_BASE_URL=https://exercisedb-api-nine-omega.vercel.app/api/v1` added to `.env`
- Existing `EXERCISE_API_KEY` stays the same (same key used in both APIs)

**Proxy route** (`app/api/exercises/[[...path]]/route.ts`)
- `EXERCISE_API_BASE` reads from `process.env.EXERCISE_API_BASE_URL` instead of hardcoded string
- Catch-all path forwarding logic stays the same — it already supports the new path-based endpoints

**`exercise-api.ts`** — full rewrite
- Remove: `RawExercise`, `transformExercise`, `buildLocalResponse`, `fetchAllRaw`, `allExercisesCache`
- New API schema used directly (no transform layer needed)
- `images['360']` used as the default image everywhere `gifUrl` was used before
- `metadata.totalItems` replaces `metadata.totalExercises`
- Filtering (bodyPart, target, equipment) is now server-side via path endpoints
- `searchExercises` routes to the correct path endpoint based on active filters

**New endpoint mapping** (via proxy `/api/exercises`):

| Function | Proxy call |
|---|---|
| `getAllExercises` | `GET /api/exercises?offset=&limit=&lang=es` |
| `searchByName` | `GET /api/exercises/name/{name}?offset=&limit=&lang=es` |
| `filterByBodyPart` | `GET /api/exercises/bodyPart/{bodyPart}?offset=&limit=&lang=es` |
| `filterByTarget` | `GET /api/exercises/target/{target}?offset=&limit=&lang=es` |
| `filterByEquipment` | `GET /api/exercises/equipment/{equipment}?offset=&limit=&lang=es` |
| `getExerciseById` | `GET /api/exercises/exercise/{id}?lang=es` |
| `getBodyPartList` | `GET /api/exercises/bodyPartList?lang=es` |
| `getTargetList` | `GET /api/exercises/targetList?lang=es` |
| `getEquipmentList` | `GET /api/exercises/equipmentList?lang=es` |

### Proxy route path handling

The proxy receives the Next.js path segment and appends query string. For path-based routes (e.g. `/api/exercises/name/squat`), the `[[...path]]` catch-all correctly forwards `name/squat` as the path, giving `NEW_BASE/exercises/name/squat`.

## Constraints

- `limit` max is 100 per request (new API enforces this)
- `currentPage` in new API response is 1-based (same as old — no adjustment needed)
- All filter path params are always in English regardless of `lang`
- The proxy must not expose `EXERCISE_API_KEY` to the client — it stays server-side only

## Validation (Playwright browser agent)

1. Exercise list loads with data on the library/dashboard page
2. Name search returns relevant results
3. Body part / target / equipment filters return correct exercises
4. Exercise detail view displays name, image (360px), instructions, metadata
5. Images load successfully (no broken image URLs)

## Related Specs

- [Authentication](./auth.md) — X-API-Key enforcement
- [Exercises API](./exercises-api.md) — full API endpoint reference
- [Data Model](./data-model.md) — exercise schema fields

## Source

- [`smart-coach-pwa/app/api/exercises/[[...path]]/route.ts`](../../smart-coach-pwa/app/api/exercises/[[...path]]/route.ts)
- [`smart-coach-pwa/app/(dashboard)/_data/exercise-api.ts`](../../smart-coach-pwa/app/(dashboard)/_data/exercise-api.ts)
- [`src/modules/exercises/controllers/exercise.controller.ts`](../src/modules/exercises/controllers/exercise.controller.ts)
- [`src/middleware/auth.ts`](../src/middleware/auth.ts)

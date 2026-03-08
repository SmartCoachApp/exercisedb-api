# Exercises API

REST API exposing 1,324 exercises following the ExerciseDB v2 URL pattern. Requires API key authentication. Every exercise response includes GCS Signed URLs for all 4 image resolutions.

## User Capabilities

- Consumers can list all exercises with pagination (`GET /api/v1/exercises`)
- Consumers can search exercises by name with fuzzy matching (`GET /api/v1/exercises/name/{name}`)
- Consumers can filter exercises by body part (`GET /api/v1/exercises/bodyPart/{bodyPart}`)
- Consumers can filter exercises by target muscle (`GET /api/v1/exercises/target/{target}`)
- Consumers can filter exercises by equipment (`GET /api/v1/exercises/equipment/{equipment}`)
- Consumers can get a single exercise by its 4-digit ID (`GET /api/v1/exercises/exercise/{id}`)
- Consumers can retrieve catalog lists: body parts, target muscles, equipment types
- Consumers can request any endpoint with `?lang=es` to receive results in Spanish
- Consumers can browse interactive API documentation at `/docs`

## Endpoints

### List & Filter

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/exercises` | All exercises, paginated |
| GET | `/api/v1/exercises/bodyPart/{bodyPart}` | Filter by body part (case-insensitive) |
| GET | `/api/v1/exercises/target/{target}` | Filter by target muscle (case-insensitive) |
| GET | `/api/v1/exercises/equipment/{equipment}` | Filter by equipment (case-insensitive) |
| GET | `/api/v1/exercises/name/{name}` | Fuzzy search by name |

Common query params (all list endpoints): `offset` (default 0), `limit` (default 10, max 100), `lang` (`en`/`es`).

### Single Exercise

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/exercises/exercise/{id}` | Single exercise by 4-digit ID |

### Catalogs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/exercises/bodyPartList` | All 10 body parts |
| GET | `/api/v1/exercises/targetList` | All 19 target muscles |
| GET | `/api/v1/exercises/equipmentList` | All 28 equipment types |

## Response Shapes

### Exercise Object

Every exercise in any response (list or single) includes all 4 image resolutions as GCS Signed URLs (TTL: 24h):

```json
{
  "id": "0001",
  "name": "3/4 sit-up",
  "bodyPart": "waist",
  "equipment": "body weight",
  "target": "abs",
  "secondaryMuscles": ["hip flexors", "lower back"],
  "instructions": ["Lie flat on your back...", "Engaging your abs..."],
  "description": "The 3/4 sit-up is an abdominal exercise...",
  "difficulty": "beginner",
  "category": "strength",
  "images": {
    "180": "https://storage.googleapis.com/smart-coach-exercises-media/...",
    "360": "https://storage.googleapis.com/smart-coach-exercises-media/...",
    "720": "https://storage.googleapis.com/smart-coach-exercises-media/...",
    "1080": "https://storage.googleapis.com/smart-coach-exercises-media/..."
  }
}
```

### List Response

```json
{
  "success": true,
  "metadata": {
    "totalItems": 1324,
    "totalPages": 133,
    "currentPage": 1,
    "previousPage": null,
    "nextPage": "/api/v1/exercises?offset=10&limit=10"
  },
  "data": [{ "...exercise..." }]
}
```

### Single Item Response

```json
{ "success": true, "data": { "...exercise..." } }
```

### Catalog Response

```json
{ "success": true, "data": ["back", "cardio", "chest", "..."] }
```

## Constraints

- Read-only API (GET only)
- Path params (bodyPart, target, equipment, id) always accept English values regardless of `lang`
- Fuzzy search (`/name/{name}`) uses Fuse.js; path segment is URL-decoded before matching
- CORS restricted to the smart-coach-pwa domain
- Data is static JSON loaded into memory on startup

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Invalid query params |
| 401 | Missing or invalid API key |
| 404 | Exercise not found |
| 500 | Server error |

## Related Specs

- [Auth](./auth.md) — API key validation middleware
- [Data Model](./data-model.md) — exercise fields and source field mapping
- [GCS Media](./gcs-media.md) — Signed URL generation for `images` object
- [Internationalization](./i18n.md) — `lang=es` translation

## Source

- `src/modules/exercises/`
- `src/app.ts`
- `src/data/exercises.json`

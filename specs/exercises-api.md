# Exercises API

REST API that serves a database of 1,500+ fitness exercises with metadata, search, filtering, and pagination.

## User Capabilities

- Users can list all exercises with pagination (`GET /api/v1/exercises`)
- Users can search exercises with fuzzy matching across name, muscles, equipment, and body parts (`GET /api/v1/exercises/search?q=...`)
- Users can filter exercises by multiple criteria simultaneously: muscles, equipment, body parts (`GET /api/v1/exercises/filter`)
- Users can get a single exercise by ID (`GET /api/v1/exercises/{exerciseId}`)
- Users can get exercises for a specific body part (`GET /api/v1/bodyparts/{bodyPartName}/exercises`)
- Users can get exercises that use specific equipment (`GET /api/v1/equipments/{equipmentName}/exercises`)
- Users can get exercises targeting a specific muscle, optionally including secondary muscles (`GET /api/v1/muscles/{muscleName}/exercises`)
- Users can list all available body parts, muscles, and equipment (`GET /api/v1/bodyparts`, `/muscles`, `/equipments`)
- Users can request any endpoint with `?lang=es` to get results in Spanish (names, instructions, muscles, body parts, equipment)
- Users can search and filter using terms in either English or Spanish when `lang=es`
- Users can browse interactive API documentation (`GET /docs`)
- Users can access the OpenAPI 3.1.0 spec (`GET /swagger`)

## Exercise Data Shape

Each exercise contains:
- `exerciseId` - Unique string ID (e.g., "trmte8s")
- `name` - Exercise name in English (e.g., "band shrug")
- `gifUrl` - URL to animated GIF demonstration
- `equipments` - Array of required equipment names
- `bodyParts` - Array of targeted body part names
- `targetMuscles` - Array of primary muscle names
- `secondaryMuscles` - Array of supporting muscle names
- `instructions` - Array of step-by-step instruction strings

## Pagination

- All list endpoints support `offset` and `limit` query params
- Max 100 items per page, default 10
- Response includes `metadata` with `totalExercises`, `totalPages`, `currentPage`, `previousPage` (URL), `nextPage` (URL)

## Search

- Fuzzy search powered by Fuse.js
- Weighted scoring: name (40%), targetMuscles (25%), bodyParts (20%), equipments (15%), secondaryMuscles (10%)
- Configurable threshold (0 = exact, 1 = loose). Default: 0.3

## Filtering

- Multi-muscle: AND logic (exercise must target ALL specified muscles)
- Multi-equipment: AND logic (exercise must use ALL specified equipment)
- Multi-body-part: OR logic (exercise targets ANY specified body part)
- Optional secondary muscle inclusion
- Sortable by: name, exerciseId, targetMuscles, bodyParts, equipments

## Constraints

- Read-only API (GET only)
- CORS open to all origins
- No authentication required (auth middleware exists but is disabled)
- Data is static JSON loaded into memory on first request

## Architecture

- **Framework**: Hono with OpenAPI integration
- **Validation**: Zod schemas
- **Pattern**: Clean Architecture (Controller -> Service -> UseCase -> FileLoader)
- **i18n**: TranslationService translates responses; bilingual filter resolution for Spanish
- **Deployment**: Vercel serverless + Bun runtime for dev
- **Documentation**: Scalar UI + OpenAPI 3.1.0

## Related specs

- [Data Layer](./data-layer.md) - how exercise data is stored and loaded
- [Internationalization](./i18n.md) - multi-language support (Spanish)

## Source

- [src/modules/exercises/controllers/exercise.controller.ts](../src/modules/exercises/controllers/exercise.controller.ts)
- [src/modules/exercises/services/exercise.service.ts](../src/modules/exercises/services/exercise.service.ts)
- [src/modules/exercises/use-cases/get-exercise.usecase.ts](../src/modules/exercises/use-cases/get-exercise.usecase.ts)
- [src/modules/exercises/models/exercise.model.ts](../src/modules/exercises/models/exercise.model.ts)
- [src/modules/bodyparts/controllers/bodypart.controller.ts](../src/modules/bodyparts/controllers/bodypart.controller.ts)
- [src/modules/muscles/controllers/muscle.controller.ts](../src/modules/muscles/controllers/muscle.controller.ts)
- [src/modules/equipments/controllers/equipment.controller.ts](../src/modules/equipments/controllers/equipment.controller.ts)
- [src/services/translation.service.ts](../src/services/translation.service.ts)
- [src/data/i18n/types.ts](../src/data/i18n/types.ts)
- [src/app.ts](../src/app.ts)

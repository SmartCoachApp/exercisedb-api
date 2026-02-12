# Data Layer

Static JSON file storage with in-memory caching. Serves as the data source for all exercise-related information.

## User Capabilities

- System loads exercise data from JSON files on first request
- Subsequent requests are served from in-memory cache (no disk I/O)
- Data is read-only; no write operations exist

## Data Files

| File | Records | Content |
|------|---------|---------|
| `exercises.json` | ~1,500 | Full exercise objects with all metadata |
| `bodyparts.json` | 10 | Body part names: neck, lower arms, shoulders, cardio, upper arms, chest, lower legs, back, upper legs, waist |
| `muscles.json` | 50 | Muscle names: abs, biceps, triceps, glutes, quads, hamstrings, lats, delts, traps, calves, etc. |
| `equipments.json` | 28 | Equipment names: dumbbell, barbell, cable, body weight, band, kettlebell, smith machine, etc. |
| `i18n/es/catalogs.json` | 88 | Spanish translations for body parts, muscles, and equipment names |
| `i18n/es/exercises_001.json` ... `exercises_015.json` | ~1,500 | Spanish translations for exercise names and instructions (100 per file) |

## FileLoader

- Static class at `src/data/load.ts`
- Uses `Map<string, unknown>` for caching
- Reads JSON files from `src/data/` using `fs.promises.readFile`
- Throws `HTTPException(500)` if file read fails
- Public methods: `loadExercises()`, `loadEquipments()`, `loadBodyParts()`, `loadMuscles()`, `loadCatalogTranslations(lang)`, `loadExerciseTranslations(lang)`

## Data Types

Defined in `src/data/types.ts`:
- `Exercise` - Full exercise with all fields
- `Equipment` - `{ name: string }`
- `BodyPart` - `{ name: string }`
- `Muscle` - `{ name: string }`

## Constraints

- English is the internal source of truth; Spanish translations stored in `src/data/i18n/es/`
- JSON files are deployed with the application code
- Cache is per-process (each serverless invocation gets its own cache)
- No database dependency; files are the single source of truth
- GIF media hosted externally at `https://static.exercisedb.dev/media/`

## Related specs

- [Exercises API](./exercises-api.md) - endpoints that consume this data
- [Internationalization](./i18n.md) - multi-language translation support (Spanish)

## Source

- [src/data/load.ts](../src/data/load.ts)
- [src/data/types.ts](../src/data/types.ts)
- [src/data/exercises.json](../src/data/exercises.json)
- [src/data/bodyparts.json](../src/data/bodyparts.json)
- [src/data/muscles.json](../src/data/muscles.json)
- [src/data/equipments.json](../src/data/equipments.json)
- [src/data/i18n/types.ts](../src/data/i18n/types.ts)
- [src/data/i18n/es/catalogs.json](../src/data/i18n/es/catalogs.json)

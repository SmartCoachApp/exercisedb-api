# Data Model

Static JSON files serving as the single source of truth for all exercise data. Loaded into memory on startup.

## Exercise Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (4 digits) | Unique exercise identifier, e.g. `"0001"` |
| `name` | string | Exercise name in English |
| `bodyPart` | string | Body region targeted (single value) |
| `equipment` | string | Equipment required (single value) |
| `target` | string | Primary muscle targeted (single value) |
| `secondaryMuscles` | string[] | Supporting muscles engaged |
| `instructions` | string[] | Step-by-step instructions (plain text, no prefix) |
| `description` | string | Summary description of the exercise |
| `difficulty` | `"beginner"` \| `"intermediate"` \| `"advanced"` | Difficulty level |
| `category` | string | Movement category (e.g. `"strength"`, `"cardio"`, `"stretching"`) |
| `images` | object | Runtime-generated GCS Signed URLs — NOT stored in JSON |

## Data Files

| File | Records | Content |
|------|---------|---------|
| `src/data/exercises.json` | 1,324 | Full exercise objects |
| `src/data/body_parts.json` | 10 | Body part names (string array) |
| `src/data/targets.json` | 19 | Target muscle names (string array) |
| `src/data/equipment.json` | 28 | Equipment names (string array) |

## Catalog Values

**Body Parts (10):** back, cardio, chest, lower arms, lower legs, neck, shoulders, upper arms, upper legs, waist

**Target Muscles (19):** abductors, abs, adductors, biceps, calves, cardiovascular system, delts, forearms, glutes, hamstrings, lats, levator scapulae, pectorals, quads, serratus anterior, spine, traps, triceps, upper back

**Equipment (28):** assisted, band, barbell, body weight, bosu ball, cable, dumbbell, elliptical machine, ez barbell, hammer, kettlebell, leverage machine, medicine ball, olympic barbell, resistance band, roller, rope, skierg machine, sled machine, smith machine, stability ball, stationary bike, stepmill machine, tire, trap bar, upper body ergometer, weighted, wheel roller

**Difficulty distribution:** beginner (567), intermediate (589), advanced (168)

**Category distribution:** strength (1,180), stretching (53), cardio (34), mobility (31), plyometrics (17), balance (5), rehabilitation (4)

## Source Data Location

Raw source files (not deployed with the app):
```
/Users/smartcoach/Documents/exercises/exercises-db/
├── data/
│   ├── exercises.json       # 1,324 exercises
│   ├── body_parts.json      # 10 body parts
│   ├── targets.json         # 19 muscles
│   ├── equipment.json       # 28 equipment types
│   ├── by_body_part/        # Pre-grouped JSONs per body part
│   ├── by_target/           # Pre-grouped JSONs per target
│   └── by_equipment/        # Pre-grouped JSONs per equipment
└── images/
    ├── 180/   # 1,324 GIFs
    ├── 360/   # 1,324 GIFs
    ├── 720/   # 1,324 GIFs
    └── 1080/  # 1,324 GIFs
```

## Images at Runtime

The `images` field is NOT in the source JSON. It is constructed at response time by the signed URL service:

```
images/{resolution}/{id}.gif  →  GCS Signed URL (24h TTL)
```

All 4 resolutions are always included in every exercise response.

## Constraints

- `images` field is generated at response time; no `gifUrl` in source data
- English is the canonical source; Spanish translations stored separately in `src/data/i18n/es/`
- Data is read-only; no write operations
- Cache is per-process (each serverless invocation gets its own cache)

## Related Specs

- [Exercises API](./exercises-api.md) — endpoints that consume this data
- [GCS Media](./gcs-media.md) — how `images` signed URLs are generated
- [Internationalization](./i18n.md) — Spanish translation layer

## Source

- `src/data/exercises.json`
- `src/data/body_parts.json`
- `src/data/targets.json`
- `src/data/equipment.json`
- `src/data/load.ts`
- `src/data/types.ts`

# Plan: Internacionalización - Soporte Español

Implementar soporte multiidioma en la ExerciseDB API, comenzando con español. Cada step está diseñado para ejecutarse en un chat de LLM independiente.

**Total steps**: 20 (5 de código + 15 de traducciones)

---

## Step 1: Infraestructura i18n - Tipos, FileLoader y TranslationService ✅

**Objetivo**: Crear la base de código que soporta i18n sin romper nada existente.

([spec: Data Architecture](../specs/i18n.md#data-architecture))
([spec: Implementation Approach](../specs/i18n.md#implementation-approach))

### Tareas:

1. **Crear directorio `src/data/i18n/es/`**

2. **Crear `src/data/i18n/types.ts`** con los tipos de traducción:
   ```typescript
   export type SupportedLanguage = 'en' | 'es'

   export interface CatalogTranslations {
     bodyParts: Record<string, string>    // "chest" -> "pecho"
     muscles: Record<string, string>      // "biceps" -> "bíceps"
     equipments: Record<string, string>   // "dumbbell" -> "mancuerna"
   }

   export interface ExerciseTranslation {
     name: string
     instructions: string[]
   }

   // Keyed by exerciseId
   export type ExerciseTranslations = Record<string, ExerciseTranslation>
   ```

3. **Modificar `src/data/load.ts`** - Agregar métodos al FileLoader:
   - `loadCatalogTranslations(lang: SupportedLanguage): Promise<CatalogTranslations>`
   - `loadExerciseTranslations(lang: SupportedLanguage): Promise<ExerciseTranslations>`
   - El método de exercises carga los 15 archivos `exercises_001.json` ... `exercises_015.json` y los mergea en un solo Map
   - Cache key incluye el idioma (e.g., `catalogs_es`, `exercises_es`)

4. **Crear `src/services/translation.service.ts`** con:
   - `translateExercise(exercise, lang)` - Traduce un ejercicio completo
   - `translateExercises(exercises[], lang)` - Traduce array de ejercicios
   - `translateCatalogList(items[], catalogType, lang)` - Traduce lista de bodyparts/muscles/equipments
   - `resolveFilterValue(value, catalogType, lang)` - Resuelve "pecho" -> "chest" para filtros bilingües
   - `getTranslatedExerciseData(lang)` - Retorna todos los ejercicios ya traducidos (para Fuse.js)

5. **Agregar `lang` al `PaginationQuerySchema`** en `src/modules/exercises/models/exercise.model.ts`:
   ```typescript
   lang: z.enum(['en', 'es']).optional().default('en').openapi({
     title: 'Language',
     description: 'Response language (en=English, es=Spanish)',
     example: 'en'
   })
   ```

### Archivos a crear/modificar:
- `src/data/i18n/types.ts` (crear)
- `src/data/load.ts` (modificar)
- `src/services/translation.service.ts` (crear)
- `src/modules/exercises/models/exercise.model.ts` (modificar)

---

## Step 2: Integrar i18n en Controllers y Services ✅

**Objetivo**: Conectar el parámetro `lang` a través de toda la cadena Controller -> Service -> UseCase -> Response.

([spec: API Contract](../specs/i18n.md#api-contract))
([spec: Bilingual Filter Support](../specs/i18n.md#bilingual-filter-support))

### Tareas:

1. **Modificar `ExerciseController`** (`src/modules/exercises/controllers/exercise.controller.ts`):
   - Todos los endpoints extraen `lang` del query
   - Pasar `lang` a los métodos del service
   - Antes de retornar, aplicar traducción a los ejercicios resultantes
   - Para endpoints de filter: resolver filtros bilingües antes de buscar

2. **Modificar `ExerciseService`** (`src/modules/exercises/services/exercise.service.ts`):
   - Todos los métodos aceptan `lang` como parámetro opcional
   - Agregar lógica de resolución de filtros bilingües (Spanish -> English)
   - Para búsqueda fuzzy: cuando lang!=en, buscar en datos traducidos

3. **Modificar `GetExercisesUseCase`** (`src/modules/exercises/use-cases/get-exercise.usecase.ts`):
   - Opcionalmente recibir datos pre-traducidos para búsqueda fuzzy

4. **Modificar `BodyPartController`** (`src/modules/bodyparts/controllers/bodypart.controller.ts`):
   - Agregar `lang` query param
   - Traducir lista de bodyparts antes de retornar

5. **Modificar `MuscleController`** (`src/modules/muscles/controllers/muscle.controller.ts`):
   - Agregar `lang` query param
   - Traducir lista de muscles antes de retornar

6. **Modificar `EquipmentController`** (`src/modules/equipments/controllers/equipment.controller.ts`):
   - Agregar `lang` query param
   - Traducir lista de equipments antes de retornar

7. **Modificar tipos** en `src/modules/exercises/types/index.ts`:
   - Agregar `lang?: SupportedLanguage` a todas las interfaces de argumentos

### Archivos a modificar:
- `src/modules/exercises/controllers/exercise.controller.ts`
- `src/modules/exercises/services/exercise.service.ts`
- `src/modules/exercises/use-cases/get-exercise.usecase.ts`
- `src/modules/exercises/types/index.ts`
- `src/modules/bodyparts/controllers/bodypart.controller.ts`
- `src/modules/muscles/controllers/muscle.controller.ts`
- `src/modules/equipments/controllers/equipment.controller.ts`

---

## Step 3: Crear archivo de traducciones de catálogos ✅

**Objetivo**: Crear `src/data/i18n/es/catalogs.json` con las traducciones de los 88 términos de catálogo.

([spec: Catalog translations](../specs/i18n.md#translation-data))

### Tareas:

1. **Crear `src/data/i18n/es/catalogs.json`** con traducciones de:
   - 10 body parts: neck, lower arms, shoulders, cardio, upper arms, chest, lower legs, back, upper legs, waist
   - 50 muscles: shins, hands, sternocleidomastoid, soleus, inner thighs, lower abs, grip muscles, abdominals, wrist extensors, wrist flexors, latissimus dorsi, upper chest, rotator cuff, wrists, groin, brachialis, deltoids, feet, ankles, trapezius, rear deltoids, chest, quadriceps, back, core, shoulders, ankle stabilizers, rhomboids, obliques, lower back, hip flexors, levator scapulae, abductors, serratus anterior, traps, forearms, delts, biceps, upper back, spine, cardiovascular system, triceps, adductors, hamstrings, glutes, pectorals, calves, lats, quads, abs
   - 28 equipments: stepmill machine, elliptical machine, trap bar, tire, stationary bike, wheel roller, smith machine, hammer, skierg machine, roller, resistance band, bosu ball, weighted, olympic barbell, kettlebell, upper body ergometer, sled machine, ez barbell, dumbbell, rope, barbell, band, stability ball, medicine ball, assisted, leverage machine, cable, body weight

### Archivos a crear:
- `src/data/i18n/es/catalogs.json`

---

## Step 4: Traducciones de ejercicios - Batch 1 (ejercicios 0-99) ✅

**Objetivo**: Crear `src/data/i18n/es/exercises_001.json` con traducciones de los primeros 100 ejercicios.

([spec: exercises_NNN.json format](../specs/i18n.md#data-architecture))

### Instrucciones para el LLM:

1. Leer `src/data/exercises.json` líneas correspondientes a los ejercicios con índice 0-99
2. Para cada ejercicio, generar traducción al español de:
   - `name`: Nombre del ejercicio en español
   - `instructions`: Cada paso traducido al español, manteniendo el formato "Paso:N ..."
3. Escribir el resultado en `src/data/i18n/es/exercises_001.json`
4. Formato: objeto JSON con exerciseId como key

### Archivo a crear:
- `src/data/i18n/es/exercises_001.json`

---

## Step 5: Traducciones de ejercicios - Batch 2 (ejercicios 100-199) ✅

Mismo proceso que Step 4 pero para ejercicios con índice 100-199.
### Archivo a crear:
- `src/data/i18n/es/exercises_002.json`

---

## Step 6: Traducciones de ejercicios - Batch 3 (ejercicios 200-299) ✅

Mismo proceso que Step 4 pero para ejercicios con índice 200-299.
### Archivo a crear:
- `src/data/i18n/es/exercises_003.json`

---

## Step 7: Traducciones de ejercicios - Batch 4 (ejercicios 300-399) ✅

Mismo proceso que Step 4 pero para ejercicios con índice 300-399.
### Archivo a crear:
- `src/data/i18n/es/exercises_004.json`

---

## Step 8: Traducciones de ejercicios - Batch 5 (ejercicios 400-499) ✅

Mismo proceso que Step 4 pero para ejercicios con índice 400-499.
### Archivo a crear:
- `src/data/i18n/es/exercises_005.json`

---

## Step 9: Traducciones de ejercicios - Batch 6 (ejercicios 500-599) ✅

Mismo proceso que Step 4 pero para ejercicios con índice 500-599.
### Archivo a crear:
- `src/data/i18n/es/exercises_006.json`

---

## Step 10: Traducciones de ejercicios - Batch 7 (ejercicios 600-699) ✅

Mismo proceso que Step 4 pero para ejercicios con índice 600-699.
### Archivo a crear:
- `src/data/i18n/es/exercises_007.json`

---

## Step 11: Traducciones de ejercicios - Batch 8 (ejercicios 700-799) ✅

Mismo proceso que Step 4 pero para ejercicios con índice 700-799.
### Archivo a crear:
- `src/data/i18n/es/exercises_008.json`

---

## Step 12: Traducciones de ejercicios - Batch 9 (ejercicios 800-899) ✅

Mismo proceso que Step 4 pero para ejercicios con índice 800-899.
### Archivo a crear:
- `src/data/i18n/es/exercises_009.json`

---

## Step 13: Traducciones de ejercicios - Batch 10 (ejercicios 900-999) ✅

Mismo proceso que Step 4 pero para ejercicios con índice 900-999.
### Archivo a crear:
- `src/data/i18n/es/exercises_010.json`

---

## Step 14: Traducciones de ejercicios - Batch 11 (ejercicios 1000-1099) ✅

Mismo proceso que Step 4 pero para ejercicios con índice 1000-1099.
### Archivo a crear:
- `src/data/i18n/es/exercises_011.json`

---

## Step 15: Traducciones de ejercicios - Batch 12 (ejercicios 1100-1199) ✅

Mismo proceso que Step 4 pero para ejercicios con índice 1100-1199.
### Archivo a crear:
- `src/data/i18n/es/exercises_012.json`

---

## Step 16: Traducciones de ejercicios - Batch 13 (ejercicios 1200-1299) ✅

Mismo proceso que Step 4 pero para ejercicios con índice 1200-1299.
### Archivo a crear:
- `src/data/i18n/es/exercises_013.json`

---

## Step 17: Traducciones de ejercicios - Batch 14 (ejercicios 1300-1399) ✅

Mismo proceso que Step 4 pero para ejercicios con índice 1300-1399.
### Archivo a crear:
- `src/data/i18n/es/exercises_014.json`

---

## Step 18: Traducciones de ejercicios - Batch 15 (ejercicios 1400-1499) ✅

Mismo proceso que Step 4 pero para ejercicios con índice 1400-1499.
### Archivo a crear:
- `src/data/i18n/es/exercises_015.json`

---

## Step 19: Testing y validación ✅

**Objetivo**: Verificar que toda la implementación funciona correctamente.

### Tareas:

1. **Validar integridad de datos**:
   - Verificar que todos los 1,500 exerciseIds en las traducciones existen en exercises.json
   - Verificar que cada ejercicio traducido tiene el mismo número de instructions que el original
   - Verificar que no hay exerciseIds faltantes

2. **Test manual de endpoints**:
   - `GET /api/v1/exercises?lang=es` - verificar nombres e instrucciones en español
   - `GET /api/v1/exercises?lang=en` - verificar que inglés sigue funcionando
   - `GET /api/v1/exercises` - verificar que default es inglés
   - `GET /api/v1/exercises/search?q=pecho&lang=es` - búsqueda en español
   - `GET /api/v1/exercises/filter?muscles=pecho&lang=es` - filtro en español
   - `GET /api/v1/exercises/filter?muscles=chest&lang=es` - filtro en inglés con respuesta en español
   - `GET /api/v1/bodyparts?lang=es` - catálogo traducido
   - `GET /api/v1/muscles?lang=es` - catálogo traducido
   - `GET /api/v1/equipments?lang=es` - catálogo traducido
   - `GET /api/v1/exercises/{id}?lang=es` - ejercicio individual traducido

3. **Crear tests automatizados** (vitest):
   - Test de TranslationService
   - Test de resolución bilingüe de filtros
   - Test de endpoints con lang param

---

## Step 20: Documentación y OpenAPI ✅

**Objetivo**: Actualizar la documentación de la API para reflejar el soporte i18n.

### Tareas:

1. Actualizar descripciones OpenAPI en todos los controllers para mencionar el parámetro `lang`
2. Agregar ejemplos de uso con `lang=es` en la documentación
3. Actualizar la home page (`src/pages/home.tsx`) para mencionar soporte multiidioma
4. Actualizar specs en `./specs/` para reflejar el estado final implementado

---

## Resumen de archivos por step

| Step | Archivos | Tipo |
|------|----------|------|
| 1 | types.ts, load.ts, translation.service.ts, exercise.model.ts | Código |
| 2 | 7 controllers/services/types | Código |
| 3 | catalogs.json | Datos (88 términos) |
| 4-18 | exercises_001.json ... exercises_015.json | Datos (100 ejercicios c/u) |
| 19 | Tests | Testing |
| 20 | Controllers, home.tsx, specs | Docs |

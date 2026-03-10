# ExerciseDB API Migration Plan

Migrar el frontend (`smart-coach-pwa`) de `exercisedb-api-theta.vercel.app` a la nueva API `exercisedb-api-nine-omega.vercel.app`, actualizando el proxy y reescribiendo `exercise-api.ts` para usar los nuevos endpoints path-based con filtrado server-side.

([spec: ExerciseDB Migration](../specs/exercisedb-migration.md))

## Notas previas al inicio

- `workout-types.ts` **no necesita cambios** — el tipo `Exercise` ya coincide exactamente con el schema de la nueva API
- Los componentes UI (`ExerciseLibrary.tsx`, `RoutineEditor.tsx`) ya usan `images['360']` correctamente
- Las referencias a `gifUrl` en GraphQL/chat routes son de otra fuente de datos — no se tocan
- El proxy catch-all `[[...path]]` ya soporta los nuevos endpoints sin cambios en su lógica de forwarding

---

## Phase 1: Configuración y proxy

- [x] En `smart-coach-pwa/.env`, agregar la variable:
  ```
  EXERCISE_API_BASE_URL=https://exercisedb-api-nine-omega.vercel.app/api/v1
  ```

- [x] En `smart-coach-pwa/app/api/exercises/[[...path]]/route.ts`, reemplazar la constante hardcodeada:
  ```ts
  // antes
  const EXERCISE_API_BASE = 'https://exercisedb-api-theta.vercel.app/api/v1';
  // después
  const EXERCISE_API_BASE = process.env.EXERCISE_API_BASE_URL ?? 'https://exercisedb-api-nine-omega.vercel.app/api/v1';
  ```

---

## Phase 2: Reescritura de exercise-api.ts

- [x] **Eliminar** todo el código legacy: interfaces `RawExercise` y `RawListResponse`, funciones `transformExercise`, `buildLocalResponse`, `rawFetch`, `fetchAllRaw`, y las variables de caché `allExercisesCache`, `cacheTimestamp`, `CACHE_TTL_MS`.

- [x] **Definir** el nuevo tipo `NewExercise` y `NewListResponse` basados directamente en el schema de la nueva API, y actualizar `ApiResponse<T>` con `totalItems` (en vez de `totalExercises`).

- [x] **Implementar** la función base de fetch `apiFetch` que llame al proxy `/api/exercises` con path y query string, incluyendo `lang: 'es'` por defecto.

- [x] **Implementar** las funciones de catálogo:
  - `getBodyPartList` → `GET /api/exercises/bodyPartList?lang=es`
  - `getTargetList` → `GET /api/exercises/targetList?lang=es`
  - `getEquipmentList` → `GET /api/exercises/equipmentList?lang=es`

- [x] **Implementar** las funciones de listado y búsqueda:
  - `getAllExercises` → `GET /api/exercises?offset=&limit=&lang=es`
  - `searchByName` → `GET /api/exercises/name/{name}?offset=&limit=&lang=es`
  - `getExerciseById` → `GET /api/exercises/exercise/{id}?lang=es`

- [x] **Implementar** los filtros server-side (eliminando el client-side filtering y caching):
  - `filterByBodyPart` → `GET /api/exercises/bodyPart/{bodyPart}?offset=&limit=&lang=es`
  - `filterByTarget` → `GET /api/exercises/target/{target}?offset=&limit=&lang=es`
  - `filterByEquipment` → `GET /api/exercises/equipment/{equipment}?offset=&limit=&lang=es`

- [x] **Actualizar** `searchExercises` para enrutar al endpoint correcto según los filtros activos (sin client-side filtering):
  - Sin filtros + sin nombre → `getAllExercises`
  - Solo nombre → `searchByName`
  - bodyPart activo → `filterByBodyPart` (+ nombre si hay)
  - target activo → `filterByTarget`
  - equipment activo → `filterByEquipment`

---

## Phase 3: Validación visual con Playwright

- [x] Iniciar el servidor de desarrollo del frontend (`bun dev` o `npm run dev` en `smart-coach-pwa`) y verificar que arranca sin errores de compilación.

- [x] Usar el browser agent (Playwright) para navegar a la biblioteca de ejercicios y verificar que la lista carga con datos reales de la nueva API.

- [x] Verificar búsqueda por nombre: escribir "sentadilla" y confirmar que retorna 7 resultados relevantes. (Nota: nombres en español — "squat" devuelve 0 correctamente.)

- [x] Verificar filtros: aplicar filtro de bodyPart ("pecho"), target ("abdominales") y equipment ("mancuerna") — todos devuelven resultados correctos server-side.

- [x] Verificar detalle de ejercicio: expandir un ejercicio y confirmar que se muestra nombre, imagen (360px GCS), instrucciones, bodyPart y equipamiento.

- [x] Confirmar que las imágenes cargan sin errores — 61/61 imágenes cargaron correctamente desde `storage.googleapis.com/…/images/360/`.

---

## Verification

- [x] No hay errores de TypeScript (`tsc --noEmit`) en `smart-coach-pwa`
- [x] La lista de ejercicios carga con datos de la nueva API
- [x] Búsqueda, filtros por bodyPart/target/equipment funcionan correctamente
- [x] El detalle de ejercicio muestra imagen 360px
- [x] No hay referencias a `exercisedb-api-theta.vercel.app` en el código
- [x] El `EXERCISE_API_KEY` no se expone al cliente (permanece server-side en el proxy)

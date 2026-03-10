# Ingredient Search Bug Fix

Búsqueda de ingredientes retorna resultados irrelevantes al agregar alimentos a una comida en smart-coach-pwa.

## Comportamiento Actual (Bug)

- Buscar "arroz" muestra primero "Avena molida", "Fécula de maíz", "Pan campesino", etc.
- Solo "Tortitas de arroz" contiene el término buscado, pero aparece en posición 13
- El problema afecta cualquier búsqueda: la búsqueda semántica domina sobre coincidencias textuales

## Comportamiento Esperado

- Buscar "arroz" muestra primero TODOS los items que contienen "arroz" en el nombre
- Resultados semánticos/relacionados pueden aparecer después como sugerencias
- La relevancia textual tiene prioridad absoluta sobre similitud semántica

## Arquitectura del Sistema de Búsqueda

**Frontend** (`smart-coach-pwa`):
- Componente: `app/_modules/PlanOfDay/components/Search/Search.tsx`
- GraphQL query: `SEARCH_FOOD_ITEMS` con variable `{ search: string }`
- Debounce 400ms antes de disparar la query

**Backend** (`smart-coach-api`):
- `FoodItemService.searchFoodItems(search, limit=50)`
- `VectorSearchService.searchIngredients(query, topK=50, minFuzzy=0.7, minSemantic=0.5)`
- Vector files: `data/vectors/ingredients_vectors.jsonl` (900 entradas, 768 dimensiones)
- Embeddings generados con Vertex AI `text-embedding-004`

## Flujo de Búsqueda y Punto de Falla

```
1. Usuario escribe "arroz"
2. Fuzzy text match en 900 vectores → pocos resultados (<50)
3. Genera embedding via Vertex AI → búsqueda semántica coseno
4. combined = [...textResults, ...semanticResults] → debería ser texto primero
5. FoodItemService: foodItemIds → DB query → orderedResults  ← POSIBLE BUG
6. orderedResults = foodItemIds.map(id => foodItems.find(item => item.id === id))
   .filter(item => item !== undefined)  ← filter puede reordenar
```

## Hipótesis de Causa Raíz

**H1 (más probable)**: El `topK=50` es demasiado alto. Hay pocos items con "arroz" en el nombre → la búsqueda semántica llena los 47+ espacios con carbohidratos similares.

**H2**: La reordenación en `searchFoodItems` (`orderedResults`) pierde el orden de relevancia al hacer `foodItems.find()` — si algún ID no existe en la BD, el `.filter(undefined)` puede desplazar posiciones.

**H3**: Cobertura incompleta — la BD puede tener más food items que los 900 vectores generados, causando que ítems relevantes no tengan vector y no se encuentren textualmente.

**H4**: `minSemanticScore=0.5` es demasiado bajo, permitiendo resultados semánticamente débiles.

## Plan de Diagnóstico (Browser-Agent)

### Paso 1: Reproducir
1. Login: `testuser@smartcoach.dev` / `TestUser123!` en `https://localhost:3000`
2. Ir a Plan of Day → abrir comida → "Agregar ingrediente"
3. Buscar "arroz" → screenshot del resultado
4. Inspeccionar Network: ver payload GraphQL response de `searchFoodItems`

### Paso 2: Análisis técnico
1. Ver logs de `smart-coach-api` al momento de la búsqueda (exact/fuzzy/semantic counts)
2. Contar cuántos food items en BD contienen "arroz"
3. Verificar si `combined` array tiene texto primero antes del retorno

### Paso 3: Aplicar fix
Según diagnóstico, aplicar **Fix A**, **B**, **C**, o **D** (ver Fixes).

## Fixes

**Fix A – Corregir ordering en `searchFoodItems`**
`src/foodItem/foodItem.service.ts`: Preservar orden del array `vectorResults` correctamente.

**Fix B – Reducir topK y separar límites**
`VectorSearchService.searchIngredients()`: Cambiar default `topK` de 50 a 15. Separar `textLimit` y `semanticLimit`.

**Fix C – Regenerar vectores para todos los food items de BD**
Script `prisma/generate-vectors.ts`: Verificar que todos los IDs de BD están cubiertos.

**Fix D – Subir umbral semántico**
`VectorSearchService.searchIngredients()`: Cambiar `minSemanticScore` de 0.5 a 0.75+.

## Related Specs

- [ExerciseDB Migration](./exercisedb-migration.md) — contexto smart-coach-pwa

## Source

- `smart-coach-api/src/foodItem/foodItem.service.ts` (L208-282)
- `smart-coach-api/src/vectorSearch/vectorSearch.service.ts` (L295-370)
- `smart-coach-api/data/vectors/ingredients_vectors.jsonl`
- `smart-coach-pwa/app/_modules/PlanOfDay/components/Search/Search.tsx`
- `smart-coach-pwa/graphql/queries.ts`

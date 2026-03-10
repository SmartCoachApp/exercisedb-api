# Ingredient Search Bug Fix

## Summary

Diagnóstico y corrección del bug donde la búsqueda de ingredientes retorna resultados irrelevantes. Al buscar "arroz", aparecen primero carbohidratos semánticamente similares (avena, fécula, quinua) en lugar de items que contienen "arroz" en su nombre. El plan usa browser-agent para reproducir, diagnosticar y verificar el fix.

([spec: Ingredient Search Bug](../specs/ingredient-search-bug.md))

---

## Phase 1: Reproducción con Browser-Agent

- [x] Login en `https://localhost:3000` con `testuser@smartcoach.dev` / `TestUser123!`, navegar a Plan of Day → abrir una comida existente → click en "Agregar ingrediente", buscar "arroz" y capturar screenshot del resultado erróneo ([spec: Diagnóstico Paso 1](../specs/ingredient-search-bug.md#plan-de-diagnóstico-browser-agent))
- [x] Con browser-agent, abrir DevTools Network tab, repetir búsqueda "arroz" y extraer el JSON completo del response GraphQL `searchFoodItems` — anotar los primeros 5 IDs y nombres retornados para confirmar el orden incorrecto
- [x] Repetir búsqueda con "pollo" y "leche" para confirmar que el bug es generalizado (no solo "arroz"), capturar screenshots

---

## Phase 2: Diagnóstico Técnico

- [x] Revisar logs de `smart-coach-api` ejecutando búsqueda manual — verificar los counts logueados: "X exact matches, Y fuzzy matches" y "Semantic search found Z results" para la query "arroz" ([spec: Causa Raíz H1](../specs/ingredient-search-bug.md#hipótesis-de-causa-raíz))
- [x] Contar food items en BD que contienen "arroz" en el nombre (query directa a Postgres via Prisma Studio o psql) y comparar contra los 900 vectores — determinar si hay IDs en BD sin vector correspondiente ([spec: Causa Raíz H3](../specs/ingredient-search-bug.md#hipótesis-de-causa-raíz))
- [x] Inspeccionar `VectorSearchService.searchIngredients()` (`smart-coach-api/src/vectorSearch/vectorSearch.service.ts` L295-370): agregar log temporal del array `combined` antes del return para verificar que texto va primero; e inspeccionar `FoodItemService.searchFoodItems()` (`smart-coach-api/src/foodItem/foodItem.service.ts` L208-282): loguear `foodItemIds` array y `orderedResults` para detectar si el reordenamiento pierde la relevancia

---

## Phase 3: Fix del Código

- [x] **Fix B** (aplicar siempre): En `VectorSearchService.searchIngredients()`, reducir `topK` default de 50 a 15 y separar límites: devolver máximo 10 resultados textuales + máximo 5 semánticos en lugar de mezclarlos con un solo topK — esto evita que semántica domine cuando hay pocos matches de texto ([spec: Fix B](../specs/ingredient-search-bug.md#fixes))
- [x] **Fix D** (aplicar siempre): Subir `minSemanticScore` de 0.5 a 0.75 en `VectorSearchService.searchIngredients()` para que solo resultados semánticamente muy cercanos pasen el filtro ([spec: Fix D](../specs/ingredient-search-bug.md#fixes))
- [x] **Fix A** (aplicar si diagnóstico confirmó ordering bug): Corregir `orderedResults` en `FoodItemService.searchFoodItems()` — reemplazar lookup por ID (que estaba roto por desincronización vector/BD) con lookup por `metadata.name` para O(1) lookup correcto ([spec: Fix A](../specs/ingredient-search-bug.md#fixes))
- [x] **Fix C** (aplicar si hay IDs en BD sin vector): Ejecutar script `smart-coach-api/prisma/generate-vectors.ts` para regenerar vectores cubriendo todos los food items actuales de la BD

---

## Phase 4: Verificación con Browser-Agent

- [x] Reiniciar `smart-coach-api`, login con browser-agent, buscar "arroz" → verificar que los primeros resultados contienen "arroz" en el nombre (arroz blanco, arroz integral, tortitas de arroz, etc.) — capturar screenshot del resultado corregido
- [x] Probar términos adicionales: "pollo", "leche", "pan", "manzana" — verificar que cada búsqueda retorna resultados textuales relevantes primero
- [x] Verificar comportamiento de búsqueda semántica: buscar "proteína" o "cereal" (términos sin match exacto) → confirmar que los resultados semánticos son razonables y relevantes

---

## Verification

- [x] Buscar "arroz" retorna items con "arroz" en el nombre en las primeras posiciones
- [x] No hay resultados completamente irrelevantes en el top 5 de ninguna búsqueda
- [x] La búsqueda semántica solo complementa (no domina) cuando no hay suficientes matches textuales
- [x] Los logs del servidor muestran counts coherentes (X text matches + Y semantic fills)
- [x] No hay regresión en otros flujos de la app (agregar item, ver detalle nutricional)

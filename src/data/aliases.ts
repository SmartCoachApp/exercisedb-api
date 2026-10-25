import { z } from 'zod'
import type { Exercise, ExerciseAliasEntry, ExerciseAliasesFile, ExerciseCatalogFields } from './types'

/** Zod schema of one `aliases.json` entry. Unknown keys are rejected so a typo never passes silently. */
export const ExerciseAliasEntrySchema = z
  .object({
    aliases: z.array(z.string()).optional(),
    substituteFor: z.array(z.string()).optional(),
    primary: z.literal(true).optional()
  })
  .strict()

/** Zod schema of the whole `aliases.json` file. */
export const ExerciseAliasesFileSchema = z.record(z.string(), ExerciseAliasEntrySchema)

/** Lowercase, strip diacritics, collapse whitespace. The single normalization for alias comparisons. */
export function normalizeAlias(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Trims each term, drops empty ones and keeps the first occurrence of each normalized form. */
export function dedupeTerms(terms: readonly string[] | undefined): string[] {
  if (!terms) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of terms) {
    const term = raw.replace(/\s+/g, ' ').trim()
    const key = normalizeAlias(term)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(term)
  }
  return out
}

/** Catalog fields served for one exercise. `nameEn` is the original English name. */
export function buildCatalogFields(entry: ExerciseAliasEntry | undefined, nameEn: string): ExerciseCatalogFields {
  return {
    aliases: dedupeTerms(entry?.aliases),
    substituteFor: dedupeTerms(entry?.substituteFor),
    isPrimary: entry?.primary === true,
    nameEn
  }
}

/**
 * Validates raw `aliases.json` content against the schema and the catalog ids.
 * Never throws: an invalid shape yields `{}`; entries with unknown ids are dropped.
 */
export function parseAliasesFile(
  raw: unknown,
  knownIds: ReadonlySet<string>
): { aliases: ExerciseAliasesFile; error?: string; unknownIds: string[] } {
  const parsed = ExerciseAliasesFileSchema.safeParse(raw)
  if (!parsed.success) {
    return { aliases: {}, error: parsed.error.message, unknownIds: [] }
  }
  const aliases: ExerciseAliasesFile = {}
  const unknownIds: string[] = []
  for (const [id, entry] of Object.entries(parsed.data)) {
    if (!knownIds.has(id)) {
      unknownIds.push(id)
      continue
    }
    aliases[id] = entry as ExerciseAliasEntry
  }
  return { aliases, unknownIds }
}

export interface SharedAlias {
  /** Normalized alias. */
  alias: string
  /** Exercises (sorted ids) that carry it. */
  exerciseIds: string[]
  /** Distinct normalized ES names of those exercises (≥ 2). */
  names: string[]
}

/**
 * Aliases shared by exercises whose normalized (ES) name differs — i.e. the same alias points to
 * different exercise groups. Clones with the same normalized name may share aliases.
 * `exercises` must carry the Spanish name in `name`.
 */
export function findSharedAliases(
  aliasesFile: ExerciseAliasesFile,
  exercises: ReadonlyArray<Pick<Exercise, 'id' | 'name'>>
): SharedAlias[] {
  const nameById = new Map(exercises.map((ex) => [ex.id, normalizeAlias(ex.name)]))
  const byAlias = new Map<string, Set<string>>()
  for (const [id, entry] of Object.entries(aliasesFile)) {
    for (const alias of entry.aliases ?? []) {
      const key = normalizeAlias(alias)
      if (!key) continue
      const ids = byAlias.get(key) ?? new Set<string>()
      ids.add(id)
      byAlias.set(key, ids)
    }
  }
  const shared: SharedAlias[] = []
  for (const [alias, ids] of byAlias) {
    const names = new Set([...ids].map((id) => nameById.get(id) ?? `#${id}`))
    if (names.size < 2) continue
    shared.push({ alias, exerciseIds: [...ids].sort(), names: [...names].sort() })
  }
  return shared.sort((a, b) => a.alias.localeCompare(b.alias))
}

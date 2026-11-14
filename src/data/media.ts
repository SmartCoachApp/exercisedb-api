/**
 * Exercises with no GIF in the media bucket (`images/{res}/{id}.gif`).
 *
 * The 15 HYROX exercises (5202-5216, added in 866614b) were created without
 * media and no catalog GIF shows their movement (sled push/pull, rowing, wall
 * balls...). Owner decision 2026-11-14: they stay in the catalog and are shown
 * without a GIF. The API returns empty image URLs for them instead of signed
 * URLs to objects that do not exist; clients render their placeholder.
 *
 * Remove an id once its GIF is uploaded at all 4 resolutions.
 */
export const EXERCISES_WITHOUT_MEDIA: ReadonlySet<string> = new Set([
  '5202',
  '5203',
  '5204',
  '5205',
  '5206',
  '5207',
  '5208',
  '5209',
  '5210',
  '5211',
  '5212',
  '5213',
  '5214',
  '5215',
  '5216'
])

export function hasMedia(exerciseId: string): boolean {
  return !EXERCISES_WITHOUT_MEDIA.has(exerciseId)
}

#!/usr/bin/env node
/**
 * Merges tag batch files into exercises.json.
 *
 * Usage: node scripts/apply-exercise-tags.mjs /tmp/exercise-tags/batch_*.json
 *
 * Each batch file is a JSON object: { "exerciseId": { "tags": [...], "baselineEffectiveness": N, "contraindicatedFor": [...] } }
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, resolve } from 'path'

const EXERCISES_PATH = resolve(import.meta.dirname, '../src/data/exercises.json')
const BATCH_DIR = '/tmp/exercise-tags'

// Load exercises
const exercises = JSON.parse(readFileSync(EXERCISES_PATH, 'utf-8'))
console.log(`Loaded ${exercises.length} exercises`)

// Load all batch files
const batchFiles = readdirSync(BATCH_DIR).filter(f => f.endsWith('.json')).sort()
console.log(`Found ${batchFiles.length} batch files: ${batchFiles.join(', ')}`)

let totalTagged = 0
let totalSkipped = 0
const taggedIds = new Set()

for (const file of batchFiles) {
  const batchPath = join(BATCH_DIR, file)
  const batch = JSON.parse(readFileSync(batchPath, 'utf-8'))
  const ids = Object.keys(batch)
  console.log(`  ${file}: ${ids.length} exercises`)

  for (const [id, data] of Object.entries(batch)) {
    if (taggedIds.has(id)) {
      console.warn(`  WARNING: Duplicate ID ${id} in ${file}, skipping`)
      totalSkipped++
      continue
    }
    taggedIds.add(id)

    const exercise = exercises.find(e => e.id === id)
    if (!exercise) {
      console.warn(`  WARNING: Exercise ${id} not found in exercises.json`)
      totalSkipped++
      continue
    }

    // Validate
    if (!Array.isArray(data.tags) || data.tags.length === 0) {
      console.warn(`  WARNING: Exercise ${id} (${exercise.name}) has empty tags`)
    }
    if (typeof data.baselineEffectiveness !== 'number' || data.baselineEffectiveness < 0 || data.baselineEffectiveness > 100) {
      console.warn(`  WARNING: Exercise ${id} (${exercise.name}) has invalid baselineEffectiveness: ${data.baselineEffectiveness}`)
    }
    if (!Array.isArray(data.contraindicatedFor)) {
      console.warn(`  WARNING: Exercise ${id} (${exercise.name}) has invalid contraindicatedFor`)
    }

    exercise.tags = data.tags
    exercise.baselineEffectiveness = data.baselineEffectiveness
    exercise.contraindicatedFor = data.contraindicatedFor
    totalTagged++
  }
}

console.log(`\nTagged: ${totalTagged}, Skipped: ${totalSkipped}, Missing: ${exercises.length - totalTagged}`)

// Verify all exercises are tagged
const untagged = exercises.filter(e => !e.tags)
if (untagged.length > 0) {
  console.warn(`\nWARNING: ${untagged.length} exercises still untagged:`)
  untagged.slice(0, 10).forEach(e => console.warn(`  ${e.id} ${e.name}`))
  if (untagged.length > 10) console.warn(`  ... and ${untagged.length - 10} more`)
}

// Stats
const allTags = new Set()
exercises.forEach(e => (e.tags || []).forEach(t => allTags.add(t)))
console.log(`\nUnique tags used: ${allTags.size}`)
console.log('Tags:', [...allTags].sort().join(', '))

// Distribution stats
const tagCounts = {}
exercises.forEach(e => (e.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1 }))
console.log('\nTag distribution:')
Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).forEach(([tag, count]) => {
  console.log(`  ${tag}: ${count} (${(count / exercises.length * 100).toFixed(1)}%)`)
})

// Effectiveness distribution
const effBands = { '85-100': 0, '70-84': 0, '50-69': 0, '30-49': 0, '10-29': 0, '0-9': 0 }
exercises.forEach(e => {
  const v = e.baselineEffectiveness ?? 50
  if (v >= 85) effBands['85-100']++
  else if (v >= 70) effBands['70-84']++
  else if (v >= 50) effBands['50-69']++
  else if (v >= 30) effBands['30-49']++
  else if (v >= 10) effBands['10-29']++
  else effBands['0-9']++
})
console.log('\nEffectiveness distribution:')
Object.entries(effBands).forEach(([band, count]) => {
  console.log(`  ${band}: ${count} (${(count / exercises.length * 100).toFixed(1)}%)`)
})

// Write back
writeFileSync(EXERCISES_PATH, JSON.stringify(exercises, null, 2) + '\n')
console.log(`\nWrote ${exercises.length} exercises to ${EXERCISES_PATH}`)

/**
 * Script: add-measurement-type.mjs
 *
 * Adds `measurementType` to all exercises in exercises.json:
 * - Default: 'reps' for all exercises
 * - Reclassifies specific cardio exercises to 'time':
 *   - run / running variants
 *   - stationary bike variants
 *   - walking / cycling machine variants
 *   - jump rope (typically timed)
 *
 * Usage: node scripts/add-measurement-type.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// IDs of cardio exercises that should be classified as 'time'
// These are continuous cardio activities where duration is the primary metric
const TIME_EXERCISE_IDS = new Set([
  '0684', // run (equipment) — treadmill running
  '0685', // run — outdoor running
  '0798', // stationary bike walk
  '2138', // stationary bike run v. 3
  '2141', // walk elliptical cross trainer
  '2311', // walking on stepmill
  '2331', // cycle cross trainer
  '2612', // jump rope — typically timed
  '3656', // short stride run
  '3666', // walking on incline treadmill
]);

const exercisesPath = join(__dirname, '..', 'src', 'data', 'exercises.json');

// Read
const raw = readFileSync(exercisesPath, 'utf-8');
const exercises = JSON.parse(raw);

console.log(`Total exercises: ${exercises.length}`);

let repsCount = 0;
let timeCount = 0;

// Add measurementType to each exercise
for (const exercise of exercises) {
  if (TIME_EXERCISE_IDS.has(exercise.id)) {
    exercise.measurementType = 'time';
    timeCount++;
    console.log(`  [time] ${exercise.id} — ${exercise.name}`);
  } else {
    exercise.measurementType = 'reps';
    repsCount++;
  }
}

// Write back
const output = JSON.stringify(exercises, null, 2) + '\n';
writeFileSync(exercisesPath, output, 'utf-8');

console.log(`\nDone:`);
console.log(`  reps: ${repsCount}`);
console.log(`  time: ${timeCount}`);
console.log(`  total: ${exercises.length}`);

// Validate: re-read and parse to confirm valid JSON
const validation = JSON.parse(readFileSync(exercisesPath, 'utf-8'));
console.log(`\nValidation: re-parsed ${validation.length} exercises — JSON is valid`);

// Verify all exercises have measurementType
const missing = validation.filter((e) => !e.measurementType);
if (missing.length > 0) {
  console.error(`ERROR: ${missing.length} exercises missing measurementType!`);
  process.exit(1);
} else {
  console.log(`All ${validation.length} exercises have measurementType`);
}

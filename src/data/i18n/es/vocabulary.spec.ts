import { describe, it, expect } from 'vitest'
import exercises from '../../exercises.json'
import equipmentList from '../../equipment.json'
import catalogs from './catalogs.json'
import { TranslationService } from '../../../services/translation.service'
import { GetExercisesUseCase } from '../../../modules/exercises/use-cases/get-exercise.usecase'
import type { Exercise } from '../../types'

/**
 * Every lang=es response must carry Spanish catalog labels for EVERY exercise
 * (QA prod 2026-10-25: «dumbbell, exercise ball» and «dumbbell (used as handles
 * for deeper range)» reached the PWA untranslated). Equipment may be compound
 * («mancuerna, balón de estabilidad»): each comma-separated token must be a
 * Spanish catalog label.
 */
const cat = catalogs as unknown as {
  bodyParts: Record<string, string>
  targets: Record<string, string>
  equipment: Record<string, string>
  secondaryMuscles: Record<string, string>
}

const spanishEquipment = new Set(Object.values(cat.equipment))
const spanishBodyParts = new Set(Object.values(cat.bodyParts))
const spanishTargets = new Set(Object.values(cat.targets))
const spanishMuscles = new Set([
  ...Object.values(cat.targets),
  ...Object.values(cat.bodyParts),
  ...Object.values(cat.secondaryMuscles ?? {})
])

const splitTokens = (value: string) => value.split(',').map((t) => t.trim())

describe('Spanish catalog vocabulary — full catalog', () => {
  it('source equipment values are canonical: every token is in equipment.json, no annotations', () => {
    const allowed = new Set(equipmentList as string[])
    const bad = (exercises as Exercise[])
      .filter((e) => splitTokens(e.equipment).some((t) => !allowed.has(t)))
      .map((e) => `${e.id}: ${e.equipment}`)
    expect(bad).toEqual([])
  })

  it('lang=es: equipment, bodyPart, target and secondaryMuscles are Spanish for every exercise', async () => {
    const translated = await TranslationService.translateExercises(exercises as Exercise[], 'es')
    const leaks: string[] = []
    for (const e of translated) {
      for (const t of splitTokens(e.equipment)) {
        if (!spanishEquipment.has(t)) leaks.push(`${e.id} equipment: ${e.equipment}`)
      }
      if (!spanishBodyParts.has(e.bodyPart)) leaks.push(`${e.id} bodyPart: ${e.bodyPart}`)
      if (!spanishTargets.has(e.target)) leaks.push(`${e.id} target: ${e.target}`)
      for (const m of e.secondaryMuscles) {
        if (!spanishMuscles.has(m)) leaks.push(`${e.id} secondaryMuscles: ${m}`)
      }
    }
    expect([...new Set(leaks)]).toEqual([])
  })

  it('a compound equipment exercise matches the filter of each of its equipments', async () => {
    const useCase = new GetExercisesUseCase()
    const es = await TranslationService.getTranslatedExerciseData('es')
    // The use case caps a page at 100: walk every page.
    const ids = async (equipment: string, exerciseData?: Exercise[]) => {
      const out: string[] = []
      for (let offset = 0; ; offset += 100) {
        const page = await useCase.execute({ offset, limit: 100, query: { equipment }, exerciseData })
        out.push(...page.exercises.map((e) => e.id))
        if (page.exercises.length < 100) return out
      }
    }
    expect(await ids('dumbbell')).toContain('1278')
    expect(await ids('stability ball')).toContain('1278')
    expect(await ids('dumbbell')).toContain('1274')
    expect(await ids('mancuerna', es)).toContain('1278')
    expect(await ids('balón de estabilidad', es)).toContain('1278')
  })
})

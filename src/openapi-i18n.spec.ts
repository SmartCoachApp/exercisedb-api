import { describe, it, expect } from 'vitest'
import { BodyPartController, EquipmentController, ExerciseController, MuscleController } from './modules'
import { App } from './app'

function createApp() {
  return new App([
    new ExerciseController(),
    new MuscleController(),
    new EquipmentController(),
    new BodyPartController()
  ]).getApp()
}

describe('OpenAPI i18n documentation', () => {
  it('includes multi-language description in API info', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    expect(spec.info.description).toContain('Multi-language support')
    expect(spec.info.description).toContain('lang')
    expect(spec.info.description).toContain('lang=es')
  })

  it('exposes lang query parameter on GET /exercises', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const exercisesPath = spec.paths['/api/v1/exercises']
    expect(exercisesPath).toBeDefined()
    const getOp = exercisesPath.get
    expect(getOp.description).toContain('lang=es')

    const langParam = getOp.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
    expect(langParam.schema.enum).toContain('en')
    expect(langParam.schema.enum).toContain('es')
  })

  it('exposes lang query parameter on GET /exercises/search', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const searchPath = spec.paths['/api/v1/exercises/search']
    expect(searchPath).toBeDefined()
    const getOp = searchPath.get
    expect(getOp.description).toContain('lang=es')

    const langParam = getOp.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
  })

  it('exposes lang query parameter on GET /exercises/filter with bilingual mention', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const filterPath = spec.paths['/api/v1/exercises/filter']
    expect(filterPath).toBeDefined()
    const getOp = filterPath.get
    expect(getOp.description).toContain('lang=es')
    expect(getOp.description).toContain('Spanish')

    const langParam = getOp.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
  })

  it('exposes lang query parameter on GET /exercises/{exerciseId}', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const byIdPath = spec.paths['/api/v1/exercises/{exerciseId}']
    expect(byIdPath).toBeDefined()
    const getOp = byIdPath.get
    expect(getOp.description).toContain('lang=es')

    const langParam = getOp.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
  })

  it('exposes lang query parameter on GET /bodyparts', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const bodypartsPath = spec.paths['/api/v1/bodyparts']
    expect(bodypartsPath).toBeDefined()
    const getOp = bodypartsPath.get
    expect(getOp.description).toContain('lang=es')

    const langParam = getOp.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
  })

  it('exposes lang query parameter on GET /muscles', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const musclesPath = spec.paths['/api/v1/muscles']
    expect(musclesPath).toBeDefined()
    const getOp = musclesPath.get
    expect(getOp.description).toContain('lang=es')

    const langParam = getOp.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
  })

  it('exposes lang query parameter on GET /equipments', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const equipmentsPath = spec.paths['/api/v1/equipments']
    expect(equipmentsPath).toBeDefined()
    const getOp = equipmentsPath.get
    expect(getOp.description).toContain('lang=es')

    const langParam = getOp.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
  })

  it('mentions lang support in body-part exercises endpoint', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const path = spec.paths['/api/v1/bodyparts/{bodyPartName}/exercises']
    expect(path).toBeDefined()
    expect(path.get.description).toContain('lang=es')
  })

  it('mentions lang support in equipment exercises endpoint', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const path = spec.paths['/api/v1/equipments/{equipmentName}/exercises']
    expect(path).toBeDefined()
    expect(path.get.description).toContain('lang=es')
  })

  it('mentions lang support in muscle exercises endpoint', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const path = spec.paths['/api/v1/muscles/{muscleName}/exercises']
    expect(path).toBeDefined()
    expect(path.get.description).toContain('lang=es')
  })

  it('lang parameter defaults to en in schema', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const exercisesPath = spec.paths['/api/v1/exercises']
    const langParam = exercisesPath.get.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
    expect(langParam.schema.default).toBe('en')
  })
})

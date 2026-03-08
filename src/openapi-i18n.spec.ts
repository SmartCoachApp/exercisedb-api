import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExerciseController } from './modules'
import { App } from './app'
import { FileLoader } from './data/load'
import { signedUrlService } from './services/signed-url.service'

vi.spyOn(FileLoader, 'loadExercises').mockResolvedValue([])
vi.spyOn(signedUrlService, 'generateImageUrls').mockResolvedValue({ '180': '', '360': '', '720': '', '1080': '' })

function createApp() {
  return new App([new ExerciseController()]).getApp()
}

describe('OpenAPI i18n documentation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('includes multi-language description in API info', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    expect(spec.info.description).toContain('Multi-language support')
    expect(spec.info.description).toContain('lang')
    expect(spec.info.description).toContain('lang=es')
  })

  it('exposes GET /api/v1/exercises with lang parameter', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const path = spec.paths['/api/v1/exercises']
    expect(path).toBeDefined()
    const getOp = path.get
    expect(getOp.description).toContain('lang=es')

    const langParam = getOp.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
    expect(langParam.schema.enum).toContain('en')
    expect(langParam.schema.enum).toContain('es')
    expect(langParam.schema.default).toBe('en')
  })

  it('exposes GET /api/v1/exercises/bodyPartList with lang parameter', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const path = spec.paths['/api/v1/exercises/bodyPartList']
    expect(path).toBeDefined()
    const langParam = path.get.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
  })

  it('exposes GET /api/v1/exercises/targetList with lang parameter', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const path = spec.paths['/api/v1/exercises/targetList']
    expect(path).toBeDefined()
    const langParam = path.get.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
  })

  it('exposes GET /api/v1/exercises/equipmentList with lang parameter', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const path = spec.paths['/api/v1/exercises/equipmentList']
    expect(path).toBeDefined()
    const langParam = path.get.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
  })

  it('exposes GET /api/v1/exercises/bodyPart/{bodyPart} with lang parameter', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const path = spec.paths['/api/v1/exercises/bodyPart/{bodyPart}']
    expect(path).toBeDefined()
    expect(path.get.description).toContain('lang=es')

    const langParam = path.get.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
  })

  it('exposes GET /api/v1/exercises/target/{target} with lang parameter', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const path = spec.paths['/api/v1/exercises/target/{target}']
    expect(path).toBeDefined()
    const langParam = path.get.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
  })

  it('exposes GET /api/v1/exercises/equipment/{equipment} with lang parameter', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const path = spec.paths['/api/v1/exercises/equipment/{equipment}']
    expect(path).toBeDefined()
    const langParam = path.get.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
  })

  it('exposes GET /api/v1/exercises/name/{name} with lang parameter', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const path = spec.paths['/api/v1/exercises/name/{name}']
    expect(path).toBeDefined()
    expect(path.get.description).toContain('lang=es')

    const langParam = path.get.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
  })

  it('exposes GET /api/v1/exercises/exercise/{id} with lang parameter', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const path = spec.paths['/api/v1/exercises/exercise/{id}']
    expect(path).toBeDefined()
    expect(path.get.description).toContain('lang=es')

    const langParam = path.get.parameters?.find((p: { name: string }) => p.name === 'lang')
    expect(langParam).toBeDefined()
  })

  it('all 9 exercise endpoints are documented in the OpenAPI spec', async () => {
    const app = createApp()
    const res = await app.request('/swagger')
    const spec = await res.json()

    const paths = Object.keys(spec.paths)
    expect(paths).toContain('/api/v1/exercises')
    expect(paths).toContain('/api/v1/exercises/bodyPartList')
    expect(paths).toContain('/api/v1/exercises/targetList')
    expect(paths).toContain('/api/v1/exercises/equipmentList')
    expect(paths).toContain('/api/v1/exercises/bodyPart/{bodyPart}')
    expect(paths).toContain('/api/v1/exercises/target/{target}')
    expect(paths).toContain('/api/v1/exercises/equipment/{equipment}')
    expect(paths).toContain('/api/v1/exercises/name/{name}')
    expect(paths).toContain('/api/v1/exercises/exercise/{id}')
  })
})

import { Routes } from '#common/types/route.type.js'
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { ExerciseService } from '../services/exercise.service'
import {
  CatalogResponseSchema,
  FilterQuerySchema,
  ListResponseSchema,
  PaginationQuerySchema,
  SingleExerciseResponseSchema
} from '../models/exercise.model'

export class ExerciseController implements Routes {
  public controller: OpenAPIHono
  private readonly exerciseService: ExerciseService

  constructor() {
    this.controller = new OpenAPIHono()
    this.exerciseService = new ExerciseService()
  }

  private buildPaginationUrls(
    origin: string,
    pathname: string,
    currentPage: number,
    totalPages: number,
    limit: number,
    extraParams: string = ''
  ): { previousPage: string | null; nextPage: string | null } {
    const base = `${origin}${pathname}`
    const extra = extraParams ? `&${extraParams}` : ''
    return {
      previousPage: currentPage > 1 ? `${base}?offset=${(currentPage - 2) * limit}&limit=${limit}${extra}` : null,
      nextPage: currentPage < totalPages ? `${base}?offset=${currentPage * limit}&limit=${limit}${extra}` : null
    }
  }

  public initRoutes() {
    // ── Catalog endpoints ──────────────────────────────────────────────────

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/exercises/bodyPartList',
        tags: ['EXERCISES'],
        summary: 'Get all body parts',
        description: 'Returns the list of all available body parts. Supports ?lang=es for Spanish translations.',
        operationId: 'getBodyPartList',
        request: {
          query: z.object({
            lang: z.enum(['en', 'es']).optional().default('en').openapi({
              title: 'Language',
              description: 'Response language',
              example: 'en'
            })
          })
        },
        responses: {
          200: {
            description: 'List of body parts',
            content: { 'application/json': { schema: CatalogResponseSchema } }
          }
        }
      }),
      async (ctx) => {
        const { lang = 'en' } = ctx.req.valid('query')
        const data = await this.exerciseService.getBodyPartList(lang)
        return ctx.json({ success: true as const, data })
      }
    )

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/exercises/targetList',
        tags: ['EXERCISES'],
        summary: 'Get all target muscles',
        description: 'Returns the list of all target muscles. Supports ?lang=es for Spanish translations.',
        operationId: 'getTargetList',
        request: {
          query: z.object({
            lang: z.enum(['en', 'es']).optional().default('en').openapi({
              title: 'Language',
              description: 'Response language',
              example: 'en'
            })
          })
        },
        responses: {
          200: {
            description: 'List of target muscles',
            content: { 'application/json': { schema: CatalogResponseSchema } }
          }
        }
      }),
      async (ctx) => {
        const { lang = 'en' } = ctx.req.valid('query')
        const data = await this.exerciseService.getTargetList(lang)
        return ctx.json({ success: true as const, data })
      }
    )

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/exercises/equipmentList',
        tags: ['EXERCISES'],
        summary: 'Get all equipment types',
        description: 'Returns the list of all available equipment types. Supports ?lang=es for Spanish translations.',
        operationId: 'getEquipmentList',
        request: {
          query: z.object({
            lang: z.enum(['en', 'es']).optional().default('en').openapi({
              title: 'Language',
              description: 'Response language',
              example: 'en'
            })
          })
        },
        responses: {
          200: {
            description: 'List of equipment types',
            content: { 'application/json': { schema: CatalogResponseSchema } }
          }
        }
      }),
      async (ctx) => {
        const { lang = 'en' } = ctx.req.valid('query')
        const data = await this.exerciseService.getEquipmentList(lang)
        return ctx.json({ success: true as const, data })
      }
    )

    // ── Single exercise ────────────────────────────────────────────────────

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/exercises/exercise/{id}',
        tags: ['EXERCISES'],
        summary: 'Get exercise by ID',
        description:
          'Retrieve a single exercise by its 4-digit ID. Returns 404 if not found. Supports ?lang=es for Spanish results.',
        operationId: 'getExerciseById',
        request: {
          params: z.object({
            id: z.string().openapi({
              title: 'Exercise ID',
              description: '4-digit exercise ID',
              example: '0001'
            })
          }),
          query: z.object({
            lang: z.enum(['en', 'es']).optional().default('en').openapi({
              title: 'Language',
              description: 'Response language',
              example: 'en'
            })
          })
        },
        responses: {
          200: {
            description: 'Exercise details',
            content: { 'application/json': { schema: SingleExerciseResponseSchema } }
          },
          404: { description: 'Exercise not found' }
        }
      }),
      async (ctx) => {
        const { id } = ctx.req.valid('param')
        const { lang = 'en' } = ctx.req.valid('query')
        const data = await this.exerciseService.getExerciseById({ id, lang })
        return ctx.json({ success: true as const, data })
      }
    )

    // ── Filter endpoints ───────────────────────────────────────────────────

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/exercises/bodyPart/{bodyPart}',
        tags: ['EXERCISES'],
        summary: 'Filter exercises by body part',
        description:
          'Retrieve exercises that target a specific body part (case-insensitive exact match). Path param is always English. Supports ?lang=es for Spanish results.',
        operationId: 'getExercisesByBodyPart',
        request: {
          params: z.object({
            bodyPart: z.string().openapi({
              description: 'Body part name (case-insensitive, always English)',
              example: 'waist'
            })
          }),
          query: PaginationQuerySchema
        },
        responses: {
          200: {
            description: 'Paginated list of exercises',
            content: { 'application/json': { schema: ListResponseSchema } }
          }
        }
      }),
      async (ctx) => {
        const { bodyPart } = ctx.req.valid('param')
        const { offset = 0, limit = 10, lang = 'en' } = ctx.req.valid('query')
        const { origin, pathname } = new URL(ctx.req.url)

        const { data, totalItems, totalPages, currentPage } = await this.exerciseService.getExercisesByBodyPart({
          bodyPart,
          offset,
          limit,
          lang
        })

        const langParam = lang !== 'en' ? `lang=${lang}` : ''
        const { previousPage, nextPage } = this.buildPaginationUrls(
          origin,
          pathname,
          currentPage,
          totalPages,
          limit,
          langParam
        )

        return ctx.json({
          success: true as const,
          metadata: { totalItems, totalPages, currentPage, previousPage, nextPage },
          data
        })
      }
    )

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/exercises/target/{target}',
        tags: ['EXERCISES'],
        summary: 'Filter exercises by target muscle',
        description:
          'Retrieve exercises that target a specific muscle (case-insensitive exact match). Path param is always English. Supports ?lang=es for Spanish results.',
        operationId: 'getExercisesByTarget',
        request: {
          params: z.object({
            target: z.string().openapi({
              description: 'Target muscle name (case-insensitive, always English)',
              example: 'abs'
            })
          }),
          query: PaginationQuerySchema
        },
        responses: {
          200: {
            description: 'Paginated list of exercises',
            content: { 'application/json': { schema: ListResponseSchema } }
          }
        }
      }),
      async (ctx) => {
        const { target } = ctx.req.valid('param')
        const { offset = 0, limit = 10, lang = 'en' } = ctx.req.valid('query')
        const { origin, pathname } = new URL(ctx.req.url)

        const { data, totalItems, totalPages, currentPage } = await this.exerciseService.getExercisesByTarget({
          target,
          offset,
          limit,
          lang
        })

        const langParam = lang !== 'en' ? `lang=${lang}` : ''
        const { previousPage, nextPage } = this.buildPaginationUrls(
          origin,
          pathname,
          currentPage,
          totalPages,
          limit,
          langParam
        )

        return ctx.json({
          success: true as const,
          metadata: { totalItems, totalPages, currentPage, previousPage, nextPage },
          data
        })
      }
    )

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/exercises/equipment/{equipment}',
        tags: ['EXERCISES'],
        summary: 'Filter exercises by equipment',
        description:
          'Retrieve exercises that use specific equipment (case-insensitive exact match). Path param is always English. Supports ?lang=es for Spanish results.',
        operationId: 'getExercisesByEquipment',
        request: {
          params: z.object({
            equipment: z.string().openapi({
              description: 'Equipment name (case-insensitive, always English)',
              example: 'dumbbell'
            })
          }),
          query: PaginationQuerySchema
        },
        responses: {
          200: {
            description: 'Paginated list of exercises',
            content: { 'application/json': { schema: ListResponseSchema } }
          }
        }
      }),
      async (ctx) => {
        const { equipment } = ctx.req.valid('param')
        const { offset = 0, limit = 10, lang = 'en' } = ctx.req.valid('query')
        const { origin, pathname } = new URL(ctx.req.url)

        const { data, totalItems, totalPages, currentPage } = await this.exerciseService.getExercisesByEquipment({
          equipment,
          offset,
          limit,
          lang
        })

        const langParam = lang !== 'en' ? `lang=${lang}` : ''
        const { previousPage, nextPage } = this.buildPaginationUrls(
          origin,
          pathname,
          currentPage,
          totalPages,
          limit,
          langParam
        )

        return ctx.json({
          success: true as const,
          metadata: { totalItems, totalPages, currentPage, previousPage, nextPage },
          data
        })
      }
    )

    // ── Name search ────────────────────────────────────────────────────────

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/exercises/name/{name}',
        tags: ['EXERCISES'],
        summary: 'Search exercises by name',
        description:
          'Fuzzy search exercises by name (Fuse.js, name field only). Path segment is URL-decoded before matching. Supports ?lang=es for Spanish results.',
        operationId: 'searchExercisesByName',
        request: {
          params: z.object({
            name: z.string().openapi({
              description: 'Exercise name to search (fuzzy)',
              example: 'sit-up'
            })
          }),
          query: PaginationQuerySchema
        },
        responses: {
          200: {
            description: 'Paginated list of matching exercises',
            content: { 'application/json': { schema: ListResponseSchema } }
          }
        }
      }),
      async (ctx) => {
        const { name } = ctx.req.valid('param')
        const { offset = 0, limit = 10, lang = 'en' } = ctx.req.valid('query')
        const { origin, pathname } = new URL(ctx.req.url)

        const { data, totalItems, totalPages, currentPage } = await this.exerciseService.searchByName({
          name,
          offset,
          limit,
          lang
        })

        const langParam = lang !== 'en' ? `lang=${lang}` : ''
        const nameParam = `name=${encodeURIComponent(name)}`
        const extra = langParam ? `${nameParam}&${langParam}` : nameParam
        const { previousPage, nextPage } = this.buildPaginationUrls(
          origin,
          pathname,
          currentPage,
          totalPages,
          limit,
          extra
        )

        return ctx.json({
          success: true as const,
          metadata: { totalItems, totalPages, currentPage, previousPage, nextPage },
          data
        })
      }
    )

    // ── All exercises (paginated) ──────────────────────────────────────────

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/exercises',
        tags: ['EXERCISES'],
        summary: 'Get all exercises',
        description:
          'Retrieve all exercises with pagination and optional filtering by tags, effectiveness, and contraindications. Supports ?lang=es for Spanish results.',
        operationId: 'getAllExercises',
        request: {
          query: FilterQuerySchema
        },
        responses: {
          200: {
            description: 'Paginated list of exercises',
            content: { 'application/json': { schema: ListResponseSchema } }
          }
        }
      }),
      async (ctx) => {
        const {
          offset = 0,
          limit = 10,
          lang = 'en',
          tags,
          minEffectiveness,
          maxEffectiveness,
          excludeContraindicated
        } = ctx.req.valid('query')
        const { origin, pathname } = new URL(ctx.req.url)

        const { data, totalItems, totalPages, currentPage } = await this.exerciseService.getAllExercises({
          offset,
          limit,
          lang,
          tags: tags ? tags.split(',').map((t) => t.trim()) : undefined,
          minEffectiveness,
          maxEffectiveness,
          excludeContraindicated: excludeContraindicated
            ? excludeContraindicated.split(',').map((c) => c.trim())
            : undefined
        })

        const langParam = lang !== 'en' ? `lang=${lang}` : ''
        const { previousPage, nextPage } = this.buildPaginationUrls(
          origin,
          pathname,
          currentPage,
          totalPages,
          limit,
          langParam
        )

        return ctx.json({
          success: true as const,
          metadata: { totalItems, totalPages, currentPage, previousPage, nextPage },
          data
        })
      }
    )
  }
}

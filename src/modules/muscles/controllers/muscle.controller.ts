import { Routes } from '#common/types/route.type.js'
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { MuscleModel } from '../models/muscle.model'
import { MuscleService } from '../services'
import { TranslationService } from '../../../services/translation.service'

export class MuscleController implements Routes {
  public controller: OpenAPIHono
  private readonly muscleService: MuscleService
  constructor() {
    this.controller = new OpenAPIHono()
    this.muscleService = new MuscleService()
  }

  public initRoutes() {
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/muscles',
        tags: ['MUSCLES'],
        summary: 'Get all muscles',
        description: 'Retrieve the list of all available target muscles. Supports ?lang=es for Spanish translations.',
        operationId: 'getMuscles',
        request: {
          query: z.object({
            lang: z.enum(['en', 'es']).optional().default('en').openapi({
              title: 'Language',
              description: 'Response language (en=English, es=Spanish)',
              example: 'en'
            })
          })
        },
        responses: {
          200: {
            description: 'Successful response with list of all muscles.',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the request was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: z.array(MuscleModel).openapi({
                    description: 'Array of muscles.'
                  })
                })
              }
            }
          },
          500: {
            description: 'Internal server error'
          }
        }
      }),
      async (ctx) => {
        const { lang = 'en' } = ctx.req.valid('query')
        const response = await this.muscleService.getMuscles()

        if (lang !== 'en') {
          const names = response.map(m => m.name)
          const translated = await TranslationService.translateCatalogList(names, 'muscles', lang)
          const translatedResponse = translated.map(name => ({ name }))
          return ctx.json({ success: true, data: translatedResponse })
        }

        return ctx.json({ success: true, data: response })
      }
    )
  }
}

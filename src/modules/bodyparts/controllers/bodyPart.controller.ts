import { Routes } from '#common/types/route.type.js'
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { BodyPartService } from '../services'
import { BodyPartModel } from '../models/bodyPart.model'
import { TranslationService } from '../../../services/translation.service'

export class BodyPartController implements Routes {
  public controller: OpenAPIHono
  private readonly bodyPartService: BodyPartService
  constructor() {
    this.controller = new OpenAPIHono()
    this.bodyPartService = new BodyPartService()
  }

  public initRoutes() {
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/bodyparts',
        tags: ['BODYPARTS'],
        summary: 'Get all body parts',
        description: 'Retrieve the list of all available body parts. Supports ?lang=es for Spanish translations.',
        operationId: 'getBodyParts',
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
            description: 'Successful response with list of all bodyparts.',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the request was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: z.array(BodyPartModel).openapi({
                    description: 'Array of bodyparts.'
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
        const response = await this.bodyPartService.getBodyParts()

        if (lang !== 'en') {
          const names = response.map((bp) => bp.name)
          const translated = await TranslationService.translateCatalogList(names, 'bodyParts', lang)
          const translatedResponse = translated.map((name) => ({ name }))
          return ctx.json({ success: true, data: translatedResponse })
        }

        return ctx.json({ success: true, data: response })
      }
    )
  }
}

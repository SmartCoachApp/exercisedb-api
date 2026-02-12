import { Routes } from '#common/types/route.type.js'
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { EquipmentModel } from '../models/equipment.model'
import { EquipmentService } from '../services'
import { TranslationService } from '../../../services/translation.service'

export class EquipmentController implements Routes {
  public controller: OpenAPIHono
  private readonly equipmentService: EquipmentService
  constructor() {
    this.controller = new OpenAPIHono()
    this.equipmentService = new EquipmentService()
  }

  public initRoutes() {
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/equipments',
        tags: ['EQUIPMENTS'],
        summary: 'Get all equipment',
        description: 'Retrieve the list of all available equipment types. Supports ?lang=es for Spanish translations.',
        operationId: 'getEquipments',
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
            description: 'Successful response with list of all equipments.',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the request was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: z.array(EquipmentModel).openapi({
                    description: 'Array of equipments.'
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
        const response = await this.equipmentService.getEquipments()

        if (lang !== 'en') {
          const names = response.map((e) => e.name)
          const translated = await TranslationService.translateCatalogList(names, 'equipments', lang)
          const translatedResponse = translated.map((name) => ({ name }))
          return ctx.json({ success: true, data: translatedResponse })
        }

        return ctx.json({ success: true, data: response })
      }
    )
  }
}

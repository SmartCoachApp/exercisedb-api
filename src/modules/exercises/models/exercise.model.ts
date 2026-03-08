import { z } from 'zod'

export const ExerciseImagesSchema = z.object({
  '180': z.string(),
  '360': z.string(),
  '720': z.string(),
  '1080': z.string()
})

export const ExerciseWithImagesSchema = z.object({
  id: z.string().openapi({ example: '0001' }),
  name: z.string().openapi({ example: '3/4 sit-up' }),
  bodyPart: z.string().openapi({ example: 'waist' }),
  equipment: z.string().openapi({ example: 'body weight' }),
  target: z.string().openapi({ example: 'abs' }),
  secondaryMuscles: z.array(z.string()).openapi({ example: ['hip flexors', 'lower back'] }),
  instructions: z.array(z.string()).openapi({ example: ['Lie flat on your back...', 'Engaging your abs...'] }),
  description: z.string().openapi({ example: 'The 3/4 sit-up is an abdominal exercise...' }),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).openapi({ example: 'beginner' }),
  category: z.string().openapi({ example: 'strength' }),
  images: ExerciseImagesSchema
})

export const PaginationQuerySchema = z.object({
  offset: z.coerce.number().nonnegative().optional().default(0).openapi({
    title: 'Offset',
    description: 'Number of exercises to skip for pagination',
    type: 'number',
    example: 0,
    default: 0
  }),
  limit: z.coerce.number().positive().max(100).optional().default(10).openapi({
    title: 'Limit',
    description: 'Maximum number of exercises to return (max 100)',
    maximum: 100,
    minimum: 1,
    type: 'number',
    example: 10,
    default: 10
  }),
  lang: z.enum(['en', 'es']).optional().default('en').openapi({
    title: 'Language',
    description: 'Response language (en=English, es=Spanish)',
    example: 'en'
  })
})

export const ListResponseSchema = z.object({
  success: z.literal(true).openapi({ example: true }),
  metadata: z.object({
    totalItems: z.number().openapi({ example: 1324 }),
    totalPages: z.number().openapi({ example: 133 }),
    currentPage: z.number().openapi({ example: 1 }),
    previousPage: z.string().nullable().openapi({ example: null }),
    nextPage: z.string().nullable().openapi({ example: '/api/v1/exercises?offset=10&limit=10' })
  }),
  data: z.array(ExerciseWithImagesSchema)
})

export const SingleExerciseResponseSchema = z.object({
  success: z.literal(true).openapi({ example: true }),
  data: ExerciseWithImagesSchema
})

export const CatalogResponseSchema = z.object({
  success: z.literal(true).openapi({ example: true }),
  data: z.array(z.string()).openapi({ example: ['back', 'cardio', 'chest', 'lower arms'] })
})

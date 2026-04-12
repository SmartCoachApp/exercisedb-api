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
  measurementType: z.enum(['reps', 'distance', 'time']).default('reps').openapi({
    example: 'reps',
    description: 'How this exercise is measured: reps (repetitions + weight), distance (meters), or time (seconds)'
  }),
  tags: z.array(z.string()).openapi({
    title: 'Tags',
    description: 'Classification tags for filtering and recommendation',
    example: ['compound', 'main-lift', 'full-gym', 'staple', 'strength']
  }),
  baselineEffectiveness: z.number().min(0).max(100).openapi({
    title: 'Baseline Effectiveness',
    description: 'Acceptance score (0-100): probability a typical user accepts this exercise without requesting a change',
    example: 85
  }),
  contraindicatedFor: z.array(z.string()).openapi({
    title: 'Contraindicated For',
    description: 'Injury keys this exercise is contraindicated for',
    example: ['knee', 'lower-back']
  }),
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

export const FilterQuerySchema = PaginationQuerySchema.extend({
  tags: z.string().optional().openapi({
    title: 'Tags',
    description: 'Comma-separated tags to filter by (AND logic). E.g. "compound,staple"',
    example: 'compound,staple'
  }),
  minEffectiveness: z.coerce.number().min(0).max(100).optional().openapi({
    title: 'Min Effectiveness',
    description: 'Minimum baseline effectiveness score (0-100)',
    example: 70
  }),
  maxEffectiveness: z.coerce.number().min(0).max(100).optional().openapi({
    title: 'Max Effectiveness',
    description: 'Maximum baseline effectiveness score (0-100)',
    example: 100
  }),
  excludeContraindicated: z.string().optional().openapi({
    title: 'Exclude Contraindicated',
    description: 'Comma-separated injury keys to exclude exercises for. E.g. "knee,lower-back"',
    example: 'knee,lower-back'
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

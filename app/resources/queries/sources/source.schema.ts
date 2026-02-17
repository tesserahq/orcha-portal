import { z } from 'zod/v4'

// ============================================================================
// API Schemas (for server-side validation / request payloads)
// ============================================================================

/**
 * Base source schema with common fields
 */
const baseSourceSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  identifier: z.string().optional(),
})

/**
 * Create source schema
 */
export const createSourceSchema = baseSourceSchema

/**
 * Update source schema (all fields optional)
 */
export const updateSourceSchema = baseSourceSchema.partial()

// ============================================================================
// Form Schema (for client-side validation)
// ============================================================================

export const sourceFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  identifier: z.string().optional(),
  description: z.string().optional(),
})

export type SourceFormValues = z.infer<typeof sourceFormSchema>

export const defaultSourceFormValues: SourceFormValues = {
  name: '',
  identifier: '',
  description: '',
}

// ============================================================================
// Inferred TypeScript types
// ============================================================================

export type CreateSourceInput = z.infer<typeof createSourceSchema>
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>

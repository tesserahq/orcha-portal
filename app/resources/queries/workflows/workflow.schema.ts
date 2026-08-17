import { z } from 'zod/v4'

// ============================================================================
// API Schemas (for server-side validation)
// ============================================================================

/**
 * Node property schema
 */
const nodePropertySchema = z.object({
  display_name: z.string(),
  name: z.string(),
  type: z.enum(['string', 'options', 'json']),
  default: z.string(),
  description: z.string(),
  options: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      })
    )
    .optional(),
})

/**
 * Workflow node input schema
 */
const nodeInputSchema = z.object({
  name: z.string(),
  description: z.string(),
  kind: z.string(),
  ui_settings: z.any(),
  parameters: z.any(),
  properties: z.array(nodePropertySchema),
})

/**
 * Base workflow schema with common fields
 */
const baseWorkflowSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  active_version_id: z.string().optional(),
  last_execution_time: z.string().optional(),
  execution_status: z.string().optional(),
  execution_status_message: z.string().optional(),
  nodes: z.array(nodeInputSchema).optional(),
})

/**
 * Create workflow schema
 */
export const createWorkflowSchema = baseWorkflowSchema

/**
 * Update workflow schema (all fields optional)
 */
export const updateWorkflowSchema = baseWorkflowSchema.partial()

// ============================================================================
// Form Schema (for client-side validation)
// ============================================================================

/**
 * Workflow form validation schema
 */
export const workflowFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(10000, 'Description must be less than 10000 characters'),
  is_active: z.boolean(),
  active_version_id: z.string().optional(),
  last_execution_time: z.string().optional(),
  execution_status: z.string().optional(),
  execution_status_message: z.string().optional(),
  nodes: z.array(nodeInputSchema).optional(),
})

export type WorkflowFormValues = z.infer<typeof workflowFormSchema>

/**
 * Default values for new workflow
 */
export const defaultWorkflowFormValues: WorkflowFormValues = {
  name: '',
  description: '',
  is_active: true,
  active_version_id: '',
  last_execution_time: '',
  execution_status: '',
  execution_status_message: '',
  nodes: [],
}

// ============================================================================
// Inferred TypeScript types
// ============================================================================

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>

// ============================================================================
// Execution Schemas
// ============================================================================

/**
 * Execute workflow schema
 */
export const executeWorkflowSchema = z.object({
  initial_data: z.record(z.string(), z.unknown()).optional(),
  manual: z.boolean(),
})

export type ExecuteWorkflowInput = z.infer<typeof executeWorkflowSchema>

/* eslint-disable @typescript-eslint/no-explicit-any */
import { IQueryConfig, IQueryParams } from '@/resources/queries'
import {
  createWorkflow,
  deleteWorkflow,
  executeWorkflow,
  getWorkflow,
  getWorkflowExecutionList,
  getWorkflows,
  updateWorkflow,
} from '@/resources/queries/workflows/workflow.queries'
import {
  CreateWorkflowInput,
  ExecuteWorkflowInput,
  UpdateWorkflowInput,
} from '@/resources/queries/workflows/workflow.schema'
import { WorkflowType } from '@/resources/queries/workflows/workflow.type'
import { WorkflowExecutionItem } from '@/resources/queries/workflows/workflow.type'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/**
 * Custom error class for query errors
 */
class QueryError extends Error {
  code?: string
  details?: unknown

  constructor(message: string, code?: string, details?: unknown) {
    super(message)
    this.name = 'QueryError'
    this.code = code
    this.details = details
  }
}

/**
 * Workflow query keys for React Query caching
 */
export const workflowQueryKeys = {
  all: ['workflows'] as const,
  lists: () => [...workflowQueryKeys.all, 'list'] as const,
  list: (params: IQueryParams) => [...workflowQueryKeys.lists(), params] as const,
  details: () => [...workflowQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...workflowQueryKeys.details(), id] as const,
  executions: () => [...workflowQueryKeys.all, 'executions'] as const,
  execution: (id: string) => [...workflowQueryKeys.executions(), id] as const,
}

/**
 * Hook for fetching workflows
 * @config - Workflow query configuration
 * @params - Workflow query parameters
 * @options - Workflow query options
 */
export function useWorkflows(
  config: IQueryConfig,
  params: IQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: workflowQueryKeys.list(params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getWorkflows(config, params)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  })
}

/**
 * Hook to fetch a single workflow by ID
 */
export function useWorkflow(
  config: IQueryConfig,
  id: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: workflowQueryKeys.detail(id),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getWorkflow(config, id)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false && !!id,
  })
}

/**
 * Hook to create a new workflow
 */
export function useCreateWorkflow(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: WorkflowType) => void
    onError?: (error: Error) => void
    showToast?: boolean
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateWorkflowInput) => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await createWorkflow(config, data)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.lists() })
      if (options?.showToast !== false) {
        toast.success('Workflow created successfully')
      }
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      if (options?.showToast !== false) {
        toast.error('Failed to create workflow', {
          description: error.message,
        })
      }
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to update an existing workflow
 */
export function useUpdateWorkflow(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: WorkflowType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWorkflowInput }) => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await updateWorkflow(config, id, data)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    onSuccess: (data) => {
      if (data.id) {
        queryClient.setQueryData(workflowQueryKeys.detail(data.id), data)
      }
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.lists() })
      toast.success('Workflow updated successfully')
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      toast.error('Failed to update workflow', {
        description: error.message,
      })
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to delete a workflow
 */
export function useDeleteWorkflow(
  config: IQueryConfig,
  options?: {
    onSuccess?: () => void
    onError?: (error: QueryError) => void
    showToast?: boolean
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await deleteWorkflow(config, id)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: workflowQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.lists() })
      if (options?.showToast !== false) {
        toast.success('Workflow deleted successfully')
      }
      options?.onSuccess?.()
    },
    onError: (error: Error) => {
      if (options?.showToast !== false) {
        toast.error('Failed to delete workflow', {
          description: error.message,
        })
      }
      options?.onError?.(error)
    },
  })
}

/**
 * Hook for list workflow executions
 */
export function useWorkflowExecutions(
  config: IQueryConfig,
  id: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: workflowQueryKeys.execution(id),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getWorkflowExecutionList(config, id)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false && !!id,
  })
}

/**
 * Hook for executing a workflow
 */
export function useExecuteWorkflow(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: WorkflowExecutionItem) => void
    onError?: (error: Error) => void
    showToast?: boolean
  }
) {
  const queryClient = useQueryClient()

  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useMutation({
    mutationFn: async (variables: { id: string; data: ExecuteWorkflowInput }) => {
      try {
        return await executeWorkflow(config, variables.id, variables.data)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    onSuccess: (data, variables) => {
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: workflowQueryKeys.execution(variables.id) })
      }
      if (options?.showToast !== false) {
        toast.success('Workflow execution started')
      }
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      if (options?.showToast !== false) {
        toast.error('Failed to execute workflow', {
          description: error.message,
        })
      }
      options?.onError?.(error)
    },
  })
}

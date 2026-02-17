/* eslint-disable @typescript-eslint/no-explicit-any */
import { IQueryConfig, IQueryParams } from '@/resources/queries'
import {
  createSource,
  deleteSource,
  getSource,
  getSources,
  updateSource,
} from '@/resources/queries/sources/source.queries'
import { CreateSourceInput, UpdateSourceInput } from '@/resources/queries/sources/source.schema'
import { SourceType } from '@/resources/queries/sources/source.type'
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
 * Source query keys for React Query caching
 */
export const sourceQueryKeys = {
  all: ['sources'] as const,
  lists: () => [...sourceQueryKeys.all, 'list'] as const,
  list: (params: IQueryParams) => [...sourceQueryKeys.lists(), params] as const,
  details: () => [...sourceQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...sourceQueryKeys.details(), id] as const,
}

/**
 * Hook for fetching sources
 * @config - Source query configuration
 * @params - Source query parameters
 * @options - Source query options
 */
export function useSources(
  config: IQueryConfig,
  params: IQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: sourceQueryKeys.list(params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getSources(config, params)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  })
}

/**
 * Hook to fetch a single source by ID
 */
export function useSource(
  config: IQueryConfig,
  id: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: sourceQueryKeys.detail(id),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getSource(config, id)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false && !!id,
  })
}

/**
 * Hook to create a new source
 */
export function useCreateSource(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: SourceType) => void
    onError?: (error: Error) => void
    showToast?: boolean
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSourceInput) => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await createSource(config, data)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: sourceQueryKeys.lists() })
      if (options?.showToast !== false) {
        toast.success('Source created successfully')
      }
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      if (options?.showToast !== false) {
        toast.error('Failed to create source', {
          description: error.message,
        })
      }
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to update an existing source
 */
export function useUpdateSource(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: SourceType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSourceInput }) => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await updateSource(config, id, data)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(sourceQueryKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: sourceQueryKeys.lists() })
      toast.success('Source updated successfully')
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      toast.error('Failed to update source', {
        description: error.message,
      })
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to delete a source
 */
export function useDeleteSource(
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

        return await deleteSource(config, id)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: sourceQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: sourceQueryKeys.lists() })
      if (options?.showToast !== false) {
        toast.success('Source deleted successfully')
      }
      options?.onSuccess?.()
    },
    onError: (error: Error) => {
      if (options?.showToast !== false) {
        toast.error('Failed to delete source', {
          description: error.message,
        })
      }
      options?.onError?.(error)
    },
  })
}

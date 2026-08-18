/* eslint-disable @typescript-eslint/no-explicit-any */
import { IQueryConfig } from '@/resources/queries'
import { getNodeCategories } from '@/resources/queries/nodes/node.queries'
import { useQuery } from '@tanstack/react-query'

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
 * Node query keys for React Query caching
 */
export const nodeQueryKeys = {
  all: ['nodes'] as const,
  categories: () => [...nodeQueryKeys.all, 'categories'] as const,
}

/**
 * Hook for fetching the node catalog (categories + property schema per node kind)
 */
export function useNodeCategories(
  config: IQueryConfig,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: nodeQueryKeys.categories(),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getNodeCategories(config)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    staleTime: options?.staleTime || 10 * 60 * 1000,
    enabled: options?.enabled !== false && !!config.token,
  })
}

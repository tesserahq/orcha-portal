/* eslint-disable @typescript-eslint/no-explicit-any */
import { IQueryConfig } from '@/resources/queries'
import {
  deleteEvent,
  EventListParams,
  getEvent,
  getEvents,
} from '@/resources/queries/events/event.queries'
import { EventType } from '@/resources/queries/events/event.type'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
 * Event query keys for React Query caching
 */
export const eventQueryKeys = {
  all: ['events'] as const,
  lists: () => [...eventQueryKeys.all, 'list'] as const,
  list: (params: EventListParams) => [...eventQueryKeys.lists(), params] as const,
  details: () => [...eventQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventQueryKeys.details(), id] as const,
}

/**
 * Hook for fetching events
 */
export function useEvents(
  config: IQueryConfig,
  params: EventListParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: eventQueryKeys.list(params),
    // Keep the current list visible while a new filter or page loads, so the
    // filter inputs stay mounted and keep focus.
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getEvents(config, params)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  })
}

/**
 * Hook to fetch a single event by ID
 */
export function useEvent(
  config: IQueryConfig,
  id: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: eventQueryKeys.detail(id),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getEvent(config, id)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false && !!id,
  })
}

/**
 * Hook to delete an event
 */
export function useDeleteEvent(
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

        return await deleteEvent(config, id)
      } catch (error: any) {
        throw new QueryError(error)
      }
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: eventQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: eventQueryKeys.lists() })
      if (options?.showToast !== false) {
        toast.success('Event deleted successfully')
      }
      options?.onSuccess?.()
    },
    onError: (error: Error) => {
      if (options?.showToast !== false) {
        toast.error('Failed to delete event', {
          description: error.message,
        })
      }
      options?.onError?.(error)
    },
  })
}

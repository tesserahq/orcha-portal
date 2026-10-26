/* eslint-disable @typescript-eslint/no-explicit-any */
import { type QueryKey, useQueries } from '@tanstack/react-query'
import { NodeENVType } from '@/libraries/fetch'
import { BreadcrumbItemData } from 'tessera-ui'
import { getEvent } from '@/resources/queries/events/event.queries'
import { IQueryConfig } from '@/resources/queries'
import { getSource } from '@/resources/queries/sources/source.queries'
import { generateBreadcrumbs } from '@/utils/helpers/breadcrumb'
import { queryKeys } from '@/modules/react-query'
import { eventQueryKeys } from '@/resources/hooks/events'
import { sourceQueryKeys } from '@/resources/hooks/sources'

/**
 * Resource state per breadcrumb
 */
export type BreadcrumbResourceState<T = any> = {
  data?: T
  isLoading: boolean
  error?: Error | null
}

/**
 * Breadcrumb hook config
 */
interface BreadcrumbConfigType {
  pathname: string
  params: Record<string, string | undefined>
  token: string
  apiUrl: string
  nodeEnv: NodeENVType
}

/**
 * Internal query config
 */
type BreadcrumbQueryConfig = {
  paramKey: string
  queryKey: QueryKey
  queryFn: () => Promise<any>
  enabled: boolean
  staleTime: number
}
/**
 * Fetcher registry (NO HOOKS)
 */
const breadcrumbFetchers = {
  eventID: {
    queryKey: eventQueryKeys.detail,
    fetch: (config: IQueryConfig, id: string) => getEvent(config, id),
  },
  source_id: {
    queryKey: sourceQueryKeys.detail,
    fetch: (config: IQueryConfig, id: string) => getSource(config, id),
  },
}

export default function useBreadcrumb(config: BreadcrumbConfigType): BreadcrumbItemData[] {
  const { pathname, params, apiUrl, nodeEnv, token } = config

  const pathParts = pathname.split('/').filter(Boolean)

  const queriesConfig = pathParts
    .map((part) => {
      const matched = Object.entries(params).find(([, value]) => value === part)

      if (!matched) return null

      const [paramKey] = matched
      const id = part
      const resolver = breadcrumbFetchers[paramKey as keyof typeof breadcrumbFetchers]

      if (!resolver) return null

      return {
        paramKey,
        queryKey: resolver.queryKey(id) as QueryKey,
        queryFn: () => resolver.fetch({ apiUrl, token, nodeEnv }, id),
        enabled: Boolean(token),
        staleTime: 5 * 60 * 1000,
      }
    })
    .filter((q): q is BreadcrumbQueryConfig => q !== null)

  const queryResults = useQueries({
    queries: queriesConfig.map(({ paramKey, ...q }) => q),
  })

  /**
   * Build resource map WITH loading state
   */
  const resourceData = queriesConfig.reduce<Record<string, BreadcrumbResourceState>>(
    (acc, config, index) => {
      const result = queryResults[index]

      acc[config.paramKey] = {
        data: result?.data,
        isLoading: result?.isFetching ?? false,
        error: result?.error as Error | null,
      }

      return acc
    },
    {}
  )

  return generateBreadcrumbs({
    pathname,
    params,
    resourceData,
  })
}

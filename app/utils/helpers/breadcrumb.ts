import { BreadcrumbItemData } from 'tessera-ui/layouts'
import { EventType } from '@/resources/queries/events/event.type'
import { SourceType } from '@/resources/queries/sources/source.type'

/**
 * Union type of all possible resource data types
 * Add more resource types here as you implement them
 */
export type BreadcrumbResourceData = EventType | SourceType

/**
 * Configuration for breadcrumb generation
 */
export interface GeneratingBreadcrumbConfig {
  pathname: string
  params: Record<string, string | undefined>
  resourceData?: Record<string, BreadcrumbResourceData | undefined>
}

/**
 * Generates breadcrumb items from pathname and resource data
 *
 * @param config - Breadcrumb configuration including pathname, params, and resource data
 * @returns Array of breadcrumb items
 *
 * @example
 * ```ts
 * const breadcrumbs = generateBreadcrumbs({
 *   pathname: '/accounts/123/people/456',
 *   params: { accountID: '123', personID: '456' },
 *   resourceData: {
 *     accountID: account,  // AccountType with 'name'
 *     personID: person,    // PersonType with 'first_name' and 'last_name'
 *   }
 * })
 * ```
 */
export function generateBreadcrumbs({
  pathname,
  params,
  resourceData,
}: {
  pathname: string
  params: Record<string, string | undefined>
  resourceData: Record<
    string,
    {
      data?: BreadcrumbResourceData
      isLoading: boolean
      error?: Error | null
    }
  >
}): BreadcrumbItemData[] {
  const parts = pathname.split('/').filter(Boolean)

  return parts.map((part, index) => {
    const matched = Object.entries(params).find(([, value]) => value === part)

    let label = formatPathPart(part)

    if (matched) {
      const [paramKey] = matched
      const resource = resourceData[paramKey]

      if (resource?.isLoading) {
        label = 'Loading…'
      } else if (resource?.error) {
        label = 'Unknown'
      } else {
        label = getResourceName(resource?.data)
      }
    }

    return {
      label,
      link: '/' + parts.slice(0, index + 1).join('/'),
    }
  })
}

/**
 * Formats a path part by replacing hyphens with spaces and capitalizing
 *
 * @param part - Path part to format
 * @returns Formatted string
 */
export function formatPathPart(part: string): string {
  return part
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Gets the resource name from resource data
 * Handles different naming conventions:
 * - AccountType: uses 'name'
 * - PersonType: combines 'first_name' and 'last_name'
 * - Add more resource types as needed
 *
 * @param resource - Resource data object
 * @returns Resource name or empty string
 */
export function getResourceName(resource: BreadcrumbResourceData | undefined): string {
  if (!resource) return ''

  // Event
  if ('event_type' in resource && resource.event_type) {
    return resource.event_type
  }

  // Source
  if ('name' in resource && resource.name) {
    return resource.name
  }

  // Fallback for other types
  return ''
}

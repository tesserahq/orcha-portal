import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { IQueryConfig, IQueryParams } from '..'
import { CreateSourceInput, UpdateSourceInput } from './source.schema'
import { SourceType } from './source.type'

const SOURCES_ENDPOINT = '/sources'

/**
 * Get all sources
 */
export async function getSources(
  config: IQueryConfig,
  params: IQueryParams
): Promise<IPaging<SourceType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size, q } = params

  const sources = await fetchApi(`${apiUrl}${SOURCES_ENDPOINT}`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
    params: { q },
  })

  return sources as IPaging<SourceType>
}

/**
 * Create a source
 */
export async function createSource(
  config: IQueryConfig,
  data: CreateSourceInput
): Promise<SourceType> {
  const { apiUrl, token, nodeEnv } = config

  const source = await fetchApi(`${apiUrl}${SOURCES_ENDPOINT}`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return source as SourceType
}

/**
 * Get a single source by ID
 */
export async function getSource(config: IQueryConfig, id: string): Promise<SourceType> {
  const { apiUrl, token, nodeEnv } = config

  const source = await fetchApi(`${apiUrl}${SOURCES_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'GET',
  })

  return source as SourceType
}

/**
 * Update a source by ID
 */
export async function updateSource(
  config: IQueryConfig,
  id: string,
  data: UpdateSourceInput
): Promise<SourceType> {
  const { apiUrl, token, nodeEnv } = config

  const source = await fetchApi(`${apiUrl}${SOURCES_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  return source as SourceType
}

/**
 * Delete a source by ID
 */
export async function deleteSource(config: IQueryConfig, id: string): Promise<void> {
  const { apiUrl, token, nodeEnv } = config

  await fetchApi(`${apiUrl}${SOURCES_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'DELETE',
  })
}


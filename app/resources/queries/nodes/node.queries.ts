import { fetchApi } from '@/libraries/fetch'
import { IWorkflowNodeCategory } from '@/types/workflow'
import { IQueryConfig } from '..'

const NODES_ENDPOINT = '/nodes'

/**
 * Get node categories (the node catalog, including each node kind's property schema)
 */
export async function getNodeCategories(
  config: IQueryConfig
): Promise<{ items: IWorkflowNodeCategory[] }> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${NODES_ENDPOINT}/categories`, token, nodeEnv, {
    method: 'GET',
  })

  return response as { items: IWorkflowNodeCategory[] }
}

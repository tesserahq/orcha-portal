import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { CreateWorkflowInput, ExecuteWorkflowInput, UpdateWorkflowInput } from './workflow.schema'
import { WorkflowExecutionItem, WorkflowType } from './workflow.type'
import { IQueryConfig, IQueryParams } from '..'

const WORKFLOWS_ENDPOINT = '/workflows'

/**
 * Get all workflows
 */
export async function getWorkflows(
  config: IQueryConfig,
  params: IQueryParams
): Promise<IPaging<WorkflowType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const workflows = await fetchApi(`${apiUrl}${WORKFLOWS_ENDPOINT}`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
  })

  return workflows as IPaging<WorkflowType>
}

/**
 * Create a workflow
 */
export async function createWorkflow(
  config: IQueryConfig,
  data: CreateWorkflowInput
): Promise<WorkflowType> {
  const { apiUrl, token, nodeEnv } = config

  const workflow = await fetchApi(`${apiUrl}${WORKFLOWS_ENDPOINT}`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return workflow as WorkflowType
}

/**
 * Get a single workflow by ID
 */
export async function getWorkflow(config: IQueryConfig, id: string): Promise<WorkflowType> {
  const { apiUrl, token, nodeEnv } = config

  const workflow = await fetchApi(`${apiUrl}${WORKFLOWS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'GET',
  })

  return workflow as WorkflowType
}

/**
 * Update a workflow by ID
 */
export async function updateWorkflow(
  config: IQueryConfig,
  id: string,
  data: UpdateWorkflowInput
): Promise<WorkflowType> {
  const { apiUrl, token, nodeEnv } = config

  const workflow = await fetchApi(`${apiUrl}${WORKFLOWS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  return workflow as WorkflowType
}

/**
 * Delete a workflow by ID
 */
export async function deleteWorkflow(config: IQueryConfig, id: string): Promise<void> {
  const { apiUrl, token, nodeEnv } = config

  await fetchApi(`${apiUrl}${WORKFLOWS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'DELETE',
  })
}

/**
 * List Workflow Executions
 */
export async function getWorkflowExecutionList(
  config: IQueryConfig,
  id: string
): Promise<IPaging<WorkflowExecutionItem>> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}${WORKFLOWS_ENDPOINT}/${id}/executions`,
    token,
    nodeEnv,
    {
      method: 'GET',
    }
  )

  return response as IPaging<WorkflowExecutionItem>
}

/**
 * Execute a workflow by ID
 */
export async function executeWorkflow(
  config: IQueryConfig,
  id: string,
  data: ExecuteWorkflowInput
): Promise<WorkflowExecutionItem> {
  const { apiUrl, token, nodeEnv } = config

  return await fetchApi(`${apiUrl}${WORKFLOWS_ENDPOINT}/${id}/execute`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

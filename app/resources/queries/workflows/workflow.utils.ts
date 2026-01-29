import { WorkflowFormValues } from './workflow.schema'
import { NodeInputType, WorkflowType } from './workflow.type'

type WorkflowPayload = Omit<WorkflowType, 'id' | 'created_at' | 'updated_at'> & {
  nodes?: NodeInputType[]
}

/**
 * Convert API data to form values
 */
export function workflowToFormValues(
  data: WorkflowType & { nodes?: NodeInputType[] }
): WorkflowFormValues {
  return {
    name: data.name,
    description: data.description,
    is_active: data.is_active,
    active_version_id: data.active_version_id ?? '',
    last_execution_time: data.last_execution_time ?? '',
    execution_status: data.execution_status ?? '',
    execution_status_message: data.execution_status_message ?? '',
    nodes: data.nodes ?? [],
  }
}

/**
 * Convert form values to workflow API data
 */
export function formValuesToWorkflowData(formValues: WorkflowFormValues): WorkflowPayload {
  return {
    name: formValues.name,
    description: formValues.description,
    is_active: formValues.is_active,
    active_version_id: formValues.active_version_id || undefined,
    last_execution_time: formValues.last_execution_time || undefined,
    execution_status: formValues.execution_status || undefined,
    execution_status_message: formValues.execution_status_message || undefined,
    nodes: formValues.nodes,
  }
}

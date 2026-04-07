/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IWorkflowCreator } from '@/types/workflow'

/**
 * For workflow list response
 */
export type WorkflowType = {
  id?: string
  name: string
  description: string
  is_active: boolean
  active_version_id?: string
  last_execution_time?: string
  execution_status?: string
  execution_status_message?: string
  created_at?: string
  updated_at?: string
  created_by?: IWorkflowCreator
  nodes?: NodeInputType[]
}

/**
 * For node categories
 */
export type NodeCategoryType = {
  key: string
  name: string
  description: string
  nodes?: NodeType[]
}

/**
 * For node childrens
 */
export type NodeType = {
  id: string
  display_name: string
  name: string
  icon: string
  group: string[]
  version: string
  subtitle: string
  description: string
  defaults: Record<string, unknown>
  inputs: []
  outputs: []
  requestDefaults: Record<string, unknown>
  properties: NodeProperty[]
  category: string
  icon_color: string
  credentials?: []
}

/**
 * For request body when create/update workflow
 */
export type NodeInputType = {
  name: string
  description: string
  kind: string
  ui_settings: any
  parameters: any
  properties: NodeProperty[]
}

interface IPropertyOption {
  name: string
  value: string
}

/**
 * For data when selecting node property
 */
export type NodeProperty = {
  display_name: string
  name: string
  type: 'string' | 'options' | 'json'
  default: string
  description: string
  options?: IPropertyOption[]
}

/**
 * Workflow execution
 */
export type WorkflowExecutionItem = {
  id: string
  workflow_id: string
  workflow_version_id: string
  status: string
  triggered_by: string
  started_at: string
  finished_at: string
  result: WorkflowExecutionResult
  error_message: string
  created_at: string
}

export type WorkflowExecutionResult = {
  status: string
  workflow_id: string
  node_results: any[]
  error_message: string
  trigger_event: any
}

export type WorkflowExecutionNodeResult = {
  input: any
  output: any
  node_id: string
  node_name: string
  node_kind: string
  status: string
  error_message: string
  timestamp: string
}

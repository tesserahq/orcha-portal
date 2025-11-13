/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IWorkflow {
  id?: string
  name: string
  description: string
  is_active: boolean
  active_version_id?: string
  created_at?: string
  updated_at?: string
  nodes?: INodeInput[]
}

export interface IWorkflowNode {
  id: string
  displayName: string
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
  properties: []
  category: string
  credentials?: []
}

export interface IWorkflowNodeCategory {
  key: string
  name: string
  description: string
  nodes?: IWorkflowNode[]
}

export interface INodeInput {
  name: string
  description: string
  kind: string
  settings: any
  ui_settings: any
}

// export interface IWorkflow {
//   name: string
//   description: string
//   is_active: boolean
//   active_version_id?: string
//   nodes?: INodeInput[]
//   id?: string
// }

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IWorkflowCreator {
  id: string
  email: string
  avatar_url: string | null
  first_name: string | null
  last_name: string | null
  provider: string | null
  confirmed_at: string | null
  verified: boolean
  verified_at: string | null
  service_account: boolean
  created_at: string
  updated_at: string
}

export interface IWorkflow {
  id?: string
  name: string
  description: string
  is_active: boolean
  active_version_id?: string
  created_at?: string
  updated_at?: string
  created_by?: IWorkflowCreator
  nodes?: INodeInput[]
}

export interface IWorkflowNode {
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
  properties: INodeProperty[]
  category: string
  icon_color: string
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
  ui_settings: any
  parameters: any
  properties: INodeProperty[]
}

interface IPropertyOption {
  name: string
  value: string
}

export interface INodeProperty {
  display_name: string
  name: string
  type: 'string' | 'options' | 'json'
  default: string
  description: string
  options?: IPropertyOption[]
}

// export interface IWorkflow {
//   name: string
//   description: string
//   is_active: boolean
//   active_version_id?: string
//   nodes?: INodeInput[]
//   id?: string
// }

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { formValuesToWorkflowData, workflowToFormValues } from './workflow.utils'
import type { WorkflowFormValues } from './workflow.schema'
import type { WorkflowType } from './workflow.type'

describe('workflow form conversions', () => {
  it('fills optional form fields and nodes for older API responses', () => {
    const values = workflowToFormValues({
      name: 'Daily sync',
      description: 'Sync records',
      is_active: true,
    })

    assert.deepEqual(values, {
      name: 'Daily sync',
      description: 'Sync records',
      is_active: true,
      active_version_id: '',
      last_execution_time: '',
      execution_status: '',
      execution_status_message: '',
      nodes: [],
    })
  })

  it('omits empty optional metadata from API payloads', () => {
    const values: WorkflowFormValues = {
      name: 'Daily sync',
      description: 'Sync records',
      is_active: true,
      active_version_id: '',
      last_execution_time: '',
      execution_status: '',
      execution_status_message: '',
      nodes: [],
    }

    assert.deepEqual(formValuesToWorkflowData(values), {
      name: 'Daily sync',
      description: 'Sync records',
      is_active: true,
      active_version_id: undefined,
      last_execution_time: undefined,
      execution_status: undefined,
      execution_status_message: undefined,
      nodes: [],
    })
  })

  it('round-trips workflow nodes without losing node configuration', () => {
    const workflow: WorkflowType = {
      name: 'Daily sync',
      description: 'Sync records',
      is_active: false,
      nodes: [
        {
          name: 'http-request',
          description: 'Fetch records',
          kind: 'action',
          ui_settings: { x: 12, y: 24 },
          parameters: { url: 'https://api.example.com' },
          properties: [],
        },
      ],
    }

    assert.deepEqual(workflowToFormValues(workflow).nodes, workflow.nodes)
  })
})

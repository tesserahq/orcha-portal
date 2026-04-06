/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'

import { AppPreloader } from '@/components/loader/pre-loader'
import ReactFlowCanvas from '@/components/react-flow/canvas'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi } from '@/libraries/fetch'
import { NodeInputType } from '@/resources/queries/workflows/workflow.type'
import { useWorkflow, useWorkflowExecutions } from '@/resources/hooks/workflows/use-workflows'
import { redirectWithToast } from '@/utils/toast.server'
import { ActionFunctionArgs } from 'react-router'
import { Link, useLoaderData, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function WorkflowExecution() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const params = useParams()
  const handleApiError = useHandleApiError()

  const config = {
    apiUrl: apiUrl!,
    token: token!,
    nodeEnv,
  }

  const {
    data: workflowData,
    isLoading: isLoadingWorkflow,
    error: errorWorkflow,
  } = useWorkflow(config, params.workflow_id!, { enabled: !!token && !!params.workflow_id })

  const {
    data: workflowExecutions,
    isLoading: isLoadingExecutions,
    error: errorExecutions,
  } = useWorkflowExecutions(config, params.workflow_id!, {
    enabled: !!token && !!params.workflow_id,
  })
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null)

  useEffect(() => {
    if (errorWorkflow) {
      handleApiError(errorWorkflow)
    }
  }, [errorWorkflow, handleApiError])

  useEffect(() => {
    if (errorExecutions) {
      handleApiError(errorExecutions)
    }
  }, [errorExecutions, handleApiError])

  const workflowNodes = workflowData?.nodes ?? []

  const edges =
    workflowNodes.flatMap((node: NodeInputType) => {
      const nodeEdges = Array.isArray(node?.ui_settings?.edges) ? node.ui_settings.edges : []

      if (nodeEdges.length > 0) {
        return nodeEdges
      }

      const sourceId = node?.ui_settings?.id ?? node?.name

      if (!sourceId) {
        return []
      }

      return [
        {
          id: 'add',
          source: sourceId,
          target: 'add',
        },
      ]
    }) ?? []

  const executionItems = workflowExecutions?.items ?? []
  const totalRuns = workflowExecutions?.total ?? 0
  const selectedExecution = useMemo(
    () => executionItems.find((execution) => execution.id === selectedExecutionId),
    [executionItems, selectedExecutionId]
  )
  const selectedExecutionNodeResult = useMemo(() => {
    const nodeResult =
      selectedExecution?.result?.node_results ?? selectedExecution?.result?.node_result
    return Array.isArray(nodeResult) ? nodeResult : []
  }, [selectedExecution])
  const mergedExecutionNodes = useMemo(() => {
    if (selectedExecutionNodeResult.length === 0) {
      return []
    }

    const workflowNodeMap = new Map<string, NodeInputType>()
    workflowNodes.forEach((node) => {
      const workflowNodeId = node?.ui_settings?.id
      if (workflowNodeId) {
        workflowNodeMap.set(workflowNodeId, node)
      }
      workflowNodeMap.set(node.name, node)
    })

    const nodesFromExecution = selectedExecutionNodeResult
      .map((nodeResultItem: any) => {
        const matchedNode =
          workflowNodeMap.get(nodeResultItem?.node_id) ??
          workflowNodeMap.get(nodeResultItem?.node_name)

        if (!matchedNode) {
          return null
        }

        return {
          ...matchedNode,
          name: nodeResultItem?.node_name || matchedNode.name,
          kind: nodeResultItem?.node_kind || matchedNode.kind,
        }
      })
      .filter(Boolean) as NodeInputType[]

    return nodesFromExecution
  }, [workflowNodes, selectedExecutionNodeResult])

  const executionEdges =
    mergedExecutionNodes?.flatMap((node: NodeInputType) => {
      const nodeEdges = Array.isArray(node?.ui_settings?.edges) ? node.ui_settings.edges : []

      if (nodeEdges.length > 0) {
        return nodeEdges
      }

      const sourceId = node?.ui_settings?.id ?? node?.name

      if (!sourceId) {
        return []
      }

      return [
        {
          id: 'add',
          source: sourceId,
          target: 'add',
        },
      ]
    }) ?? []

  useEffect(() => {
    if (executionItems.length === 0) {
      setSelectedExecutionId(null)
      return
    }

    const hasSelectedExecution = executionItems.some(
      (execution) => execution.id === selectedExecutionId
    )
    if (!hasSelectedExecution) {
      setSelectedExecutionId(executionItems[0].id)
    }
  }, [executionItems, selectedExecutionId])

  if (isLoadingWorkflow) return <AppPreloader />
  if (!workflowData) return null

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden"
      aria-label="Workflow executions view">
      <ReactFlowCanvas
        apiUrl={apiUrl!}
        nodeEnv={nodeEnv!}
        initialNodes={mergedExecutionNodes}
        initialEdges={selectedExecutionId ? executionEdges : edges}
        workflow={workflowData}
        isExecution
        executionHistory={{
          isLoadingExecutions,
          totalRuns,
          executionItems,
          selectedExecutionId,
          onSelectExecution: (executionId) => setSelectedExecutionId(executionId),
        }}
      />
    </div>
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV
  const formData = await request.formData()
  const { token, workflow, id } = Object.fromEntries(formData)

  try {
    const response = await fetchApi(`${apiUrl}/workflows/${id}`, token as string, nodeEnv, {
      method: 'PUT',
      body: workflow,
    })

    return Response.json({
      toast: {
        type: 'success' as const,
        title: 'Success',
        description: 'Workflow updated successfully',
      },
      response: { workflow: response },
    })
  } catch (error: any) {
    const convertError = JSON.parse(error?.message || '{}')

    return redirectWithToast(`/workflows/${id}`, {
      type: 'error',
      title: 'Error',
      description: `${convertError.status || 500} - ${
        convertError.error || 'Failed to create workflow'
      }`,
    })
  }
}

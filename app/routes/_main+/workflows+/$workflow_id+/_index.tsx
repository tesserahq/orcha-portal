/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'

import { AppPreloader } from '@/components/misc/AppPreloader'
import ReactFlowCanvas from '@/components/misc/ReactFlow/canvas'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi } from '@/libraries/fetch'
import { INodeInput, IWorkflow } from '@/types/workflow'
import { redirectWithToast } from '@/utils/toast.server'
import { ActionFunctionArgs } from '@remix-run/node'
import { useFetcher, useLoaderData, useParams } from '@remix-run/react'
import { handleFetcherData } from '@/utils/fetcher.data'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function WorkflowDetails() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const params = useParams()
  const fetcher = useFetcher()
  const handleApiError = useHandleApiError()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [workflow, setWorkflow] = useState<IWorkflow>()
  const [edges, setEdges] = useState([])

  const fetchWorkflowDetail = async () => {
    try {
      const response = await fetchApi(
        `${apiUrl}/workflows/${params.workflow_id}`,
        token!,
        nodeEnv,
      )

      // get edges from nodes api
      const edges = response.nodes.flatMap((node: INodeInput) => {
        const nodeEdges = Array.isArray(node?.ui_settings?.edges)
          ? node.ui_settings.edges
          : []

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
      })

      setEdges(edges)
      setWorkflow(response)
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (fetcher.data) {
      handleFetcherData(fetcher.data)
    }
  }, [fetcher.data])

  useEffect(() => {
    if (token) {
      fetchWorkflowDetail()
    }
  }, [token])

  if (isLoading) return <AppPreloader />

  return (
    <ReactFlowCanvas
      apiUrl={apiUrl!}
      nodeEnv={nodeEnv!}
      initialNodes={workflow?.nodes || []}
      initialEdges={edges}
      workflow={workflow}
      fetcher={fetcher}
    />
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV
  const formData = await request.formData()
  const { token, workflow, id } = Object.fromEntries(formData)

  try {
    const response = await fetchApi(
      `${apiUrl}/workflows/${id}`,
      token as string,
      nodeEnv,
      {
        method: 'PUT',
        body: workflow,
      },
    )

    return Response.json({
      toast: {
        type: 'success' as const,
        title: 'Success',
        description: 'Workflow updated successfully',
      },
      response: { workflow: response },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

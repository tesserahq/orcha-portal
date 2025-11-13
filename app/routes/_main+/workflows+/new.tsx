/* eslint-disable @typescript-eslint/no-explicit-any */
import ReactFlowCanvas from '@/components/misc/ReactFlow/canvas'
import { fetchApi } from '@/libraries/fetch'
import { redirectWithToast } from '@/utils/toast.server'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { ActionFunctionArgs } from '@remix-run/router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function NewWorkflow() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()

  return (
    <ReactFlowCanvas
      apiUrl={apiUrl!}
      nodeEnv={nodeEnv!}
      initialNodes={[]}
      initialEdges={[]}
      fetcher={fetcher}
    />
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV
  const formData = await request.formData()
  const { token, workflow } = Object.fromEntries(formData)

  try {
    const response = await fetchApi(`${apiUrl}/workflows`, token as string, nodeEnv, {
      method: 'POST',
      body: workflow,
    })

    return redirectWithToast(`/workflows/${response.id}`, {
      type: 'success',
      title: 'Success',
      description: 'Workflow created successfully',
    })
  } catch (error: any) {
    const convertError = JSON.parse(error?.message || '{}')

    return redirectWithToast('/workflows', {
      type: 'error',
      title: 'Error',
      description: `${convertError.status || 500} - ${
        convertError.error || 'Failed to delete workflow'
      }`,
    })
  }
}

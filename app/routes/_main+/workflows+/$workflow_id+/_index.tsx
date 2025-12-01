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
import { useBlocker, useFetcher, useLoaderData, useParams } from '@remix-run/react'
import { handleFetcherData } from '@/utils/fetcher.data'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

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
  const [showDialog, setShowDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return currentLocation.pathname !== nextLocation.pathname
  })

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

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowDialog(true)
      setPendingNavigation(() => () => {
        blocker.proceed()
        setShowDialog(false)
        setPendingNavigation(null)
      })
    }
  }, [blocker])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '' // required for Chrome
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const handleCancel = () => {
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
    setShowDialog(false)
    setPendingNavigation(null)
  }

  const handleConfirm = () => {
    if (pendingNavigation) {
      pendingNavigation()
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel()
    } else {
      setShowDialog(open)
    }
  }

  if (isLoading) return <AppPreloader />

  return (
    <>
      <ReactFlowCanvas
        apiUrl={apiUrl!}
        nodeEnv={nodeEnv!}
        initialNodes={workflow?.nodes || []}
        initialEdges={edges}
        workflow={workflow}
        fetcher={fetcher}
      />

      <Dialog open={showDialog} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-md border-t-4 border-t-destructive">
          <DialogHeader className="flex flex-col items-center">
            <div className="-mt-16 flex h-16 w-16 items-center justify-center rounded-full bg-destructive p-3 dark:bg-yellow-900">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="!mt-3 text-2xl font-semibold">
              Leave this page?
            </DialogTitle>
            <DialogDescription className="mt-2 text-center">
              You have unsaved changes. Are you sure you want to leave? Your changes will
              be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex w-full justify-center gap-2">
            <Button variant="outline" onClick={handleCancel} className="w-full">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} className="w-full">
              Leave Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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

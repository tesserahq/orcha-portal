/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react'

import { AppPreloader } from '@/components/loader/pre-loader'
import ReactFlowCanvas, { type ReactFlowCanvasHandle } from '@/components/react-flow/canvas'
import UnsavedChangesDialog from '@/components/workflows/unsaved-changes-dialog'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi } from '@/libraries/fetch'
import { INodeInput, IWorkflow } from '@/types/workflow'
import { redirectWithToast } from '@/utils/toast.server'
import { ActionFunctionArgs } from 'react-router'
import { useBlocker, useLoaderData, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function WorkflowDetails() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const params = useParams()
  const handleApiError = useHandleApiError()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [workflow, setWorkflow] = useState<IWorkflow>()
  const [edges, setEdges] = useState([])
  const [showDialog, setShowDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const canvasRef = useRef<ReactFlowCanvasHandle>(null)

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  })

  const fetchWorkflowDetail = async () => {
    try {
      const response = await fetchApi(`${apiUrl}/workflows/${params.workflow_id}`, token!, nodeEnv)

      // get edges from nodes api
      const edges = response.nodes.flatMap((node: INodeInput) => {
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
    if (!hasUnsavedChanges) {
      setShowDialog(false)
      setPendingNavigation(null)
      return
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '' // required for Chrome
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

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

  const handleSaveAndLeave = async () => {
    setIsSaving(true)
    try {
      const didSave = await canvasRef.current?.save({ shouldRedirect: false })
      if (didSave) {
        handleConfirm()
      }
    } finally {
      setIsSaving(false)
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
        ref={canvasRef}
        apiUrl={apiUrl!}
        nodeEnv={nodeEnv!}
        initialNodes={workflow?.nodes || []}
        initialEdges={edges}
        workflow={workflow}
        onDirtyChange={setHasUnsavedChanges}
      />

      <UnsavedChangesDialog
        open={showDialog}
        onOpenChange={handleDialogOpenChange}
        onLeaveWithoutSaving={handleConfirm}
        onSave={handleSaveAndLeave}
        isSaving={isSaving}
      />
    </>
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

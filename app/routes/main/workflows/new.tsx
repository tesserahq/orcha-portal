/* eslint-disable @typescript-eslint/no-explicit-any */
import ReactFlowCanvas, { type ReactFlowCanvasHandle } from '@/components/react-flow/canvas'
import UnsavedChangesDialog from '@/components/workflows/unsaved-changes-dialog'
import { fetchApi } from '@/libraries/fetch'
import { redirectWithToast } from '@/utils/toast.server'
import { useBlocker, useLoaderData } from 'react-router'
import { ActionFunctionArgs } from 'react-router'
import { useEffect, useRef, useState } from 'react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function NewWorkflow() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const [showDialog, setShowDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const canvasRef = useRef<ReactFlowCanvasHandle>(null)

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  })

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

  return (
    <>
      <ReactFlowCanvas
        ref={canvasRef}
        apiUrl={apiUrl!}
        nodeEnv={nodeEnv!}
        initialNodes={[]}
        initialEdges={[]}
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
  const { token, workflow, isExecution } = Object.fromEntries(formData)

  try {
    const response = await fetchApi(`${apiUrl}/workflows`, token as string, nodeEnv, {
      method: 'POST',
      body: workflow,
    })

    const redirectUrl =
      isExecution === 'true' ? `/workflows/${response.id}/executions` : `/workflows/${response.id}`

    return redirectWithToast(redirectUrl, {
      type: 'success',
      title: 'Success',
      description: 'Workflow created successfully',
    })
  } catch (error: any) {
    const convertError = JSON.parse(error?.message || '{}')

    return redirectWithToast('/workflows/new', {
      type: 'error',
      title: 'Error',
      description: `${convertError.status || 500} - ${
        convertError.error || 'Failed to delete workflow'
      }`,
    })
  }
}

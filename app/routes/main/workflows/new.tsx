/* eslint-disable @typescript-eslint/no-explicit-any */
import ReactFlowCanvas from '@/components/react-flow/canvas'
import { fetchApi } from '@/libraries/fetch'
import { redirectWithToast } from '@/utils/toast.server'
import { useBlocker, useFetcher, useLoaderData } from 'react-router'
import { ActionFunctionArgs } from 'react-router'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shadcn/ui/dialog'
import { Button } from '@shadcn/ui/button'
import { AlertTriangle } from 'lucide-react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function NewWorkflow() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const [showDialog, setShowDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return currentLocation.pathname !== nextLocation.pathname
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

  return (
    <>
      <ReactFlowCanvas
        apiUrl={apiUrl!}
        nodeEnv={nodeEnv!}
        initialNodes={[]}
        initialEdges={[]}
        fetcher={fetcher}
      />

      <Dialog open={showDialog} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-md border-t-4 border-t-destructive">
          <DialogHeader className="flex flex-col items-center">
            <div
              className="-mt-16 flex h-16 w-16 items-center justify-center rounded-full
                bg-destructive p-3 dark:bg-yellow-900">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="mt-3! text-2xl font-semibold">Leave this page?</DialogTitle>
            <DialogDescription className="mt-2 text-center">
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
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

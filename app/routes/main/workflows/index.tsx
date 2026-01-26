import EmptyContent from '@/components/empty-content/empty-content'
import { AppPreloader } from '@/components/loader/pre-loader'
import DeleteConfirmation from '@/components/misc/Dialog/DeleteConfirmation'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi, NodeENVType } from '@/libraries/fetch'
import { Card, CardContent } from '@/modules/shadcn/ui/card'
import { IPaging } from '@/resources/types'
import { IWorkflow } from '@/types/workflow'
import { handleFetcherData } from '@/utils/fetcher.data'
import { ensureCanonicalPagination } from '@/utils/pagination.server'
import { redirectWithToast } from '@/utils/toast.server'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { Edit, EllipsisVertical, EyeIcon, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  ActionFunctionArgs,
  Link,
  LoaderFunctionArgs,
  useFetcher,
  useLoaderData,
  useNavigate,
} from 'react-router'
import { DateTime, NewButton } from 'tessera-ui/components'

export function loader({ request }: LoaderFunctionArgs) {
  const canonical = ensureCanonicalPagination(request, {
    defaultSize: 25,
    defaultPage: 1,
  })

  if (canonical instanceof Response) return canonical

  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv, size: canonical.size, page: canonical.page }
}

export default function WorkflowsIndex() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData() as {
    apiUrl: string
    nodeEnv: NodeENVType
    size: number
    page: number
  }
  const { token, isLoading: appLoading } = useApp()
  const handleApiError = useHandleApiError()
  const navigate = useNavigate()
  const deleteFetcher = useFetcher()

  const [workflows, setWorkflows] = useState<IPaging<IWorkflow>>()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [firstLoading, setFirstLoading] = useState<boolean>(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [workflowToDelete, setWorkflowToDelete] = useState<IWorkflow | null>(null)

  const fetchWorkflows = useCallback(async () => {
    if (!token || !apiUrl) {
      setFirstLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = (await fetchApi(`${apiUrl}/workflows`, token, nodeEnv, {
        pagination: { page, size },
      })) as IPaging<IWorkflow>

      setWorkflows(response)
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
      setFirstLoading(false)
    }
  }, [token, apiUrl, nodeEnv, page, size, handleApiError])

  const handleDeleteClick = useCallback((workflow: IWorkflow) => {
    setWorkflowToDelete(workflow)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!token || !workflowToDelete) return

    deleteFetcher.submit(
      {
        workflowId: workflowToDelete?.id as string,
        token: token,
      },
      {
        method: 'POST',
      }
    )
  }, [deleteFetcher, token, workflowToDelete])

  useEffect(() => {
    if (token) {
      fetchWorkflows()
    }
  }, [token, fetchWorkflows])

  useEffect(() => {
    if (!deleteFetcher.data) return

    handleFetcherData(deleteFetcher.data, (responseData: { workflowId: string }) => {
      setWorkflows((previousData) => {
        if (!previousData) return previousData

        const updatedItems = previousData.items.filter(
          (workflowItem) => workflowItem.id !== responseData.workflowId
        )
        const updatedTotal = Math.max(previousData.total - 1, 0)
        const updatedPages =
          previousData.size > 0 ? Math.ceil(updatedTotal / previousData.size) : previousData.pages

        return {
          ...previousData,
          total: updatedTotal,
          pages: updatedPages,
          items: updatedItems,
        }
      })

      setDeleteDialogOpen(false)
      setWorkflowToDelete(null)
    })
  }, [deleteFetcher.data])

  if (appLoading || firstLoading) return <AppPreloader />

  return (
    <div className="animate-slide-up">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workflows</h1>
        {!isLoading && workflows?.items?.length !== 0 && (
          <NewButton label="New Source" onClick={() => navigate('/workflows/new')} />
        )}
      </div>

      {!isLoading && workflows?.items?.length === 0 && (
        <EmptyContent
          title="No workflows found"
          description="Workflows will appear here when they are created"
          image="/images/empty-workflows.png">
          <Button variant="black" onClick={() => navigate('/workflows/new')}>
            <span>New Workflow</span>
          </Button>
        </EmptyContent>
      )}

      {workflows?.items &&
        workflows?.items?.length > 0 &&
        workflows.items.map((workflow) => {
          return (
            <Card
              key={workflow.id}
              className="overflow-hidden rounded-lg bg-card text-card-foreground shadow-sm
                transition-shadow duration-200 mb-2.5 shadow-card">
              <CardContent className="flex items-center gap-2 p-4">
                <div className="flex-1">
                  <Link
                    to={`/workflows/${workflow.id}`}
                    className="mb-1 text-base font-medium text-black hover:text-primary
                      hover:underline dark:text-primary-foreground">
                    {workflow.name}
                  </Link>

                  <div
                    className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <span>Created</span>
                      <DateTime date={workflow.created_at!} />
                    </div>
                    {workflow.is_active && <Badge>Active</Badge>}
                  </div>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="icon" variant="ghost" className="px-0">
                      <EllipsisVertical size={18} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" side="right" className="w-40 p-1">
                    <Button
                      variant="ghost"
                      className="flex w-full justify-start gap-2"
                      onClick={() => navigate(`/workflows/${workflow.id}`)}>
                      <EyeIcon size={18} />
                      <span>View</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex w-full justify-start gap-2"
                      onClick={() => {
                        navigate(`/workflows/${workflow.id}/edit`)
                      }}>
                      <Edit size={18} />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex w-full justify-start gap-2 hover:bg-destructive
                        hover:text-destructive-foreground"
                      onClick={() => handleDeleteClick(workflow)}>
                      <Trash2 size={18} />
                      <span>Delete</span>
                    </Button>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          )
        })}

      <DeleteConfirmation
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Workflow"
        description={`This will remove "${workflowToDelete?.name ?? ''}" from your workflows. This action cannot be undone.`}
        onDelete={handleConfirmDelete}
        fetcher={deleteFetcher}
      />
    </div>
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV
  const formData = await request.formData()
  const { token, workflowId } = Object.fromEntries(formData)

  try {
    await fetchApi(`${apiUrl}/workflows/${workflowId}`, token as string, nodeEnv, {
      method: 'DELETE',
    })

    return Response.json({
      toast: {
        type: 'success' as const,
        title: 'Success',
        description: 'Workflow deleted successfully',
      },
      response: { workflowId },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

import { AppPreloader } from '@/components/misc/AppPreloader'
import CreateButton from '@/components/misc/CreateButton'
import { DataTable } from '@/components/misc/Datatable'
import DatePreview from '@/components/misc/DatePreview'
import DeleteConfirmation from '@/components/misc/Dialog/DeleteConfirmation'
import EmptyContent from '@/components/misc/EmptyContent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/types/pagination'
import { IWorkflow } from '@/types/workflow'
import { handleFetcherData } from '@/utils/fetcher.data'
import { ensureCanonicalPagination } from '@/utils/pagination.server'
import { redirectWithToast } from '@/utils/toast.server'
import { Link, useFetcher, useLoaderData, useNavigate } from '@remix-run/react'
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/router'
import type { ColumnDef } from '@tanstack/react-table'
import { Edit, Ellipsis, EyeIcon, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token, isLoading: appLoading } = useApp()
  const handleApiError = useHandleApiError()
  const navigate = useNavigate()
  const deleteFetcher = useFetcher<typeof action>()

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
        intent: 'delete',
        workflowId: workflowToDelete.id,
        token,
      },
      {
        method: 'POST',
      },
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
          (workflowItem) => workflowItem.id !== responseData.workflowId,
        )
        const updatedTotal = Math.max(previousData.total - 1, 0)
        const updatedPages =
          previousData.size > 0
            ? Math.ceil(updatedTotal / previousData.size)
            : previousData.pages

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

  const columns = useMemo<ColumnDef<IWorkflow>[]>(
    () => [
      {
        accessorKey: 'id',
        header: '',
        size: 5,
        cell: ({ row }) => {
          const { id } = row.original

          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="px-0">
                  <Ellipsis size={18} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" side="right" className="w-44 p-2">
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => navigate(`/workflows/${id}`)}>
                  <EyeIcon size={18} />
                  <span>View</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => {
                    navigate(`/workflows/${id}/edit`)
                  }}>
                  <Edit size={18} />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleDeleteClick(row.original)}>
                  <Trash2 size={18} />
                  <span>Delete</span>
                </Button>
              </PopoverContent>
            </Popover>
          )
        },
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 200,
        cell: ({ row }) => {
          return (
            <Link to={`/workflows/${row.original.id}`} className="button-link">
              {row.original.name}
            </Link>
          )
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 300,
        cell: ({ row }) => {
          return (
            <span className="text-sm text-muted-foreground">
              {row.original.description || '-'}
            </span>
          )
        },
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 120,
        cell: ({ row }) => {
          return (
            <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
              {row.original.is_active ? 'Active' : 'Inactive'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        size: 180,
        cell: ({ row }) => {
          const date = row.original.created_at
          return date && <DatePreview date={date + 'z'} label="Created" />
        },
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated At',
        size: 180,
        cell: ({ row }) => {
          const date = row.original.updated_at
          return date && <DatePreview date={date + 'z'} label="Updated" />
        },
      },
    ],
    [handleDeleteClick, navigate],
  )

  if (appLoading || firstLoading) return <AppPreloader />

  return (
    <div className="animate-slide-up">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-800 dark:text-navy-100">
          Workflows
        </h1>
        {!isLoading && workflows?.items?.length !== 0 && (
          <CreateButton label="New Source" onClick={() => navigate('/workflows/new')} />
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

      {workflows?.items && workflows?.items?.length > 0 && (
        <DataTable
          columns={columns}
          data={workflows?.items}
          meta={{
            page: workflows?.page || 1,
            size: workflows?.size || 25,
            total: workflows?.total || 0,
            pages: workflows?.pages || 1,
          }}
          isLoading={isLoading}
        />
      )}

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

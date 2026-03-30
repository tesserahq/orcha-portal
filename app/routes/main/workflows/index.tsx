import EmptyContent from '@/components/empty-content/empty-content'
import { Pagination } from '@/components/data-table/data-pagination'
import { AppPreloader } from '@/components/loader/pre-loader'
import { useApp } from '@/context/AppContext'
import { NodeENVType } from '@/libraries/fetch'
import { Card, CardContent } from '@/modules/shadcn/ui/card'
import { useDeleteWorkflow, useWorkflows } from '@/resources/hooks/workflows/use-workflows'
import { WorkflowType } from '@/resources/queries/workflows/workflow.type'
import { ensureCanonicalPagination } from '@/utils/pagination.server'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { Edit, EllipsisVertical, EyeIcon, Trash2 } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { Link, LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router'
import { DateTime, NewButton } from 'tessera-ui/components'
import DeleteConfirmation, {
  type DeleteConfirmationHandle,
} from 'tessera-ui/components/delete-confirmation'

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
  const { token } = useApp()
  const navigate = useNavigate()
  const deleteConfirmationRef = useRef<DeleteConfirmationHandle>(null)

  const config = {
    apiUrl: apiUrl!,
    token: token!,
    nodeEnv,
  }

  const { data, isLoading, error } = useWorkflows(config, { page, size }, { enabled: !!token })

  const { mutateAsync: deleteWorkflow } = useDeleteWorkflow(config, {
    onSuccess: () => {
      deleteConfirmationRef.current?.close()
    },
    onError: () => {
      deleteConfirmationRef.current?.updateConfig({ isLoading: false })
    },
  })

  const handleDeleteClick = (workflow: WorkflowType) => {
    deleteConfirmationRef.current?.open({
      title: 'Remove Workflow',
      description: `This will remove "${workflow.name}" from your workflows. This action cannot be undone.`,
      onDelete: async () => {
        deleteConfirmationRef.current?.updateConfig({ isLoading: true })
        await deleteWorkflow(workflow.id as string)
      },
    })
  }

  if (isLoading) return <AppPreloader />

  if (error) {
    return (
      <EmptyContent
        image="/images/empty-workflows.png"
        title="Failed to get workflows"
        description={error.message}
      />
    )
  }

  return (
    <div className="animate-slide-up page-content">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workflows</h1>
        {!isLoading && data?.items?.length !== 0 && (
          <NewButton label="New Source" onClick={() => navigate('/workflows/new')} />
        )}
      </div>

      {!isLoading && data?.items?.length === 0 && (
        <EmptyContent
          title="No workflows found"
          description="Workflows will appear here when they are created"
          image="/images/empty-workflows.png">
          <Button variant="black" onClick={() => navigate('/workflows/new')}>
            <span>New Workflow</span>
          </Button>
        </EmptyContent>
      )}

      {data?.items &&
        data?.items?.length > 0 &&
        data.items.map((workflow) => {
          return (
            <Card
              key={workflow.id}
              className="overflow-hidden rounded-lg bg-card text-card-foreground shadow-sm
                transition-shadow duration-200 mb-2.5 shadow-card">
              <CardContent className="flex min-w-0 items-center gap-2 p-4">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/workflows/${workflow.id}`}
                    title={workflow.name}
                    className="mb-1 block w-full truncate text-base font-medium text-black
                      hover:text-primary hover:underline dark:text-primary-foreground">
                    {workflow.name.length > 100
                      ? `${workflow.name.slice(0, 100)}...`
                      : workflow.name}
                  </Link>

                  <div
                    className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <span>Created</span>
                      <DateTime
                        date={workflow.created_at!}
                        tooltipSide="right"
                        tooltipAlign="center"
                      />
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

      {data?.items && data.items.length > 0 && (
        <div className="mt-6">
          <Pagination
            meta={{
              page: data.page,
              pages: data.pages,
              size: data.size,
              total: data.total,
            }}
          />
        </div>
      )}

      <DeleteConfirmation ref={deleteConfirmationRef} />
    </div>
  )
}

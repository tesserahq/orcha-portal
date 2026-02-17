import { AppPreloader } from '@/components/loader/pre-loader'
import NewButton from '@/components/new-button/new-button'
import { DataTable } from '@/components/data-table'
import DeleteConfirmation, {
  type DeleteConfirmationHandle,
} from '@/components/delete-confirmation/delete-confirmation'
import EmptyContent from '@/components/empty-content/empty-content'
import { Button } from '@shadcn/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { useApp } from '@/context/AppContext'
import { NodeENVType } from '@/libraries/fetch'
import { useDeleteSource, useSources } from '@/resources/hooks/sources/use-sources'
import { SourceType } from '@/resources/queries/sources/source.type'
import { ensureCanonicalPagination } from '@/utils/pagination.server'
import { LoaderFunctionArgs } from 'react-router'
import { Link, useLoaderData, useNavigate } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Edit, Ellipsis, EyeIcon, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useRef } from 'react'
import { DateTime } from '@/components/datetime'

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

export default function SourcesIndex() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData() as {
    apiUrl: string
    nodeEnv: NodeENVType
    size: number
    page: number
  }
  const { token, isLoading: appLoading } = useApp()
  const navigate = useNavigate()
  const deleteConfirmationRef = useRef<DeleteConfirmationHandle>(null)

  const config = {
    apiUrl: apiUrl!,
    token: token!,
    nodeEnv,
  }

  const { data, isLoading, error } = useSources(config, { page, size }, { enabled: !!token })

  const { mutateAsync: deleteSource } = useDeleteSource(config, {
    onSuccess: () => {
      deleteConfirmationRef.current?.close()
    },
    onError: () => {
      deleteConfirmationRef.current?.updateConfig({ isLoading: false })
    },
  })

  const handleDeleteClick = useCallback(
    (source: SourceType) => {
      deleteConfirmationRef.current?.open({
        title: 'Remove Source',
        description: `This will remove "${source.name}" from your sources. This action cannot be undone.`,
        onDelete: async () => {
          deleteConfirmationRef.current?.updateConfig({ isLoading: true })
          await deleteSource(source.id)
        },
      })
    },
    [deleteSource]
  )

  const columns = useMemo<ColumnDef<SourceType>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 200,
        cell: ({ row }) => {
          return (
            <Link to={`/sources/${row.original.id}`} className="button-link">
              <span className="text-sm font-medium">{row.original.name}</span>
            </Link>
          )
        },
      },
      {
        accessorKey: 'identifier',
        header: 'Identifier',
        size: 200,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 300,
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        size: 180,
        cell: ({ row }) => {
          const date = row.original.created_at
          return date && <DateTime date={date} />
        },
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated At',
        size: 180,
        cell: ({ row }) => {
          const date = row.original.updated_at
          return date && <DateTime date={date} />
        },
      },
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
              <PopoverContent align="start" side="right" className="w-40 p-1">
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => navigate(`/sources/${id}`)}>
                  <EyeIcon size={18} />
                  <span>View</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => {
                    navigate(`/sources/${id}/edit`)
                  }}>
                  <Edit size={18} />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2 hover:bg-destructive
                    hover:text-destructive-foreground"
                  onClick={() => handleDeleteClick(row.original)}>
                  <Trash2 size={18} />
                  <span>Delete</span>
                </Button>
              </PopoverContent>
            </Popover>
          )
        },
      },
    ],
    [handleDeleteClick, navigate]
  )

  if (appLoading || isLoading) return <AppPreloader />

  if (error) {
    return (
      <EmptyContent
        title="Failed to get sources"
        description={error.message}
        image="/images/empty-sources.png"
      />
    )
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sources</h1>
        {!isLoading && data?.items?.length !== 0 && (
          <NewButton label="New Source" onClick={() => navigate('new')} />
        )}
      </div>

      {!isLoading && data?.items?.length === 0 && (
        <EmptyContent
          title="No sources found"
          description="Create a new source to get started"
          image="/images/empty-sources.png">
          <Button variant="black" onClick={() => navigate('new')}>
            New Source
          </Button>
        </EmptyContent>
      )}

      {data?.items && data?.items?.length > 0 && (
        <DataTable
          columns={columns}
          data={data?.items}
          meta={{
            page: data?.page || 1,
            size: data?.size || 25,
            total: data?.total || 0,
            pages: data?.pages || 1,
          }}
          isLoading={isLoading}
        />
      )}

      <DeleteConfirmation ref={deleteConfirmationRef} />
    </div>
  )
}

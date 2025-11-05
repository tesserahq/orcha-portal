import { AppPreloader } from '@/components/misc/AppPreloader'
import CreateButton from '@/components/misc/CreateButton'
import { DataTable } from '@/components/misc/Datatable'
import DatePreview from '@/components/misc/DatePreview'
import DeleteConfirmation from '@/components/misc/Dialog/DeleteConfirmation'
import EmptyContent from '@/components/misc/EmptyContent'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/types/pagination'
import { ISource } from '@/types/source'
import { ensureCanonicalPagination } from '@/utils/pagination.server'
import { handleFetcherData } from '@/utils/fetcher.data'
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { Link, useFetcher, useLoaderData, useNavigate } from '@remix-run/react'
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

export default function SourcesIndex() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token, isLoading: appLoading } = useApp()
  const handleApiError = useHandleApiError()
  const navigate = useNavigate()
  const deleteFetcher = useFetcher<typeof action>()

  const [sources, setSources] = useState<IPaging<ISource>>()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [firstLoading, setFirstLoading] = useState<boolean>(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [sourceToDelete, setSourceToDelete] = useState<ISource | null>(null)

  const fetchSources = useCallback(async () => {
    if (!token || !apiUrl) {
      setFirstLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = (await fetchApi(`${apiUrl}/sources`, token, nodeEnv, {
        pagination: { page, size },
      })) as IPaging<ISource>

      setSources(response)
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
      setFirstLoading(false)
    }
  }, [token, apiUrl, nodeEnv, page, size, handleApiError])

  useEffect(() => {
    if (token) {
      fetchSources()
    }
  }, [token, fetchSources])

  useEffect(() => {
    if (deleteFetcher.data) {
      handleFetcherData(deleteFetcher.data, (responseData) => {
        setSources((prevData) => {
          if (!prevData) return prevData
          return {
            ...prevData,
            total: prevData.total - 1,
            pages: Math.ceil((prevData.total - 1) / prevData.size),
            items: prevData.items.filter((item) => item.id !== responseData.sourceId),
          }
        })

        setDeleteDialogOpen(false)
        setSourceToDelete(null)
      })
    }
  }, [deleteFetcher.data])

  const handleDeleteClick = useCallback((source: ISource) => {
    setSourceToDelete(source)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!token || !sourceToDelete) return

    deleteFetcher.submit(
      {
        intent: 'delete',
        sourceId: sourceToDelete.id,
        token,
      },
      {
        method: 'POST',
      },
    )
  }, [deleteFetcher, token, sourceToDelete])

  const columns = useMemo<ColumnDef<ISource>[]>(
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
          return <DatePreview date={date + 'z'} label="Created" />
        },
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated At',
        size: 180,
        cell: ({ row }) => {
          const date = row.original.updated_at
          return <DatePreview date={date + 'z'} label="Updated" />
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
          Sources
        </h1>
        {!isLoading && sources?.items?.length !== 0 && (
          <CreateButton label="New Source" onClick={() => navigate('new')} />
        )}
      </div>

      {!isLoading && sources?.items?.length === 0 && (
        <EmptyContent
          title="No sources found"
          description="Create a new source to get started"
          image="/images/empty-sources.png">
          <Button variant="black" onClick={() => navigate('new')}>
            New Source
          </Button>
        </EmptyContent>
      )}

      {sources?.items && sources?.items?.length > 0 && (
        <DataTable
          columns={columns}
          data={sources?.items}
          meta={{
            page: sources?.page || 1,
            size: sources?.size || 25,
            total: sources?.total || 0,
            pages: sources?.pages || 1,
          }}
          isLoading={isLoading}
        />
      )}

      <DeleteConfirmation
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Source"
        description={`This will remove "${sourceToDelete?.name}" from your sources, This action cannot be undone.`}
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
  const { token, sourceId, intent } = Object.fromEntries(formData)

  if (intent !== 'delete' || !sourceId) {
    return Response.json(
      {
        toast: {
          type: 'error' as const,
          title: 'Error',
          description: 'Invalid request',
        },
      },
      { status: 400 },
    )
  }

  try {
    await fetchApi(`${apiUrl}/sources/${sourceId}`, token as string, nodeEnv, {
      method: 'DELETE',
    })

    return Response.json({
      toast: {
        type: 'success' as const,
        title: 'Success',
        description: 'Source deleted successfully',
      },
      response: { sourceId },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const convertError = JSON.parse(error?.message || '{}')
    return Response.json({
      toast: {
        type: 'error' as const,
        title: 'Error',
        description: `${convertError.status || 500} - ${convertError.error || 'Failed to delete source'}`,
      },
    })
  }
}

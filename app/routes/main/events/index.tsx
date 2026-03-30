import { AppPreloader } from '@/components/loader/pre-loader'
import { DataTable } from '@/components/data-table'
import EmptyContent from '@/components/empty-content/empty-content'
import DialogPreviewJson from '@/components/json/preview'
import { Button } from '@shadcn/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { useApp } from '@/context/AppContext'
import DeleteConfirmation, {
  type DeleteConfirmationHandle,
} from '@/components/delete-confirmation/delete-confirmation'
import { NodeENVType } from '@/libraries/fetch'
import { useDeleteEvent, useEvents } from '@/resources/hooks/events/use-events'
import { EventType } from '@/resources/queries/events/event.type'
import { ensureCanonicalPagination } from '@/utils/pagination.server'
import { useLoaderData, useNavigate } from 'react-router'
import { LoaderFunctionArgs } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Ellipsis, EyeIcon, FileJson, Trash2 } from 'lucide-react'
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

export default function EventsIndex() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData() as {
    apiUrl: string
    nodeEnv: NodeENVType
    size: number
    page: number
  }
  const { token, isLoading: appLoading } = useApp()
  const navigate = useNavigate()
  const dialogRef = useRef<React.ElementRef<typeof DialogPreviewJson>>(null)
  const deleteConfirmationRef = useRef<DeleteConfirmationHandle>(null)

  const config = {
    apiUrl: apiUrl!,
    token: token!,
    nodeEnv,
  }

  const { data, isLoading, error } = useEvents(config, { page, size }, { enabled: !!token })

  const { mutateAsync: deleteEvent } = useDeleteEvent(config, {
    onSuccess: () => {
      deleteConfirmationRef.current?.close()
    },
    onError: () => {
      deleteConfirmationRef.current?.updateConfig({ isLoading: false })
    },
  })

  const handleDeleteClick = useCallback(
    (event: EventType) => {
      deleteConfirmationRef.current?.open({
        title: 'Remove Event',
        description: `This will remove this event. This action cannot be undone.`,
        onDelete: async () => {
          deleteConfirmationRef.current?.updateConfig({ isLoading: true })
          await deleteEvent(event.id)
        },
      })
    },
    [deleteEvent]
  )

  const columns = useMemo<ColumnDef<EventType>[]>(
    () => [
      {
        accessorKey: 'event_type',
        header: 'Event Type',
        size: 200,
        cell: ({ row }) => {
          return <span className="text-sm font-medium">{row.original.event_type}</span>
        },
      },
      {
        accessorKey: 'spec_version',
        header: 'Spec Version',
        size: 120,
      },
      {
        accessorKey: 'time',
        header: 'Event Time',
        size: 180,
        cell: ({ row }) => {
          const date = row.original.time
          return date && <DateTime date={date} />
        },
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
                  onClick={() => dialogRef.current?.onOpen(row.original.event_data)}>
                  <FileJson size={18} />
                  <span>View Data</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => navigate(`/events/${id}`)}>
                  <EyeIcon size={18} />
                  <span>View</span>
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
        title="Failed to get events"
        description={error.message}
        image="/images/empty-events.png"
      />
    )
  }

  return (
    <div className="animate-slide-up page-content">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Events</h1>
      </div>

      {!isLoading && data?.items?.length === 0 && (
        <EmptyContent
          title="No events found"
          description="Events will appear here when they are created"
          image="/images/empty-sources.png"
        />
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

      <DialogPreviewJson ref={dialogRef} title="Event Data" />
      <DeleteConfirmation ref={deleteConfirmationRef} />
    </div>
  )
}

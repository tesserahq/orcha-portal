import { AppPreloader } from '@/components/misc/AppPreloader'
import { DataTable } from '@/components/misc/Datatable'
import DatePreview from '@/components/misc/DatePreview'
import EmptyContent from '@/components/misc/EmptyContent'
import DialogPreviewJson from '@/components/misc/PreviewJson'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi } from '@/libraries/fetch'
import { IEvent } from '@/types/event'
import { IPaging } from '@/types/pagination'
import { ensureCanonicalPagination } from '@/utils/pagination.server'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { LoaderFunctionArgs } from '@remix-run/router'
import type { ColumnDef } from '@tanstack/react-table'
import { Edit, Ellipsis, EyeIcon, FileJson, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token, isLoading: appLoading } = useApp()
  const handleApiError = useHandleApiError()
  const navigate = useNavigate()
  const dialogRef = useRef<React.ElementRef<typeof DialogPreviewJson>>(null)

  const [events, setEvents] = useState<IPaging<IEvent>>()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [firstLoading, setFirstLoading] = useState<boolean>(true)

  const fetchEvents = useCallback(async () => {
    if (!token || !apiUrl) {
      setFirstLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = (await fetchApi(`${apiUrl}/events`, token, nodeEnv, {
        pagination: { page, size },
      })) as IPaging<IEvent>

      setEvents(response)
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
      setFirstLoading(false)
    }
  }, [token, apiUrl, nodeEnv, page, size, handleApiError])

  useEffect(() => {
    if (token) {
      fetchEvents()
    }
  }, [token, fetchEvents])

  const columns = useMemo<ColumnDef<IEvent>[]>(
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

          return date && <DatePreview date={date} />
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        size: 180,
        cell: ({ row }) => {
          const date = row.original.created_at
          return date && <DatePreview date={date} />
        },
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated At',
        size: 180,
        cell: ({ row }) => {
          const date = row.original.updated_at
          return date && <DatePreview date={date} />
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
                  disabled
                  className="hidden w-full justify-start gap-2"
                  onClick={() => navigate(`/sources/${id}`)}>
                  <EyeIcon size={18} />
                  <span>View</span>
                </Button>
                <Button
                  variant="ghost"
                  disabled
                  className="hidden w-full justify-start gap-2"
                  onClick={() => {
                    navigate(`/sources/${id}/edit`)
                  }}>
                  <Edit size={18} />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  disabled
                  className="hidden w-full justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => {}}>
                  <Trash2 size={18} />
                  <span>Delete</span>
                </Button>
              </PopoverContent>
            </Popover>
          )
        },
      },
    ],
    [],
  )

  if (appLoading || firstLoading) return <AppPreloader />

  return (
    <div className="animate-slide-up">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Events</h1>
      </div>

      {!isLoading && events?.items?.length === 0 && (
        <EmptyContent
          title="No events found"
          description="Events will appear here when they are created"
          image="/images/empty-sources.png"
        />
      )}

      {events?.items && events?.items?.length > 0 && (
        <DataTable
          columns={columns}
          data={events?.items}
          meta={{
            page: events?.page || 1,
            size: events?.size || 25,
            total: events?.total || 0,
            pages: events?.pages || 1,
          }}
          isLoading={isLoading}
        />
      )}

      <DialogPreviewJson ref={dialogRef} title="Event Data" />
    </div>
  )
}

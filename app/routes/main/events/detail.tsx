import { AppPreloader } from '@/components/loader/pre-loader'
import EmptyContent from '@/components/empty-content/empty-content'
import DialogPreviewJson from '@/components/json/preview'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardHeader } from '@shadcn/ui/card'
import { useApp } from '@/context/AppContext'
import { NodeENVType } from '@/libraries/fetch'
import { useEvent } from '@/resources/hooks/events/use-events'
import { useLoaderData, useNavigate, useParams } from 'react-router'
import { format } from 'date-fns'
import { FileJson, ArrowLeft } from 'lucide-react'
import { useRef } from 'react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function EventDetail() {
  const { apiUrl, nodeEnv } = useLoaderData() as { apiUrl: string; nodeEnv: NodeENVType }
  const { token, isLoading: appLoading } = useApp()
  const params = useParams()
  const navigate = useNavigate()
  const dialogRef = useRef<React.ElementRef<typeof DialogPreviewJson>>(null)

  const config = {
    apiUrl: apiUrl!,
    token: token!,
    nodeEnv,
  }

  const eventId = params.event_id as string
  const {
    data: event,
    isLoading,
    error,
  } = useEvent(config, eventId, {
    enabled: !!token && !!eventId,
  })

  if (appLoading || isLoading) return <AppPreloader />

  if (error) {
    return (
      <EmptyContent
        title="Failed to get event"
        description={error.message}
        image="/images/empty-sources.png"
      />
    )
  }

  if (!event) {
    return (
      <EmptyContent
        title="Event not found"
        description="Event not found"
        image="/images/empty-sources.png"
      />
    )
  }

  return (
    <div className="mx-auto h-full max-w-4xl animate-slide-up">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/events')}>
                <ArrowLeft size={16} /> Back
              </Button>
              <h1 className="text-xl font-bold lg:text-3xl">Event Details</h1>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => dialogRef.current?.onOpen(event.event_data)}>
              <FileJson size={16} /> View Data
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-6 pt-4">
          <div className="d-list">
            <div className="d-item">
              <dt className="d-label">Event Type</dt>
              <dd className="d-content">{event.event_type || 'N/A'}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Spec Version</dt>
              <dd className="d-content">{event.spec_version || 'N/A'}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Source</dt>
              <dd className="d-content">{event.source || 'N/A'}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Data Content Type</dt>
              <dd className="d-content">{event.data_content_type || 'N/A'}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Tags</dt>
              <dd className="d-content">
                {event.tags && event.tags.length > 0 ? event.tags.join(', ') : 'N/A'}
              </dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Privy</dt>
              <dd className="d-content">{String(event.privy)}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">User ID</dt>
              <dd className="d-content">{event.user_id || 'N/A'}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Event Time</dt>
              <dd className="d-content">{format(new Date(event.time + 'z'), 'PPPpp')}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Created At</dt>
              <dd className="d-content">{format(new Date(event.created_at + 'z'), 'PPPpp')}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Updated At</dt>
              <dd className="d-content">{format(new Date(event.updated_at + 'z'), 'PPPpp')}</dd>
            </div>
          </div>
        </CardContent>
      </Card>

      <DialogPreviewJson ref={dialogRef} title="Event Data" />
    </div>
  )
}

import { DetailContent } from '@/components/detail-content'
import EmptyContent from '@/components/empty-content/empty-content'
import { AppPreloader } from '@/components/loader/pre-loader'
import Markdown from '@/components/markdown/markdown'
import { useApp } from '@/context/AppContext'
import { Badge } from '@/modules/shadcn/ui/badge'
import { Button } from '@/modules/shadcn/ui/button'
import { useEvent } from '@/resources/hooks/events/use-events'
import { cn } from '@/utils/misc'
import { SquareArrowRight } from 'lucide-react'
import { useLoaderData, useNavigate } from 'react-router'
import { DateTime, ResourceID } from 'tessera-ui'

export async function loader({ params }: { params: { eventID: string } }) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV
  return { apiUrl, nodeEnv, id: params.eventID }
}

export default function Overview() {
  const { apiUrl, nodeEnv, id } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()

  const config = { apiUrl: apiUrl!, token: token!, nodeEnv: nodeEnv }
  const { data: event, isLoading, error } = useEvent(config, id)

  const name = event?.event_type || '-'

  if (isLoading || !token) {
    return <AppPreloader className="min-h-screen" />
  }

  if (!event || error) {
    return (
      <EmptyContent
        image="/images/no-data.svg"
        title="Event not found"
        description="We couldn't find the event you're looking for.">
        <Button variant="black" onClick={() => navigate('/events')}>
          Back to Events
        </Button>
      </EmptyContent>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <DetailContent title={name}>
        <div className="d-list">
          <div className="d-item">
            <dt className="d-label">Event ID</dt>
            <dd className="d-content">
              <ResourceID value={event.id || ''} />
            </dd>
          </div>
          <div className="d-item">
            <dt className="d-label">Event Type</dt>
            <dd className="d-content">{event.event_type || 'N/A'}</dd>
          </div>
          <div className="d-item">
            <dt className="d-label">Spec Version</dt>
            <dd className="d-content">{event.spec_version || 'N/A'}</dd>
          </div>
          <div className="d-item">
            <dt className="d-label">Subject</dt>
            <dd className="d-content">{event.subject || 'N/A'}</dd>
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
            <dt className="d-label">Privy</dt>
            <dd className="d-content">
              <Badge
                variant="outline"
                className={cn(
                  'border border-orange-500 text-orange-500',
                  event?.privy && 'border-primary text-primary'
                )}>
                {event?.privy ? 'Yes' : 'No'}
              </Badge>
            </dd>
          </div>
          <div className="d-item">
            <dt className="d-label">User ID</dt>
            <dd className="d-content">
              <ResourceID value={event.user_id || ''} />
            </dd>
          </div>
          <div className="d-item">
            <dt className="d-label">Event Time</dt>
            <dd className="d-content">
              <DateTime date={event.time} tooltipSide="top" />
            </dd>
          </div>
          <div className="d-item">
            <dt className="d-label">Created At</dt>
            <dd className="d-content">
              <DateTime date={event.created_at} tooltipSide="top" />
            </dd>
          </div>
          <div className="d-item">
            <dt className="d-label">Updated At</dt>
            <dd className="d-content">
              <DateTime date={event.updated_at} tooltipSide="top" />
            </dd>
          </div>
          <div className="d-item">
            <dt className="d-label">Tags</dt>
            <dd className="d-content break-all mb-0">
              <Markdown>{`\`\`\`json\n${JSON.stringify(event.tags ?? [], null, 2)}\n\`\`\``}</Markdown>
            </dd>
          </div>
          <div className="d-item">
            <dt className="d-label">Labels</dt>
            <dd className="d-content break-all">
              <Markdown>{`\`\`\`json\n${JSON.stringify({ ...event.labels }, null, 2)}\n\`\`\``}</Markdown>
            </dd>
          </div>
        </div>
      </DetailContent>

      <DetailContent title="Event Data">
        <div className="">
          <Markdown>{`\`\`\`json\n${JSON.stringify({ ...event.event_data }, null, 2)}\n\`\`\``}</Markdown>
        </div>
      </DetailContent>
    </div>
  )
}

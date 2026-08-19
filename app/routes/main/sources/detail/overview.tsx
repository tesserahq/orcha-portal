import { DetailContent } from '@/components/detail-content'
import EmptyContent from '@/components/empty-content/empty-content'
import { AppPreloader } from '@/components/loader/pre-loader'
import { Button } from '@/modules/shadcn/ui/button'
import { useSource } from '@/resources/hooks/sources/use-sources'
import { Edit } from 'lucide-react'
import { useLoaderData, useNavigate } from 'react-router'
import { DateTime, ResourceID, useApp } from 'tessera-ui'

export async function loader({ params }: { params: { source_id: string } }) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv, id: params.source_id }
}

export default function Overview() {
  const { apiUrl, nodeEnv, id } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()

  const config = { apiUrl: apiUrl!, token: token!, nodeEnv }
  const {
    data: source,
    isLoading,
    error,
  } = useSource(config, id, {
    enabled: !!token && !!id,
  })

  const title = source?.name || 'Source Details'

  if (isLoading || !token) {
    return <AppPreloader className="min-h-screen" />
  }

  if (!source || error) {
    return (
      <EmptyContent
        image="/images/empty-sources.png"
        title="Source not found"
        description="We couldn't find the source you're looking for.">
        <Button variant="black" onClick={() => navigate('/sources')}>
          Back to Sources
        </Button>
      </EmptyContent>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <DetailContent
        title={title}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(`/sources/${id}/edit`)}>
            <Edit />
            Edit
          </Button>
        }>
        <div className="d-list">
          <div className="d-item">
            <dt className="d-label">Source ID</dt>
            <dd className="d-content">
              <ResourceID value={source.id || ''} />
            </dd>
          </div>
          <div className="d-item">
            <dt className="d-label">Name</dt>
            <dd className="d-content">{source.name || 'N/A'}</dd>
          </div>
          <div className="d-item">
            <dt className="d-label">Identifier</dt>
            <dd className="d-content">{source.identifier || 'N/A'}</dd>
          </div>
          <div className="d-item">
            <dt className="d-label">Description</dt>
            <dd className="d-content">{source.description || 'N/A'}</dd>
          </div>
          <div className="d-item">
            <dt className="d-label">Created At</dt>
            <dd className="d-content">
              <DateTime date={source.created_at} />
            </dd>
          </div>
          <div className="d-item">
            <dt className="d-label">Updated At</dt>
            <dd className="d-content">
              <DateTime date={source.updated_at} />
            </dd>
          </div>
        </div>
      </DetailContent>
    </div>
  )
}

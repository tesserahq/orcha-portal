import { AppPreloader } from '@/components/loader/pre-loader'
import EmptyContent from '@/components/empty-content/empty-content'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardHeader } from '@shadcn/ui/card'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi } from '@/libraries/fetch'
import { ISource } from '@/types/source'
import { useLoaderData, useNavigate, useParams } from 'react-router'
import { format } from 'date-fns'
import { Edit } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function SourceDetail() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token, isLoading: appLoading } = useApp()
  const handleApiError = useHandleApiError()
  const params = useParams()
  const navigate = useNavigate()

  const [source, setSource] = useState<ISource | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchData = useCallback(async () => {
    if (!token || !apiUrl) {
      setIsLoading(false)
      return
    }

    try {
      const source: ISource = await fetchApi(`${apiUrl}/sources/${params?.id}`, token, nodeEnv)
      setSource(source)
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }, [token, apiUrl, nodeEnv])

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token, fetchData])

  if (appLoading || isLoading) return <AppPreloader />

  if (!source)
    return (
      <EmptyContent
        title="Source not found"
        description="Source not found"
        image="/images/empty-sources.png"
      />
    )

  return (
    <div className="mx-auto h-full max-w-3xl animate-slide-up">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold lg:text-3xl">Source Details</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/sources/${params.id}/edit`)}>
              <Edit /> Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pt-4">
          <div className="d-list">
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
              <dd className="d-content">{format(new Date(source.created_at + 'z'), 'PPPpp')}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Updated At</dt>
              <dd className="d-content">{format(new Date(source.updated_at + 'z'), 'PPPpp')}</dd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useApp } from '@/context/AppContext'
import { sourceSchema } from '@/schemas/source'
import { useLoaderData, useNavigate, useNavigation } from 'react-router'
import { LoaderFunctionArgs } from 'react-router'
import { SourceForm } from '@/components/sources'
import { AppPreloader } from '@/components/loader/pre-loader'
import { NodeENVType } from '@/libraries/fetch'
import { useSource, useUpdateSource } from '@/resources/hooks/sources/use-sources'
import { z } from 'zod'

export function loader({ params }: LoaderFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv, id: params.id }
}

export default function SourcesEdit() {
  const { apiUrl, nodeEnv, id } = useLoaderData() as {
    apiUrl: string
    nodeEnv: NodeENVType
    id: string
  }
  const navigation = useNavigation()
  const navigate = useNavigate()
  const { token, isLoading: appLoading } = useApp()

  const config = {
    apiUrl: apiUrl!,
    token: token!,
    nodeEnv,
  }

  const { data: source, isLoading } = useSource(config, id, { enabled: !!token && !!id })

  const defaultValues: Partial<z.infer<typeof sourceSchema>> | null = source
    ? {
        name: source.name || '',
        identifier: source.identifier || '',
        description: source.description || '',
      }
    : null

  const { mutateAsync: updateSource, isPending } = useUpdateSource(config, {
    onSuccess: () => {
      navigate(`/sources/${id}`)
    },
  })

  const handleSubmit = async (values: z.infer<typeof sourceSchema>) => {
    await updateSource({
      id,
      data: {
        name: values.name,
        identifier: values.identifier || '',
        description: values.description || '',
      },
    })
  }

  const handleCancel = () => {
    navigate(`/sources/${id}`)
  }

  if (appLoading || isLoading || !defaultValues) return <AppPreloader />

  return (
    <SourceForm
      title="Edit Source"
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={navigation.state === 'submitting' || isPending}
      submitLabel="Update Source"
    />
  )
}

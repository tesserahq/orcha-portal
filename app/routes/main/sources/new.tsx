import { useApp } from '@/context/AppContext'
import { sourceSchema } from '@/schemas/source'
import { NodeENVType } from '@/libraries/fetch'
import { useCreateSource } from '@/resources/hooks/sources/use-sources'
import { LoaderFunctionArgs, useLoaderData, useNavigate, useNavigation } from 'react-router'
import { SourceForm } from '@/components/sources'
import { z } from 'zod'

export function loader({}: LoaderFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function SourcesNew() {
  const { apiUrl, nodeEnv } = useLoaderData() as { apiUrl: string; nodeEnv: NodeENVType }
  const navigation = useNavigation()
  const navigate = useNavigate()
  const { token } = useApp()
  const isSubmitting = navigation.state === 'submitting'

  const config = {
    apiUrl: apiUrl!,
    token: token!,
    nodeEnv,
  }

  const { mutateAsync: createSource, isPending } = useCreateSource(config, {
    onSuccess: () => {
      navigate('/sources')
    },
  })

  const handleSubmit = async (values: z.infer<typeof sourceSchema>) => {
    await createSource({
      name: values.name,
      identifier: values.identifier || '',
      description: values.description || '',
    })
  }

  const handleCancel = () => {
    navigate('/sources')
  }

  return (
    <SourceForm
      title="New Source"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting || isPending}
      submitLabel="Create Source"
    />
  )
}

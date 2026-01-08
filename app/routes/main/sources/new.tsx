import { useApp } from '@/context/AppContext'
import { fetchApi } from '@/libraries/fetch'
import { sourceSchema } from '@/schemas/source'
import { redirectWithToast } from '@/utils/toast.server'
import { useNavigate, useNavigation, useSubmit } from 'react-router'
import { ActionFunctionArgs } from 'react-router'
import { SourceForm } from '@/components/sources'
import { z } from 'zod'

export default function SourcesNew() {
  const navigation = useNavigation()
  const navigate = useNavigate()
  const submit = useSubmit()
  const { token } = useApp()
  const isSubmitting = navigation.state === 'submitting'

  const handleSubmit = (values: z.infer<typeof sourceSchema>) => {
    const formData = new FormData()
    formData.append('token', token!)
    formData.append('name', values.name)
    formData.append('identifier', values.identifier || '')
    if (values.description) {
      formData.append('description', values.description)
    }
    submit(formData, { method: 'POST' })
  }

  const handleCancel = () => {
    navigate('/sources')
  }

  return (
    <SourceForm
      title="New Source"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
      submitLabel="Create Source"
    />
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV
  const formData = await request.formData()
  const { token, name, identifier, description } = Object.fromEntries(formData)

  const validated = sourceSchema.safeParse({
    name,
    description,
    identifier,
  })

  if (!validated.success) {
    return Response.json({ errors: validated.error.flatten().fieldErrors })
  }

  try {
    await fetchApi(`${apiUrl}/sources`, token as string, nodeEnv, {
      method: 'POST',
      body: JSON.stringify(validated.data),
    })

    return redirectWithToast('/sources', {
      type: 'success',
      title: 'Success',
      description: 'Source created successfully',
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const convertError = JSON.parse(error?.message)

    return redirectWithToast('/contact-lists/new', {
      type: 'error',
      title: 'Error',
      description: `${convertError.status} - ${convertError.error}`,
    })
  }
}

import { useApp } from '@/context/AppContext'
import { fetchApi } from '@/libraries/fetch'
import { sourceSchema } from '@/schemas/source'
import { redirectWithToast } from '@/utils/toast.server'
import { useLoaderData, useNavigate, useNavigation, useSubmit } from 'react-router'
import { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { SourceForm } from '@/components/sources'
import { useCallback, useEffect, useState } from 'react'
import { AppPreloader } from '@/components/loader/pre-loader'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { ISource } from '@/types/source'
import { z } from 'zod'

export function loader({ params }: LoaderFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv, id: params.id }
}

export default function SourcesEdit() {
  const { apiUrl, nodeEnv, id } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const submit = useSubmit()
  const { token, isLoading: appLoading } = useApp()
  const handleApiError = useHandleApiError()
  const [defaultValues, setDefaultValues] = useState<Partial<z.infer<typeof sourceSchema>> | null>(
    null
  )
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchSource = useCallback(async () => {
    if (!token || !apiUrl || !id) {
      setIsLoading(false)
      return
    }

    try {
      const source: ISource = await fetchApi(`${apiUrl}/sources/${id}`, token, nodeEnv)
      setDefaultValues({
        name: source.name || '',
        identifier: source.identifier || '',
        description: source.description || '',
      })
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }, [token, apiUrl, nodeEnv, id, handleApiError])

  useEffect(() => {
    if (token) {
      fetchSource()
    }
  }, [token, fetchSource])

  const handleSubmit = (values: z.infer<typeof sourceSchema>) => {
    const formData = new FormData()
    formData.append('token', token!)
    formData.append('name', values.name)
    formData.append('identifier', values.identifier)
    if (values.description) {
      formData.append('description', values.description)
    }
    submit(formData, { method: 'POST' })
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
      isSubmitting={navigation.state === 'submitting'}
      submitLabel="Update Source"
    />
  )
}

export async function action({ request, params }: ActionFunctionArgs) {
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
    await fetchApi(`${apiUrl}/sources/${params.id}`, token as string, nodeEnv, {
      method: 'PUT',
      body: JSON.stringify(validated.data),
    })

    return redirectWithToast(`/sources/${params.id}`, {
      type: 'success',
      title: 'Success',
      description: 'Source updated successfully',
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const convertError = JSON.parse(error?.message)
    return redirectWithToast(`/sources/${params.id}/edit`, {
      type: 'error',
      title: 'Error',
      description: `${convertError.status} - ${convertError.error}`,
    })
  }
}

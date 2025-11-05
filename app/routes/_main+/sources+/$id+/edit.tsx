import { useApp } from '@/context/AppContext'
import { fetchApi } from '@/libraries/fetch'
import { sourceSchema } from '@/schemas/source'
import { formatString } from '@/utils/format-string'
import { redirectWithToast } from '@/utils/toast.server'
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
} from '@remix-run/react'
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/router'
import { FormField, FormWrapper } from 'core-ui'
import { useCallback, useEffect, useState } from 'react'
import { AppPreloader } from '@/components/misc/AppPreloader'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { ISource } from '@/types/source'

export function loader({ params }: LoaderFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv, id: params.id }
}

export default function SourcesEdit() {
  const { apiUrl, nodeEnv, id } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const { token, isLoading: appLoading } = useApp()
  const handleApiError = useHandleApiError()
  const [identifier, setIdentifier] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [errorFields, setErrorFields] = useState<any>()

  useEffect(() => {
    if (actionData?.errors) {
      setErrorFields(actionData.errors)
    }
  }, [actionData])

  const fetchSource = useCallback(async () => {
    if (!token || !apiUrl || !id) {
      setIsLoading(false)
      return
    }

    try {
      const source: ISource = await fetchApi(`${apiUrl}/sources/${id}`, token, nodeEnv)
      setName(source.name || '')
      setIdentifier(source.identifier || '')
      setDescription(source.description || '')
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

  if (appLoading || isLoading) return <AppPreloader />

  return (
    <FormWrapper
      title="Edit Source"
      method="POST"
      isSubmitting={navigation.state === 'submitting'}
      onCancel={() => navigate(`/sources/${id}`)}
      hiddenInputs={{
        token: token!,
      }}>
      <FormField
        required
        autoFocus
        label="Name"
        name="name"
        value={name}
        error={errorFields?.name}
        onChange={(value) => {
          const formattedIdentifier = formatString('kebab-case', value)
          setName(value)
          setIdentifier(formattedIdentifier)
          setErrorFields(null)
        }}
      />
      <FormField
        label="Identifier"
        name="identifier"
        value={identifier}
        onChange={(value) => {
          const formattedIdentifier = formatString('kebab-case', value)
          setIdentifier(formattedIdentifier)
        }}
      />
      <FormField
        label="Description"
        name="description"
        type="textarea"
        value={description}
        onChange={(value) => setDescription(value)}
      />
    </FormWrapper>
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

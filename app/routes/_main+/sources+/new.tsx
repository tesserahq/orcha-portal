import { useApp } from '@/context/AppContext'
import { fetchApi } from '@/libraries/fetch'
import { sourceSchema } from '@/schemas/source'
import { formatString } from '@/utils/format-string'
import { redirectWithToast } from '@/utils/toast.server'
import { useActionData, useNavigate, useNavigation } from '@remix-run/react'
import { ActionFunctionArgs } from '@remix-run/router'
import { FormField, FormWrapper } from 'core-ui'
import { useEffect, useState } from 'react'

export default function SourcesNew() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const { token } = useApp()
  const [identifier, setIdentifier] = useState<string>('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [errorFields, setErrorFields] = useState<any>()

  useEffect(() => {
    if (actionData?.errors) {
      setErrorFields(actionData.errors)
    }
  }, [actionData])

  return (
    <FormWrapper
      title="New Source"
      method="POST"
      isSubmitting={navigation.state === 'submitting'}
      onCancel={() => navigate('/sources')}
      hiddenInputs={{
        token: token!,
      }}>
      <FormField
        required
        autoFocus
        label="Name"
        name="name"
        error={errorFields?.name}
        onChange={(value) => {
          const identifier = formatString('kebab-case', value)
          setIdentifier(identifier)
          setErrorFields(null)
        }}
      />
      <FormField
        label="Identifier"
        name="identifier"
        value={identifier}
        onChange={(value) => {
          const identifier = formatString('kebab-case', value)
          setIdentifier(identifier)
        }}
      />
      <FormField label="Description" name="description" type="textarea" />
    </FormWrapper>
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

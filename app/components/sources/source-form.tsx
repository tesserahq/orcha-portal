import { sourceSchema } from '@/schemas/source'
import { formatString } from '@/utils/format-string'
import { Form, useFormContext } from '@/components/form'
import { FormLayout } from '@/components/form/form-layout'
import { Button } from '@shadcn/ui/button'
import { z } from 'zod'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

type SourceFormValues = z.infer<typeof sourceSchema>

interface SourceFormProps {
  title: string
  defaultValues?: Partial<SourceFormValues>
  onSubmit: (values: SourceFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
  submitLabel?: string
  cancelLabel?: string
}

const NameField = () => {
  const { form } = useFormContext()
  const nameValue = form.watch('name')

  useEffect(() => {
    if (nameValue) {
      const formattedIdentifier = formatString('kebab-case', nameValue)
      form.setValue('identifier', formattedIdentifier, { shouldValidate: false })
    }
  }, [nameValue, form])

  return <Form.Input field="name" label="Name" required autoFocus />
}

const IdentifierField = () => {
  const { form } = useFormContext()

  return (
    <Form.Input
      field="identifier"
      label="Identifier"
      onChange={(e) => {
        const formattedIdentifier = formatString('kebab-case', e.target.value)
        form.setValue('identifier', formattedIdentifier, { shouldValidate: false })
      }}
    />
  )
}

export const SourceForm = ({
  title,
  defaultValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
}: SourceFormProps) => {
  const hasDefaultValues = Boolean(defaultValues.name || defaultValues.identifier)
  const formKey = hasDefaultValues
    ? `edit-${defaultValues.identifier || defaultValues.name}`
    : 'create'

  return (
    <FormLayout title={title}>
      <Form
        key={formKey}
        schema={sourceSchema}
        defaultValues={{
          name: defaultValues.name || '',
          identifier: defaultValues.identifier || '',
          description: defaultValues.description || '',
        }}
        onSubmit={onSubmit}
        className="space-y-3">
        <NameField />
        <IdentifierField />
        <Form.Textarea field="description" label="Description" />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </Form>
    </FormLayout>
  )
}

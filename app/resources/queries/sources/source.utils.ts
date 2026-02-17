import { SourceFormValues } from './source.schema'
import { SourceType } from './source.type'

type SourcePayload = Omit<SourceType, 'id' | 'created_at' | 'updated_at'>

/**
 * Convert API data to form values
 */
export function sourceToFormValues(data: SourceType): SourceFormValues {
  return {
    name: data.name,
    identifier: data.identifier ?? '',
    description: data.description ?? '',
  }
}

/**
 * Convert form values to source API data
 */
export function formValuesToSourceData(formValues: SourceFormValues): SourcePayload {
  return {
    name: formValues.name,
    identifier: formValues.identifier || '',
    description: formValues.description || '',
  }
}

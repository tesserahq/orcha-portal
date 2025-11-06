export interface IEvent {
  id: string
  data: Record<string, unknown>
  event_type: string
  spec_version: string
  time: string
  source_id: string
  created_at: string
  updated_at: string
}

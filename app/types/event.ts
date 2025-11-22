export interface IEvent {
  id: string
  event_data: Record<string, unknown>
  event_type: string
  spec_version: string
  time: string
  source: string
  data_content_type: string
  tags: string[]
  privy: boolean
  user_id: string
  created_at: string
  updated_at: string
}

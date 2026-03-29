export interface FeedEvent {
  feed: string
  source_id: string
  title: string | null
  body: string | null
  lat: number
  lng: number
  severity: 'critical' | 'high' | 'moderate' | 'low'
  category: 'conflict' | 'fire' | 'seismic' | 'aircraft' | 'weather' | 'maritime'
  source_url: string | null
  metadata: Record<string, unknown>
  event_time: string // ISO 8601
}

export interface FeedAdapter {
  name: string
  pollIntervalSeconds: number
  fetch(): Promise<FeedEvent[]>
}

export interface StoredEvent extends FeedEvent {
  id: string
  ingested_at: string
}

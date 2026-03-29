import type { FeedAdapter, FeedEvent } from './types'
import { normalizeSeverity } from './severity'

// GDELT Event Database API
// Docs: https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/
// Returns recent events in article list format
const GDELT_URL =
  'https://api.gdeltproject.org/api/v2/events/events?query=&mode=artlist&maxrecords=250&format=json&timespan=60min'

interface GDELTArticle {
  url: string
  title: string
  seendate: string
  socialimage: string
  domain: string
  language: string
  sourcecountry: string
}

interface GDELTEvent {
  GlobalEventID: string
  ActionGeo_Lat: number | null
  ActionGeo_Long: number | null
  GoldsteinScale: number
  Actor1Name: string | null
  Actor2Name: string | null
  EventCode: string
  NumArticles: number
  DateAdded: string
  SourceURL: string
}

interface GDELTResponse {
  articles?: GDELTArticle[]
  events?: GDELTEvent[]
}

export const gdeltAdapter: FeedAdapter = {
  name: 'gdelt',
  pollIntervalSeconds: 900, // 15 minutes

  async fetch(): Promise<FeedEvent[]> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    try {
      const res = await fetch(GDELT_URL, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        next: { revalidate: 0 },
      })

      if (!res.ok) {
        throw new Error(`GDELT API returned ${res.status}: ${res.statusText}`)
      }

      const data: GDELTResponse = await res.json()

      if (!data.events || !Array.isArray(data.events)) {
        return []
      }

      return data.events
        .filter(
          (e) =>
            e.ActionGeo_Lat != null &&
            e.ActionGeo_Long != null &&
            !isNaN(e.ActionGeo_Lat) &&
            !isNaN(e.ActionGeo_Long)
        )
        .map((e) => ({
          feed: 'gdelt',
          source_id: String(e.GlobalEventID),
          title: [e.Actor1Name, e.Actor2Name].filter(Boolean).join(' — ') || `Event ${e.EventCode}`,
          body: `GDELT Event ${e.EventCode} (Goldstein ${e.GoldsteinScale})`,
          lat: e.ActionGeo_Lat!,
          lng: e.ActionGeo_Long!,
          severity: normalizeSeverity('gdelt', e.GoldsteinScale),
          category: 'conflict' as const,
          source_url: e.SourceURL || null,
          metadata: {
            goldsteinScale: e.GoldsteinScale,
            eventCode: e.EventCode,
            numArticles: e.NumArticles,
            actor1: e.Actor1Name,
            actor2: e.Actor2Name,
          },
          event_time: e.DateAdded
            ? new Date(
                e.DateAdded.replace(
                  /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
                  '$1-$2-$3T$4:$5:$6Z'
                )
              ).toISOString()
            : new Date().toISOString(),
        }))
    } finally {
      clearTimeout(timeout)
    }
  },
}

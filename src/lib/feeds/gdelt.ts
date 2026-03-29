import type { FeedAdapter, FeedEvent } from './types'

// Global Disaster Alert and Coordination System (GDACS)
// Replaces GDELT (which is unreliable). GDACS is run by the EU/UN.
// Returns earthquakes, tropical cyclones, floods, volcanoes, droughts, wildfires
// Free, no API key, GeoJSON format.
const GDACS_URL =
  'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH'

interface GDACSProperties {
  eventtype: string   // EQ, TC, FL, VO, DR, WF
  name: string
  alertlevel: string  // Green, Orange, Red
  alertscore: number
  episodealertlevel: string
  country: string
  fromdate: string
  todate: string
  url: { report: string }
}

interface GDACSFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]  // [lng, lat]
  }
  properties: GDACSProperties
}

interface GDACSResponse {
  type: 'FeatureCollection'
  features: GDACSFeature[]
}

const EVENT_NAMES: Record<string, string> = {
  EQ: 'Earthquake',
  TC: 'Tropical Cyclone',
  FL: 'Flood',
  VO: 'Volcano',
  DR: 'Drought',
  WF: 'Wildfire',
}

function alertToSeverity(alert: string): 'critical' | 'high' | 'moderate' | 'low' {
  switch (alert) {
    case 'Red': return 'critical'
    case 'Orange': return 'high'
    case 'Green': return 'moderate'
    default: return 'low'
  }
}

// Map GDACS event types to our categories
function eventTypeToCategory(type: string): 'conflict' | 'fire' | 'seismic' | 'weather' {
  switch (type) {
    case 'EQ': return 'seismic'
    case 'VO': return 'seismic'
    case 'WF': return 'fire'
    case 'TC': return 'weather'
    case 'FL': return 'weather'
    case 'DR': return 'weather'
    default: return 'conflict'
  }
}

export const gdeltAdapter: FeedAdapter = {
  name: 'gdelt', // Keep the name for backward compat with feed_state
  pollIntervalSeconds: 900,

  async fetch(): Promise<FeedEvent[]> {
    const toDate = new Date().toISOString().split('T')[0]
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const params = new URLSearchParams({
      eventlist: 'EQ,TC,FL,VO,DR,WF',
      fromDate,
      toDate,
      alertlevel: 'Green;Orange;Red',
    })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    try {
      const res = await fetch(`${GDACS_URL}?${params}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        next: { revalidate: 0 },
      })

      if (!res.ok) {
        throw new Error(`GDACS API returned ${res.status}: ${res.statusText}`)
      }

      const data: GDACSResponse = await res.json()

      if (!data.features || data.features.length === 0) {
        return []
      }

      return data.features
        .filter((f) => f.geometry?.coordinates?.length === 2)
        .map((f) => {
          const p = f.properties
          const typeName = EVENT_NAMES[p.eventtype] || p.eventtype

          return {
            feed: 'gdelt',
            source_id: `gdacs-${p.eventtype}-${f.geometry.coordinates.join(',')}`,
            title: p.name || `${typeName} in ${p.country || 'Unknown'}`,
            body: `${typeName} | Alert: ${p.alertlevel} | ${p.country || ''}`,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            severity: alertToSeverity(p.alertlevel),
            category: eventTypeToCategory(p.eventtype),
            source_url: typeof p.url === 'object' ? p.url.report : null,
            metadata: {
              event_type: p.eventtype,
              event_type_name: typeName,
              alert_level: p.alertlevel,
              alert_score: p.alertscore,
              country: p.country,
              from_date: p.fromdate,
              to_date: p.todate,
            },
            event_time: p.fromdate
              ? new Date(p.fromdate).toISOString()
              : new Date().toISOString(),
          }
        })
    } finally {
      clearTimeout(timeout)
    }
  },
}

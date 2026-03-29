import type { FeedAdapter, FeedEvent } from './types'
import { mapNWSSeverity } from './severity'

// National Weather Service Alerts API
// Docs: https://www.weather.gov/documentation/services-web-api
const NWS_URL =
  'https://api.weather.gov/alerts/active?status=actual&message_type=alert'

const USER_AGENT = 'IcarusSituationMonitor/1.0 (contact@icarustechnologies.co.uk)'

interface NWSProperties {
  id: string
  areaDesc: string
  severity: string // 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown'
  certainty: string
  urgency: string
  event: string
  headline: string | null
  description: string | null
  instruction: string | null
  effective: string
  expires: string
  senderName: string
}

interface NWSGeometry {
  type: string
  coordinates: number[] | number[][] | number[][][] | number[][][][]
}

interface NWSFeature {
  id: string
  type: 'Feature'
  properties: NWSProperties
  geometry: NWSGeometry | null
}

interface NWSResponse {
  type: 'FeatureCollection'
  features: NWSFeature[]
}

function computeCentroid(geometry: NWSGeometry): [number, number] | null {
  // Extract all coordinate pairs from the geometry
  const points: [number, number][] = []

  function extractPoints(coords: unknown): void {
    if (!Array.isArray(coords)) return
    if (
      coords.length >= 2 &&
      typeof coords[0] === 'number' &&
      typeof coords[1] === 'number'
    ) {
      points.push([coords[0] as number, coords[1] as number])
      return
    }
    for (const c of coords) {
      extractPoints(c)
    }
  }

  extractPoints(geometry.coordinates)

  if (points.length === 0) return null

  const sumLng = points.reduce((s, p) => s + p[0], 0)
  const sumLat = points.reduce((s, p) => s + p[1], 0)

  return [sumLng / points.length, sumLat / points.length]
}

function getCoordinates(feature: NWSFeature): [number, number] | null {
  if (!feature.geometry) return null

  if (feature.geometry.type === 'Point') {
    const coords = feature.geometry.coordinates as number[]
    if (coords.length >= 2) return [coords[0], coords[1]]
    return null
  }

  // For Polygon and other geometry types, compute centroid
  return computeCentroid(feature.geometry)
}

export const nwsAdapter: FeedAdapter = {
  name: 'nws',
  pollIntervalSeconds: 300, // 5 minutes

  async fetch(): Promise<FeedEvent[]> {
    const res = await fetch(NWS_URL, {
      headers: {
        Accept: 'application/geo+json',
        'User-Agent': USER_AGENT,
      },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      throw new Error(`NWS API returned ${res.status}: ${res.statusText}`)
    }

    const data: NWSResponse = await res.json()

    const events: FeedEvent[] = []

    for (const f of data.features) {
      const coords = getCoordinates(f)
      if (!coords) continue

      const [lng, lat] = coords

      events.push({
        feed: 'nws',
        source_id: f.properties.id,
        title: f.properties.headline || f.properties.event,
        body: f.properties.description?.slice(0, 500) || null,
        lat,
        lng,
        severity: mapNWSSeverity(f.properties.severity),
        category: 'weather' as const,
        source_url: `https://alerts.weather.gov/search?id=${encodeURIComponent(f.properties.id)}`,
        metadata: {
          event: f.properties.event,
          severity: f.properties.severity,
          certainty: f.properties.certainty,
          urgency: f.properties.urgency,
          areaDesc: f.properties.areaDesc,
          senderName: f.properties.senderName,
          expires: f.properties.expires,
          instruction: f.properties.instruction,
        },
        event_time: new Date(f.properties.effective).toISOString(),
      })
    }

    return events
  },
}

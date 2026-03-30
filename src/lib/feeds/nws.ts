import type { FeedAdapter, FeedEvent } from './types'
import { mapNWSSeverity } from './severity'

// National Weather Service Alerts API
const NWS_URL =
  'https://api.weather.gov/alerts/active?status=actual&message_type=alert'

const USER_AGENT = 'IcarusSituationMonitor/1.0 (contact@icarustechnologies.co.uk)'

interface NWSProperties {
  id: string
  areaDesc: string
  severity: string
  certainty: string
  urgency: string
  event: string
  headline: string | null
  description: string | null
  instruction: string | null
  effective: string
  expires: string
  senderName: string
  affectedZones: string[]
}

interface NWSFeature {
  id: string
  type: 'Feature'
  properties: NWSProperties
  geometry: { type: string; coordinates: number[] | number[][][] } | null
}

interface NWSResponse {
  type: 'FeatureCollection'
  features: NWSFeature[]
}

// Resolve a zone URL to a centroid [lng, lat]
async function resolveZone(zoneUrl: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(zoneUrl, {
      headers: { Accept: 'application/geo+json', 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const geom = data.geometry
    if (!geom) return null

    // Extract all coordinate pairs and average them
    const points: [number, number][] = []
    const extractPts = (coords: unknown): void => {
      if (!Array.isArray(coords)) return
      if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        points.push([coords[0] as number, coords[1] as number])
        return
      }
      for (const c of coords) extractPts(c)
    }
    extractPts(geom.coordinates)
    if (points.length === 0) return null

    return [
      points.reduce((s, p) => s + p[0], 0) / points.length,
      points.reduce((s, p) => s + p[1], 0) / points.length,
    ]
  } catch {
    return null
  }
}

export const nwsAdapter: FeedAdapter = {
  name: 'nws',
  pollIntervalSeconds: 300,

  async fetch(): Promise<FeedEvent[]> {
    const res = await fetch(NWS_URL, {
      headers: { Accept: 'application/geo+json', 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      throw new Error(`NWS API returned ${res.status}: ${res.statusText}`)
    }

    const data: NWSResponse = await res.json()

    // Only process severe+ alerts to limit zone lookups
    const severeAlerts = data.features.filter(
      (f) => ['Extreme', 'Severe', 'Moderate'].includes(f.properties.severity)
    )

    // Resolve coordinates: use geometry if present, else look up first zone
    // Batch limit: resolve up to 30 zones per poll to stay within timeout
    const events: FeedEvent[] = []
    let zoneLookupsRemaining = 30

    for (const f of severeAlerts) {
      let lng: number | null = null
      let lat: number | null = null

      if (f.geometry) {
        // Has inline geometry
        if (f.geometry.type === 'Point') {
          const coords = f.geometry.coordinates as number[]
          lng = coords[0]; lat = coords[1]
        } else {
          // Polygon centroid
          const points: [number, number][] = []
          const extractCoords = (coords: unknown): void => {
            if (!Array.isArray(coords)) return
            if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
              points.push([coords[0] as number, coords[1] as number]); return
            }
            for (const c of coords) extractCoords(c)
          }
          extractCoords(f.geometry.coordinates)
          if (points.length > 0) {
            lng = points.reduce((s, p) => s + p[0], 0) / points.length
            lat = points.reduce((s, p) => s + p[1], 0) / points.length
          }
        }
      } else if (f.properties.affectedZones?.length > 0 && zoneLookupsRemaining > 0) {
        // Look up the first zone
        zoneLookupsRemaining--
        const coords = await resolveZone(f.properties.affectedZones[0])
        if (coords) { lng = coords[0]; lat = coords[1] }
      }

      if (lat === null || lng === null) continue

      events.push({
        feed: 'nws',
        source_id: f.properties.id,
        title: f.properties.headline || f.properties.event,
        body: f.properties.description?.slice(0, 500) || null,
        lat,
        lng,
        severity: mapNWSSeverity(f.properties.severity),
        category: 'weather' as const,
        source_url: null,
        metadata: {
          event: f.properties.event,
          severity: f.properties.severity,
          certainty: f.properties.certainty,
          urgency: f.properties.urgency,
          areaDesc: f.properties.areaDesc,
          senderName: f.properties.senderName,
          expires: f.properties.expires,
        },
        event_time: new Date(f.properties.effective).toISOString(),
      })
    }

    return events
  },
}

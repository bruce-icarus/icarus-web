import type { FeedAdapter, FeedEvent } from './types'
import { normalizeSeverity } from './severity'

// USGS Earthquake Hazards GeoJSON API
// Docs: https://earthquake.usgs.gov/fdsnws/event/1/
// Returns M2.5+ earthquakes from the last hour
const USGS_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson'

interface USGSFeature {
  id: string
  properties: {
    mag: number
    place: string
    time: number
    url: string
    title: string
    type: string
  }
  geometry: {
    coordinates: [number, number, number] // [lng, lat, depth]
  }
}

interface USGSResponse {
  type: 'FeatureCollection'
  features: USGSFeature[]
}

export const usgsAdapter: FeedAdapter = {
  name: 'usgs',
  pollIntervalSeconds: 300, // 5 minutes

  async fetch(): Promise<FeedEvent[]> {
    const res = await fetch(USGS_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      throw new Error(`USGS API returned ${res.status}: ${res.statusText}`)
    }

    const data: USGSResponse = await res.json()

    return data.features.map((f) => ({
      feed: 'usgs',
      source_id: f.id,
      title: f.properties.title,
      body: `${f.properties.type} - ${f.properties.place}`,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      severity: normalizeSeverity('usgs', f.properties.mag),
      category: 'seismic' as const,
      source_url: f.properties.url,
      metadata: {
        magnitude: f.properties.mag,
        depth_km: f.geometry.coordinates[2],
        place: f.properties.place,
        type: f.properties.type,
      },
      event_time: new Date(f.properties.time).toISOString(),
    }))
  },
}

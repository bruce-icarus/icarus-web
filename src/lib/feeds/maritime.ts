import type { FeedAdapter, FeedEvent } from './types'

// Finnish Transport Agency Digitraffic — Free AIS vessel tracking
// Docs: https://www.digitraffic.fi/en/marine/
// Returns all tracked vessels as GeoJSON. No API key required.
// Best coverage: Baltic Sea, North Sea, European waters. Some global coverage.
const DIGITRAFFIC_URL = 'https://meri.digitraffic.fi/api/ais/v1/locations'

interface DigitTrafficFeature {
  properties: {
    mmsi: number
    sog: number       // Speed over ground (knots)
    cog: number       // Course over ground (degrees)
    navStat: number   // Navigation status
    heading: number
    timestampExternal: number // Unix ms
  }
  geometry: {
    coordinates: [number, number] // [lng, lat]
  }
}

interface DigitTrafficResponse {
  type: 'FeatureCollection'
  features: DigitTrafficFeature[]
}

// Navigation status codes
const NAV_STATUS: Record<number, string> = {
  0: 'Under way using engine',
  1: 'At anchor',
  2: 'Not under command',
  3: 'Restricted manoeuvrability',
  4: 'Constrained by draught',
  5: 'Moored',
  6: 'Aground',
  7: 'Engaged in fishing',
  8: 'Under way sailing',
  14: 'AIS-SART',
  15: 'Not defined',
}

export const maritimeAdapter: FeedAdapter = {
  name: 'maritime',
  pollIntervalSeconds: 900, // 15 minutes

  async fetch(): Promise<FeedEvent[]> {
    const res = await fetch(DIGITRAFFIC_URL, {
      headers: { Accept: 'application/geo+json' },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      throw new Error(`Digitraffic API returned ${res.status}: ${res.statusText}`)
    }

    const data: DigitTrafficResponse = await res.json()

    if (!data.features || data.features.length === 0) {
      return []
    }

    // Filter: only moving vessels (SOG > 0.5 knots) to reduce noise
    const moving = data.features.filter(
      (f) => f.properties.sog > 0.5 && f.geometry.coordinates[0] !== 0
    )

    // Sample down to ~300 vessels for the map
    const sampleRate = Math.max(1, Math.floor(moving.length / 300))

    return moving
      .filter((_, i) => i % sampleRate === 0)
      .map((f) => {
        const mmsi = f.properties.mmsi
        const sog = f.properties.sog
        const navStatus = NAV_STATUS[f.properties.navStat] || 'Unknown'

        return {
          feed: 'maritime',
          source_id: `ais-${mmsi}-${Math.floor(Date.now() / 60000)}`, // Dedupe per minute
          title: `MMSI ${mmsi}`,
          body: `${navStatus}, ${sog.toFixed(1)} kn, heading ${f.properties.heading}°`,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          severity: 'low' as const,
          category: 'maritime' as const,
          source_url: `https://www.marinetraffic.com/en/ais/details/ships/mmsi:${mmsi}`,
          metadata: {
            mmsi,
            speed_knots: sog,
            course: f.properties.cog,
            heading: f.properties.heading,
            nav_status: navStatus,
            nav_status_code: f.properties.navStat,
          },
          event_time: new Date(f.properties.timestampExternal).toISOString(),
        }
      })
  },
}

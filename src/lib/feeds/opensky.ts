import type { FeedAdapter, FeedEvent } from './types'

// ADSB.lol — free, open ADS-B aggregator, no auth required
// Docs: https://api.adsb.lol
const ADSB_REGIONS = [
  'https://api.adsb.lol/v2/lat/52.5/lon/2/dist/500',    // UK + Western Europe
  'https://api.adsb.lol/v2/lat/28/lon/47/dist/500',      // Middle East
]

interface ADSBAircraft {
  hex: string        // ICAO24 hex code
  flight?: string    // Callsign
  lat?: number
  lon?: number
  alt_baro?: number | 'ground'
  gs?: number        // Ground speed (knots)
  track?: number     // Track/heading (degrees)
  category?: string
  t?: string         // Aircraft type
  r?: string         // Registration
  dbFlags?: number
}

interface ADSBResponse {
  ac: ADSBAircraft[] | null
  now: number
  total: number
}

export const openskyAdapter: FeedAdapter = {
  name: 'opensky',
  pollIntervalSeconds: 900, // 15 minutes

  async fetch(): Promise<FeedEvent[]> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    // Fetch all regions in parallel
    const results = await Promise.all(
      ADSB_REGIONS.map(async (url) => {
        try {
          const res = await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          })
          if (!res.ok) return null
          return res.json() as Promise<ADSBResponse>
        } catch {
          return null
        }
      })
    )
    clearTimeout(timeout)

    // Merge aircraft from all regions, dedup by hex
    const seen = new Set<string>()
    const allAircraft: ADSBAircraft[] = []
    let now = Date.now()

    for (const data of results) {
      if (!data?.ac) continue
      if (data.now) now = data.now
      for (const a of data.ac) {
        if (a.hex && !seen.has(a.hex)) {
          seen.add(a.hex)
          allAircraft.push(a)
        }
      }
    }

    if (allAircraft.length === 0) {
      return []
    }

    // Filter to airborne aircraft with valid positions
    const airborne = allAircraft.filter(
      (a) => a.lat != null && a.lon != null && a.alt_baro !== 'ground'
    )

    // Sample to keep marker count reasonable (~200 max)
    const sampleRate = Math.max(1, Math.floor(airborne.length / 200))

    return airborne
      .filter((_, i) => i % sampleRate === 0)
      .map((a) => {
        const icao24 = a.hex.trim().toLowerCase()
        const callsign = a.flight?.trim() || a.r || icao24.toUpperCase()
        const altitude = typeof a.alt_baro === 'number' ? Math.round(a.alt_baro * 0.3048) : null // ft → m
        const speedKnots = a.gs ?? null
        const speedKmh = speedKnots ? Math.round(speedKnots * 1.852) : null

        return {
          feed: 'opensky',
          source_id: `opensky-${icao24}`,
          title: callsign,
          body: altitude
            ? `Alt: ${altitude}m${speedKmh ? `, Speed: ${speedKmh}km/h` : ''}`
            : null,
          lat: a.lat!,
          lng: a.lon!,
          severity: 'low' as const,
          category: 'aircraft' as const,
          source_url: `https://globe.adsb.fi/?icao=${icao24}`,
          metadata: {
            icao24,
            callsign,
            altitude_m: altitude,
            velocity_ms: speedKnots ? speedKnots * 0.5144 : null,
            heading: a.track ?? 0,
            on_ground: false,
            type: a.t || null,
            registration: a.r || null,
          },
          event_time: new Date(now).toISOString(),
        }
      })
  },
}

import type { FeedAdapter, FeedEvent } from './types'

// OpenSky Network REST API — anonymous access
// Docs: https://openskynetwork.github.io/opensky-api/rest.html
// Returns all aircraft state vectors currently tracked
// Anonymous: 400 credits/day, 10s resolution
const OPENSKY_URL = 'https://opensky-network.org/api/states/all'

interface OpenSkyState {
  // [icao24, callsign, origin_country, time_position, last_contact,
  //  longitude, latitude, baro_altitude, on_ground, velocity,
  //  true_track, vertical_rate, sensors, geo_altitude, squawk,
  //  spi, position_source]
  [index: number]: string | number | boolean | null
}

interface OpenSkyResponse {
  time: number
  states: OpenSkyState[] | null
}

export const openskyAdapter: FeedAdapter = {
  name: 'opensky',
  pollIntervalSeconds: 900, // 15 minutes

  async fetch(): Promise<FeedEvent[]> {
    // Fetch a bounded region to limit data volume
    // Default: Europe + Middle East + North Africa (the "interesting" region for a demo)
    const params = new URLSearchParams({
      lamin: '10',   // South
      lamax: '65',   // North
      lomin: '-30',  // West
      lomax: '60',   // East
    })

    const res = await fetch(`${OPENSKY_URL}?${params}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      throw new Error(`OpenSky API returned ${res.status}: ${res.statusText}`)
    }

    const data: OpenSkyResponse = await res.json()

    if (!data.states || data.states.length === 0) {
      return []
    }

    // Sample: take every Nth aircraft to keep marker count reasonable (~200 max)
    const sampleRate = Math.max(1, Math.floor(data.states.length / 200))

    return data.states
      .filter((_, i) => i % sampleRate === 0)
      .filter((s) => s[6] !== null && s[5] !== null) // Must have lat/lng
      .map((s) => {
        const icao24 = String(s[0]).trim()
        const callsign = s[1] ? String(s[1]).trim() : icao24
        const originCountry = String(s[2] || 'Unknown')
        const lat = Number(s[6])
        const lng = Number(s[5])
        const altitude = s[7] !== null ? Number(s[7]) : null
        const velocity = s[9] !== null ? Number(s[9]) : null
        const heading = s[10] !== null ? Number(s[10]) : null
        const onGround = Boolean(s[8])

        return {
          feed: 'opensky',
          source_id: `opensky-${icao24}-${data.time}`,
          title: `${callsign} (${originCountry})`,
          body: onGround
            ? 'On ground'
            : altitude
              ? `Alt: ${Math.round(altitude)}m, Speed: ${velocity ? Math.round(velocity * 3.6) + 'km/h' : 'N/A'}`
              : null,
          lat,
          lng,
          severity: 'low' as const,
          category: 'aircraft' as const,
          source_url: `https://opensky-network.org/aircraft-profile?icao24=${icao24}`,
          metadata: {
            icao24,
            callsign,
            origin_country: originCountry,
            altitude_m: altitude,
            velocity_ms: velocity,
            heading,
            on_ground: onGround,
          },
          event_time: new Date(data.time * 1000).toISOString(),
        }
      })
  },
}

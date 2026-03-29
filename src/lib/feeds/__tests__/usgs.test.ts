import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usgsAdapter } from '../usgs'

const MOCK_USGS_RESPONSE = {
  type: 'FeatureCollection',
  features: [
    {
      id: 'us7000abc1',
      properties: {
        mag: 5.2,
        place: '10km NE of Ridgecrest, CA',
        time: 1711700000000,
        url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000abc1',
        title: 'M 5.2 - 10km NE of Ridgecrest, CA',
        type: 'earthquake',
      },
      geometry: {
        coordinates: [-117.6, 35.7, 10.5],
      },
    },
    {
      id: 'us7000abc2',
      properties: {
        mag: 2.8,
        place: '5km S of Pahala, Hawaii',
        time: 1711699000000,
        url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000abc2',
        title: 'M 2.8 - 5km S of Pahala, Hawaii',
        type: 'earthquake',
      },
      geometry: {
        coordinates: [-155.47, 19.17, 33.2],
      },
    },
  ],
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('usgsAdapter', () => {
  it('has correct name and poll interval', () => {
    expect(usgsAdapter.name).toBe('usgs')
    expect(usgsAdapter.pollIntervalSeconds).toBe(300)
  })

  it('fetches and transforms USGS GeoJSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_USGS_RESPONSE,
    } as Response)

    const events = await usgsAdapter.fetch()

    expect(events).toHaveLength(2)

    // First event: M5.2 critical
    expect(events[0]).toMatchObject({
      feed: 'usgs',
      source_id: 'us7000abc1',
      title: 'M 5.2 - 10km NE of Ridgecrest, CA',
      lat: 35.7,
      lng: -117.6,
      severity: 'critical',
      category: 'seismic',
    })
    expect(events[0].metadata).toMatchObject({
      magnitude: 5.2,
      depth_km: 10.5,
    })

    // Second event: M2.8 low
    expect(events[1]).toMatchObject({
      feed: 'usgs',
      source_id: 'us7000abc2',
      severity: 'low',
      category: 'seismic',
    })
  })

  it('throws on API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    } as Response)

    await expect(usgsAdapter.fetch()).rejects.toThrow('USGS API returned 503')
  })

  it('returns empty array when no features', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ type: 'FeatureCollection', features: [] }),
    } as Response)

    const events = await usgsAdapter.fetch()
    expect(events).toHaveLength(0)
  })
})

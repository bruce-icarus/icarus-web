'use client'

import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { StoredEvent } from '@/lib/feeds/types'

const STADIA_STYLE = `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${process.env.NEXT_PUBLIC_STADIA_API_KEY}`

const CATEGORY_COLORS: Record<string, string> = {
  conflict: '#ef4444',
  fire: '#f97316',
  seismic: '#eab308',
  aircraft: '#3b82f6',
  weather: '#14b8a6',
  maritime: '#8b5cf6',
}

const SEVERITY_RADIUS: Record<string, number> = {
  critical: 8,
  high: 6,
  moderate: 4,
  low: 3,
}

interface MapViewProps {
  events: StoredEvent[]
  activeFeeds: Set<string>
  onSelectEvent: (event: StoredEvent | null) => void
}

// Split events into aircraft (unclustered, plane icon) and others (clustered, circles)
function nonAircraftGeoJSON(events: StoredEvent[], activeFeeds: Set<string>) {
  return {
    type: 'FeatureCollection' as const,
    features: events
      .filter((e) => activeFeeds.has(e.category) && e.category !== 'aircraft')
      .map((e) => ({
        type: 'Feature' as const,
        id: e.id,
        geometry: {
          type: 'Point' as const,
          coordinates: [e.lng, e.lat],
        },
        properties: {
          id: e.id,
          category: e.category,
          severity: e.severity,
          title: e.title || '',
          feed: e.feed,
          color: CATEGORY_COLORS[e.category] || '#666',
          radius: SEVERITY_RADIUS[e.severity] || 3,
        },
      })),
  }
}

function aircraftGeoJSON(events: StoredEvent[], activeFeeds: Set<string>) {
  if (!activeFeeds.has('aircraft')) {
    return { type: 'FeatureCollection' as const, features: [] }
  }

  // Dedupe aircraft by icao24 — keep only the most recent position
  const latestByIcao = new Map<string, StoredEvent>()
  for (const e of events) {
    if (e.category !== 'aircraft') continue
    const icao = (e.metadata as Record<string, unknown>)?.icao24 as string
    if (!icao) continue
    const existing = latestByIcao.get(icao)
    if (!existing || e.event_time > existing.event_time) {
      latestByIcao.set(icao, e)
    }
  }

  return {
    type: 'FeatureCollection' as const,
    features: Array.from(latestByIcao.values()).map((e) => {
      const meta = e.metadata as Record<string, unknown>
      return {
        type: 'Feature' as const,
        id: e.id,
        geometry: {
          type: 'Point' as const,
          coordinates: [e.lng, e.lat],
        },
        properties: {
          id: e.id,
          category: 'aircraft',
          title: e.title || '',
          feed: e.feed,
          heading: (meta?.heading as number) ?? 0,
          icao24: (meta?.icao24 as string) ?? '',
          altitude: (meta?.altitude_m as number) ?? null,
          callsign: (meta?.callsign as string) ?? '',
        },
      }
    }),
  }
}

// Build track lines from historical positions per icao24
function aircraftTracksGeoJSON(events: StoredEvent[], activeFeeds: Set<string>) {
  if (!activeFeeds.has('aircraft')) {
    return { type: 'FeatureCollection' as const, features: [] }
  }

  const positionsByIcao = new Map<string, { lng: number; lat: number; time: string }[]>()
  for (const e of events) {
    if (e.category !== 'aircraft') continue
    const icao = (e.metadata as Record<string, unknown>)?.icao24 as string
    if (!icao) continue
    const list = positionsByIcao.get(icao) || []
    list.push({ lng: e.lng, lat: e.lat, time: e.event_time })
    positionsByIcao.set(icao, list)
  }

  return {
    type: 'FeatureCollection' as const,
    features: Array.from(positionsByIcao.entries())
      .filter(([, positions]) => positions.length >= 2)
      .map(([icao, positions]) => {
        // Sort by time ascending
        positions.sort((a, b) => a.time.localeCompare(b.time))
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: positions.map((p) => [p.lng, p.lat]),
          },
          properties: { icao24: icao },
        }
      }),
  }
}

// Create a plane icon as ImageData for MapLibre
function createPlaneIcon(): { width: number; height: number; data: Uint8Array } {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Draw plane shape pointing UP (north = 0°)
  ctx.translate(size / 2, size / 2)
  ctx.fillStyle = '#3b82f6'
  ctx.strokeStyle = '#1d4ed8'
  ctx.lineWidth = 0.5

  ctx.beginPath()
  // Fuselage
  ctx.moveTo(0, -12)   // Nose
  ctx.lineTo(3, -4)
  ctx.lineTo(3, 4)
  ctx.lineTo(1.5, 10)  // Tail
  ctx.lineTo(-1.5, 10)
  ctx.lineTo(-3, 4)
  ctx.lineTo(-3, -4)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Wings
  ctx.beginPath()
  ctx.moveTo(-11, 1)
  ctx.lineTo(-3, -2)
  ctx.lineTo(3, -2)
  ctx.lineTo(11, 1)
  ctx.lineTo(10, 3)
  ctx.lineTo(3, 0)
  ctx.lineTo(-3, 0)
  ctx.lineTo(-10, 3)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Tail wings
  ctx.beginPath()
  ctx.moveTo(-5, 9)
  ctx.lineTo(-1.5, 7)
  ctx.lineTo(1.5, 7)
  ctx.lineTo(5, 9)
  ctx.lineTo(4, 10.5)
  ctx.lineTo(1, 9)
  ctx.lineTo(-1, 9)
  ctx.lineTo(-4, 10.5)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  const imageData = ctx.getImageData(0, 0, size, size)
  return { width: size, height: size, data: new Uint8Array(imageData.data.buffer) }
}

export function MapView({ events, activeFeeds, onSelectEvent }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const eventsRef = useRef(events)
  const activeFeedsRef = useRef(activeFeeds)

  eventsRef.current = events
  activeFeedsRef.current = activeFeeds

  const updateSources = useCallback(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const eventsSrc = map.getSource('events') as maplibregl.GeoJSONSource
    if (eventsSrc) {
      eventsSrc.setData(nonAircraftGeoJSON(eventsRef.current, activeFeedsRef.current))
    }

    const aircraftSrc = map.getSource('aircraft') as maplibregl.GeoJSONSource
    if (aircraftSrc) {
      aircraftSrc.setData(aircraftGeoJSON(eventsRef.current, activeFeedsRef.current))
    }

    const tracksSrc = map.getSource('aircraft-tracks') as maplibregl.GeoJSONSource
    if (tracksSrc) {
      tracksSrc.setData(aircraftTracksGeoJSON(eventsRef.current, activeFeedsRef.current))
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: STADIA_STYLE,
        center: [20, 30],
        zoom: 2.5,
        attributionControl: false,
      })
    } catch (e) {
      console.warn('MapLibre failed to initialize:', e)
      if (containerRef.current) {
        containerRef.current.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:14px;">Map requires WebGL support</div>'
      }
      return
    }

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-left'
    )

    map.on('load', () => {
      // Add plane icon
      map.addImage('plane-icon', createPlaneIcon(), { sdf: false })

      // === NON-AIRCRAFT SOURCE (clustered circles) ===
      map.addSource('events', {
        type: 'geojson',
        data: nonAircraftGeoJSON(eventsRef.current, activeFeedsRef.current),
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 40,
      })

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'events',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#3b82f6',
          'circle-radius': ['step', ['get', 'point_count'], 12, 10, 16, 50, 22],
          'circle-opacity': 0.7,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(59, 130, 246, 0.3)',
        },
      })

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'events',
        filter: ['has', 'point_count'],
        layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 11 },
        paint: { 'text-color': '#ffffff' },
      })

      map.addLayer({
        id: 'event-circles',
        type: 'circle',
        source: 'events',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['get', 'radius'],
          'circle-opacity': 0.85,
          'circle-stroke-width': 1,
          'circle-stroke-color': [
            'case',
            ['==', ['get', 'severity'], 'critical'],
            ['get', 'color'],
            'transparent',
          ],
          'circle-stroke-opacity': 0.4,
        },
      })

      map.addLayer({
        id: 'event-pulse',
        type: 'circle',
        source: 'events',
        filter: [
          'all',
          ['!', ['has', 'point_count']],
          ['==', ['get', 'severity'], 'critical'],
        ],
        paint: {
          'circle-color': 'transparent',
          'circle-radius': 12,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-opacity': 0.3,
        },
      })

      // === AIRCRAFT TRACKS (lines) ===
      map.addSource('aircraft-tracks', {
        type: 'geojson',
        data: aircraftTracksGeoJSON(eventsRef.current, activeFeedsRef.current),
      })

      map.addLayer({
        id: 'aircraft-track-lines',
        type: 'line',
        source: 'aircraft-tracks',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 1.5,
          'line-opacity': 0.4,
          'line-dasharray': [2, 4],
        },
      })

      // === AIRCRAFT SOURCE (unclustered, plane icons) ===
      map.addSource('aircraft', {
        type: 'geojson',
        data: aircraftGeoJSON(eventsRef.current, activeFeedsRef.current),
      })

      map.addLayer({
        id: 'aircraft-icons',
        type: 'symbol',
        source: 'aircraft',
        layout: {
          'icon-image': 'plane-icon',
          'icon-size': 0.6,
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      })

      // === CLICK HANDLERS ===
      const clickableLayers = ['event-circles', 'aircraft-icons']

      for (const layer of clickableLayers) {
        map.on('click', layer, (e) => {
          if (!e.features?.[0]) return
          const props = e.features[0].properties
          const event = eventsRef.current.find((ev) => ev.id === props?.id)
          if (event) onSelectEvent(event)
        })

        map.on('mouseenter', layer, () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', layer, () => {
          map.getCanvas().style.cursor = ''
        })
      }

      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
        if (!features[0]) return
        const clusterId = features[0].properties?.cluster_id
        const source = map.getSource('events') as maplibregl.GeoJSONSource
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const coords = (features[0].geometry as GeoJSON.Point).coordinates
          map.easeTo({ center: [coords[0], coords[1]], zoom })
        })
      })
      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = ''
      })

      // Tooltip on hover
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'event-tooltip',
        offset: 12,
      })

      for (const layer of clickableLayers) {
        map.on('mouseenter', layer, (e) => {
          if (!e.features?.[0]) return
          const props = e.features[0].properties
          const coords = (e.features[0].geometry as GeoJSON.Point).coordinates
          popup
            .setLngLat([coords[0], coords[1]])
            .setHTML(
              `<div class="text-xs">
                <div class="font-medium text-white truncate max-w-[200px]">${props?.title || props?.callsign || 'Event'}</div>
                <div class="text-gray-400">${props?.feed?.toUpperCase() || props?.category?.toUpperCase()}</div>
              </div>`
            )
            .addTo(map)
        })

        map.on('mouseleave', layer, () => {
          popup.remove()
        })
      }

      // Click empty map to deselect
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [...clickableLayers, 'clusters'],
        })
        if (features.length === 0) {
          onSelectEvent(null)
        }
      })
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [onSelectEvent, updateSources])

  // Update sources when events or feeds change
  useEffect(() => {
    updateSources()
  }, [events, activeFeeds, updateSources])

  // Pulse animation
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    let animFrame: number
    let phase = 0

    const animate = () => {
      phase = (phase + 0.02) % 1
      const pulseRadius = 10 + Math.sin(phase * Math.PI * 2) * 4

      if (map.isStyleLoaded() && map.getLayer('event-pulse')) {
        map.setPaintProperty('event-pulse', 'circle-radius', pulseRadius)
        map.setPaintProperty(
          'event-pulse',
          'circle-stroke-opacity',
          0.15 + Math.sin(phase * Math.PI * 2) * 0.15
        )
      }

      animFrame = requestAnimationFrame(animate)
    }

    const timeout = setTimeout(() => {
      animFrame = requestAnimationFrame(animate)
    }, 2000)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(animFrame)
    }
  }, [])

  return <div ref={containerRef} className="h-full w-full" />
}

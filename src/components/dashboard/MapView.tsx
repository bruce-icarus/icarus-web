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

// Vehicle categories get icons + tracks, not circles
const VEHICLE_CATEGORIES = new Set(['aircraft', 'maritime'])

interface MapViewProps {
  events: StoredEvent[]
  activeFeeds: Set<string>
  onSelectEvent: (event: StoredEvent | null) => void
}

// Static events (non-vehicle): clustered circles
function staticEventsGeoJSON(events: StoredEvent[], activeFeeds: Set<string>) {
  return {
    type: 'FeatureCollection' as const,
    features: events
      .filter((e) => activeFeeds.has(e.category) && !VEHICLE_CATEGORIES.has(e.category))
      .map((e) => ({
        type: 'Feature' as const,
        id: e.id,
        geometry: { type: 'Point' as const, coordinates: [e.lng, e.lat] },
        properties: {
          id: e.id, category: e.category, severity: e.severity,
          title: e.title || '', feed: e.feed,
          color: CATEGORY_COLORS[e.category] || '#666',
          radius: SEVERITY_RADIUS[e.severity] || 3,
        },
      })),
  }
}

// Vehicle events: deduplicated by unique ID, latest position only, with heading
function vehicleGeoJSON(
  events: StoredEvent[],
  activeFeeds: Set<string>,
  category: string,
  idField: string,
) {
  if (!activeFeeds.has(category)) {
    return { type: 'FeatureCollection' as const, features: [] }
  }

  const latestById = new Map<string, StoredEvent>()
  for (const e of events) {
    if (e.category !== category) continue
    const vid = (e.metadata as Record<string, unknown>)?.[idField] as string | number
    if (vid === undefined || vid === null) continue
    const key = String(vid)
    const existing = latestById.get(key)
    if (!existing || e.event_time > existing.event_time) {
      latestById.set(key, e)
    }
  }

  return {
    type: 'FeatureCollection' as const,
    features: Array.from(latestById.values()).map((e) => {
      const meta = e.metadata as Record<string, unknown>
      return {
        type: 'Feature' as const,
        id: e.id,
        geometry: { type: 'Point' as const, coordinates: [e.lng, e.lat] },
        properties: {
          id: e.id, category, title: e.title || '', feed: e.feed,
          heading: (meta?.heading as number) ?? (meta?.course as number) ?? 0,
        },
      }
    }),
  }
}

// Track lines from historical positions
function vehicleTracksGeoJSON(
  events: StoredEvent[],
  activeFeeds: Set<string>,
  category: string,
  idField: string,
) {
  if (!activeFeeds.has(category)) {
    return { type: 'FeatureCollection' as const, features: [] }
  }

  const positionsById = new Map<string, { lng: number; lat: number; time: string }[]>()
  for (const e of events) {
    if (e.category !== category) continue
    const vid = (e.metadata as Record<string, unknown>)?.[idField] as string | number
    if (vid === undefined || vid === null) continue
    const key = String(vid)
    const list = positionsById.get(key) || []
    list.push({ lng: e.lng, lat: e.lat, time: e.event_time })
    positionsById.set(key, list)
  }

  return {
    type: 'FeatureCollection' as const,
    features: Array.from(positionsById.entries())
      .filter(([, pos]) => pos.length >= 2)
      .map(([vid, pos]) => {
        pos.sort((a, b) => a.time.localeCompare(b.time))
        return {
          type: 'Feature' as const,
          geometry: { type: 'LineString' as const, coordinates: pos.map((p) => [p.lng, p.lat]) },
          properties: { vehicleId: vid },
        }
      }),
  }
}

function createIcon(
  color: string, stroke: string,
  drawShape: (ctx: CanvasRenderingContext2D) => void,
): { width: number; height: number; data: Uint8Array } {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.translate(size / 2, size / 2)
  ctx.fillStyle = color
  ctx.strokeStyle = stroke
  ctx.lineWidth = 0.5
  drawShape(ctx)
  const imageData = ctx.getImageData(0, 0, size, size)
  return { width: size, height: size, data: new Uint8Array(imageData.data.buffer) }
}

function createPlaneIcon() {
  return createIcon('#3b82f6', '#1d4ed8', (ctx) => {
    // Fuselage
    ctx.beginPath()
    ctx.moveTo(0, -12); ctx.lineTo(3, -4); ctx.lineTo(3, 4)
    ctx.lineTo(1.5, 10); ctx.lineTo(-1.5, 10); ctx.lineTo(-3, 4); ctx.lineTo(-3, -4)
    ctx.closePath(); ctx.fill(); ctx.stroke()
    // Wings
    ctx.beginPath()
    ctx.moveTo(-11, 1); ctx.lineTo(-3, -2); ctx.lineTo(3, -2); ctx.lineTo(11, 1)
    ctx.lineTo(10, 3); ctx.lineTo(3, 0); ctx.lineTo(-3, 0); ctx.lineTo(-10, 3)
    ctx.closePath(); ctx.fill(); ctx.stroke()
    // Tail
    ctx.beginPath()
    ctx.moveTo(-5, 9); ctx.lineTo(-1.5, 7); ctx.lineTo(1.5, 7); ctx.lineTo(5, 9)
    ctx.lineTo(4, 10.5); ctx.lineTo(1, 9); ctx.lineTo(-1, 9); ctx.lineTo(-4, 10.5)
    ctx.closePath(); ctx.fill(); ctx.stroke()
  })
}

function createBoatIcon() {
  return createIcon('#8b5cf6', '#6d28d9', (ctx) => {
    // Hull
    ctx.beginPath()
    ctx.moveTo(0, -11)    // Bow (front)
    ctx.lineTo(5, -2)
    ctx.lineTo(6, 6)
    ctx.quadraticCurveTo(5, 10, 0, 11)  // Stern curve
    ctx.quadraticCurveTo(-5, 10, -6, 6)
    ctx.lineTo(-5, -2)
    ctx.closePath()
    ctx.fill(); ctx.stroke()
    // Bridge/superstructure
    ctx.fillStyle = '#7c3aed'
    ctx.beginPath()
    ctx.roundRect(-3, -3, 6, 6, 1)
    ctx.fill(); ctx.stroke()
    // Bow line
    ctx.strokeStyle = '#a78bfa'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, -11)
    ctx.lineTo(0, -5)
    ctx.stroke()
  })
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
    const ev = eventsRef.current
    const af = activeFeedsRef.current

    const src = (id: string) => map.getSource(id) as maplibregl.GeoJSONSource | undefined
    src('events')?.setData(staticEventsGeoJSON(ev, af))
    src('aircraft')?.setData(vehicleGeoJSON(ev, af, 'aircraft', 'icao24'))
    src('aircraft-tracks')?.setData(vehicleTracksGeoJSON(ev, af, 'aircraft', 'icao24'))
    src('maritime')?.setData(vehicleGeoJSON(ev, af, 'maritime', 'mmsi'))
    src('maritime-tracks')?.setData(vehicleTracksGeoJSON(ev, af, 'maritime', 'mmsi'))
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

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left')

    map.on('load', () => {
      // Register icons
      map.addImage('plane-icon', createPlaneIcon(), { sdf: false })
      map.addImage('boat-icon', createBoatIcon(), { sdf: false })

      const ev = eventsRef.current
      const af = activeFeedsRef.current

      // === STATIC EVENTS (clustered circles) ===
      map.addSource('events', {
        type: 'geojson',
        data: staticEventsGeoJSON(ev, af),
        cluster: true, clusterMaxZoom: 10, clusterRadius: 40,
      })

      map.addLayer({
        id: 'clusters', type: 'circle', source: 'events',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#3b82f6',
          'circle-radius': ['step', ['get', 'point_count'], 12, 10, 16, 50, 22],
          'circle-opacity': 0.7,
          'circle-stroke-width': 1, 'circle-stroke-color': 'rgba(59,130,246,0.3)',
        },
      })
      map.addLayer({
        id: 'cluster-count', type: 'symbol', source: 'events',
        filter: ['has', 'point_count'],
        layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 11 },
        paint: { 'text-color': '#fff' },
      })
      map.addLayer({
        id: 'event-circles', type: 'circle', source: 'events',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'], 'circle-radius': ['get', 'radius'],
          'circle-opacity': 0.85, 'circle-stroke-width': 1,
          'circle-stroke-color': ['case', ['==', ['get', 'severity'], 'critical'], ['get', 'color'], 'transparent'],
          'circle-stroke-opacity': 0.4,
        },
      })
      map.addLayer({
        id: 'event-pulse', type: 'circle', source: 'events',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'severity'], 'critical']],
        paint: {
          'circle-color': 'transparent', 'circle-radius': 12,
          'circle-stroke-width': 1.5, 'circle-stroke-color': ['get', 'color'], 'circle-stroke-opacity': 0.3,
        },
      })

      // === AIRCRAFT (tracks + plane icons) ===
      map.addSource('aircraft-tracks', {
        type: 'geojson', data: vehicleTracksGeoJSON(ev, af, 'aircraft', 'icao24'),
      })
      map.addLayer({
        id: 'aircraft-track-lines', type: 'line', source: 'aircraft-tracks',
        paint: { 'line-color': '#3b82f6', 'line-width': 1.5, 'line-opacity': 0.4, 'line-dasharray': [2, 4] },
      })
      map.addSource('aircraft', {
        type: 'geojson', data: vehicleGeoJSON(ev, af, 'aircraft', 'icao24'),
      })
      map.addLayer({
        id: 'aircraft-icons', type: 'symbol', source: 'aircraft',
        layout: {
          'icon-image': 'plane-icon', 'icon-size': 0.6,
          'icon-rotate': ['get', 'heading'], 'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true, 'icon-ignore-placement': true,
        },
      })

      // === MARITIME (tracks + boat icons) ===
      map.addSource('maritime-tracks', {
        type: 'geojson', data: vehicleTracksGeoJSON(ev, af, 'maritime', 'mmsi'),
      })
      map.addLayer({
        id: 'maritime-track-lines', type: 'line', source: 'maritime-tracks',
        paint: { 'line-color': '#8b5cf6', 'line-width': 1.5, 'line-opacity': 0.4, 'line-dasharray': [2, 4] },
      })
      map.addSource('maritime', {
        type: 'geojson', data: vehicleGeoJSON(ev, af, 'maritime', 'mmsi'),
      })
      map.addLayer({
        id: 'maritime-icons', type: 'symbol', source: 'maritime',
        layout: {
          'icon-image': 'boat-icon', 'icon-size': 0.55,
          'icon-rotate': ['get', 'heading'], 'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true, 'icon-ignore-placement': true,
        },
      })

      // === INTERACTIONS ===
      const clickableLayers = ['event-circles', 'aircraft-icons', 'maritime-icons']

      for (const layer of clickableLayers) {
        map.on('click', layer, (e) => {
          if (!e.features?.[0]) return
          const props = e.features[0].properties
          const event = eventsRef.current.find((ev) => ev.id === props?.id)
          if (event) onSelectEvent(event)
        })
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = '' })
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
      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = '' })

      // Tooltip
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: 'event-tooltip', offset: 12 })
      for (const layer of clickableLayers) {
        map.on('mouseenter', layer, (e) => {
          if (!e.features?.[0]) return
          const props = e.features[0].properties
          const coords = (e.features[0].geometry as GeoJSON.Point).coordinates
          popup.setLngLat([coords[0], coords[1]]).setHTML(
            `<div class="text-xs">
              <div class="font-medium text-white truncate max-w-[200px]">${props?.title || 'Event'}</div>
              <div class="text-gray-400">${(props?.feed || props?.category || '').toUpperCase()}</div>
            </div>`
          ).addTo(map)
        })
        map.on('mouseleave', layer, () => { popup.remove() })
      }

      // Deselect on empty click
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [...clickableLayers, 'clusters'] })
        if (features.length === 0) onSelectEvent(null)
      })
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [onSelectEvent, updateSources])

  useEffect(() => { updateSources() }, [events, activeFeeds, updateSources])

  // Pulse animation
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let animFrame: number
    let phase = 0
    const animate = () => {
      phase = (phase + 0.02) % 1
      const r = 10 + Math.sin(phase * Math.PI * 2) * 4
      if (map.isStyleLoaded() && map.getLayer('event-pulse')) {
        map.setPaintProperty('event-pulse', 'circle-radius', r)
        map.setPaintProperty('event-pulse', 'circle-stroke-opacity', 0.15 + Math.sin(phase * Math.PI * 2) * 0.15)
      }
      animFrame = requestAnimationFrame(animate)
    }
    const timeout = setTimeout(() => { animFrame = requestAnimationFrame(animate) }, 2000)
    return () => { clearTimeout(timeout); cancelAnimationFrame(animFrame) }
  }, [])

  return <div ref={containerRef} className="h-full w-full" />
}

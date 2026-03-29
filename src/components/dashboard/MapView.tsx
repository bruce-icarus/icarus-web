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

function eventsToGeoJSON(events: StoredEvent[], activeFeeds: Set<string>) {
  return {
    type: 'FeatureCollection' as const,
    features: events
      .filter((e) => activeFeeds.has(e.category))
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

export function MapView({ events, activeFeeds, onSelectEvent }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const eventsRef = useRef(events)
  const activeFeedsRef = useRef(activeFeeds)

  // Keep refs in sync
  eventsRef.current = events
  activeFeedsRef.current = activeFeeds

  const updateSource = useCallback(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const source = map.getSource('events') as maplibregl.GeoJSONSource
    if (source) {
      source.setData(eventsToGeoJSON(eventsRef.current, activeFeedsRef.current))
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STADIA_STYLE,
      center: [20, 30], // Center on Middle East / Mediterranean
      zoom: 2.5,
      attributionControl: false,
    })

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-left'
    )

    map.on('load', () => {
      // Add events source
      map.addSource('events', {
        type: 'geojson',
        data: eventsToGeoJSON(eventsRef.current, activeFeedsRef.current),
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 40,
      })

      // Cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'events',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#3b82f6',
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            12, 10, 16, 50, 22,
          ],
          'circle-opacity': 0.7,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(59, 130, 246, 0.3)',
        },
      })

      // Cluster count label
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'events',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 11,
        },
        paint: {
          'text-color': '#ffffff',
        },
      })

      // Individual event circles
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

      // Pulse ring for critical severity
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

      // Click handler for individual events
      map.on('click', 'event-circles', (e) => {
        if (!e.features?.[0]) return
        const props = e.features[0].properties
        const event = eventsRef.current.find((ev) => ev.id === props?.id)
        if (event) onSelectEvent(event)
      })

      // Click on cluster → zoom in
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        })
        if (!features[0]) return
        const clusterId = features[0].properties?.cluster_id
        const source = map.getSource('events') as maplibregl.GeoJSONSource
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const coords = (features[0].geometry as GeoJSON.Point).coordinates
          map.easeTo({
            center: [coords[0], coords[1]],
            zoom: zoom,
          })
        })
      })

      // Cursor changes
      map.on('mouseenter', 'event-circles', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'event-circles', () => {
        map.getCanvas().style.cursor = ''
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

      map.on('mouseenter', 'event-circles', (e) => {
        if (!e.features?.[0]) return
        const props = e.features[0].properties
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates
        popup
          .setLngLat([coords[0], coords[1]])
          .setHTML(
            `<div class="text-xs">
              <div class="font-medium text-white truncate max-w-[200px]">${props?.title || 'Event'}</div>
              <div class="text-gray-400">${props?.feed?.toUpperCase()}</div>
            </div>`
          )
          .addTo(map)
      })

      map.on('mouseleave', 'event-circles', () => {
        popup.remove()
      })

      // Click empty map to deselect
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['event-circles', 'clusters'],
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
  }, [onSelectEvent, updateSource])

  // Update markers when events or active feeds change
  useEffect(() => {
    updateSource()
  }, [events, activeFeeds, updateSource])

  // Pulse animation via requestAnimationFrame
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

    // Start after a short delay to let the map load
    const timeout = setTimeout(() => {
      animFrame = requestAnimationFrame(animate)
    }, 2000)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(animFrame)
    }
  }, [])

  return (
    <div ref={containerRef} className="h-full w-full" />
  )
}

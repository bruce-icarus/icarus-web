'use client'

import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const STADIA_STYLE = `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${process.env.NEXT_PUBLIC_STADIA_API_KEY}`

interface Camera {
  id: string
  name: string
  lat: number
  lng: number
  imageUrl: string
  videoUrl: string
}

interface LondonMapProps {
  cameras: Camera[]
  onSelectCamera: (camera: Camera | null) => void
}

function camerasToGeoJSON(cameras: Camera[]) {
  return {
    type: 'FeatureCollection' as const,
    features: cameras.map((c) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [c.lng, c.lat],
      },
      properties: {
        id: c.id,
        name: c.name,
      },
    })),
  }
}

// Camera icon: small circle with dot (looks like a lens)
function createCameraIcon(): { width: number; height: number; data: Uint8Array } {
  const size = 20
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Outer ring
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, 7, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
  ctx.fill()
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Inner dot
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, 3, 0, Math.PI * 2)
  ctx.fillStyle = '#3b82f6'
  ctx.fill()

  const imageData = ctx.getImageData(0, 0, size, size)
  return { width: size, height: size, data: new Uint8Array(imageData.data.buffer) }
}

export function LondonMap({ cameras, onSelectCamera }: LondonMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const camerasRef = useRef(cameras)

  camerasRef.current = cameras

  const updateSource = useCallback(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const src = map.getSource('cameras') as maplibregl.GeoJSONSource
    if (src) src.setData(camerasToGeoJSON(camerasRef.current))
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: STADIA_STYLE,
        center: [-0.118, 51.509], // Central London
        zoom: 11,
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
    map.addControl(new maplibregl.NavigationControl(), 'bottom-right')

    map.on('load', () => {
      map.addImage('camera-icon', createCameraIcon(), { sdf: false })

      map.addSource('cameras', {
        type: 'geojson',
        data: camerasToGeoJSON(camerasRef.current),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 30,
      })

      // Cluster circles
      map.addLayer({
        id: 'camera-clusters',
        type: 'circle',
        source: 'cameras',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': 'rgba(59, 130, 246, 0.4)',
          'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 50, 24],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#3b82f6',
        },
      })

      map.addLayer({
        id: 'camera-cluster-count',
        type: 'symbol',
        source: 'cameras',
        filter: ['has', 'point_count'],
        layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 11 },
        paint: { 'text-color': '#ffffff' },
      })

      // Individual camera icons
      map.addLayer({
        id: 'camera-icons',
        type: 'symbol',
        source: 'cameras',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': 'camera-icon',
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      })

      // Click camera
      map.on('click', 'camera-icons', (e) => {
        if (!e.features?.[0]) return
        const props = e.features[0].properties
        const camera = camerasRef.current.find((c) => c.id === props?.id)
        if (camera) onSelectCamera(camera)
      })

      // Click cluster → zoom
      map.on('click', 'camera-clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['camera-clusters'] })
        if (!features[0]) return
        const clusterId = features[0].properties?.cluster_id
        const source = map.getSource('cameras') as maplibregl.GeoJSONSource
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const coords = (features[0].geometry as GeoJSON.Point).coordinates
          map.easeTo({ center: [coords[0], coords[1]], zoom })
        })
      })

      // Cursor
      map.on('mouseenter', 'camera-icons', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'camera-icons', () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', 'camera-clusters', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'camera-clusters', () => { map.getCanvas().style.cursor = '' })

      // Tooltip
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: 'event-tooltip', offset: 12 })
      map.on('mouseenter', 'camera-icons', (e) => {
        if (!e.features?.[0]) return
        const props = e.features[0].properties
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates
        popup.setLngLat([coords[0], coords[1]]).setHTML(
          `<div class="text-xs">
            <div class="font-medium text-white truncate max-w-[200px]">${props?.name || 'Camera'}</div>
            <div class="text-gray-400">Click for live feed</div>
          </div>`
        ).addTo(map)
      })
      map.on('mouseleave', 'camera-icons', () => { popup.remove() })

      // Click empty → deselect
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['camera-icons', 'camera-clusters'] })
        if (features.length === 0) onSelectCamera(null)
      })
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [onSelectCamera, updateSource])

  useEffect(() => { updateSource() }, [cameras, updateSource])

  return <div ref={containerRef} className="h-full w-full" />
}

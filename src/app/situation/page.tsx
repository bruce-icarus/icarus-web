'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { TopBar } from '@/components/dashboard/TopBar'
import { RightPanel } from '@/components/dashboard/RightPanel'
import { useEvents } from '@/lib/hooks/useEvents'
import type { StoredEvent } from '@/lib/feeds/types'

// MapLibre must be loaded client-side only (WebGL)
const MapView = dynamic(
  () => import('@/components/dashboard/MapView').then((m) => m.MapView),
  { ssr: false }
)

import { CTAToast } from '@/components/dashboard/CTAToast'

const DEFAULT_FEEDS = new Set(['conflict', 'fire', 'seismic', 'aircraft', 'weather', 'maritime'])

export default function SituationDashboard() {
  const { events, loading } = useEvents()
  const [selectedEvent, setSelectedEvent] = useState<StoredEvent | null>(null)
  const [activeFeeds, setActiveFeeds] = useState<Set<string>>(DEFAULT_FEEDS)

  const handleToggleFeed = useCallback((category: string) => {
    setActiveFeeds((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  const handleSelectEvent = useCallback((event: StoredEvent | null) => {
    setSelectedEvent(event)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <TopBar
        events={events}
        activeFeeds={activeFeeds}
        onToggleFeed={handleToggleFeed}
      />

      <div className="relative flex-1">
        {/* Loading overlay */}
        {loading && events.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-[rgba(10,15,26,0.9)] px-5 py-3 backdrop-blur-xl">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">
                Connecting to live feeds...
              </span>
            </div>
          </div>
        )}

        <MapView
          events={events}
          activeFeeds={activeFeeds}
          onSelectEvent={handleSelectEvent}
        />

        <RightPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      </div>

      <CTAToast />
    </div>
  )
}

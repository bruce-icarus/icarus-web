'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { StoredEvent } from '@/lib/feeds/types'

const POLL_INTERVAL = 5 * 60 * 1000 // 5 minutes (matches cron interval)

export function useEvents() {
  const [events, setEvents] = useState<StoredEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cursorRef = useRef<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (cursorRef.current) {
        params.set('since', cursorRef.current)
      }

      const res = await fetch(`/api/events?${params}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const data = await res.json()
      const newEvents: StoredEvent[] = data.events

      if (newEvents.length > 0) {
        setEvents((prev) => {
          // Merge new events, dedup by id
          const existingIds = new Set(prev.map((e) => e.id))
          const unique = newEvents.filter((e) => !existingIds.has(e.id))
          return [...unique, ...prev].slice(0, 1000) // Cap at 1000
        })
        cursorRef.current = data.cursor
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchEvents])

  return { events, loading, error, refetch: fetchEvents }
}

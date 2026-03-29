'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { StoredEvent } from '@/lib/feeds/types'

const CATEGORY_COLORS: Record<string, string> = {
  conflict: '#ef4444',
  fire: '#f97316',
  seismic: '#eab308',
  aircraft: '#3b82f6',
  weather: '#14b8a6',
  maritime: '#8b5cf6',
}

const CATEGORY_LABELS: Record<string, string> = {
  conflict: 'Conflicts',
  fire: 'Fires',
  seismic: 'Seismic',
  aircraft: 'Aircraft',
  weather: 'Weather',
  maritime: 'Maritime',
}

interface TopBarProps {
  events: StoredEvent[]
  activeFeeds: Set<string>
  onToggleFeed: (category: string) => void
}

function UTCClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(
        now.toISOString().slice(11, 19) + ' UTC'
      )
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="font-mono text-[13px] text-muted-foreground">
      {time}
    </span>
  )
}

export function TopBar({ events, activeFeeds, onToggleFeed }: TopBarProps) {
  const categoryCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1
    return acc
  }, {})

  return (
    <header className="flex h-12 items-center justify-between border-b border-border/40 bg-[rgba(10,15,26,0.9)] px-4 backdrop-blur-xl">
      {/* Left: Logo + wordmark */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 overflow-hidden rounded-lg ring-1 ring-white/10">
          <Image
            src="/Icarus300.png"
            alt="Icarus"
            width={28}
            height={28}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="hidden sm:block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Icarus Deck
          </span>
          <span className="ml-2 text-[10px] text-muted-foreground/60">
            OSINT situation awareness
          </span>
        </div>
      </div>

      {/* Center: Layer toggle chips */}
      <div className="flex items-center gap-2 overflow-x-auto px-4">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          const active = activeFeeds.has(key)
          const count = categoryCounts[key] || 0
          return (
            <button
              key={key}
              onClick={() => onToggleFeed(key)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-all ${
                active
                  ? 'border-border/60 bg-card/60 text-foreground'
                  : 'border-transparent bg-transparent text-muted-foreground/40'
              }`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: active
                    ? CATEGORY_COLORS[key]
                    : 'transparent',
                  boxShadow: active
                    ? `0 0 6px ${CATEGORY_COLORS[key]}40`
                    : 'none',
                }}
              />
              {label}
              <span className="ml-0.5 font-mono text-[10px] text-muted-foreground">
                {count || '\u2014'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Right: Clock */}
      <UTCClock />
    </header>
  )
}

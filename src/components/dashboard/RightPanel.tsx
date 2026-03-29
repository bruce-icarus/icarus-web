'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { StoredEvent } from '@/lib/feeds/types'

const CATEGORY_COLORS: Record<string, string> = {
  conflict: 'text-red-400 border-red-400/30 bg-red-400/10',
  fire: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  seismic: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  aircraft: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  weather: 'text-teal-400 border-teal-400/30 bg-teal-400/10',
  maritime: 'text-violet-400 border-violet-400/30 bg-violet-400/10',
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface RightPanelProps {
  event: StoredEvent | null
  onClose: () => void
}

export function RightPanel({ event, onClose }: RightPanelProps) {
  return (
    <AnimatePresence>
      {event && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute right-0 top-0 z-20 h-full w-[340px] max-w-full border-l border-border/40 bg-[rgba(10,15,26,0.9)] backdrop-blur-xl md:w-[340px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
            <span className="text-sm font-medium text-foreground">
              Event Detail
            </span>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-card/60 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-4">
            <div className="space-y-4">
              <Badge
                variant="outline"
                className={`text-[10px] uppercase tracking-wider ${CATEGORY_COLORS[event.category] || ''}`}
              >
                {event.category}
              </Badge>

              <h3 className="text-base font-semibold text-foreground">
                {event.title || 'Untitled event'}
              </h3>

              {event.body && (
                <p className="text-[13px] text-muted-foreground">
                  {event.body}
                </p>
              )}

              <div className="space-y-2 rounded-lg border border-border/40 bg-card/40 p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Coordinates</span>
                  <span className="font-mono text-foreground">
                    {event.lat.toFixed(3)}, {event.lng.toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Severity</span>
                  <span className="capitalize text-foreground">
                    {event.severity}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Time</span>
                  <span className="text-foreground">
                    {timeAgo(event.event_time)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Feed</span>
                  <span className="uppercase text-foreground">{event.feed}</span>
                </div>
              </div>

              {/* Metadata */}
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Details
                  </span>
                  {Object.entries(event.metadata).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-mono text-foreground">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {event.source_url && (
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[12px] text-primary hover:underline"
                >
                  View source
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

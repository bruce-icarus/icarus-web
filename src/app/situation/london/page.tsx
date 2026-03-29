'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Video, Camera, MapPin } from 'lucide-react'

const LondonMap = dynamic(
  () => import('@/components/dashboard/LondonMap').then((m) => m.LondonMap),
  { ssr: false }
)

interface CameraData {
  id: string
  name: string
  lat: number
  lng: number
  imageUrl: string
  videoUrl: string
}

export default function LondonCCTV() {
  const [cameras, setCameras] = useState<CameraData[]>([])
  const [selectedCamera, setSelectedCamera] = useState<CameraData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    fetch('/api/cameras')
      .then((r) => r.json())
      .then((data) => {
        setCameras(data.cameras || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSelectCamera = useCallback((camera: CameraData | null) => {
    setSelectedCamera(camera)
    setShowVideo(false)
  }, [])

  // Add cache-busting timestamp to image URL for live refresh
  const liveImageUrl = selectedCamera
    ? `${selectedCamera.imageUrl}?t=${Math.floor(Date.now() / 10000)}`
    : ''

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="flex h-12 items-center justify-between border-b border-border/40 bg-[rgba(10,15,26,0.9)] px-4 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary ring-1 ring-white/10">
            <Camera className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              London CCTV
            </span>
            <span className="ml-2 text-[10px] text-muted-foreground/60">
              TfL JamCam Network
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              style={{ boxShadow: '0 0 6px rgba(52,211,153,0.4)' }}
            />
            {loading ? 'Loading...' : `${cameras.length} cameras`}
          </div>
          <a
            href="/situation"
            className="text-[11px] text-muted-foreground hover:text-foreground transition"
          >
            ← Global Monitor
          </a>
        </div>
      </header>

      <div className="relative flex-1">
        {loading && cameras.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-[rgba(10,15,26,0.9)] px-5 py-3 backdrop-blur-xl">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">
                Loading TfL camera network...
              </span>
            </div>
          </div>
        )}

        <LondonMap cameras={cameras} onSelectCamera={handleSelectCamera} />

        {/* Camera feed panel */}
        <AnimatePresence>
          {selectedCamera && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute right-0 top-0 z-20 flex h-full w-[400px] max-w-full flex-col border-l border-border/40 bg-[rgba(10,15,26,0.95)] backdrop-blur-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Live Feed
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCamera(null)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-card/60 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Feed content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {/* Camera name */}
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {selectedCamera.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="font-mono">
                        {selectedCamera.lat.toFixed(4)}, {selectedCamera.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Live image/video */}
                  <div className="overflow-hidden rounded-lg border border-border/40">
                    {showVideo && selectedCamera.videoUrl ? (
                      <video
                        key={selectedCamera.id + '-video'}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full"
                      >
                        <source src={selectedCamera.videoUrl} type="video/mp4" />
                      </video>
                    ) : (
                      <Image
                        key={selectedCamera.id + '-img'}
                        src={liveImageUrl}
                        alt={selectedCamera.name}
                        width={640}
                        height={480}
                        unoptimized
                        className="w-full"
                      />
                    )}
                  </div>

                  {/* Toggle buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowVideo(false)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-[12px] transition ${
                        !showVideo
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Still Image
                    </button>
                    <button
                      onClick={() => setShowVideo(true)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-[12px] transition ${
                        showVideo
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Video Loop
                    </button>
                  </div>

                  {/* Camera ID */}
                  <div className="rounded-lg border border-border/40 bg-card/40 p-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Camera ID</span>
                      <span className="font-mono text-foreground">
                        {selectedCamera.id}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Source</span>
                      <span className="text-foreground">TfL JamCam</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Refresh</span>
                      <span className="text-foreground">~5 min intervals</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

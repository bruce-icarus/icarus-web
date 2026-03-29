'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'

const INITIAL_DELAY = 3 * 60 * 1000   // 3 minutes
const REAPPEAR_DELAY = 10 * 60 * 1000 // 10 minutes

export function CTAToast() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), INITIAL_DELAY)
    return () => clearTimeout(showTimer)
  }, [])

  useEffect(() => {
    if (visible) return
    // After dismiss, reappear after 10 minutes
    const reappearTimer = setTimeout(() => setVisible(true), REAPPEAR_DELAY)
    return () => clearTimeout(reappearTimer)
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 z-50 flex w-[340px] max-w-[calc(100vw-3rem)] items-start gap-3 rounded-xl border border-border/40 bg-[rgba(10,15,26,0.95)] p-4 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex-1">
            <p className="text-[13px] font-medium text-foreground">
              Built by Icarus Technologies
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Need something like this? Let&apos;s talk.
            </p>
            <a
              href="https://cal.com/bruce-williams-icarus/15min"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition hover:bg-primary/80"
            >
              Book a 15-min call
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import type { FeedAdapter } from './types'
import { usgsAdapter } from './usgs'
import { openskyAdapter } from './opensky'
import { maritimeAdapter } from './maritime'

// Register all active feed adapters
export const feedAdapters: FeedAdapter[] = [
  usgsAdapter,
  openskyAdapter,
  maritimeAdapter,
  // gdeltAdapter,  // Phase 2
  // firmsAdapter,  // Phase 2
]

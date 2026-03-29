import type { FeedAdapter } from './types'
import { usgsAdapter } from './usgs'

// Register all active feed adapters
// Add new feeds here as they're implemented
export const feedAdapters: FeedAdapter[] = [
  usgsAdapter,
  // gdeltAdapter,  // Phase 1.5
  // firmsAdapter,  // Phase 1.5
]

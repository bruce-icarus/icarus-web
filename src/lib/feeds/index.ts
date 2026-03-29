import type { FeedAdapter } from './types'
import { usgsAdapter } from './usgs'
import { openskyAdapter } from './opensky'
import { maritimeAdapter } from './maritime'
import { gdeltAdapter } from './gdelt'
import { firmsAdapter } from './firms'
import { nwsAdapter } from './nws'

// Register all active feed adapters
export const feedAdapters: FeedAdapter[] = [
  usgsAdapter,
  openskyAdapter,
  maritimeAdapter,
  gdeltAdapter,
  firmsAdapter,
  nwsAdapter,
]

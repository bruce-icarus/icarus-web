import type { FeedAdapter, FeedEvent } from './types'
import { normalizeSeverity } from './severity'

// NASA FIRMS (Fire Information for Resource Management System)
// VIIRS active fire data — global 24-hour CSV, no API key required
const FIRMS_URL =
  'https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J2_VIIRS_C2_Global_24h.csv'

const MAX_EVENTS = 300

interface FIRMSRecord {
  latitude: number
  longitude: number
  bright_ti4: number
  scan: number
  track: number
  acq_date: string
  acq_time: string
  satellite: string
  confidence: string
  version: string
  bright_ti5: number
  frp: number
  daynight: string
}

function parseCSV(text: string): FIRMSRecord[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  const records: FIRMSRecord[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    if (values.length !== headers.length) continue

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx].trim()
    })

    const lat = parseFloat(row['latitude'])
    const lng = parseFloat(row['longitude'])
    const frp = parseFloat(row['frp'])

    if (isNaN(lat) || isNaN(lng) || isNaN(frp)) continue

    records.push({
      latitude: lat,
      longitude: lng,
      bright_ti4: parseFloat(row['bright_ti4']) || 0,
      scan: parseFloat(row['scan']) || 0,
      track: parseFloat(row['track']) || 0,
      acq_date: row['acq_date'] || '',
      acq_time: row['acq_time'] || '',
      satellite: row['satellite'] || '',
      confidence: row['confidence'] || '',
      version: row['version'] || '',
      bright_ti5: parseFloat(row['bright_ti5']) || 0,
      frp,
      daynight: row['daynight'] || '',
    })
  }

  return records
}

function sampleRecords(records: FIRMSRecord[], max: number): FIRMSRecord[] {
  if (records.length <= max) return records

  // Sort by FRP descending so we keep the most intense fires
  const sorted = [...records].sort((a, b) => b.frp - a.frp)

  // Always keep the top 20% by intensity
  const topCount = Math.floor(max * 0.2)
  const top = sorted.slice(0, topCount)

  // Randomly sample the rest
  const remaining = sorted.slice(topCount)
  const sampleCount = max - topCount
  const step = remaining.length / sampleCount

  const sampled: FIRMSRecord[] = []
  for (let i = 0; i < sampleCount; i++) {
    sampled.push(remaining[Math.floor(i * step)])
  }

  return [...top, ...sampled]
}

export const firmsAdapter: FeedAdapter = {
  name: 'firms',
  pollIntervalSeconds: 900, // 15 minutes

  async fetch(): Promise<FeedEvent[]> {
    const res = await fetch(FIRMS_URL, {
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      throw new Error(`FIRMS API returned ${res.status}: ${res.statusText}`)
    }

    const text = await res.text()
    const records = parseCSV(text)
    const sampled = sampleRecords(records, MAX_EVENTS)

    return sampled.map((r) => {
      // Parse acquisition time (HHMM format) with date
      const timeStr = r.acq_time.padStart(4, '0')
      const hours = timeStr.slice(0, 2)
      const minutes = timeStr.slice(2, 4)
      const eventTime = r.acq_date
        ? new Date(`${r.acq_date}T${hours}:${minutes}:00Z`).toISOString()
        : new Date().toISOString()

      return {
        feed: 'firms',
        source_id: `${r.latitude}_${r.longitude}_${r.acq_date}`,
        title: `Active fire (${r.frp.toFixed(1)} MW FRP)`,
        body: `VIIRS detection at ${r.latitude.toFixed(3)}, ${r.longitude.toFixed(3)} — confidence: ${r.confidence}`,
        lat: r.latitude,
        lng: r.longitude,
        severity: normalizeSeverity('firms', r.frp),
        category: 'fire' as const,
        source_url: null,
        metadata: {
          frp: r.frp,
          bright_ti4: r.bright_ti4,
          bright_ti5: r.bright_ti5,
          confidence: r.confidence,
          satellite: r.satellite,
          daynight: r.daynight,
          scan: r.scan,
          track: r.track,
        },
        event_time: eventTime,
      }
    })
  },
}

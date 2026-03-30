import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Per-feed limits to ensure a balanced mix on the map
const FEED_LIMITS: Record<string, number> = {
  usgs: 100,
  opensky: 250,
  maritime: 300,
  gdelt: 100,   // GDACS disasters
  firms: 300,
  nws: 100,
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const since = searchParams.get('since')

  const supabase = getSupabase()
  const cutoff = since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Fetch each feed separately with its own limit for balanced results
  const feedQueries = Object.entries(FEED_LIMITS).map(async ([feed, limit]) => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('feed', feed)
      .gt('ingested_at', cutoff)
      .order('ingested_at', { ascending: false })
      .limit(limit)
    return data ?? []
  })

  try {
    const results = await Promise.all(feedQueries)
    const events = results.flat().sort((a, b) =>
      b.ingested_at.localeCompare(a.ingested_at)
    )

    return NextResponse.json({
      events,
      cursor: events[0]?.ingested_at ?? null,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch events'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const since = searchParams.get('since')

  const supabase = getSupabase()
  let query = supabase
    .from('events')
    .select('*')
    .order('ingested_at', { ascending: false })
    .limit(500)

  if (since) {
    query = query.gt('ingested_at', since)
  } else {
    // Default: last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    query = query.gt('ingested_at', oneDayAgo)
  }

  const { data: events, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    events: events ?? [],
    cursor: events?.[0]?.ingested_at ?? null,
  })
}

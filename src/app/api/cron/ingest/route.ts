import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { feedAdapters } from '@/lib/feeds'
import type { FeedEvent } from '@/lib/feeds/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Vercel Pro: 60s timeout

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const results: Record<string, { ingested: number; error?: string }> = {}

  for (const adapter of feedAdapters) {
    try {
      // Check if this feed is due for polling
      const { data: feedState } = await supabase
        .from('feed_state')
        .select('last_polled_at, poll_interval_s')
        .eq('feed', adapter.name)
        .single()

      if (feedState?.last_polled_at) {
        const lastPoll = new Date(feedState.last_polled_at).getTime()
        const intervalMs = feedState.poll_interval_s * 1000
        if (Date.now() - lastPoll < intervalMs) {
          results[adapter.name] = { ingested: 0 }
          continue // Not due yet
        }
      }

      // Fetch events from the feed
      const events: FeedEvent[] = await adapter.fetch()

      if (events.length > 0) {
        // Upsert events (dedup by feed + source_id)
        const { error: upsertError } = await supabase
          .from('events')
          .upsert(
            events.map((e) => ({
              feed: e.feed,
              source_id: e.source_id,
              title: e.title,
              body: e.body,
              lat: e.lat,
              lng: e.lng,
              severity: e.severity,
              category: e.category,
              source_url: e.source_url,
              metadata: e.metadata,
              event_time: e.event_time,
            })),
            { onConflict: 'feed,source_id', ignoreDuplicates: true }
          )

        if (upsertError) throw upsertError
      }

      // Update feed state
      await supabase
        .from('feed_state')
        .update({
          last_polled_at: new Date().toISOString(),
          last_error: null,
          status: 'ok',
        })
        .eq('feed', adapter.name)

      results[adapter.name] = { ingested: events.length }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)

      // Update feed state with error (best-effort)
      try {
        await supabase
          .from('feed_state')
          .update({
            last_error: errorMsg,
            status: 'error',
          })
          .eq('feed', adapter.name)
      } catch {
        // Don't fail the whole route if state update fails
      }

      results[adapter.name] = { ingested: 0, error: errorMsg }
    }
  }

  return NextResponse.json({ ok: true, results })
}

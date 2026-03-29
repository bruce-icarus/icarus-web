import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TFL_JAMCAM_URL = 'https://api.tfl.gov.uk/Place/Type/JamCam/'

export interface Camera {
  id: string
  name: string
  lat: number
  lng: number
  imageUrl: string
  videoUrl: string
}

export async function GET() {
  try {
    const res = await fetch(TFL_JAMCAM_URL, {
      next: { revalidate: 300 }, // Cache for 5 min
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `TFL API returned ${res.status}` },
        { status: 502 }
      )
    }

    const data = await res.json()

    const cameras: Camera[] = data
      .filter((cam: Record<string, unknown>) => cam.lat && cam.lon)
      .map((cam: Record<string, unknown>) => {
        const props: Record<string, string> = {}
        for (const p of (cam.additionalProperties as { key: string; value: string }[]) || []) {
          props[p.key] = p.value
        }
        return {
          id: cam.id as string,
          name: cam.commonName as string,
          lat: cam.lat as number,
          lng: cam.lon as number,
          imageUrl: props.imageUrl || '',
          videoUrl: props.videoUrl || '',
        }
      })
      .filter((c: Camera) => c.imageUrl)

    return NextResponse.json({ cameras, count: cameras.length })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch cameras' },
      { status: 500 }
    )
  }
}

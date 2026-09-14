import type { Metadata, Viewport } from 'next'
import './globals.css'

const SITE_URL = 'https://www.icarustechnologies.co.uk'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Icarus Technologies',
    template: '%s — Icarus Technologies',
  },
  description: 'We build mission-critical software.',
  applicationName: 'Icarus Technologies',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/icon.png', sizes: '256x256', type: 'image/png' },
      { url: '/brand/icarus-figure-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Icarus Technologies',
    title: 'Icarus Technologies',
    description: 'We build mission-critical software.',
    url: SITE_URL,
    images: [
      {
        url: '/brand/icarus-og.png',
        width: 1200,
        height: 630,
        alt: 'Icarus Technologies',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Icarus Technologies',
    description: 'We build mission-critical software.',
    images: ['/brand/icarus-og.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#032356',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}

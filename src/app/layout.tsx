import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Icarus Technologies',
  description: 'We build mission-critical software.',
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

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Icarus Technologies | Software Consultancy',
  description:
    'Systems consultants crafting secure, resilient software for teams that build critical products.',
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

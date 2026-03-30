import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import IcarusLogo from './Icarus300.png'

export default function Home() {
  // In production, link to situation subdomain. In dev, link to /situation path.
  const dashboardUrl = '/situation'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 overflow-hidden rounded-xl shadow-lg ring-1 ring-white/10">
            <Image
              src={IcarusLogo}
              alt="Icarus Technologies"
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <span className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
            Icarus Technologies
          </span>
        </div>

        <h1 className="max-w-lg text-4xl font-semibold leading-tight md:text-5xl">
          We build mission-critical software.
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild>
            <a href={dashboardUrl}>
              See what we build
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a
              href="https://cal.com/bruce-williams-icarus/15min"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a call
            </a>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          bruce@icarustechnologies.co.uk
        </p>
      </div>
    </main>
  )
}

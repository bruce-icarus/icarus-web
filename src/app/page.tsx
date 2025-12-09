import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CircuitBoard,
  Radar,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const signals = [
  { label: 'Platform uptime', value: '99.982%', delta: '+0.21%' },
  { label: 'Delivery risk index', value: '0.12', delta: '-41% vs. baseline' },
  { label: 'Throughput gain', value: '28%', delta: 'automation lift' },
]

const pillars = [
  {
    title: 'Critical systems engineering',
    copy: 'We architect resilient platforms, modernize legacy estates, and ship mission-grade software with safety nets.',
    icon: ShieldCheck,
    tags: ['Platform strategy', 'Quality gates', 'SRE readiness'],
  },
  {
    title: 'Velocity without fragility',
    copy: 'Product engineering pods that pair with your teams to accelerate delivery without creating drift or tech debt.',
    icon: Sparkles,
    tags: ['Product squads', 'Design systems', 'Accelerators'],
  },
  {
    title: 'Data-shaped decisioning',
    copy: 'Telemetry, observability, and operating dashboards that keep leadership close to the truth in real time.',
    icon: BarChart3,
    tags: ['Observability', 'Control planes', 'Exec reporting'],
  },
]

const capabilities = [
  'Cloud-native platforms (AWS/GCP/Azure)',
  'Microservice and API ecosystems',
  'AI-assisted workflows & copilots',
  'Event-driven architectures',
  'Data platforms & stream processing',
  'Design systems & UX modernisation',
  'Security & compliance automation',
  'DevEx and developer platform strategy',
  'SRE playbooks & incident response',
]

const playbooks = [
  {
    title: 'Discover & model',
    detail:
      'Topology mapping, threat modelling, and ROI modeling to align the program with measurable outcomes.',
  },
  {
    title: 'Design & de-risk',
    detail:
      'Reference architectures, thin-slice pilots, and safety nets to validate the path before scaling.',
  },
  {
    title: 'Build & integrate',
    detail:
      'Embedded delivery pods that ship features, integrate with your stack, and transfer patterns to your teams.',
  },
  {
    title: 'Operate & evolve',
    detail:
      'Observability, runbooks, and capability uplift that keeps systems healthy long after launch.',
  },
]

const caseStudies = [
  {
    sector: 'Aerospace systems',
    result: '43% faster simulation cycles',
    detail:
      'Rebuilt modelling pipelines, added deterministic test harnesses, and integrated telemetry into mission control.',
  },
  {
    sector: 'Fintech infrastructure',
    result: 'Zero-downtime migration',
    detail:
      'Re-architected payment rails onto a service mesh with progressive delivery and automated rollback.',
  },
  {
    sector: 'Energy intelligence',
    result: 'Unified situational awareness',
    detail:
      'Shipped a data platform with live geospatial signals, anomaly detection, and resilient edge ingestion.',
  },
]

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-grid-lines [background-size:80px_80px]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
      <div className="pointer-events-none absolute inset-x-0 top-[-120px] h-[420px] bg-[radial-gradient(circle_at_center,_rgba(82,146,255,0.28),_transparent_55%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_20%_30%,rgba(52,211,153,0.12),transparent_25%)]" />

      <div className="relative z-10">
        <header className="container flex flex-col gap-6 pb-6 pt-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-background shadow-lg ring-1 ring-white/10">
              <Radar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
                Icarus Technologies
              </p>
              <p className="text-base font-semibold text-foreground/90">
                Software Consultancy
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="hidden items-center gap-3 rounded-full border border-border/60 bg-card/40 px-3 py-2 shadow-sm backdrop-blur md:flex">
              <a className="px-3 py-1 hover:text-primary" href="#services">
                Services
              </a>
              <a className="px-3 py-1 hover:text-primary" href="#capabilities">
                Capabilities
              </a>
              <a className="px-3 py-1 hover:text-primary" href="#proof">
                Proof
              </a>
              <a className="px-3 py-1 hover:text-primary" href="#contact">
                Contact
              </a>
            </div>
            <Button variant="outline" size="sm" className="hidden md:inline-flex">
              Our approach
            </Button>
            <Button size="sm">
              Book a strategy call
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </nav>
        </header>

        <section className="container grid gap-12 pb-16 pt-6 md:grid-cols-[1.2fr_0.9fr] md:items-end">
          <div className="space-y-7">
            <Badge variant="muted" className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_0_6px_rgba(94,234,212,0.15)]" />
              Operating layer for ambitious teams
            </Badge>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Engineering teams that build {` `}
              <span className="text-primary">secure, scalable</span> software with
              Palantir-level rigor.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Icarus Technologies is a boutique consultancy that embeds with your
              leaders, architects platforms, and ships production software—without
              compromising pace or reliability.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg">
                Book a strategy call
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="lg">
                Download capabilities deck
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {signals.map((signal) => (
                <Card key={signal.label} className="border-border/60 bg-card/70">
                  <CardHeader className="pb-2">
                    <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      {signal.label}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-2xl font-semibold">{signal.value}</p>
                    <p className="text-xs text-secondary">{signal.delta}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Card className="border-primary/30 bg-card/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <CircuitBoard className="h-5 w-5" />
                  </div>
                  Mission-critical delivery pod
                </CardTitle>
                <CardDescription>
                  Governance, instrumentation, and delivery muscle in a single,
                  embedded team.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                    <p className="text-xs text-muted-foreground">Engagement lead</p>
                    <p className="font-medium">Principal engineer</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                    <p className="text-xs text-muted-foreground">Delivery window</p>
                    <p className="font-medium">8–12 weeks</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                    <p className="text-xs text-muted-foreground">Deployment model</p>
                    <p className="font-medium">Embedded or autonomous</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="font-medium text-secondary">Backed by playbooks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-gradient-to-r from-primary/10 via-card to-card/80 p-4 text-sm">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <p>
                    Built-in compliance and observability for regulated environments:
                    SOC2, FedRAMP, ISO 27001.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full">
                  Explore an engagement
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section className="container pb-12">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="uppercase tracking-[0.2em] text-xs">
              Trusted by leaders across
            </span>
            <div className="flex flex-wrap gap-3">
              {['Defense tech', 'Energy', 'Fintech', 'GovTech', 'Deep tech'].map(
                (sector) => (
                  <Badge key={sector} variant="outline" className="bg-card/60">
                    {sector}
                  </Badge>
                )
              )}
            </div>
          </div>
        </section>

        <section
          id="services"
          className="container grid gap-8 pb-20 md:grid-cols-3"
        >
          <div className="md:col-span-1">
            <Badge variant="muted">Services</Badge>
            <h2 className="mt-4 text-3xl font-semibold">
              Precision-crafted software programs.
            </h2>
            <p className="mt-3 text-muted-foreground">
              We build platforms, modernize stacks, and ship products that stay
              reliable under pressure. Every engagement is led by principals who
              have operated at scale.
            </p>
          </div>
          <div className="md:col-span-2 grid gap-4">
            {pillars.map((pillar) => (
              <Card
                key={pillar.title}
                className="border-border/60 bg-card/70 transition hover:border-primary/40 hover:shadow-[0_24px_80px_-60px_rgba(59,130,246,0.7)]"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <pillar.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{pillar.title}</CardTitle>
                      <CardDescription>{pillar.copy}</CardDescription>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardFooter className="flex flex-wrap gap-2 pt-0">
                  {pillar.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="bg-background/60">
                      {tag}
                    </Badge>
                  ))}
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section
          id="capabilities"
          className="container grid gap-10 pb-20 lg:grid-cols-[1fr_1.1fr]"
        >
          <div className="space-y-4">
            <Badge variant="muted">Capabilities</Badge>
            <h2 className="text-3xl font-semibold">
              Operators who design, ship, and run production systems.
            </h2>
            <p className="text-muted-foreground">
              From strategy to code, we bring the toolkit of platform companies:
              interoperable services, ruthless observability, and experience
              leading teams through complex deliveries.
            </p>
            <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-inner">
              <div className="flex items-start gap-3 text-sm">
                <Workflow className="mt-0.5 h-5 w-5 text-secondary" />
                <div>
                  <p className="font-medium text-foreground">
                    Engagement patterns that de-risk delivery
                  </p>
                  <p className="text-muted-foreground">
                    We combine discovery sprints, reference builds, and capability
                    transfer so your teams inherit proven patterns—not just a code
                    drop.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Card className="border-border/60 bg-card/70">
            <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
              {capabilities.map((capability) => (
                <div
                  key={capability}
                  className="group rounded-xl border border-border/50 bg-background/50 p-4 transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-secondary group-hover:scale-125 transition" />
                    <p className="text-sm font-medium">{capability}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="container grid gap-8 pb-20 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-4">
            <Badge variant="muted">Operating model</Badge>
            <h2 className="text-3xl font-semibold">A clear path from idea to impact.</h2>
            <p className="text-muted-foreground">
              We stay close to your leadership, use lightweight governance, and
              publish telemetry so you can see value land every week.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {playbooks.map((item, idx) => (
              <Card key={item.title} className="border-border/60 bg-card/70">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Step {idx + 1}
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {item.detail}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section
          id="proof"
          className="container grid gap-8 pb-20 md:grid-cols-[1fr_1.1fr]"
        >
          <div className="space-y-4">
            <Badge variant="muted">Proof</Badge>
            <h2 className="text-3xl font-semibold">Outcomes we deliver.</h2>
            <p className="text-muted-foreground">
              Every story pairs delivery with observable impact. We stay until the
              new capabilities are running in production.
            </p>
          </div>
          <div className="grid gap-4">
            {caseStudies.map((study) => (
              <Card
                key={study.sector}
                className="border-border/60 bg-card/70 transition hover:border-secondary/50"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      {study.sector}
                    </p>
                    <CardTitle className="text-xl">{study.result}</CardTitle>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {study.detail}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="container pb-24">
          <div className="flex flex-col gap-8 rounded-2xl border border-border/60 bg-gradient-to-r from-primary/20 via-card to-card/90 p-10 shadow-lg md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <Badge variant="muted">Let&apos;s talk</Badge>
              <h3 className="text-3xl font-semibold">
                Bring Icarus Technologies onto your next mission.
              </h3>
              <p className="max-w-2xl text-muted-foreground">
                Show us your roadmap, your constraints, or your biggest risks. We will
                return with an executable plan and a delivery pod ready to start in
                weeks—not months.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="bg-background/70">
                  Rapid pilots
                </Badge>
                <Badge variant="outline" className="bg-background/70">
                  Regulated environments
                </Badge>
                <Badge variant="outline" className="bg-background/70">
                  Onsite & remote collaboration
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-3 min-w-[260px]">
              <Button size="lg">
                Start a conversation
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                Request a capabilities brief
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

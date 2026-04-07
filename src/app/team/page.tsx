import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const TEAM = [
  {
    role: 'Chief Executive Officer',
    name: 'Bruce Williams',
    image: '/team/bruce-ceo.png',
    bio: 'Visionary leader. Sets the direction, signs the invoices, thinks of the shareholders when nobody else will.',
  },
  {
    role: 'Chief Technology Officer',
    name: 'Bruce Williams',
    image: '/team/bruce-cto.png',
    bio: 'Architects the systems, debates himself on tech choices, and never wins the argument.',
  },
  {
    role: 'Head of HR',
    name: 'Bruce Williams',
    image: '/team/bruce-hr.png',
    bio: 'Maintains a 100% employee retention rate. Has never received a single HR complaint.',
  },
  {
    role: 'Head of Catering',
    name: 'Bruce Williams',
    image: '/team/bruce-catering.png',
    bio: 'Keeps the team fuelled. Specialises in meal deals and questionable microwave decisions.',
  },
]

export default function TeamPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="w-full max-w-4xl">
        {/* Back */}
        <Button variant="ghost" size="sm" asChild className="mb-12">
          <a href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </a>
        </Button>

        {/* Header */}
        <div className="mb-16 text-center">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            The people behind the product
          </p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">
            Meet the team
          </h1>
        </div>

        {/* Grid */}
        <div className="grid gap-10 sm:grid-cols-2">
          {TEAM.map((member) => (
            <div
              key={member.role}
              className="group flex flex-col items-center rounded-2xl border border-border/40 bg-card/40 p-8 text-center backdrop-blur-sm transition hover:border-border/60 hover:bg-card/60"
            >
              <div className="mb-5 h-40 w-40 overflow-hidden rounded-2xl ring-1 ring-white/10">
                <Image
                  src={member.image}
                  alt={`${member.name} — ${member.role}`}
                  width={320}
                  height={320}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary">
                {member.role}
              </span>
              <h2 className="mt-1.5 text-lg font-semibold">
                {member.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

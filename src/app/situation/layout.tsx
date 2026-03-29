export const metadata = {
  title: 'Icarus Situation Monitor | Icarus Technologies',
  description: 'Live OSINT situational awareness dashboard. Conflicts, fires, seismic events — monitored in real time.',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {children}
    </div>
  )
}

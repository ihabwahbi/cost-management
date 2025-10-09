'use client'

import { AppShell } from '@/components/cells/app-shell-cell/component'
import { MainDashboardCell } from '@/components/cells/main-dashboard-cell/component'

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Global metrics and recent activity across all projects
          </p>
        </div>
        <MainDashboardCell />
      </div>
    </AppShell>
  )
}

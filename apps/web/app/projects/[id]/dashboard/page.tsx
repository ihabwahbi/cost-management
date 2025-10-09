import { ProjectDashboardPage } from '@/components/cells/project-dashboard-page/component'

interface PageProps {
  params: { id: string }
}

export default function DashboardPage({ params }: PageProps) {
  return <ProjectDashboardPage projectId={params.id} />
}

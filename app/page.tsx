"use client"

import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, FolderOpen, TrendingUp, DollarSign, Clock, ArrowRight, BarChart3 } from "lucide-react"

// Mock data for dashboard metrics
const dashboardMetrics = {
  unmappedPOs: 47,
  totalPOValue: 12450000,
  activeProjects: 8,
  budgetVariance: -2.3,
  recentActivity: [
    { type: "po_mapped", description: "PO 4584391746 mapped to Shell Crux", time: "2 hours ago" },
    { type: "project_created", description: "New project 'Browse Basin Exploration' created", time: "4 hours ago" },
    { type: "budget_updated", description: "Shell Crux budget updated - Version 2.1", time: "1 day ago" },
  ],
}

export default function Dashboard() {
  return (
    <AppShell>
      <div className="p-6 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-card-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Monitor your cost management activities and project performance
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unmapped POs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{dashboardMetrics.unmappedPOs}</div>
              <p className="text-xs text-muted-foreground">Requiring immediate attention</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total PO Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">
                ${(dashboardMetrics.totalPOValue / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">Across all active projects</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{dashboardMetrics.activeProjects}</div>
              <p className="text-xs text-muted-foreground">Currently being tracked</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{dashboardMetrics.budgetVariance}%</div>
              <p className="text-xs text-muted-foreground">Average across projects</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">PO Mapping Inbox</CardTitle>
                  <CardDescription>Map purchase orders to projects and spend categories</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Pending Mapping</p>
                  <p className="text-2xl font-bold text-card-foreground">{dashboardMetrics.unmappedPOs} POs</p>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Urgent
                </Badge>
              </div>
              <Link href="/po-mapping">
                <Button className="w-full group-hover:bg-primary/90 transition-colors">
                  Start Mapping
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Project Management</CardTitle>
                  <CardDescription>Track budgets, costs, and project performance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold text-card-foreground">{dashboardMetrics.activeProjects}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Tracking
                </Badge>
              </div>
              <Link href="/projects">
                <Button variant="secondary" className="w-full group-hover:bg-secondary/90 transition-colors">
                  View Projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest updates across your cost management workflows</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardMetrics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                  <div
                    className={`p-1.5 rounded-full ${
                      activity.type === "po_mapped"
                        ? "bg-primary/10"
                        : activity.type === "project_created"
                          ? "bg-secondary/10"
                          : "bg-accent/10"
                    }`}
                  >
                    {activity.type === "po_mapped" && <FileText className="h-3 w-3 text-primary" />}
                    {activity.type === "project_created" && <FolderOpen className="h-3 w-3 text-secondary" />}
                    {activity.type === "budget_updated" && <BarChart3 className="h-3 w-3 text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

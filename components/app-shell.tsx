"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileText, FolderOpen, Menu, ChevronRight, Home } from "lucide-react"

interface AppShellProps {
  children: React.ReactNode
}

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview and key metrics",
  },
  {
    name: "PO Mapping",
    href: "/po-mapping",
    icon: FileText,
    description: "Map purchase orders to projects",
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderOpen,
    description: "Manage project budgets and costs",
  },
]

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs = [{ name: "Dashboard", href: "/" }]

    if (segments.length > 0) {
      if (segments[0] === "po-mapping") {
        breadcrumbs.push({ name: "PO Mapping", href: "/po-mapping" })
      } else if (segments[0] === "projects") {
        breadcrumbs.push({ name: "Projects", href: "/projects" })
        if (segments[1] === "new") {
          breadcrumbs.push({ name: "New Project", href: "/projects/new" })
        }
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-card border-r border-border transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo and header */}
          <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
            <img src="/slb-logo-blue.jpg" alt="SLB Logo" className="h-10 w-14" />
            <div>
              <h1 className="text-lg font-semibold text-card-foreground">Cost Management Hub</h1>
              <p className="text-xs text-muted-foreground">For a Balanced Planet</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent/10 hover:text-accent-foreground",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <div className="text-xs text-muted-foreground">
              <div className="font-medium">SLB Cost Management</div>
              <div>Version 1.0</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                <Link
                  href={crumb.href}
                  className={cn(
                    "hover:text-foreground transition-colors",
                    index === breadcrumbs.length - 1 && "text-foreground font-medium",
                  )}
                >
                  {index === 0 && <Home className="h-4 w-4 mr-1" />}
                  {crumb.name}
                </Link>
              </div>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Welcome back, Resource Manager</div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

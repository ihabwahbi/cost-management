"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileText, FolderOpen, Menu } from "lucide-react"
import { useSidebarState } from "./hooks/use-sidebar-state"
import { Breadcrumbs } from "./components/breadcrumbs"
import { MobileSidebar } from "./components/mobile-sidebar"

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

/**
 * AppShell Cell - Application shell with navigation, breadcrumbs, and mobile sidebar
 * 
 * Behavioral Assertions:
 * - BA-001: Sidebar toggles on mobile menu click
 * - BA-002: Breadcrumbs update based on pathname
 * - BA-003: Active navigation item highlighted
 * - BA-004: Overlay click closes sidebar
 * - BA-005: Nav link click closes sidebar
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebarState()

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar with overlay - BA-004 */}
      <MobileSidebar isOpen={sidebarOpen} onClose={closeSidebar}>
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 transform bg-card border-r border-border transition-transform duration-200 ease-in-out lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          <div className="flex h-full flex-col">
            {/* Logo and header - Exact SLB Corporate Standard */}
            <div className="border-b border-border">
              <div className="quisitiveBrand">
                <div className="quisitiveBrandImage">
                  <a 
                    className="quisitiveBrandImageLink" 
                    title="Our Brand" 
                    data-interception="off" 
                    href="https://slb001.sharepoint.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img 
                      src="/SLB_Logo_Positive_RGB_General.svg"
                      alt="SLB Logo"
                    />
                  </a>
                </div>
                <div className="flex-1 ml-4">
                  <h1 className="text-lg font-semibold text-card-foreground">Cost Management Hub</h1>
                  <p className="text-xs text-muted-foreground">For a Balanced Planet</p>
                </div>
              </div>
            </div>

            {/* Navigation - BA-003, BA-005 */}
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
                    onClick={closeSidebar}
                    data-testid={`nav-link-${item.name.toLowerCase().replace(" ", "-")}`}
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
      </MobileSidebar>

      {/* Sidebar (desktop always visible) */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-card border-r border-border transition-transform duration-200 ease-in-out lg:translate-x-0 hidden lg:block"
        )}
      >
        {/* Same content as mobile sidebar for desktop */}
        <div className="flex h-full flex-col">
          <div className="border-b border-border">
            <div className="quisitiveBrand">
              <div className="quisitiveBrandImage">
                <a 
                  className="quisitiveBrandImageLink" 
                  title="Our Brand" 
                  data-interception="off" 
                  href="https://slb001.sharepoint.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img 
                    src="/SLB_Logo_Positive_RGB_General.svg"
                    alt="SLB Logo"
                  />
                </a>
              </div>
              <div className="flex-1 ml-4">
                <h1 className="text-lg font-semibold text-card-foreground">Cost Management Hub</h1>
                <p className="text-xs text-muted-foreground">For a Balanced Planet</p>
              </div>
            </div>
          </div>
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
                  data-testid={`nav-link-${item.name.toLowerCase().replace(" ", "-")}`}
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
        {/* Top header - BA-001 */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden" 
            onClick={openSidebar}
            data-testid="mobile-menu-button"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumbs - BA-002 */}
          <Breadcrumbs pathname={pathname} />

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

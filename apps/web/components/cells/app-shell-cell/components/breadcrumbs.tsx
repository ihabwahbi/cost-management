import Link from "next/link"
import { Home, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Breadcrumb {
  name: string
  href: string
}

interface BreadcrumbsProps {
  pathname: string
}

/**
 * Breadcrumbs component - generates navigation trail based on current route
 * Extracted from app-shell.tsx (lines 41-57) for M-CELL-3 compliance
 */
export function Breadcrumbs({ pathname }: BreadcrumbsProps) {
  const getBreadcrumbs = (): Breadcrumb[] => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs: Breadcrumb[] = [{ name: "Dashboard", href: "/" }]

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
            {index === 0 && <Home className="h-4 w-4 mr-1 inline" />}
            {crumb.name}
          </Link>
        </div>
      ))}
    </nav>
  )
}

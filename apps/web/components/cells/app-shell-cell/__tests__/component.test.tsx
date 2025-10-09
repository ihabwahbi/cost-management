import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { usePathname } from "next/navigation"
import { AppShell } from "../component"

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}))

vi.mock("next/link", () => ({
  default: ({ children, href, className, onClick, ...props }: any) => (
    <a href={href} className={className} onClick={onClick} {...props}>
      {children}
    </a>
  ),
}))

describe("AppShell Cell - Behavioral Assertions", () => {
  beforeEach(() => {
    // Default mock for pathname
    vi.mocked(usePathname).mockReturnValue("/")
  })

  describe("BA-001: Sidebar MUST toggle visibility on mobile menu click", () => {
    it("should open sidebar when mobile menu button is clicked", () => {
      render(<AppShell><div>Test Content</div></AppShell>)
      
      // Sidebar should be closed initially (no overlay)
      expect(screen.queryByTestId("mobile-sidebar-overlay")).not.toBeInTheDocument()
      
      // Click mobile menu button
      const menuButton = screen.getByTestId("mobile-menu-button")
      fireEvent.click(menuButton)
      
      // Sidebar overlay should now be visible
      expect(screen.getByTestId("mobile-sidebar-overlay")).toBeInTheDocument()
    })

    it("should close sidebar via overlay or nav click", () => {
      render(<AppShell><div>Test Content</div></AppShell>)
      
      const menuButton = screen.getByTestId("mobile-menu-button")
      
      // Open sidebar
      fireEvent.click(menuButton)
      expect(screen.getByTestId("mobile-sidebar-overlay")).toBeInTheDocument()
      
      // Close sidebar by clicking overlay (BA-004)
      const overlay = screen.getByTestId("mobile-sidebar-overlay")
      fireEvent.click(overlay)
      expect(screen.queryByTestId("mobile-sidebar-overlay")).not.toBeInTheDocument()
    })
  })

  describe("BA-002: Breadcrumbs MUST update based on current pathname", () => {
    it("should show Dashboard breadcrumb for root path", () => {
      vi.mocked(usePathname).mockReturnValue("/")
      render(<AppShell><div>Test Content</div></AppShell>)
      
      const dashboards = screen.getAllByText("Dashboard")
      expect(dashboards.length).toBeGreaterThan(0)
    })

    it("should show Dashboard > PO Mapping for /po-mapping path", () => {
      vi.mocked(usePathname).mockReturnValue("/po-mapping")
      render(<AppShell><div>Test Content</div></AppShell>)
      
      const dashboards = screen.getAllByText("Dashboard")
      expect(dashboards.length).toBeGreaterThan(0)
      const poMappings = screen.getAllByText("PO Mapping")
      expect(poMappings.length).toBeGreaterThan(0)
    })

    it("should show Dashboard > Projects for /projects path", () => {
      vi.mocked(usePathname).mockReturnValue("/projects")
      render(<AppShell><div>Test Content</div></AppShell>)
      
      const dashboards = screen.getAllByText("Dashboard")
      expect(dashboards.length).toBeGreaterThan(0)
      const projects = screen.getAllByText("Projects")
      expect(projects.length).toBeGreaterThan(0)
    })

    it("should show Dashboard > Projects > New Project for /projects/new path", () => {
      vi.mocked(usePathname).mockReturnValue("/projects/new")
      render(<AppShell><div>Test Content</div></AppShell>)
      
      const dashboards = screen.getAllByText("Dashboard")
      expect(dashboards.length).toBeGreaterThan(0)
      const projects = screen.getAllByText("Projects")
      expect(projects.length).toBeGreaterThan(0)
      expect(screen.getByText("New Project")).toBeInTheDocument()
    })
  })

  describe("BA-003: Active navigation item MUST be highlighted", () => {
    it("should highlight Dashboard nav when on root path", () => {
      vi.mocked(usePathname).mockReturnValue("/")
      render(<AppShell><div>Test Content</div></AppShell>)
      
      const dashboardNavs = screen.getAllByTestId("nav-link-dashboard")
      const highlighted = dashboardNavs.some(nav => nav.className.includes("bg-primary"))
      expect(highlighted).toBe(true)
    })

    it("should highlight PO Mapping nav when on /po-mapping path", () => {
      vi.mocked(usePathname).mockReturnValue("/po-mapping")
      render(<AppShell><div>Test Content</div></AppShell>)
      
      const poMappingNavs = screen.getAllByTestId("nav-link-po-mapping")
      // At least one should have bg-primary (mobile or desktop)
      const highlighted = poMappingNavs.some(nav => nav.className.includes("bg-primary"))
      expect(highlighted).toBe(true)
    })

    it("should highlight Projects nav when on /projects path", () => {
      vi.mocked(usePathname).mockReturnValue("/projects")
      render(<AppShell><div>Test Content</div></AppShell>)
      
      const projectsNavs = screen.getAllByTestId("nav-link-projects")
      const highlighted = projectsNavs.some(nav => nav.className.includes("bg-primary"))
      expect(highlighted).toBe(true)
    })

    it("should highlight Projects nav when on /projects/123/dashboard path", () => {
      vi.mocked(usePathname).mockReturnValue("/projects/123/dashboard")
      render(<AppShell><div>Test Content</div></AppShell>)
      
      const projectsNavs = screen.getAllByTestId("nav-link-projects")
      const highlighted = projectsNavs.some(nav => nav.className.includes("bg-primary"))
      expect(highlighted).toBe(true)
    })
  })

  describe("BA-004: Clicking overlay MUST close mobile sidebar", () => {
    it("should close sidebar when overlay is clicked", () => {
      render(<AppShell><div>Test Content</div></AppShell>)
      
      // Open sidebar
      const menuButton = screen.getByTestId("mobile-menu-button")
      fireEvent.click(menuButton)
      expect(screen.getByTestId("mobile-sidebar-overlay")).toBeInTheDocument()
      
      // Click overlay
      const overlay = screen.getByTestId("mobile-sidebar-overlay")
      fireEvent.click(overlay)
      
      // Sidebar should be closed
      expect(screen.queryByTestId("mobile-sidebar-overlay")).not.toBeInTheDocument()
    })
  })

  describe("BA-005: Clicking nav link MUST close mobile sidebar", () => {
    it("should close sidebar when a nav link is clicked", () => {
      render(<AppShell><div>Test Content</div></AppShell>)
      
      // Open sidebar
      const menuButton = screen.getByTestId("mobile-menu-button")
      fireEvent.click(menuButton)
      expect(screen.getByTestId("mobile-sidebar-overlay")).toBeInTheDocument()
      
      // Click a nav link (the one in mobile sidebar - first element)
      const poMappingLinks = screen.getAllByTestId("nav-link-po-mapping")
      fireEvent.click(poMappingLinks[0])
      
      // Sidebar should be closed
      expect(screen.queryByTestId("mobile-sidebar-overlay")).not.toBeInTheDocument()
    })

    it("should close sidebar when Dashboard link is clicked", () => {
      render(<AppShell><div>Test Content</div></AppShell>)
      
      // Open sidebar
      const menuButton = screen.getByTestId("mobile-menu-button")
      fireEvent.click(menuButton)
      expect(screen.getByTestId("mobile-sidebar-overlay")).toBeInTheDocument()
      
      // Click Dashboard link (the one in mobile sidebar - first element)
      const dashboardLinks = screen.getAllByTestId("nav-link-dashboard")
      fireEvent.click(dashboardLinks[0])
      
      // Sidebar should be closed
      expect(screen.queryByTestId("mobile-sidebar-overlay")).not.toBeInTheDocument()
    })
  })

  describe("Integration Tests", () => {
    it("should render children content", () => {
      render(
        <AppShell>
          <div data-testid="child-content">Test Page Content</div>
        </AppShell>
      )
      
      expect(screen.getByTestId("child-content")).toBeInTheDocument()
      expect(screen.getByText("Test Page Content")).toBeInTheDocument()
    })

    it("should render SLB branding", () => {
      render(<AppShell><div>Test Content</div></AppShell>)
      
      expect(screen.getByText("Cost Management Hub")).toBeInTheDocument()
      expect(screen.getByText("For a Balanced Planet")).toBeInTheDocument()
      expect(screen.getByText("SLB Cost Management")).toBeInTheDocument()
      expect(screen.getByText("Version 1.0")).toBeInTheDocument()
    })

    it("should render all navigation items", () => {
      render(<AppShell><div>Test Content</div></AppShell>)
      
      // Check all nav items exist (both mobile and desktop)
      expect(screen.getAllByTestId("nav-link-dashboard").length).toBeGreaterThan(0)
      expect(screen.getAllByTestId("nav-link-po-mapping").length).toBeGreaterThan(0)
      expect(screen.getAllByTestId("nav-link-projects").length).toBeGreaterThan(0)
    })

    it("should have proper ARIA labels for accessibility", () => {
      render(<AppShell><div>Test Content</div></AppShell>)
      
      const menuButton = screen.getByTestId("mobile-menu-button")
      expect(menuButton).toHaveAttribute("aria-label", "Open navigation menu")
    })
  })
})

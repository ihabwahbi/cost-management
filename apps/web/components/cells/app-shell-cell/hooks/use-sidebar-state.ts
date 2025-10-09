import { useState } from "react"

/**
 * Custom hook for managing mobile sidebar state
 * Extracted from app-shell.tsx to maintain M-CELL-3 compliance
 */
export function useSidebarState() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const openSidebar = () => setSidebarOpen(true)
  const closeSidebar = () => setSidebarOpen(false)
  const toggleSidebar = () => setSidebarOpen(prev => !prev)

  return {
    sidebarOpen,
    openSidebar,
    closeSidebar,
    toggleSidebar,
  }
}

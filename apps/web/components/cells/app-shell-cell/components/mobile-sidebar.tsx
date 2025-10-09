import type React from "react"

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

/**
 * Mobile sidebar component with overlay
 * Extracted from app-shell.tsx for M-CELL-3 compliance
 * Handles mobile-specific sidebar behavior and overlay
 */
export function MobileSidebar({ isOpen, onClose, children }: MobileSidebarProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Mobile sidebar overlay - BA-004 */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
        onClick={onClose}
        data-testid="mobile-sidebar-overlay"
      />
      {children}
    </>
  )
}

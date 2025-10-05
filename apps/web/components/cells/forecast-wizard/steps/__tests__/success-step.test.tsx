import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SuccessStep } from "../success-step"

describe("SuccessStep", () => {
  it("renders success message", () => {
    render(
      <SuccessStep
        versionNumber={5}
        onClose={vi.fn()}
      />
    )
    
    expect(screen.getByText("Success!")).toBeInTheDocument()
  })

  it("displays version number", () => {
    render(
      <SuccessStep
        versionNumber={5}
        onClose={vi.fn()}
      />
    )
    
    expect(
      screen.getByText(/Forecast version 5 has been created successfully/)
    ).toBeInTheDocument()
  })

  it("renders close button", () => {
    render(
      <SuccessStep
        versionNumber={5}
        onClose={vi.fn()}
      />
    )
    
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument()
  })

  it("calls onClose when close button clicked", () => {
    const mockOnClose = vi.fn()
    render(
      <SuccessStep
        versionNumber={5}
        onClose={mockOnClose}
      />
    )
    
    fireEvent.click(screen.getByRole("button", { name: /close/i }))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("renders view version button when onViewVersion provided", () => {
    render(
      <SuccessStep
        versionNumber={5}
        onClose={vi.fn()}
        onViewVersion={vi.fn()}
      />
    )
    
    expect(screen.getByRole("button", { name: /view version/i })).toBeInTheDocument()
  })

  it("does not render view version button when onViewVersion not provided", () => {
    render(
      <SuccessStep
        versionNumber={5}
        onClose={vi.fn()}
      />
    )
    
    expect(screen.queryByRole("button", { name: /view version/i })).not.toBeInTheDocument()
  })

  it("calls onViewVersion when view button clicked", () => {
    const mockOnViewVersion = vi.fn()
    render(
      <SuccessStep
        versionNumber={5}
        onClose={vi.fn()}
        onViewVersion={mockOnViewVersion}
      />
    )
    
    fireEvent.click(screen.getByRole("button", { name: /view version/i }))
    expect(mockOnViewVersion).toHaveBeenCalledTimes(1)
  })

  it("renders success icon", () => {
    const { container } = render(
      <SuccessStep
        versionNumber={5}
        onClose={vi.fn()}
      />
    )
    
    // Check for CheckCircle2 icon
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })
})

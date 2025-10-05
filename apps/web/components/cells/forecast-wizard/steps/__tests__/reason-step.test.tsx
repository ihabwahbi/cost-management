import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ReasonStep } from "../reason-step"

const mockChangeSummary = {
  modifiedCount: 5,
  newEntriesCount: 3,
  excludedCount: 2,
  totalChange: 150000,
  changePercentage: 12.5,
}

describe("ReasonStep", () => {
  it("renders alert with instruction message", () => {
    render(
      <ReasonStep
        reason=""
        onReasonChange={vi.fn()}
        changeSummary={mockChangeSummary}
      />
    )
    
    expect(
      screen.getByText(/Provide a clear reason for this forecast/)
    ).toBeInTheDocument()
  })

  it("renders textarea with current reason value", () => {
    render(
      <ReasonStep
        reason="Market conditions changed"
        onReasonChange={vi.fn()}
        changeSummary={mockChangeSummary}
      />
    )
    
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveValue("Market conditions changed")
  })

  it("calls onReasonChange when text is entered", () => {
    const mockOnChange = vi.fn()
    render(
      <ReasonStep
        reason=""
        onReasonChange={mockOnChange}
        changeSummary={mockChangeSummary}
      />
    )
    
    const textarea = screen.getByRole("textbox")
    fireEvent.change(textarea, { target: { value: "New reason" } })
    
    expect(mockOnChange).toHaveBeenCalledWith("New reason")
  })

  it("displays placeholder text", () => {
    render(
      <ReasonStep
        reason=""
        onReasonChange={vi.fn()}
        changeSummary={mockChangeSummary}
      />
    )
    
    expect(
      screen.getByPlaceholderText(/Explain the business rationale/)
    ).toBeInTheDocument()
  })

  it("displays items modified count", () => {
    render(
      <ReasonStep
        reason=""
        onReasonChange={vi.fn()}
        changeSummary={mockChangeSummary}
      />
    )
    
    expect(screen.getByText("5 existing")).toBeInTheDocument()
  })

  it("displays items added count", () => {
    render(
      <ReasonStep
        reason=""
        onReasonChange={vi.fn()}
        changeSummary={mockChangeSummary}
      />
    )
    
    expect(screen.getByText("3 new")).toBeInTheDocument()
  })

  it("displays items excluded count", () => {
    render(
      <ReasonStep
        reason=""
        onReasonChange={vi.fn()}
        changeSummary={mockChangeSummary}
      />
    )
    
    expect(screen.getByText("2 excluded")).toBeInTheDocument()
  })

  it("displays total change with correct formatting", () => {
    render(
      <ReasonStep
        reason=""
        onReasonChange={vi.fn()}
        changeSummary={mockChangeSummary}
      />
    )
    
    expect(screen.getByText("+$150,000")).toBeInTheDocument()
  })

  it("displays change percentage", () => {
    render(
      <ReasonStep
        reason=""
        onReasonChange={vi.fn()}
        changeSummary={mockChangeSummary}
      />
    )
    
    expect(screen.getByText("+12.5%")).toBeInTheDocument()
  })

  it("handles negative change values", () => {
    const negativeChangeSummary = {
      ...mockChangeSummary,
      totalChange: -50000,
      changePercentage: -5.2,
    }
    
    render(
      <ReasonStep
        reason=""
        onReasonChange={vi.fn()}
        changeSummary={negativeChangeSummary}
      />
    )
    
    expect(screen.getByText("-$50,000")).toBeInTheDocument()
    expect(screen.getByText("-5.2%")).toBeInTheDocument()
  })

  it("renders change summary card", () => {
    render(
      <ReasonStep
        reason=""
        onReasonChange={vi.fn()}
        changeSummary={mockChangeSummary}
      />
    )
    
    expect(screen.getByText("Change Summary")).toBeInTheDocument()
  })
})

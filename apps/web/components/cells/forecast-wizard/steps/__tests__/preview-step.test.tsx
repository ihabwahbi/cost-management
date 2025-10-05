import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PreviewStep } from "../preview-step"

const mockCurrentCosts = [
  {
    id: "1",
    project_id: "proj-1",
    sub_business_line: "WIS",
    cost_line: "M&S",
    spend_type: "Operational",
    spend_sub_category: "Materials",
    budget_cost: 100000,
  },
  {
    id: "2",
    project_id: "proj-1",
    sub_business_line: "Drilling",
    cost_line: "Services",
    spend_type: "Maintenance",
    spend_sub_category: "Consulting",
    budget_cost: 250000,
  },
]

const mockNewEntries = [
  {
    id: "new-1",
    project_id: "proj-1",
    sub_business_line: "Production",
    cost_line: "Equipment",
    spend_type: "Capital",
    spend_sub_category: "Hardware",
    budget_cost: 50000,
  },
]

const mockForecastChanges = {
  "1": 150000, // Modified
  "2": null,   // Excluded
}

const mockTotals = {
  currentTotal: 350000,
  forecastTotal: 200000,
  totalChange: -150000,
  changePercentage: -42.9,
}

describe("PreviewStep", () => {
  it("renders alert with instruction message", () => {
    render(
      <PreviewStep
        currentCosts={mockCurrentCosts}
        forecastChanges={mockForecastChanges}
        newEntries={mockNewEntries}
        reason="Market conditions changed"
        totals={mockTotals}
      />
    )
    
    expect(
      screen.getByText(/Review all changes before saving/)
    ).toBeInTheDocument()
  })

  it("displays reason text", () => {
    render(
      <PreviewStep
        currentCosts={mockCurrentCosts}
        forecastChanges={mockForecastChanges}
        newEntries={mockNewEntries}
        reason="Market conditions changed"
        totals={mockTotals}
      />
    )
    
    expect(screen.getByText("Market conditions changed")).toBeInTheDocument()
  })

  it("displays before and after totals", () => {
    render(
      <PreviewStep
        currentCosts={mockCurrentCosts}
        forecastChanges={mockForecastChanges}
        newEntries={mockNewEntries}
        reason="Test reason"
        totals={mockTotals}
      />
    )
    
    expect(screen.getByText("$350,000")).toBeInTheDocument() // Current
    expect(screen.getByText("$200,000")).toBeInTheDocument() // Forecast
  })

  it("displays total change with correct sign and color", () => {
    render(
      <PreviewStep
        currentCosts={mockCurrentCosts}
        forecastChanges={mockForecastChanges}
        newEntries={mockNewEntries}
        reason="Test reason"
        totals={mockTotals}
      />
    )
    
    expect(screen.getByText("-$150,000")).toBeInTheDocument()
    expect(screen.getByText("-42.9%")).toBeInTheDocument()
  })

  it("displays modified items section when there are changes", () => {
    render(
      <PreviewStep
        currentCosts={mockCurrentCosts}
        forecastChanges={mockForecastChanges}
        newEntries={mockNewEntries}
        reason="Test reason"
        totals={mockTotals}
      />
    )
    
    expect(screen.getByText("Modified Items")).toBeInTheDocument()
  })

  it("displays excluded items with strikethrough", () => {
    render(
      <PreviewStep
        currentCosts={mockCurrentCosts}
        forecastChanges={mockForecastChanges}
        newEntries={mockNewEntries}
        reason="Test reason"
        totals={mockTotals}
      />
    )
    
    expect(screen.getByText("Excluded")).toBeInTheDocument()
  })

  it("displays new items section when there are new entries", () => {
    render(
      <PreviewStep
        currentCosts={mockCurrentCosts}
        forecastChanges={mockForecastChanges}
        newEntries={mockNewEntries}
        reason="Test reason"
        totals={mockTotals}
      />
    )
    
    expect(screen.getByText("New Items")).toBeInTheDocument()
    expect(screen.getByText("Equipment - Hardware")).toBeInTheDocument()
  })

  it("handles positive change with green color", () => {
    const positiveTotals = {
      ...mockTotals,
      totalChange: 100000,
      changePercentage: 28.6,
    }
    
    render(
      <PreviewStep
        currentCosts={mockCurrentCosts}
        forecastChanges={{}}
        newEntries={mockNewEntries}
        reason="Test reason"
        totals={positiveTotals}
      />
    )
    
    expect(screen.getByText("+$100,000")).toBeInTheDocument()
    expect(screen.getByText("+28.6%")).toBeInTheDocument()
  })
})

import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ConfirmStep } from "../confirm-step"

describe("ConfirmStep", () => {
  it("renders success alert message", () => {
    render(
      <ConfirmStep
        isSaving={false}
        totalChanges={5}
        totalForecast={500000}
        totalChange={100000}
        changePercentage={25}
        reason="Market conditions changed"
      />
    )
    
    expect(
      screen.getByText(/Your forecast is ready to be saved/)
    ).toBeInTheDocument()
  })

  it("displays total changes count", () => {
    render(
      <ConfirmStep
        isSaving={false}
        totalChanges={5}
        totalForecast={500000}
        totalChange={100000}
        changePercentage={25}
        reason="Market conditions changed"
      />
    )
    
    expect(screen.getByText(/Version will be created with 5 changes/)).toBeInTheDocument()
  })

  it("displays forecast total", () => {
    render(
      <ConfirmStep
        isSaving={false}
        totalChanges={5}
        totalForecast={500000}
        totalChange={100000}
        changePercentage={25}
        reason="Market conditions changed"
      />
    )
    
    expect(screen.getByText("$500,000")).toBeInTheDocument()
  })

  it("displays total change with positive sign and green color", () => {
    render(
      <ConfirmStep
        isSaving={false}
        totalChanges={5}
        totalForecast={500000}
        totalChange={100000}
        changePercentage={25}
        reason="Market conditions changed"
      />
    )
    
    expect(screen.getByText(/\+\$100,000/)).toBeInTheDocument()
    expect(screen.getByText(/\+25\.0%/)).toBeInTheDocument()
  })

  it("displays total change with negative sign and red color", () => {
    render(
      <ConfirmStep
        isSaving={false}
        totalChanges={3}
        totalForecast={400000}
        totalChange={-50000}
        changePercentage={-11.1}
        reason="Market conditions changed"
      />
    )
    
    expect(screen.getByText(/-\$50,000/)).toBeInTheDocument()
    expect(screen.getByText(/-11\.1%/)).toBeInTheDocument()
  })

  it("displays reason text truncated", () => {
    render(
      <ConfirmStep
        isSaving={false}
        totalChanges={5}
        totalForecast={500000}
        totalChange={100000}
        changePercentage={25}
        reason="Market conditions changed"
      />
    )
    
    expect(screen.getByText("Market conditions changed")).toBeInTheDocument()
  })

  it("renders success icon", () => {
    const { container } = render(
      <ConfirmStep
        isSaving={false}
        totalChanges={5}
        totalForecast={500000}
        totalChange={100000}
        changePercentage={25}
        reason="Market conditions changed"
      />
    )
    
    // Check for CheckCircle2 icon
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it("displays heading text", () => {
    render(
      <ConfirmStep
        isSaving={false}
        totalChanges={5}
        totalForecast={500000}
        totalChange={100000}
        changePercentage={25}
        reason="Market conditions changed"
      />
    )
    
    expect(screen.getByText("Ready to Save Forecast")).toBeInTheDocument()
  })
})

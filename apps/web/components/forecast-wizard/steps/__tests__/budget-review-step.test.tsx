import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { BudgetReviewStep } from "../budget-review-step"

const mockCosts = [
  {
    id: "1",
    project_id: "project-1",
    sub_business_line: "WIS",
    cost_line: "M&S",
    spend_type: "Operational",
    spend_sub_category: "Materials",
    budget_cost: 100000,
  },
  {
    id: "2",
    project_id: "project-1",
    sub_business_line: "Drilling",
    cost_line: "Services",
    spend_type: "Maintenance",
    spend_sub_category: "Consulting",
    budget_cost: 250000,
  },
  {
    id: "3",
    project_id: "project-1",
    sub_business_line: "Production",
    cost_line: "Equipment",
    spend_type: "Capital",
    spend_sub_category: "Hardware",
    budget_cost: 500000,
  },
]

describe("BudgetReviewStep", () => {
  it("renders alert with instruction message", () => {
    render(<BudgetReviewStep costs={mockCosts} projectName="Test Project" />)
    
    expect(
      screen.getByText(/Review the current budget before making modifications/)
    ).toBeInTheDocument()
  })

  it("displays correct total budget", () => {
    render(<BudgetReviewStep costs={mockCosts} projectName="Test Project" />)
    
    // Total: 100,000 + 250,000 + 500,000 = 850,000
    expect(screen.getByText("$850,000")).toBeInTheDocument()
  })

  it("displays correct line items count", () => {
    render(<BudgetReviewStep costs={mockCosts} projectName="Test Project" />)
    
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("renders all cost entries in table", () => {
    render(<BudgetReviewStep costs={mockCosts} projectName="Test Project" />)
    
    // Check all cost lines are displayed
    expect(screen.getByText("M&S")).toBeInTheDocument()
    expect(screen.getByText("Services")).toBeInTheDocument()
    expect(screen.getByText("Equipment")).toBeInTheDocument()
    
    // Check all spend types
    expect(screen.getByText("Operational")).toBeInTheDocument()
    expect(screen.getByText("Maintenance")).toBeInTheDocument()
    expect(screen.getByText("Capital")).toBeInTheDocument()
    
    // Check all sub categories
    expect(screen.getByText("Materials")).toBeInTheDocument()
    expect(screen.getByText("Consulting")).toBeInTheDocument()
    expect(screen.getByText("Hardware")).toBeInTheDocument()
  })

  it("formats currency correctly", () => {
    render(<BudgetReviewStep costs={mockCosts} projectName="Test Project" />)
    
    // Check individual amounts are formatted
    expect(screen.getByText("$100,000")).toBeInTheDocument()
    expect(screen.getByText("$250,000")).toBeInTheDocument()
    expect(screen.getByText("$500,000")).toBeInTheDocument()
  })

  it("renders budget summary card", () => {
    render(<BudgetReviewStep costs={mockCosts} projectName="Test Project" />)
    
    expect(screen.getByText("Current Budget Summary")).toBeInTheDocument()
    expect(screen.getByText("Total Budget")).toBeInTheDocument()
    expect(screen.getByText("Line Items")).toBeInTheDocument()
    expect(screen.getByText("Last Updated")).toBeInTheDocument()
  })

  it("handles empty costs array", () => {
    render(<BudgetReviewStep costs={[]} projectName="Test Project" />)
    
    // Should show $0 for total
    expect(screen.getByText("$0")).toBeInTheDocument()
    
    // Should show 0 for line items
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("renders table headers correctly", () => {
    render(<BudgetReviewStep costs={mockCosts} projectName="Test Project" />)
    
    expect(screen.getByText("Cost Line")).toBeInTheDocument()
    expect(screen.getByText("Type")).toBeInTheDocument()
    expect(screen.getByText("Sub Category")).toBeInTheDocument()
    expect(screen.getByText("Amount")).toBeInTheDocument()
  })

  it("displays current status indicator", () => {
    render(<BudgetReviewStep costs={mockCosts} projectName="Test Project" />)
    
    expect(screen.getByText("Current")).toBeInTheDocument()
  })
})

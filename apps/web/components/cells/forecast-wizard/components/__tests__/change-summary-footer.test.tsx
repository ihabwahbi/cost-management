import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChangeSummaryFooter } from '../change-summary-footer'

describe('ChangeSummaryFooter', () => {
  it('displays correct total count with no changes', () => {
    render(
      <ChangeSummaryFooter
        modifiedCount={0}
        newEntriesCount={0}
        totalChange={0}
        changePercentage={0}
      />
    )

    expect(screen.getByText('Total Changes: 0 items')).toBeInTheDocument()
  })

  it('displays correct count with only modifications', () => {
    render(
      <ChangeSummaryFooter
        modifiedCount={5}
        newEntriesCount={0}
        totalChange={10000}
        changePercentage={5.5}
      />
    )

    expect(screen.getByText('Total Changes: 5 items')).toBeInTheDocument()
  })

  it('displays correct count with only new entries', () => {
    render(
      <ChangeSummaryFooter
        modifiedCount={0}
        newEntriesCount={3}
        totalChange={15000}
        changePercentage={7.2}
      />
    )

    expect(screen.getByText('Total Changes: 3 items')).toBeInTheDocument()
  })

  it('displays breakdown when both modifications and new entries exist', () => {
    render(
      <ChangeSummaryFooter
        modifiedCount={5}
        newEntriesCount={3}
        totalChange={25000}
        changePercentage={12.5}
      />
    )

    expect(screen.getByText(/Total Changes: 8 items/)).toBeInTheDocument()
    expect(screen.getByText(/(5 modified, 3 new)/)).toBeInTheDocument()
  })

  it('displays formatted currency for positive change', () => {
    render(
      <ChangeSummaryFooter
        modifiedCount={3}
        newEntriesCount={2}
        totalChange={50000}
        changePercentage={10}
      />
    )

    expect(screen.getByText(/\+\$50,000/)).toBeInTheDocument()
  })

  it('displays formatted currency for negative change', () => {
    render(
      <ChangeSummaryFooter
        modifiedCount={3}
        newEntriesCount={0}
        totalChange={-30000}
        changePercentage={-6}
      />
    )

    expect(screen.getByText(/-\$30,000/)).toBeInTheDocument()
  })

  it('displays percentage with correct sign for increase', () => {
    render(
      <ChangeSummaryFooter
        modifiedCount={2}
        newEntriesCount={1}
        totalChange={25000}
        changePercentage={12.5}
      />
    )

    expect(screen.getByText(/\+12.5%/)).toBeInTheDocument()
  })

  it('displays percentage with correct sign for decrease', () => {
    render(
      <ChangeSummaryFooter
        modifiedCount={2}
        newEntriesCount={0}
        totalChange={-15000}
        changePercentage={-7.5}
      />
    )

    expect(screen.getByText(/-7.5%/)).toBeInTheDocument()
  })

  it('hides change badge when totalChange is 0', () => {
    render(
      <ChangeSummaryFooter
        modifiedCount={0}
        newEntriesCount={0}
        totalChange={0}
        changePercentage={0}
      />
    )

    expect(screen.queryByText(/Change:/)).not.toBeInTheDocument()
  })

  it('applies default variant for positive change', () => {
    render(
      <ChangeSummaryFooter
        modifiedCount={1}
        newEntriesCount={1}
        totalChange={10000}
        changePercentage={5}
      />
    )

    // Check for positive change badge exists
    expect(screen.getByText(/\+\$10,000/)).toBeInTheDocument()
  })

  it('applies destructive variant for negative change', () => {
    render(
      <ChangeSummaryFooter
        modifiedCount={1}
        newEntriesCount={0}
        totalChange={-10000}
        changePercentage={-5}
      />
    )

    // Check for negative change badge exists
    expect(screen.getByText(/-\$10,000/)).toBeInTheDocument()
  })

  it('formats large numbers with commas', () => {
    render(
      <ChangeSummaryFooter
        modifiedCount={10}
        newEntriesCount={5}
        totalChange={1234567}
        changePercentage={50}
      />
    )

    expect(screen.getByText(/\$1,234,567/)).toBeInTheDocument()
  })

  it('rounds percentage to one decimal place', () => {
    render(
      <ChangeSummaryFooter
        modifiedCount={3}
        newEntriesCount={2}
        totalChange={12345}
        changePercentage={6.789}
      />
    )

    expect(screen.getByText(/6.8%/)).toBeInTheDocument()
  })
})

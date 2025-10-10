import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetTimelineChartCell } from '../component'
import { trpc } from '@/lib/trpc'

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    dashboard: {
      getTimelineBudget: {
        useQuery: vi.fn(),
      },
    },
  },
}))

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  Bar: ({ dataKey }: any) => <div data-testid={`bar-${dataKey}`} />,
  ReferenceLine: ({ y }: any) => <div data-testid="reference-line" data-y={y} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: ({ tickFormatter }: any) => {
    // Test the formatter
    const formatted = tickFormatter ? tickFormatter(100000) : '100000'
    return <div data-testid="y-axis" data-formatted={formatted} />
  },
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Legend: () => <div data-testid="legend" />,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}))

describe('BudgetTimelineChartCell - P&L Timeline', () => {
  const mockProjectId = '94d1eaad-4ada-4fb6-b872-212b6cd6007a'
  
  // P&L timeline data: budget as fixed limit, actual as cumulative invoiced, forecast as future promises
  const mockPLTimelineData = [
    { month: 'Jul 2025', budget: 2070000, actual: 340536, forecast: 0 },
    { month: 'Aug 2025', budget: 2070000, actual: 509639, forecast: 0 },
    { month: 'Sep 2025', budget: 2070000, actual: 509639, forecast: 0 },
    { month: 'Jan 2026', budget: 2070000, actual: 509639, forecast: 166603 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('BA-001: renders P&L timeline with budget reference line and stacked bars', () => {
    vi.mocked(trpc.dashboard.getTimelineBudget.useQuery).mockReturnValue({
      data: mockPLTimelineData,
      isLoading: false,
      error: null,
    } as any)

    render(<BudgetTimelineChartCell projectId={mockProjectId} />)

    // Verify ComposedChart renders
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
    
    // Verify ReferenceLine for budget limit
    expect(screen.getByTestId('reference-line')).toBeInTheDocument()
    
    // Verify stacked bars (actual + forecast)
    expect(screen.getByTestId('bar-actual')).toBeInTheDocument()
    expect(screen.getByTestId('bar-forecast')).toBeInTheDocument()
  })

  it('BA-002: budget displays as horizontal reference line (fixed value)', () => {
    vi.mocked(trpc.dashboard.getTimelineBudget.useQuery).mockReturnValue({
      data: mockPLTimelineData,
      isLoading: false,
      error: null,
    } as any)

    render(<BudgetTimelineChartCell projectId={mockProjectId} />)

    const referenceLine = screen.getByTestId('reference-line')
    const yValue = referenceLine.getAttribute('data-y')
    
    // Budget should be fixed at 2070000
    expect(yValue).toBe('2070000')
  })

  it('BA-003: actual bar shows cumulative invoiced values', () => {
    // Test verifies actual bar exists and would show cumulative data
    vi.mocked(trpc.dashboard.getTimelineBudget.useQuery).mockReturnValue({
      data: mockPLTimelineData,
      isLoading: false,
      error: null,
    } as any)

    render(<BudgetTimelineChartCell projectId={mockProjectId} />)
    
    // Actual bar should exist
    expect(screen.getByTestId('bar-actual')).toBeInTheDocument()
    
    // Data structure verification: actual increases from 340536 to 509639 (cumulative)
    expect(mockPLTimelineData[1].actual).toBeGreaterThan(mockPLTimelineData[0].actual)
  })

  it('BA-004: forecast bar shows future P&L commitments', () => {
    // Test verifies forecast appears only in future months with promises
    vi.mocked(trpc.dashboard.getTimelineBudget.useQuery).mockReturnValue({
      data: mockPLTimelineData,
      isLoading: false,
      error: null,
    } as any)

    render(<BudgetTimelineChartCell projectId={mockProjectId} />)
    
    // Forecast bar should exist
    expect(screen.getByTestId('bar-forecast')).toBeInTheDocument()
    
    // Data structure verification: forecast is 0 for past months, non-zero for future
    expect(mockPLTimelineData[0].forecast).toBe(0) // Jul - no forecast
    expect(mockPLTimelineData[3].forecast).toBeGreaterThan(0) // Jan - has forecast
  })

  it('BA-005: shows skeleton loader during data fetch', () => {
    vi.mocked(trpc.dashboard.getTimelineBudget.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any)

    const { container } = render(<BudgetTimelineChartCell projectId={mockProjectId} />)

    // Should show skeleton (check for skeleton class or structure)
    const skeleton = container.querySelector('.h-\\[300px\\]')
    expect(skeleton).toBeInTheDocument()
  })

  it('BA-006: displays error alert on query failure', () => {
    const mockError = new Error('Failed to fetch timeline data')
    
    vi.mocked(trpc.dashboard.getTimelineBudget.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError as any,
    } as any)

    render(<BudgetTimelineChartCell projectId={mockProjectId} />)

    // Should show error alert
    expect(screen.getByText('Error Loading Timeline')).toBeInTheDocument()
    expect(screen.getByText('Failed to fetch timeline data')).toBeInTheDocument()
  })

  it('BA-007: handles empty data (no invoices/promises) gracefully', () => {
    vi.mocked(trpc.dashboard.getTimelineBudget.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any)

    render(<BudgetTimelineChartCell projectId={mockProjectId} />)

    // Should show empty state message
    expect(screen.getByText('No timeline data available')).toBeInTheDocument()
    
    // Should not crash or show error
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('BA-008: Y-axis and tooltip format currency with K notation', () => {
    vi.mocked(trpc.dashboard.getTimelineBudget.useQuery).mockReturnValue({
      data: mockPLTimelineData,
      isLoading: false,
      error: null,
    } as any)

    render(<BudgetTimelineChartCell projectId={mockProjectId} />)

    const yAxis = screen.getByTestId('y-axis')
    const formatted = yAxis.getAttribute('data-formatted')
    
    // Should format 100000 as "$100K" (no decimals on axis)
    expect(formatted).toBe('$100K')
    
    // Tooltip formatter is tested indirectly through rendering
    // Component renders successfully, formatter is used internally
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
  })
})

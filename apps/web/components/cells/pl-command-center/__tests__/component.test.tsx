import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PLCommandCenter } from '../component';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    dashboard: {
      getPLMetrics: {
        useQuery: vi.fn()
      },
      getPLTimeline: {
        useQuery: vi.fn()
      },
      getPromiseDates: {
        useQuery: vi.fn()
      }
    }
  }
}));

// Mock Zustand store
vi.mock('../state', () => ({
  usePLCommandCenterStore: vi.fn(() => ({
    isLive: true,
    toggleLive: vi.fn()
  }))
}));

import { trpc } from '@/lib/trpc';

const mockPLMetrics = {
  totalBudget: 1000000,
  totalCommitted: 750000,
  actualPLImpact: 500000,
  futurePLImpact: 250000,
  plGap: 250000
};

const mockTimeline = [
  { month: 'Jan', year: 2025, actualPL: 100000, projectedPL: 50000, cumulative: 150000 },
  { month: 'Feb', year: 2025, actualPL: 150000, projectedPL: 75000, cumulative: 375000 },
  { month: 'Mar', year: 2025, actualPL: 125000, projectedPL: 60000, cumulative: 560000 },
  { month: 'Apr', year: 2025, actualPL: 75000, projectedPL: 40000, cumulative: 675000 },
  { month: 'May', year: 2025, actualPL: 50000, projectedPL: 25000, cumulative: 750000 },
  { month: 'Jun', year: 2025, actualPL: 0, projectedPL: 50000, cumulative: 800000 }
];

const mockPromiseDates = [
  { date: '2025-02-15', amount: 50000, supplierName: 'Acme Corp', lineItemCount: 5 },
  { date: '2025-03-01', amount: 75000, supplierName: 'Beta Inc', lineItemCount: 3 }
];

describe('PLCommandCenter Cell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BA-010: Loading state', () => {
    it('shows spinner while data is fetching', () => {
      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });

      const { container } = render(<PLCommandCenter projectId="test-project-id" />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('border-blue-600');
    });
  });

  describe('Error state', () => {
    it('displays error message when query fails', () => {
      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch')
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: null,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: null,
        isLoading: false,
        error: null
      });

      render(<PLCommandCenter projectId="test-project-id" />);

      expect(screen.getByText('Failed to load P&L metrics')).toBeInTheDocument();
    });
  });

  describe('BA-001: Budget bar', () => {
    it('displays budget bar at 100% width', () => {
      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: mockPLMetrics,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: mockTimeline,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: mockPromiseDates,
        isLoading: false,
        error: null
      });

      render(<PLCommandCenter projectId="test-project-id" />);

      const budgetBar = screen.getByTestId('budget-bar');
      expect(budgetBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('BA-002: Committed bar calculation', () => {
    it('calculates committed bar width as (committed/budget) * 100', () => {
      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: mockPLMetrics,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: mockTimeline,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: mockPromiseDates,
        isLoading: false,
        error: null
      });

      render(<PLCommandCenter projectId="test-project-id" />);

      const committedBar = screen.getByTestId('committed-bar');
      // 750000 / 1000000 = 75%
      expect(committedBar).toHaveStyle({ width: '75%' });
    });

    it('caps committed bar at 100% when over budget', () => {
      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: {
          ...mockPLMetrics,
          totalCommitted: 1200000, // Over budget
        },
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: mockTimeline,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: mockPromiseDates,
        isLoading: false,
        error: null
      });

      render(<PLCommandCenter projectId="test-project-id" />);

      const committedBar = screen.getByTestId('committed-bar');
      // 1200000 / 1000000 = 120%, capped at 100%
      expect(committedBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('BA-003: P&L Impact bar calculation', () => {
    it('calculates P&L impact bar width as (plImpact/budget) * 100', () => {
      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: mockPLMetrics,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: mockTimeline,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: mockPromiseDates,
        isLoading: false,
        error: null
      });

      render(<PLCommandCenter projectId="test-project-id" />);

      const plImpactBar = screen.getByTestId('pl-impact-bar');
      // 500000 / 1000000 = 50%
      expect(plImpactBar).toHaveStyle({ width: '50%' });
    });
  });

  describe('BA-004: P&L Gap calculation', () => {
    it('displays gap value equal to committed - plImpact', () => {
      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: mockPLMetrics,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: mockTimeline,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: mockPromiseDates,
        isLoading: false,
        error: null
      });

      render(<PLCommandCenter projectId="test-project-id" />);

      const gapAnalysis = screen.getByTestId('gap-analysis');
      // Gap = 750000 - 500000 = 250000
      // Formatted as $250,000 (not compact because < 1M)
      expect(gapAnalysis).toHaveTextContent('$250,000');
      expect(gapAnalysis).toHaveTextContent('Future P&L Impact');
    });
  });

  describe('BA-005: Gap indicator conditional rendering', () => {
    it('shows gap indicator when plGap > 0', () => {
      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: mockPLMetrics,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: mockTimeline,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: mockPromiseDates,
        isLoading: false,
        error: null
      });

      render(<PLCommandCenter projectId="test-project-id" />);

      const gapIndicator = screen.getByTestId('gap-indicator');
      expect(gapIndicator).toBeInTheDocument();
      expect(gapIndicator).toHaveTextContent('Open PO (Not Yet Invoiced)');
    });

    it('hides gap indicator when plGap = 0', () => {
      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: {
          ...mockPLMetrics,
          plGap: 0
        },
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: mockTimeline,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: mockPromiseDates,
        isLoading: false,
        error: null
      });

      render(<PLCommandCenter projectId="test-project-id" />);

      expect(screen.queryByTestId('gap-indicator')).not.toBeInTheDocument();
      expect(screen.queryByTestId('gap-analysis')).not.toBeInTheDocument();
    });
  });

  describe('BA-006: Monthly breakdown display limit', () => {
    it('displays up to 6 months only', () => {
      const manyMonths = [
        ...mockTimeline,
        { month: 'Jul', year: 2025, actualPL: 30000, projectedPL: 20000, cumulative: 850000 },
        { month: 'Aug', year: 2025, actualPL: 25000, projectedPL: 15000, cumulative: 890000 }
      ];

      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: mockPLMetrics,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: manyMonths,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: mockPromiseDates,
        isLoading: false,
        error: null
      });

      render(<PLCommandCenter projectId="test-project-id" />);

      const monthlyBreakdown = screen.getByTestId('monthly-breakdown');
      const monthLabels = monthlyBreakdown.querySelectorAll('.text-center > .text-xs');
      
      // Should display only 6 months
      expect(monthLabels.length).toBe(6);
      expect(monthLabels[0]).toHaveTextContent('Jan');
      expect(monthLabels[5]).toHaveTextContent('Jun');
    });
  });

  describe('BA-007: Actual costs render as green bars', () => {
    it('renders actual cost bars with green background', () => {
      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: mockPLMetrics,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: mockTimeline,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: mockPromiseDates,
        isLoading: false,
        error: null
      });

      render(<PLCommandCenter projectId="test-project-id" />);

      const actualBars = screen.getAllByTestId('actual-bar');
      actualBars.forEach(bar => {
        expect(bar).toHaveClass('bg-green-500');
      });
    });
  });

  describe('BA-008: Projected costs render as amber bars with opacity', () => {
    it('renders projected cost bars with amber background and opacity', () => {
      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: mockPLMetrics,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: mockTimeline,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: mockPromiseDates,
        isLoading: false,
        error: null
      });

      render(<PLCommandCenter projectId="test-project-id" />);

      const projectedBars = screen.getAllByTestId('projected-bar');
      projectedBars.forEach(bar => {
        expect(bar).toHaveClass('bg-amber-400');
        expect(bar).toHaveClass('opacity-75');
      });
    });
  });

  describe('BA-009: Currency formatting', () => {
    it('formats large numbers with appropriate notation', () => {
      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: {
          ...mockPLMetrics,
          totalBudget: 5000000, // Use > 1M to test compact notation
        },
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: mockTimeline,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: mockPromiseDates,
        isLoading: false,
        error: null
      });

      render(<PLCommandCenter projectId="test-project-id" />);

      // Budget: $5,000,000 should be formatted with compact notation
      expect(screen.getByText('$5M')).toBeInTheDocument();
    });

    it('formats numbers under 1M without compact notation', () => {
      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: mockPLMetrics, // $1,000,000
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: mockTimeline,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: mockPromiseDates,
        isLoading: false,
        error: null
      });

      render(<PLCommandCenter projectId="test-project-id" />);

      // Budget: $1,000,000 should be formatted as standard
      expect(screen.getByText('$1,000,000')).toBeInTheDocument();
    });
  });

  describe('Component accessibility', () => {
    it('has appropriate aria-label for the card', () => {
      (trpc.dashboard.getPLMetrics.useQuery as any).mockReturnValue({
        data: mockPLMetrics,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPLTimeline.useQuery as any).mockReturnValue({
        data: mockTimeline,
        isLoading: false,
        error: null
      });
      (trpc.dashboard.getPromiseDates.useQuery as any).mockReturnValue({
        data: mockPromiseDates,
        isLoading: false,
        error: null
      });

      render(<PLCommandCenter projectId="test-project-id" />);

      const card = screen.getByLabelText('P&L Command Center');
      expect(card).toBeInTheDocument();
    });
  });
});

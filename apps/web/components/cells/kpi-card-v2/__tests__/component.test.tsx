import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KPICardV2 } from '../component';
import { trpc } from '@/lib/trpc';

// Mock the tRPC client
vi.mock('@/lib/trpc', () => ({
  trpc: {
    dashboard: {
      getKPIMetrics: {
        useQuery: vi.fn(),
      },
    },
  },
}));

describe('KPICardV2 - Smart KPI Card Cell', () => {
  const mockProjectId = '550e8400-e29b-41d4-a716-446655440000';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BA-001: Cell MUST fetch project metrics via trpc.dashboard.getKPIMetrics', () => {
    it('should call tRPC query with correct projectId', () => {
      // Mock loading state
      vi.mocked(trpc.dashboard.getKPIMetrics.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      render(<KPICardV2 projectId={mockProjectId} />);

      // Verify tRPC query was called with correct projectId
      expect(trpc.dashboard.getKPIMetrics.useQuery).toHaveBeenCalledWith({
        projectId: mockProjectId,
      });
    });
  });

  describe('BA-002: Budget total MUST display with currency formatting', () => {
    it('should format budgetTotal=150000 as "$150,000.00"', async () => {
      vi.mocked(trpc.dashboard.getKPIMetrics.useQuery).mockReturnValue({
        data: {
          budgetTotal: 150000,
          committed: 120000,
          variance: 30000,
          variancePercent: 20,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<KPICardV2 projectId={mockProjectId} />);

      // Wait for data to render
      await waitFor(() => {
        const budgetElement = screen.getByTestId('budget-total');
        expect(budgetElement).toHaveTextContent('$150,000.00');
      });
    });

    it('should format small amounts correctly', async () => {
      vi.mocked(trpc.dashboard.getKPIMetrics.useQuery).mockReturnValue({
        data: {
          budgetTotal: 1234.56,
          committed: 1000,
          variance: 234.56,
          variancePercent: 19,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<KPICardV2 projectId={mockProjectId} />);

      await waitFor(() => {
        const budgetElement = screen.getByTestId('budget-total');
        expect(budgetElement).toHaveTextContent('$1,234.56');
      });
    });
  });

  describe('BA-003: Committed amount MUST display with calculated variance', () => {
    it('should display variance calculation (budgetTotal - committed)', async () => {
      const budgetTotal = 150000;
      const committed = 120000;
      const expectedVariance = budgetTotal - committed; // 30000

      vi.mocked(trpc.dashboard.getKPIMetrics.useQuery).mockReturnValue({
        data: {
          budgetTotal,
          committed,
          variance: expectedVariance,
          variancePercent: 20,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<KPICardV2 projectId={mockProjectId} />);

      await waitFor(() => {
        // Check committed amount is displayed
        expect(screen.getByText(/Committed:/)).toBeInTheDocument();
        expect(screen.getByText(/\$120,000\.00/)).toBeInTheDocument();
        
        // Check variance is displayed correctly
        const varianceElement = screen.getByTestId('variance-indicator');
        expect(varianceElement).toHaveTextContent('$30,000.00');
      });
    });
  });

  describe('BA-004: Variance indicator MUST show green when under budget, red when over budget', () => {
    it('should show green color for positive variance (under budget)', async () => {
      vi.mocked(trpc.dashboard.getKPIMetrics.useQuery).mockReturnValue({
        data: {
          budgetTotal: 150000,
          committed: 120000,
          variance: 30000, // Positive = under budget
          variancePercent: 20,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<KPICardV2 projectId={mockProjectId} />);

      await waitFor(() => {
        const varianceElement = screen.getByTestId('variance-indicator');
        // Check for green background class
        expect(varianceElement).toHaveClass('bg-green-50');
        // Check for green text class in child elements
        const textElements = varianceElement.querySelectorAll('.text-green-600');
        expect(textElements.length).toBeGreaterThan(0);
      });
    });

    it('should show red color for negative variance (over budget)', async () => {
      vi.mocked(trpc.dashboard.getKPIMetrics.useQuery).mockReturnValue({
        data: {
          budgetTotal: 150000,
          committed: 180000,
          variance: -30000, // Negative = over budget
          variancePercent: -20,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<KPICardV2 projectId={mockProjectId} />);

      await waitFor(() => {
        const varianceElement = screen.getByTestId('variance-indicator');
        // Check for red background class
        expect(varianceElement).toHaveClass('bg-red-50');
        // Check for red text class in child elements
        const textElements = varianceElement.querySelectorAll('.text-red-600');
        expect(textElements.length).toBeGreaterThan(0);
      });
    });

    it('should show neutral color for zero variance (on budget)', async () => {
      vi.mocked(trpc.dashboard.getKPIMetrics.useQuery).mockReturnValue({
        data: {
          budgetTotal: 150000,
          committed: 150000,
          variance: 0,
          variancePercent: 0,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<KPICardV2 projectId={mockProjectId} />);

      await waitFor(() => {
        const varianceElement = screen.getByTestId('variance-indicator');
        // Check for gray background class
        expect(varianceElement).toHaveClass('bg-gray-50');
      });
    });
  });

  describe('BA-005: Loading state MUST show Skeleton component', () => {
    it('should render Skeleton components while data is fetching', () => {
      vi.mocked(trpc.dashboard.getKPIMetrics.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      render(<KPICardV2 projectId={mockProjectId} />);

      // Check for Card with loading aria-label
      expect(screen.getByLabelText('Budget KPI Card Loading')).toBeInTheDocument();
      
      // Skeleton components should be present (they have specific styling)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('BA-006: Error state MUST show Alert component on fetch failure', () => {
    it('should display Alert with error message when query fails', async () => {
      const errorMessage = 'Failed to fetch KPI metrics';
      
      vi.mocked(trpc.dashboard.getKPIMetrics.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: {
          message: errorMessage,
          data: null,
          shape: null,
        } as any,
      } as any);

      render(<KPICardV2 projectId={mockProjectId} />);

      // Check for Alert with error content
      expect(screen.getByLabelText('Budget KPI Card Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load KPI metrics')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display fallback error message when error.message is undefined', async () => {
      vi.mocked(trpc.dashboard.getKPIMetrics.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: {
          message: undefined,
        } as any,
      } as any);

      render(<KPICardV2 projectId={mockProjectId} />);

      expect(screen.getByText(/Unable to fetch budget data/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      vi.mocked(trpc.dashboard.getKPIMetrics.useQuery).mockReturnValue({
        data: {
          budgetTotal: 150000,
          committed: 120000,
          variance: 30000,
          variancePercent: 20,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<KPICardV2 projectId={mockProjectId} />);

      await waitFor(() => {
        // Check main card has aria-label
        expect(screen.getByLabelText('Budget KPI Card with Variance Indicator')).toBeInTheDocument();
        
        // Check variance indicator has aria-label
        expect(screen.getByLabelText(/Under Budget:/)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero budget gracefully', async () => {
      vi.mocked(trpc.dashboard.getKPIMetrics.useQuery).mockReturnValue({
        data: {
          budgetTotal: 0,
          committed: 0,
          variance: 0,
          variancePercent: 0,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<KPICardV2 projectId={mockProjectId} />);

      await waitFor(() => {
        expect(screen.getByTestId('budget-total')).toHaveTextContent('$0.00');
      });
    });

    it('should handle large numbers', async () => {
      vi.mocked(trpc.dashboard.getKPIMetrics.useQuery).mockReturnValue({
        data: {
          budgetTotal: 1234567890.12,
          committed: 1000000000,
          variance: 234567890.12,
          variancePercent: 19,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<KPICardV2 projectId={mockProjectId} />);

      await waitFor(() => {
        expect(screen.getByTestId('budget-total')).toHaveTextContent('$1,234,567,890.12');
      });
    });
  });
});

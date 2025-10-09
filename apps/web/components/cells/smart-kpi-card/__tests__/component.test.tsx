import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SmartKPICard, MiniKPICard } from '../component'
import { DollarSign, Users } from 'lucide-react'

describe('SmartKPICard', () => {
  describe('BA-001: KPI value display with custom formatting', () => {
    it('should display value without formatter', () => {
      render(<SmartKPICard title="Total Budget" value={150000} />)
      
      expect(screen.getByText('Total Budget')).toBeInTheDocument()
      expect(screen.getByText('150000')).toBeInTheDocument()
    })

    it('should display value with custom formatter', () => {
      const formatter = (value: number | string) => {
        return `$${Number(value).toLocaleString()}`
      }
      
      render(
        <SmartKPICard 
          title="Total Budget" 
          value={150000} 
          formatter={formatter}
        />
      )
      
      expect(screen.getByText('$150,000')).toBeInTheDocument()
    })

    it('should display string values', () => {
      render(<SmartKPICard title="Status" value="Active" />)
      
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should have aria-live attribute for value updates', () => {
      const { container } = render(<SmartKPICard title="Total Budget" value={150000} />)
      
      const valueElement = container.querySelector('[aria-live="polite"]')
      expect(valueElement).toBeInTheDocument()
      expect(valueElement).toHaveAttribute('aria-atomic', 'true')
    })
  })

  describe('BA-002: Status badge variants', () => {
    it('should display critical status badge with AlertCircle icon', () => {
      render(
        <SmartKPICard 
          title="Budget Variance" 
          value={-50000} 
          status="critical"
        />
      )
      
      const badge = screen.getByText('critical')
      expect(badge).toBeInTheDocument()
      expect(badge.parentElement).toHaveClass('flex items-center gap-1')
    })

    it('should display warning status badge', () => {
      render(
        <SmartKPICard 
          title="Budget Variance" 
          value={-25000} 
          status="warning"
        />
      )
      
      expect(screen.getByText('warning')).toBeInTheDocument()
    })

    it('should display good status badge with CheckCircle icon', () => {
      render(
        <SmartKPICard 
          title="Budget Variance" 
          value={10000} 
          status="good"
        />
      )
      
      const badge = screen.getByText('good')
      expect(badge).toBeInTheDocument()
    })

    it('should not display badge for neutral status', () => {
      render(
        <SmartKPICard 
          title="Total Budget" 
          value={150000} 
          status="neutral"
        />
      )
      
      expect(screen.queryByText('neutral')).not.toBeInTheDocument()
    })

    it('should apply correct badge variant classes', () => {
      const { rerender } = render(
        <SmartKPICard 
          title="Test" 
          value={100} 
          status="critical"
        />
      )
      
      let badge = screen.getByText('critical').parentElement
      expect(badge).toHaveClass('flex items-center gap-1')
      
      // Test other variants
      rerender(<SmartKPICard title="Test" value={100} status="warning" />)
      badge = screen.getByText('warning').parentElement
      expect(badge).toHaveClass('flex items-center gap-1')
      
      rerender(<SmartKPICard title="Test" value={100} status="good" />)
      badge = screen.getByText('good').parentElement
      expect(badge).toHaveClass('flex items-center gap-1')
    })
  })

  describe('BA-003: Trend indicator display', () => {
    it('should display TrendingUp icon for positive trend', () => {
      render(
        <SmartKPICard 
          title="Revenue" 
          value={150000} 
          trend={15}
        />
      )
      
      expect(screen.getByText('+15%')).toBeInTheDocument()
      
      // Verify it's in a green-colored div
      const trendContainer = screen.getByText('+15%').parentElement
      expect(trendContainer).toHaveClass('text-green-600')
    })

    it('should display TrendingDown icon for negative trend', () => {
      render(
        <SmartKPICard 
          title="Costs" 
          value={50000} 
          trend={-10}
        />
      )
      
      expect(screen.getByText('-10%')).toBeInTheDocument()
      
      const trendContainer = screen.getByText('-10%').parentElement
      expect(trendContainer).toHaveClass('text-red-600')
    })

    it('should display Minus icon for zero trend', () => {
      render(
        <SmartKPICard 
          title="Stable Metric" 
          value={100000} 
          trend={0}
        />
      )
      
      expect(screen.getByText('No change')).toBeInTheDocument()
      
      const trendContainer = screen.getByText('No change').parentElement
      expect(trendContainer).toHaveClass('text-muted-foreground')
    })

    it('should not display trend indicator when trend is undefined', () => {
      render(
        <SmartKPICard 
          title="No Trend" 
          value={100000}
        />
      )
      
      expect(screen.queryByText(/\+.*%/)).not.toBeInTheDocument()
      expect(screen.queryByText(/-.*%/)).not.toBeInTheDocument()
      expect(screen.queryByText('No change')).not.toBeInTheDocument()
    })

    it('should handle large trend percentages', () => {
      render(
        <SmartKPICard 
          title="High Growth" 
          value={200000} 
          trend={150}
        />
      )
      
      expect(screen.getByText('+150%')).toBeInTheDocument()
    })
  })

  describe('BA-004: Progress bar rendering', () => {
    it('should render progress bar when progress prop provided', () => {
      render(
        <SmartKPICard 
          title="Project Completion" 
          value="Q4 2025" 
          progress={75}
        />
      )
      
      expect(screen.getByText('75% complete')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should not render progress bar when progress is undefined', () => {
      render(
        <SmartKPICard 
          title="No Progress" 
          value={100000}
        />
      )
      
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      expect(screen.queryByText(/complete/)).not.toBeInTheDocument()
    })

    it('should have aria-label on progress bar', () => {
      render(
        <SmartKPICard 
          title="Project Completion" 
          value="Q4 2025" 
          progress={75}
        />
      )
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-label', 'Progress: 75%')
    })

    it('should handle 0% and 100% progress', () => {
      const { rerender } = render(
        <SmartKPICard 
          title="Progress" 
          value="Test" 
          progress={0}
        />
      )
      
      expect(screen.getByText('0% complete')).toBeInTheDocument()
      
      rerender(<SmartKPICard title="Progress" value="Test" progress={100} />)
      expect(screen.getByText('100% complete')).toBeInTheDocument()
    })
  })

  describe('BA-005: Click handler functionality', () => {
    it('should be clickable when onClick handler provided', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(
        <SmartKPICard 
          title="Clickable Card" 
          value={150000} 
          onClick={handleClick}
        />
      )
      
      const card = screen.getByRole('button')
      expect(card).toBeInTheDocument()
      expect(card).toHaveAttribute('tabIndex', '0')
      
      await user.click(card)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not have button role when onClick is undefined', () => {
      render(
        <SmartKPICard 
          title="Non-clickable Card" 
          value={150000}
        />
      )
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should have hover effects when clickable', () => {
      const handleClick = vi.fn()
      
      render(
        <SmartKPICard 
          title="Clickable Card" 
          value={150000} 
          onClick={handleClick}
        />
      )
      
      const card = screen.getByRole('button')
      expect(card).toHaveClass('hover:shadow-lg', 'cursor-pointer', 'hover:scale-[1.02]')
    })

    it('should display action text with arrow when provided', () => {
      render(
        <SmartKPICard 
          title="View Details" 
          value={150000} 
          action="View full report"
          onClick={() => {}}
        />
      )
      
      expect(screen.getByText('View full report →')).toBeInTheDocument()
    })

    it('should have proper aria-label', () => {
      render(
        <SmartKPICard 
          title="Total Budget" 
          value={150000}
          formatter={(v) => `$${v}`}
        />
      )
      
      const card = screen.getByLabelText('Total Budget: $150000')
      expect(card).toBeInTheDocument()
    })
  })

  describe('BA-006: MiniKPICard variant', () => {
    it('should render compact layout', () => {
      render(
        <MiniKPICard 
          title="Active Projects" 
          value={25}
        />
      )
      
      expect(screen.getByText('Active Projects')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
    })

    it('should display icon when provided', () => {
      render(
        <MiniKPICard 
          title="Users" 
          value={150}
          icon={<Users data-testid="users-icon" />}
        />
      )
      
      expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    })

    it('should display change indicator with increase color', () => {
      render(
        <MiniKPICard 
          title="Revenue" 
          value="$150K"
          change="+15%"
          changeType="increase"
        />
      )
      
      const changeElement = screen.getByText('+15%')
      expect(changeElement).toBeInTheDocument()
      expect(changeElement).toHaveClass('text-green-600')
    })

    it('should display change indicator with decrease color', () => {
      render(
        <MiniKPICard 
          title="Costs" 
          value="$50K"
          change="-10%"
          changeType="decrease"
        />
      )
      
      const changeElement = screen.getByText('-10%')
      expect(changeElement).toBeInTheDocument()
      expect(changeElement).toHaveClass('text-red-600')
    })

    it('should display change indicator with neutral color', () => {
      render(
        <MiniKPICard 
          title="Stable Metric" 
          value={100}
          change="0%"
          changeType="neutral"
        />
      )
      
      const changeElement = screen.getByText('0%')
      expect(changeElement).toBeInTheDocument()
      expect(changeElement).toHaveClass('text-muted-foreground')
    })

    it('should not display change indicator when not provided', () => {
      render(
        <MiniKPICard 
          title="No Change" 
          value={100}
        />
      )
      
      expect(screen.queryByText(/%/)).not.toBeInTheDocument()
    })

    it('should have compact styling', () => {
      const { container } = render(
        <MiniKPICard 
          title="Compact" 
          value={100}
        />
      )
      
      const wrapper = container.querySelector('.p-3.bg-muted\\/50.rounded-lg')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Integration tests', () => {
    it('should render full-featured SmartKPICard with all props', () => {
      const handleClick = vi.fn()
      
      render(
        <SmartKPICard 
          title="Total Revenue"
          value={1500000}
          trend={12}
          status="good"
          progress={85}
          action="View breakdown"
          onClick={handleClick}
          icon={<DollarSign data-testid="dollar-icon" />}
          subtitle="Last 30 days"
          borderColor="border-l-green-500"
          formatter={(v) => `$${Number(v).toLocaleString()}`}
        />
      )
      
      // All elements should be present
      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
      expect(screen.getByText('$1,500,000')).toBeInTheDocument()
      expect(screen.getByText('+12%')).toBeInTheDocument()
      expect(screen.getByText('good')).toBeInTheDocument()
      expect(screen.getByText('85% complete')).toBeInTheDocument()
      expect(screen.getByText('View breakdown →')).toBeInTheDocument()
      expect(screen.getByText('Last 30 days')).toBeInTheDocument()
      expect(screen.getByTestId('dollar-icon')).toBeInTheDocument()
    })

    it('should handle re-renders with different values', () => {
      const { rerender } = render(
        <SmartKPICard 
          title="Dynamic Value" 
          value={100}
        />
      )
      
      expect(screen.getByText('100')).toBeInTheDocument()
      
      rerender(<SmartKPICard title="Dynamic Value" value={200} />)
      expect(screen.getByText('200')).toBeInTheDocument()
      expect(screen.queryByText('100')).not.toBeInTheDocument()
    })

    it('should maintain memoization with React.memo', () => {
      // This is more of an implementation test, but we can verify the displayName
      expect(SmartKPICard.displayName).toBe('SmartKPICard')
      expect(MiniKPICard.displayName).toBe('MiniKPICard')
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(
        <SmartKPICard 
          title="Accessible Card" 
          value={150000}
        />
      )
      
      // Card should have heading
      const title = screen.getByText('Accessible Card')
      expect(title.tagName).toBe('H3')
    })

    it('should have keyboard navigation for clickable cards', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(
        <SmartKPICard 
          title="Keyboard Card" 
          value={150000} 
          onClick={handleClick}
        />
      )
      
      const card = screen.getByRole('button')
      card.focus()
      
      // Simulate Enter key
      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalled()
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VersionManagementCell } from '../component'

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    forecasts: {
      getForecastVersions: {
        useQuery: vi.fn(),
      },
      deleteForecastVersion: {
        useMutation: vi.fn(),
      },
    },
    useUtils: vi.fn(),
  },
}))

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock VersionHistoryTimeline
vi.mock('@/components/version-history-timeline', () => ({
  VersionHistoryTimeline: ({ versions, currentVersion, onVersionSelect }: any) => (
    <div data-testid="version-timeline">
      {versions.map((v: any) => (
        <button
          key={v.version_number}
          onClick={() => onVersionSelect(v.version_number)}
          data-active={v.version_number === currentVersion}
          data-testid={`version-${v.version_number}`}
        >
          Version {v.version_number}
        </button>
      ))}
    </div>
  ),
}))

describe('VersionManagementCell', () => {
  const mockVersions = [
    { versionNumber: 2, createdAt: '2025-10-05T00:00:00Z', reason: 'Updated forecast' },
    { versionNumber: 1, createdAt: '2025-10-04T00:00:00Z', reason: 'Initial forecast' },
    { versionNumber: 0, createdAt: '2025-10-01T00:00:00Z', reason: 'Baseline' },
  ]

  const mockProps = {
    projectId: 'test-project-id',
    projectName: 'Test Project',
    activeVersion: 'latest' as const,
    onVersionChange: vi.fn(),
    onOpenForecastWizard: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('BA-030: Displays all forecast versions in dropdown with latest version pre-selected', async () => {
    const { trpc } = await import('@/lib/trpc')
    
    // Mock successful query
    vi.mocked(trpc.forecasts.getForecastVersions.useQuery).mockReturnValue({
      data: mockVersions,
      isLoading: false,
      error: null,
    } as any)

    // Mock delete mutation
    vi.mocked(trpc.forecasts.deleteForecastVersion.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(trpc.useUtils).mockReturnValue({
      forecasts: {
        getForecastVersions: {
          invalidate: vi.fn(),
        },
      },
    } as any)

    render(<VersionManagementCell {...mockProps} />)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    // Verify dropdown shows "Latest (v2)"
    expect(screen.getByText(/Latest \(v2\)/i)).toBeInTheDocument()

    // Verify create forecast button exists
    expect(screen.getByText(/Create Forecast/i)).toBeInTheDocument()
  })

  it('BA-031: Switches to selected version via timeline and triggers callback', async () => {
    const { trpc } = await import('@/lib/trpc')
    
    vi.mocked(trpc.forecasts.getForecastVersions.useQuery).mockReturnValue({
      data: mockVersions,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(trpc.forecasts.deleteForecastVersion.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(trpc.useUtils).mockReturnValue({
      forecasts: {
        getForecastVersions: {
          invalidate: vi.fn(),
        },
      },
    } as any)

    const onVersionChange = vi.fn()
    render(<VersionManagementCell {...mockProps} onVersionChange={onVersionChange} />)

    // Click version 1 in timeline
    const version1Button = screen.getByTestId('version-1')
    await userEvent.click(version1Button)

    // Verify callback called with correct value
    expect(onVersionChange).toHaveBeenCalledWith(1)
  })

  it('BA-032: Opens forecast wizard when button clicked', async () => {
    const { trpc } = await import('@/lib/trpc')
    
    vi.mocked(trpc.forecasts.getForecastVersions.useQuery).mockReturnValue({
      data: mockVersions,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(trpc.forecasts.deleteForecastVersion.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(trpc.useUtils).mockReturnValue({
      forecasts: {
        getForecastVersions: {
          invalidate: vi.fn(),
        },
      },
    } as any)

    const onOpenForecastWizard = vi.fn()
    render(<VersionManagementCell {...mockProps} onOpenForecastWizard={onOpenForecastWizard} />)

    // Click "Create Forecast" button
    const createButton = screen.getByRole('button', { name: /Create Forecast/i })
    await userEvent.click(createButton)

    // Verify wizard callback triggered
    expect(onOpenForecastWizard).toHaveBeenCalledTimes(1)
  })

  it('BA-033: Displays version timeline with creation dates', async () => {
    const { trpc } = await import('@/lib/trpc')
    
    vi.mocked(trpc.forecasts.getForecastVersions.useQuery).mockReturnValue({
      data: mockVersions,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(trpc.forecasts.deleteForecastVersion.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(trpc.useUtils).mockReturnValue({
      forecasts: {
        getForecastVersions: {
          invalidate: vi.fn(),
        },
      },
    } as any)

    render(<VersionManagementCell {...mockProps} />)

    // Verify timeline component receives versions
    const timeline = screen.getByTestId('version-timeline')
    expect(timeline).toBeInTheDocument()

    // Verify all versions displayed in timeline
    expect(screen.getByText('Version 2')).toBeInTheDocument()
    expect(screen.getByText('Version 1')).toBeInTheDocument()
    expect(screen.getByText('Version 0')).toBeInTheDocument()
  })

  it('BA-034: Handles version deletion with confirmation dialog', async () => {
    const { trpc } = await import('@/lib/trpc')
    
    const mockMutate = vi.fn()
    const mockInvalidate = vi.fn()
    
    vi.mocked(trpc.forecasts.getForecastVersions.useQuery).mockReturnValue({
      data: mockVersions,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(trpc.forecasts.deleteForecastVersion.useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any)

    vi.mocked(trpc.useUtils).mockReturnValue({
      forecasts: {
        getForecastVersions: {
          invalidate: mockInvalidate,
        },
      },
    } as any)

    const propsWithVersion = { ...mockProps, activeVersion: 1 }
    render(<VersionManagementCell {...propsWithVersion} />)

    // Click delete button (should be visible for version 1)
    const deleteButton = screen.getByRole('button', { name: /Delete version 1/i })
    await userEvent.click(deleteButton)

    // Verify confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByText(/Delete Version 1\?/i)).toBeInTheDocument()
      expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument()
    })

    // Click confirm button
    const confirmButton = screen.getByRole('button', { name: /Delete Version/i })
    await userEvent.click(confirmButton)

    // Verify mutation called with correct params
    expect(mockMutate).toHaveBeenCalledWith({
      projectId: 'test-project-id',
      versionNumber: 1,
    })
  })

  it('Prevents deletion of version 0 (baseline)', async () => {
    const { trpc } = await import('@/lib/trpc')
    
    vi.mocked(trpc.forecasts.getForecastVersions.useQuery).mockReturnValue({
      data: mockVersions,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(trpc.forecasts.deleteForecastVersion.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(trpc.useUtils).mockReturnValue({
      forecasts: {
        getForecastVersions: {
          invalidate: vi.fn(),
        },
      },
    } as any)

    const propsWithVersion0 = { ...mockProps, activeVersion: 0 }
    render(<VersionManagementCell {...propsWithVersion0} />)

    // Verify delete button is NOT shown for version 0 (baseline protection)
    const deleteButton = screen.queryByRole('button', { name: /Delete version 0/i })
    expect(deleteButton).not.toBeInTheDocument()
  })

  it('Handles loading state', async () => {
    const { trpc } = await import('@/lib/trpc')
    
    vi.mocked(trpc.forecasts.getForecastVersions.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any)

    vi.mocked(trpc.forecasts.deleteForecastVersion.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(trpc.useUtils).mockReturnValue({
      forecasts: {
        getForecastVersions: {
          invalidate: vi.fn(),
        },
      },
    } as any)

    render(<VersionManagementCell {...mockProps} />)

    // Verify skeleton loaders displayed
    const skeletons = screen.getAllByRole('generic', { hidden: true })
    const loadingSkeletons = skeletons.filter(el => 
      el.className.includes('animate-pulse')
    )
    expect(loadingSkeletons.length).toBeGreaterThan(0)
  })

  it('Selects version from timeline', async () => {
    const { trpc } = await import('@/lib/trpc')
    
    vi.mocked(trpc.forecasts.getForecastVersions.useQuery).mockReturnValue({
      data: mockVersions,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(trpc.forecasts.deleteForecastVersion.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(trpc.useUtils).mockReturnValue({
      forecasts: {
        getForecastVersions: {
          invalidate: vi.fn(),
        },
      },
    } as any)

    const onVersionChange = vi.fn()
    render(<VersionManagementCell {...mockProps} onVersionChange={onVersionChange} />)

    // Click version 2 in timeline
    const version2Button = screen.getByTestId('version-2')
    await userEvent.click(version2Button)

    // Verify callback triggered
    expect(onVersionChange).toHaveBeenCalledWith(2)
  })
})

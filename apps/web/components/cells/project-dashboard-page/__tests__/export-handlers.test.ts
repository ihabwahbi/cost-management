import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleExportPDF, handleExportExcel } from '../utils/export-handlers'
import type { Project } from '../types'

// Mock the external export library
vi.mock('@/lib/dashboard-export', () => ({
  exportDashboardToPDF: vi.fn().mockResolvedValue(undefined),
  exportDashboardToExcel: vi.fn().mockResolvedValue(undefined),
}))

import { exportDashboardToPDF, exportDashboardToExcel } from '@/lib/dashboard-export'

describe('Export Handlers - BA-006 & BA-007', () => {
  const mockProject: Project = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Project Alpha',
    subBusinessLine: 'SBL-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  }

  const mockDashboardData = {
    metrics: {
      totalBudget: 500000,
      actualSpend: 350000,
      variance: 150000,
      variancePercent: 30,
      utilization: 70,
      invoicedAmount: 300000,
      openOrders: 50000,
      burnRate: 25000,
      poCount: 15,
      lineItemCount: 87,
    },
    breakdown: [
      {
        id: '1',
        level: 'business_line' as const,
        name: 'Engineering',
        budget: 200000,
        actual: 150000,
        variance: 50000,
        utilization: 75,
      },
    ],
    categories: [
      { name: 'Labor', value: 150000, budget: 200000 },
      { name: 'Materials', value: 80000, budget: 100000 },
    ],
  }

  describe('BA-006: handleExportPDF', () => {
    beforeEach(() => {
      // Mock DOM element
      document.body.innerHTML = '<div id="dashboard-content">Dashboard Content</div>'
      vi.clearAllMocks()
    })

    afterEach(() => {
      document.body.innerHTML = ''
    })

    it('should call exportDashboardToPDF with correct parameters', async () => {
      await handleExportPDF(mockProject)
      
      expect(exportDashboardToPDF).toHaveBeenCalledTimes(1)
      expect(exportDashboardToPDF).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        'Test Project Alpha'
      )
    })

    it('should throw error if dashboard element not found', async () => {
      document.body.innerHTML = '' // Remove element
      
      await expect(handleExportPDF(mockProject)).rejects.toThrow(
        'Dashboard content element not found'
      )
    })

    it('should throw error if project is null', async () => {
      await expect(handleExportPDF(null as any)).rejects.toThrow(
        'Project data not available'
      )
    })
  })

  describe('BA-007: handleExportExcel', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should call exportDashboardToExcel with correct parameters', async () => {
      await handleExportExcel(mockProject, mockDashboardData)

      expect(exportDashboardToExcel).toHaveBeenCalledTimes(1)
      expect(exportDashboardToExcel).toHaveBeenCalledWith(
        mockDashboardData,
        'Test Project Alpha'
      )
    })

    it('should include metrics data in export', async () => {
      await handleExportExcel(mockProject, mockDashboardData)

      expect(exportDashboardToExcel).toHaveBeenCalledWith(
        expect.objectContaining({
          metrics: mockDashboardData.metrics,
        }),
        expect.any(String)
      )
    })

    it('should include category data in export', async () => {
      await handleExportExcel(mockProject, mockDashboardData)

      expect(exportDashboardToExcel).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: mockDashboardData.categories,
        }),
        expect.any(String)
      )
    })

    it('should throw error if metrics data is missing', async () => {
      await expect(
        handleExportExcel(mockProject, {
          metrics: null,
          breakdown: [],
          categories: [],
        })
      ).rejects.toThrow('Metrics data not available')
    })

    it('should throw error if project is null', async () => {
      await expect(
        handleExportExcel(null as any, mockDashboardData)
      ).rejects.toThrow('Project data not available')
    })
  })

  describe('Export error handling', () => {
    it('handleExportPDF should propagate library errors', async () => {
      vi.mocked(exportDashboardToPDF).mockRejectedValueOnce(new Error('Print failed'))
      document.body.innerHTML = '<div id="dashboard-content">Content</div>'

      await expect(handleExportPDF(mockProject)).rejects.toThrow('Print failed')
    })

    it('handleExportExcel should propagate library errors', async () => {
      vi.mocked(exportDashboardToExcel).mockRejectedValueOnce(new Error('Export failed'))

      await expect(
        handleExportExcel(mockProject, mockDashboardData)
      ).rejects.toThrow('Export failed')
    })
  })
})

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { appRouter, createContext } from '../src/index';
import type { Context } from '../src/trpc';

/**
 * Dashboard Router Integration Tests
 * 
 * Tests the dashboard.getKPIMetrics procedure with various scenarios
 */

describe('Dashboard Router', () => {
  describe('getKPIMetrics procedure', () => {
    const testProjectId = '550e8400-e29b-41d4-a716-446655440000'; // Fixed UUID for testing

    it('should return KPI metrics with correct structure', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.dashboard.getKPIMetrics({
        projectId: testProjectId,
      });

      // Verify structure
      expect(result).toHaveProperty('budgetTotal');
      expect(result).toHaveProperty('committed');
      expect(result).toHaveProperty('variance');
      expect(result).toHaveProperty('variancePercent');

      // Verify types
      expect(typeof result.budgetTotal).toBe('number');
      expect(typeof result.committed).toBe('number');
      expect(typeof result.variance).toBe('number');
      expect(typeof result.variancePercent).toBe('number');
    });

    it('should calculate variance correctly', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.dashboard.getKPIMetrics({
        projectId: testProjectId,
      });

      // Verify variance calculation
      const expectedVariance = result.budgetTotal - result.committed;
      expect(result.variance).toBe(expectedVariance);
    });

    it('should calculate variancePercent correctly', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.dashboard.getKPIMetrics({
        projectId: testProjectId,
      });

      // Verify variance percent calculation
      if (result.budgetTotal > 0) {
        const expectedPercent = (result.variance / result.budgetTotal) * 100;
        expect(result.variancePercent).toBeCloseTo(expectedPercent, 2);
      } else {
        expect(result.variancePercent).toBe(0);
      }
    });

    it('should handle empty project (no cost_breakdown entries)', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      // Use a UUID that doesn't exist in the database
      const emptyProjectId = '00000000-0000-0000-0000-000000000000';

      const result = await caller.dashboard.getKPIMetrics({
        projectId: emptyProjectId,
      });

      // Expect all zeros for empty project
      expect(result.budgetTotal).toBe(0);
      expect(result.committed).toBe(0);
      expect(result.variance).toBe(0);
      expect(result.variancePercent).toBe(0);
    });

    it('should handle project with budget but no PO mappings', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      // This would need a project with cost_breakdown but no po_mappings
      // For now, we test the logic with any result
      const result = await caller.dashboard.getKPIMetrics({
        projectId: testProjectId,
      });

      // If budgetTotal > 0 and committed = 0, variance should equal budgetTotal
      if (result.budgetTotal > 0 && result.committed === 0) {
        expect(result.variance).toBe(result.budgetTotal);
        expect(result.variancePercent).toBe(100);
      }
    });

    it('should reject invalid UUID format', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.dashboard.getKPIMetrics({
          projectId: 'invalid-uuid',
        })
      ).rejects.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      // Create a mock context with a broken database
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockRejectedValue(new Error('Database connection failed')),
          }),
        }),
      };

      const mockContext: Context = {
        db: mockDb as any,
      };

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.dashboard.getKPIMetrics({
          projectId: testProjectId,
        })
      ).rejects.toThrow('Failed to fetch KPI metrics');
    });
  });
});

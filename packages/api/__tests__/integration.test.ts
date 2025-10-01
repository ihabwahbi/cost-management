import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter, createContext } from '../src/index';
import type { Context } from '../src/trpc';

describe('tRPC API Integration Tests', () => {
  describe('Test Router', () => {
    describe('hello procedure', () => {
      it('should return greeting message with provided name', async () => {
        const caller = appRouter.createCaller(createContext());

        const result = await caller.test.hello({ name: 'World' });

        expect(result).toHaveProperty('message');
        expect(result.message).toBe('Hello World from tRPC Edge Function!');
        expect(result).toHaveProperty('timestamp');
        expect(new Date(result.timestamp)).toBeInstanceOf(Date);
      });

      it('should handle different names correctly', async () => {
        const caller = appRouter.createCaller(createContext());

        const result = await caller.test.hello({ name: 'Alice' });

        expect(result.message).toBe('Hello Alice from tRPC Edge Function!');
      });

      it('should include ISO timestamp in response', async () => {
        const caller = appRouter.createCaller(createContext());

        const result = await caller.test.hello({ name: 'Test' });

        expect(result.timestamp).toBeDefined();
        // Verify timestamp is valid ISO 8601 format
        expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
      });

      it('should validate input schema', async () => {
        const caller = appRouter.createCaller(createContext());

        // @ts-expect-error - testing runtime validation
        await expect(caller.test.hello({})).rejects.toThrow();
        
        // @ts-expect-error - testing runtime validation
        await expect(caller.test.hello({ name: 123 })).rejects.toThrow();
      });
    });

    describe('healthCheck procedure', () => {
      beforeEach(() => {
        vi.clearAllMocks();
      });

      it('should return healthy status when database is connected', async () => {
        // Mock the database query to succeed
        const mockDb = {
          query: {
            projects: {
              findFirst: vi.fn().mockResolvedValue(null),
            },
          },
        };

        const mockContext: Context = {
          db: mockDb as any,
        };

        const caller = appRouter.createCaller(mockContext);

        const result = await caller.test.healthCheck();

        expect(result.status).toBe('healthy');
        expect(result.database).toBe('connected');
        expect(result.timestamp).toBeDefined();
        expect(result).not.toHaveProperty('error');
      });

      it('should return unhealthy status when database query fails', async () => {
        // Mock the database query to fail
        const mockDb = {
          query: {
            projects: {
              findFirst: vi.fn().mockRejectedValue(new Error('Connection timeout')),
            },
          },
        };

        const mockContext: Context = {
          db: mockDb as any,
        };

        const caller = appRouter.createCaller(mockContext);

        const result = await caller.test.healthCheck();

        expect(result.status).toBe('unhealthy');
        expect(result.database).toBe('disconnected');
        expect(result.error).toBe('Connection timeout');
        expect(result.timestamp).toBeDefined();
      });

      it('should include timestamp in health check response', async () => {
        const mockDb = {
          query: {
            projects: {
              findFirst: vi.fn().mockResolvedValue(null),
            },
          },
        };

        const mockContext: Context = {
          db: mockDb as any,
        };

        const caller = appRouter.createCaller(mockContext);

        const result = await caller.test.healthCheck();

        expect(result.timestamp).toBeDefined();
        expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
      });

      it('should handle non-Error exceptions gracefully', async () => {
        // Mock the database query to fail with non-Error object
        const mockDb = {
          query: {
            projects: {
              findFirst: vi.fn().mockRejectedValue('String error'),
            },
          },
        };

        const mockContext: Context = {
          db: mockDb as any,
        };

        const caller = appRouter.createCaller(mockContext);

        const result = await caller.test.healthCheck();

        expect(result.status).toBe('unhealthy');
        expect(result.error).toBe('Unknown error');
      });
    });
  });

  describe('Type Safety', () => {
    it('should provide end-to-end type safety', async () => {
      const caller = appRouter.createCaller(createContext());

      // Type inference test - these should have correct types at compile time
      const helloResult = await caller.test.hello({ name: 'TypeScript' });
      const healthResult = await caller.test.healthCheck();

      // TypeScript should know the shape of these results
      expect(helloResult.message).toBeDefined();
      expect(helloResult.timestamp).toBeDefined();
      expect(healthResult.status).toBeDefined();
      expect(healthResult.database).toBeDefined();
    });
  });

  describe('Context Creation', () => {
    it('should create valid context with database', () => {
      const context = createContext();

      expect(context).toHaveProperty('db');
      expect(context.db).toBeDefined();
    });
  });

  describe('Router Structure', () => {
    it('should export appRouter with test router', () => {
      expect(appRouter).toBeDefined();
      expect(appRouter._def.procedures).toHaveProperty('test.hello');
      expect(appRouter._def.procedures).toHaveProperty('test.healthCheck');
    });
  });
});

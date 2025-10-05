import { router } from '../../trpc';
import { hello } from './hello.procedure';
import { healthCheck } from './health-check.procedure';

/**
 * Test Domain Router
 * Aggregates test/health check procedures
 */
export const testRouter = router({
  hello,        // Direct reference (no spread operator)
  healthCheck,  // Direct reference
});

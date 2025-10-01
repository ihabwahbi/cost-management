/**
 * Zod schemas for Cell manifest and pipeline validation
 */

import { z } from 'zod';

/**
 * Manifest JSON Schema
 * 
 * Defines the structure of a Component Cell's manifest.json
 */
export const manifestSchema = z.object({
  id: z.string().min(1, 'Cell ID is required'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (e.g., 1.0.0)'),
  description: z.string().min(1, 'Description is required'),
  
  dataContract: z.object({
    source: z.string().min(1, 'Data contract source (tRPC procedure) is required'),
    inputSchema: z.string().optional(),
    outputSchema: z.string().optional(),
  }),
  
  behavioralAssertions: z.array(
    z.object({
      id: z.string().min(1, 'Assertion ID is required'),
      description: z.string().min(1, 'Assertion description is required'),
      testFile: z.string().optional(),
    })
  ).min(1, 'At least one behavioral assertion is required'),
  
  dependencies: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export type CellManifest = z.infer<typeof manifestSchema>;

/**
 * Pipeline YAML Schema
 * 
 * Defines the structure of a Component Cell's pipeline.yaml
 */
export const pipelineSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required'),
  
  gates: z.object({
    typeCheck: z.object({
      command: z.string(),
      enabled: z.boolean().default(true),
    }),
    
    lint: z.object({
      command: z.string(),
      enabled: z.boolean().default(true),
    }),
    
    unitTests: z.object({
      command: z.string(),
      coverage: z.number().min(0).max(100).optional(),
      enabled: z.boolean().default(true),
    }),
    
    behavioralAssertions: z.object({
      command: z.string(),
      enabled: z.boolean().default(true),
    }),
  }),
  
  successCriteria: z.object({
    allGatesMustPass: z.boolean().default(true),
    minCoverage: z.number().min(0).max(100).optional(),
  }),
});

export type CellPipeline = z.infer<typeof pipelineSchema>;

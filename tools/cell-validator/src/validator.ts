/**
 * Cell Validator Core Logic
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';
import { manifestSchema, pipelineSchema, type CellManifest, type CellPipeline } from './schemas.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  cellPath: string;
}

/**
 * Validate a Component Cell directory
 */
export async function validateCell(cellPath: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if cell path exists
  if (!existsSync(cellPath)) {
    return {
      valid: false,
      errors: [`Cell path does not exist: ${cellPath}`],
      warnings: [],
      cellPath,
    };
  }

  // Check if it's a directory
  if (!statSync(cellPath).isDirectory()) {
    return {
      valid: false,
      errors: [`Cell path is not a directory: ${cellPath}`],
      warnings: [],
      cellPath,
    };
  }

  // Validate manifest.json
  const manifestResult = validateManifest(cellPath);
  errors.push(...manifestResult.errors);
  warnings.push(...manifestResult.warnings);

  // Validate pipeline.yaml
  const pipelineResult = validatePipeline(cellPath);
  errors.push(...pipelineResult.errors);
  warnings.push(...pipelineResult.warnings);

  // Validate cell structure
  const structureResult = validateStructure(cellPath);
  errors.push(...structureResult.errors);
  warnings.push(...structureResult.warnings);

  // Check component size (warn if > 200 lines)
  const componentPath = join(cellPath, 'component.tsx');
  if (existsSync(componentPath)) {
    const lines = readFileSync(componentPath, 'utf-8').split('\n').length;
    if (lines > 200) {
      warnings.push(`Component is ${lines} lines (recommended: < 200 lines)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    cellPath,
  };
}

/**
 * Validate manifest.json
 */
function validateManifest(cellPath: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const manifestPath = join(cellPath, 'manifest.json');

  // Check if manifest.json exists
  if (!existsSync(manifestPath)) {
    errors.push('manifest.json not found');
    return { errors, warnings };
  }

  try {
    // Read and parse manifest
    const content = readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    // Validate against schema
    const result = manifestSchema.safeParse(manifest);
    if (!result.success) {
      result.error.errors.forEach((err) => {
        errors.push(`Manifest validation error: ${err.path.join('.')}: ${err.message}`);
      });
      return { errors, warnings };
    }

    const validManifest = result.data as CellManifest;

    // Check for unique assertion IDs
    const assertionIds = validManifest.behavioralAssertions.map((a) => a.id);
    const uniqueIds = new Set(assertionIds);
    if (assertionIds.length !== uniqueIds.size) {
      errors.push('Behavioral assertion IDs must be unique');
    }

    // Verify tRPC procedure reference format
    if (!validManifest.dataContract.source.includes('.')) {
      warnings.push('Data contract source should reference a tRPC procedure (e.g., "projects.getById")');
    }
  } catch (err) {
    errors.push(`Failed to parse manifest.json: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  return { errors, warnings };
}

/**
 * Validate pipeline.yaml
 */
function validatePipeline(cellPath: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pipelinePath = join(cellPath, 'pipeline.yaml');

  // Check if pipeline.yaml exists
  if (!existsSync(pipelinePath)) {
    errors.push('pipeline.yaml not found');
    return { errors, warnings };
  }

  try {
    // Read and parse pipeline
    const content = readFileSync(pipelinePath, 'utf-8');
    const pipeline = YAML.parse(content);

    // Validate against schema
    const result = pipelineSchema.safeParse(pipeline);
    if (!result.success) {
      result.error.errors.forEach((err) => {
        errors.push(`Pipeline validation error: ${err.path.join('.')}: ${err.message}`);
      });
      return { errors, warnings };
    }

    const validPipeline = result.data as CellPipeline;

    // Verify all required gates are present and enabled
    const requiredGates = ['typeCheck', 'lint', 'unitTests', 'behavioralAssertions'];
    const gates = validPipeline.gates;
    
    requiredGates.forEach((gate) => {
      if (!(gate in gates)) {
        errors.push(`Required gate missing: ${gate}`);
      } else {
        const gateConfig = gates[gate as keyof typeof gates];
        if (!gateConfig.enabled) {
          warnings.push(`Gate '${gate}' is disabled`);
        }
      }
    });

    // Check success criteria
    if (!validPipeline.successCriteria.allGatesMustPass) {
      warnings.push('Success criteria does not require all gates to pass');
    }
  } catch (err) {
    errors.push(`Failed to parse pipeline.yaml: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  return { errors, warnings };
}

/**
 * Validate cell structure (expected files)
 */
function validateStructure(cellPath: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredFiles = ['component.tsx', 'state.ts', 'manifest.json', 'pipeline.yaml'];
  const optionalFiles = ['README.md', 'index.ts'];

  requiredFiles.forEach((file) => {
    if (!existsSync(join(cellPath, file))) {
      errors.push(`Required file missing: ${file}`);
    }
  });

  optionalFiles.forEach((file) => {
    if (!existsSync(join(cellPath, file))) {
      warnings.push(`Optional file missing: ${file}`);
    }
  });

  // Check for state.ts using Zustand pattern (basic check)
  const statePath = join(cellPath, 'state.ts');
  if (existsSync(statePath)) {
    const content = readFileSync(statePath, 'utf-8');
    if (!content.includes('create') || !content.includes('zustand')) {
      warnings.push('state.ts should use Zustand pattern');
    }
  }

  return { errors, warnings };
}

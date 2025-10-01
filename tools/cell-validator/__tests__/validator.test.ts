import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { validateCell } from '../src/validator.js';

describe('Cell Validator', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = join(tmpdir(), `cell-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Basic Validation', () => {
    it('should fail if cell path does not exist', async () => {
      const result = await validateCell('/nonexistent/path');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cell path does not exist: /nonexistent/path');
    });

    it('should fail if cell path is not a directory', async () => {
      const filePath = join(testDir, 'file.txt');
      writeFileSync(filePath, 'content');

      const result = await validateCell(filePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(`Cell path is not a directory: ${filePath}`);
    });
  });

  describe('Manifest Validation', () => {
    it('should fail if manifest.json is missing', async () => {
      const result = await validateCell(testDir);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('manifest.json not found');
    });

    it('should fail if manifest.json has invalid JSON', async () => {
      writeFileSync(join(testDir, 'manifest.json'), 'invalid json{');

      const result = await validateCell(testDir);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Failed to parse manifest.json'))).toBe(true);
    });

    it('should validate correct manifest structure', async () => {
      const validManifest = {
        id: 'test-cell-001',
        version: '1.0.0',
        description: 'Test Cell',
        dataContract: {
          source: 'test.getData',
        },
        behavioralAssertions: [
          {
            id: 'assert-001',
            description: 'Should render correctly',
          },
        ],
      };

      writeFileSync(join(testDir, 'manifest.json'), JSON.stringify(validManifest, null, 2));
      writeFileSync(join(testDir, 'pipeline.yaml'), 'name: test\ngates:\n  typeCheck:\n    command: tsc\n    enabled: true\n  lint:\n    command: eslint\n    enabled: true\n  unitTests:\n    command: vitest\n    enabled: true\n  behavioralAssertions:\n    command: vitest\n    enabled: true\nsuccessCriteria:\n  allGatesMustPass: true');
      writeFileSync(join(testDir, 'component.tsx'), 'export default function Component() { return null; }');
      writeFileSync(join(testDir, 'state.ts'), 'import { create } from "zustand"; export const useStore = create(() => ({}));');

      const result = await validateCell(testDir);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail if manifest is missing required fields', async () => {
      const invalidManifest = {
        id: 'test-cell',
        // missing version, description, dataContract, behavioralAssertions
      };

      writeFileSync(join(testDir, 'manifest.json'), JSON.stringify(invalidManifest));

      const result = await validateCell(testDir);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Manifest validation error'))).toBe(true);
    });

    it('should fail if version is not in semver format', async () => {
      const manifest = {
        id: 'test-cell',
        version: 'v1',
        description: 'Test',
        dataContract: { source: 'test' },
        behavioralAssertions: [{ id: '1', description: 'test' }],
      };

      writeFileSync(join(testDir, 'manifest.json'), JSON.stringify(manifest));

      const result = await validateCell(testDir);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('semver format'))).toBe(true);
    });

    it('should fail if behavioral assertion IDs are not unique', async () => {
      const manifest = {
        id: 'test-cell',
        version: '1.0.0',
        description: 'Test',
        dataContract: { source: 'test.getData' },
        behavioralAssertions: [
          { id: 'assert-001', description: 'First' },
          { id: 'assert-001', description: 'Duplicate' },
        ],
      };

      writeFileSync(join(testDir, 'manifest.json'), JSON.stringify(manifest));

      const result = await validateCell(testDir);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Behavioral assertion IDs must be unique');
    });

    it('should warn if data contract source does not look like tRPC procedure', async () => {
      const manifest = {
        id: 'test-cell',
        version: '1.0.0',
        description: 'Test',
        dataContract: { source: 'invalidformat' },
        behavioralAssertions: [{ id: 'assert-001', description: 'Test' }],
      };

      writeFileSync(join(testDir, 'manifest.json'), JSON.stringify(manifest));
      writeFileSync(join(testDir, 'pipeline.yaml'), 'name: test\ngates:\n  typeCheck:\n    command: tsc\n    enabled: true\n  lint:\n    command: eslint\n    enabled: true\n  unitTests:\n    command: vitest\n    enabled: true\n  behavioralAssertions:\n    command: vitest\n    enabled: true\nsuccessCriteria:\n  allGatesMustPass: true');
      writeFileSync(join(testDir, 'component.tsx'), '');
      writeFileSync(join(testDir, 'state.ts'), '');

      const result = await validateCell(testDir);

      expect(result.warnings.some(w => w.includes('tRPC procedure'))).toBe(true);
    });
  });

  describe('Pipeline Validation', () => {
    beforeEach(() => {
      // Create valid manifest for pipeline tests
      const manifest = {
        id: 'test-cell',
        version: '1.0.0',
        description: 'Test',
        dataContract: { source: 'test.getData' },
        behavioralAssertions: [{ id: 'assert-001', description: 'Test' }],
      };
      writeFileSync(join(testDir, 'manifest.json'), JSON.stringify(manifest));
    });

    it('should fail if pipeline.yaml is missing', async () => {
      const result = await validateCell(testDir);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('pipeline.yaml not found');
    });

    it('should fail if pipeline.yaml has invalid YAML', async () => {
      writeFileSync(join(testDir, 'pipeline.yaml'), 'invalid: yaml: syntax:');

      const result = await validateCell(testDir);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Failed to parse pipeline.yaml'))).toBe(true);
    });

    it('should validate correct pipeline structure', async () => {
      const validPipeline = `
name: Test Pipeline
gates:
  typeCheck:
    command: tsc --noEmit
    enabled: true
  lint:
    command: eslint .
    enabled: true
  unitTests:
    command: vitest run
    enabled: true
  behavioralAssertions:
    command: vitest run --testPathPattern=behavioral
    enabled: true
successCriteria:
  allGatesMustPass: true
  minCoverage: 80
`;

      writeFileSync(join(testDir, 'pipeline.yaml'), validPipeline);
      writeFileSync(join(testDir, 'component.tsx'), '');
      writeFileSync(join(testDir, 'state.ts'), '');

      const result = await validateCell(testDir);

      expect(result.valid).toBe(true);
    });

    it('should fail if required gates are missing', async () => {
      const pipeline = `
name: Test Pipeline
gates:
  typeCheck:
    command: tsc
    enabled: true
  # Missing lint, unitTests, behavioralAssertions
successCriteria:
  allGatesMustPass: true
`;

      writeFileSync(join(testDir, 'pipeline.yaml'), pipeline);

      const result = await validateCell(testDir);

      expect(result.valid).toBe(false);
      // Schema validation should catch missing required gates
      expect(result.errors.some(e => e.includes('Required') || e.includes('lint') || e.includes('unitTests') || e.includes('behavioralAssertions'))).toBe(true);
    });

    it('should warn if required gates are disabled', async () => {
      const pipeline = `
name: Test Pipeline
gates:
  typeCheck:
    command: tsc
    enabled: false
  lint:
    command: eslint
    enabled: false
  unitTests:
    command: vitest
    enabled: false
  behavioralAssertions:
    command: vitest
    enabled: false
successCriteria:
  allGatesMustPass: true
`;

      writeFileSync(join(testDir, 'pipeline.yaml'), pipeline);
      writeFileSync(join(testDir, 'component.tsx'), '');
      writeFileSync(join(testDir, 'state.ts'), '');

      const result = await validateCell(testDir);

      expect(result.warnings.some(w => w.includes('is disabled'))).toBe(true);
    });

    it('should warn if success criteria does not require all gates to pass', async () => {
      const pipeline = `
name: Test Pipeline
gates:
  typeCheck:
    command: tsc
    enabled: true
  lint:
    command: eslint
    enabled: true
  unitTests:
    command: vitest
    enabled: true
  behavioralAssertions:
    command: vitest
    enabled: true
successCriteria:
  allGatesMustPass: false
`;

      writeFileSync(join(testDir, 'pipeline.yaml'), pipeline);
      writeFileSync(join(testDir, 'component.tsx'), '');
      writeFileSync(join(testDir, 'state.ts'), '');

      const result = await validateCell(testDir);

      expect(result.warnings).toContain('Success criteria does not require all gates to pass');
    });
  });

  describe('Structure Validation', () => {
    beforeEach(() => {
      // Create valid manifest and pipeline for structure tests
      const manifest = {
        id: 'test-cell',
        version: '1.0.0',
        description: 'Test',
        dataContract: { source: 'test.getData' },
        behavioralAssertions: [{ id: 'assert-001', description: 'Test' }],
      };
      writeFileSync(join(testDir, 'manifest.json'), JSON.stringify(manifest));

      const pipeline = `
name: Test
gates:
  typeCheck: { command: tsc, enabled: true }
  lint: { command: eslint, enabled: true }
  unitTests: { command: vitest, enabled: true }
  behavioralAssertions: { command: vitest, enabled: true }
successCriteria:
  allGatesMustPass: true
`;
      writeFileSync(join(testDir, 'pipeline.yaml'), pipeline);
    });

    it('should fail if required files are missing', async () => {
      const result = await validateCell(testDir);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Required file missing: component.tsx');
      expect(result.errors).toContain('Required file missing: state.ts');
    });

    it('should warn if optional files are missing', async () => {
      writeFileSync(join(testDir, 'component.tsx'), '');
      writeFileSync(join(testDir, 'state.ts'), '');

      const result = await validateCell(testDir);

      expect(result.warnings).toContain('Optional file missing: README.md');
      expect(result.warnings).toContain('Optional file missing: index.ts');
    });

    it('should warn if component exceeds 200 lines', async () => {
      const longComponent = Array(250).fill('// line').join('\n');
      writeFileSync(join(testDir, 'component.tsx'), longComponent);
      writeFileSync(join(testDir, 'state.ts'), '');

      const result = await validateCell(testDir);

      expect(result.warnings.some(w => w.includes('250 lines'))).toBe(true);
    });

    it('should warn if state.ts does not use Zustand pattern', async () => {
      writeFileSync(join(testDir, 'component.tsx'), '');
      writeFileSync(join(testDir, 'state.ts'), 'export const state = {};');

      const result = await validateCell(testDir);

      expect(result.warnings).toContain('state.ts should use Zustand pattern');
    });

    it('should pass if state.ts uses Zustand pattern', async () => {
      writeFileSync(join(testDir, 'component.tsx'), '');
      writeFileSync(join(testDir, 'state.ts'), 'import { create } from "zustand";\nexport const useStore = create(() => ({}));');

      const result = await validateCell(testDir);

      expect(result.warnings.some(w => w.includes('Zustand pattern'))).toBe(false);
    });
  });
});

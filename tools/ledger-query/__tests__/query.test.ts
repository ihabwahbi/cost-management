import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  readLedger,
  findCell,
  getHistory,
  findDependents,
  getRecentChanges,
  getEntriesByStory,
  getAllSchemaChanges,
} from '../src/query.js';
import type { LedgerEntry } from '../src/types.js';

describe('Ledger Query Functions', () => {
  let testLedgerPath: string;
  const mockEntries: LedgerEntry[] = [
    {
      iterationId: 'iter_20250101_000001_po_mapping',
      timestamp: '2025-01-01T00:00:01Z',
      humanPrompt: 'Implement PO Mapping feature',
      artifacts: {
        created: [
          {
            type: 'feature',
            id: 'po-mapping',
            path: 'apps/web/app/po-mapping',
          },
        ],
        modified: [],
      },
      schemaChanges: [],
      metadata: {
        agent: 'dev',
        storyId: '1.0',
        note: 'Initial PO mapping implementation',
      },
    },
    {
      iterationId: 'iter_20250101_120000_foundation',
      timestamp: '2025-01-01T12:00:00Z',
      humanPrompt: 'Set up monorepo foundation',
      artifacts: {
        created: [
          {
            type: 'package',
            id: 'db',
            path: 'packages/db',
          },
          {
            type: 'package',
            id: 'api',
            path: 'packages/api',
          },
        ],
        modified: [
          {
            id: 'root-package',
            path: 'package.json',
            changes: ['Added turborepo'],
          },
        ],
      },
      schemaChanges: [
        {
          table: 'projects',
          operation: 'create',
          migration: '001_initial_schema.sql',
        },
      ],
      metadata: {
        agent: 'dev',
        storyId: '1.1',
      },
    },
    {
      iterationId: 'iter_20250102_080000_cell_001',
      timestamp: '2025-01-02T08:00:00Z',
      humanPrompt: 'Create KPI Card Cell',
      artifacts: {
        created: [
          {
            type: 'cell',
            id: 'kpi-card-001',
            path: 'apps/web/cells/kpi-card',
          },
        ],
        modified: [],
      },
      schemaChanges: [],
      metadata: {
        agent: 'dev',
        storyId: '1.2',
        note: 'Uses projects.getKPIs API',
      },
    },
  ];

  beforeEach(() => {
    // Create test ledger file
    testLedgerPath = join(tmpdir(), `test-ledger-${Date.now()}.jsonl`);
    const content = mockEntries.map((entry) => JSON.stringify(entry)).join('\n');
    writeFileSync(testLedgerPath, content);
  });

  afterEach(() => {
    // Clean up test ledger
    if (existsSync(testLedgerPath)) {
      unlinkSync(testLedgerPath);
    }
  });

  describe('readLedger', () => {
    it('should read all entries from ledger file', () => {
      const entries = readLedger(testLedgerPath);

      expect(entries).toHaveLength(3);
      expect(entries[0].iterationId).toBe('iter_20250101_000001_po_mapping');
      expect(entries[1].iterationId).toBe('iter_20250101_120000_foundation');
      expect(entries[2].iterationId).toBe('iter_20250102_080000_cell_001');
    });

    it('should return empty array if ledger file does not exist', () => {
      const entries = readLedger('/nonexistent/ledger.jsonl');

      expect(entries).toEqual([]);
    });

    it('should skip empty lines', () => {
      const contentWithEmptyLines = mockEntries
        .map((entry) => JSON.stringify(entry))
        .join('\n\n\n');
      writeFileSync(testLedgerPath, contentWithEmptyLines);

      const entries = readLedger(testLedgerPath);

      expect(entries).toHaveLength(3);
    });

    it('should parse JSONL format correctly', () => {
      const entries = readLedger(testLedgerPath);

      entries.forEach((entry) => {
        expect(entry).toHaveProperty('iterationId');
        expect(entry).toHaveProperty('timestamp');
        expect(entry).toHaveProperty('humanPrompt');
        expect(entry).toHaveProperty('artifacts');
        expect(entry.artifacts).toHaveProperty('created');
        expect(entry.artifacts).toHaveProperty('modified');
      });
    });
  });

  describe('findCell', () => {
    it('should find entries by artifact ID', () => {
      const results = findCell('po-mapping', testLedgerPath);

      expect(results).toHaveLength(1);
      expect(results[0].humanPrompt).toBe('Implement PO Mapping feature');
    });

    it('should find entries by artifact path', () => {
      const results = findCell('packages/db', testLedgerPath);

      expect(results).toHaveLength(1);
      expect(results[0].iterationId).toBe('iter_20250101_120000_foundation');
    });

    it('should find entries by human prompt', () => {
      const results = findCell('monorepo', testLedgerPath);

      expect(results).toHaveLength(1);
      expect(results[0].humanPrompt).toContain('monorepo');
    });

    it('should find entries by metadata note', () => {
      const results = findCell('getKPIs', testLedgerPath);

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.note).toContain('getKPIs');
    });

    it('should be case insensitive', () => {
      const results = findCell('PO-MAPPING', testLedgerPath);

      expect(results).toHaveLength(1);
      expect(results[0].artifacts.created[0].id).toBe('po-mapping');
    });

    it('should return empty array if no matches found', () => {
      const results = findCell('nonexistent-feature', testLedgerPath);

      expect(results).toEqual([]);
    });

    it('should find multiple matches', () => {
      const results = findCell('package', testLedgerPath);

      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getHistory', () => {
    it('should find entries where artifact was created', () => {
      const history = getHistory('db', testLedgerPath);

      expect(history).toHaveLength(1);
      expect(history[0].iterationId).toBe('iter_20250101_120000_foundation');
    });

    it('should find entries where artifact was modified', () => {
      const history = getHistory('root-package', testLedgerPath);

      expect(history).toHaveLength(1);
      expect(history[0].artifacts.modified).toHaveLength(1);
    });

    it('should return empty array if artifact not found', () => {
      const history = getHistory('nonexistent-artifact', testLedgerPath);

      expect(history).toEqual([]);
    });

    it('should return all entries for an artifact across multiple iterations', () => {
      // Add another entry that modifies 'db'
      const newEntry: LedgerEntry = {
        iterationId: 'iter_20250103_000000_update_db',
        timestamp: '2025-01-03T00:00:00Z',
        humanPrompt: 'Update database schema',
        artifacts: {
          created: [],
          modified: [
            {
              id: 'db',
              path: 'packages/db',
              changes: ['Added new tables'],
            },
          ],
        },
        schemaChanges: [],
        metadata: { agent: 'dev' },
      };

      const content = [...mockEntries, newEntry].map((e) => JSON.stringify(e)).join('\n');
      writeFileSync(testLedgerPath, content);

      const history = getHistory('db', testLedgerPath);

      expect(history).toHaveLength(2);
    });
  });

  describe('findDependents', () => {
    it('should find entries that reference an API in metadata', () => {
      const dependents = findDependents('projects.getKPIs', testLedgerPath);

      expect(dependents).toHaveLength(1);
      expect(dependents[0].iterationId).toBe('iter_20250102_080000_cell_001');
    });

    it('should be case insensitive', () => {
      const dependents = findDependents('PROJECTS.GETKPIS', testLedgerPath);

      expect(dependents).toHaveLength(1);
    });

    it('should return empty array if no dependents found', () => {
      const dependents = findDependents('nonexistent.api', testLedgerPath);

      expect(dependents).toEqual([]);
    });
  });

  describe('getRecentChanges', () => {
    it('should return entries after specified date', () => {
      const since = new Date('2025-01-01T10:00:00Z');
      const recent = getRecentChanges(since, testLedgerPath);

      expect(recent).toHaveLength(2);
      expect(recent[0].timestamp >= since.toISOString()).toBe(true);
    });

    it('should return entries sorted by timestamp (newest first)', () => {
      const since = new Date('2025-01-01T00:00:00Z');
      const recent = getRecentChanges(since, testLedgerPath);

      expect(new Date(recent[0].timestamp).getTime()).toBeGreaterThan(new Date(recent[1].timestamp).getTime());
    });

    it('should return empty array if no entries after date', () => {
      const since = new Date('2025-12-31T23:59:59Z');
      const recent = getRecentChanges(since, testLedgerPath);

      expect(recent).toEqual([]);
    });

    it('should include entries on the exact date', () => {
      const since = new Date('2025-01-01T12:00:00Z');
      const recent = getRecentChanges(since, testLedgerPath);

      expect(recent.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getEntriesByStory', () => {
    it('should return entries for a specific story', () => {
      const entries = getEntriesByStory('1.1', testLedgerPath);

      expect(entries).toHaveLength(1);
      expect(entries[0].metadata?.storyId).toBe('1.1');
    });

    it('should return empty array if story has no entries', () => {
      const entries = getEntriesByStory('999.999', testLedgerPath);

      expect(entries).toEqual([]);
    });

    it('should return all entries for a story', () => {
      // Add another entry for story 1.1
      const newEntry: LedgerEntry = {
        iterationId: 'iter_20250101_180000_foundation_part2',
        timestamp: '2025-01-01T18:00:00Z',
        humanPrompt: 'Add tests for foundation',
        artifacts: {
          created: [
            {
              type: 'package',
              id: 'test-utils',
              path: 'packages/test-utils',
            },
          ],
          modified: [],
        },
        schemaChanges: [],
        metadata: {
          agent: 'dev',
          storyId: '1.1',
        },
      };

      const content = [...mockEntries, newEntry].map((e) => JSON.stringify(e)).join('\n');
      writeFileSync(testLedgerPath, content);

      const entries = getEntriesByStory('1.1', testLedgerPath);

      expect(entries).toHaveLength(2);
    });
  });

  describe('getAllSchemaChanges', () => {
    it('should return only entries with schema changes', () => {
      const schemaEntries = getAllSchemaChanges(testLedgerPath);

      expect(schemaEntries).toHaveLength(1);
      expect(schemaEntries[0].schemaChanges).toHaveLength(1);
      expect(schemaEntries[0].schemaChanges[0].table).toBe('projects');
    });

    it('should return empty array if no schema changes', () => {
      const entriesWithoutSchema = mockEntries.filter((e) => e.schemaChanges.length === 0);
      const content = entriesWithoutSchema.map((e) => JSON.stringify(e)).join('\n');
      writeFileSync(testLedgerPath, content);

      const schemaEntries = getAllSchemaChanges(testLedgerPath);

      expect(schemaEntries).toEqual([]);
    });

    it('should include all schema change details', () => {
      const schemaEntries = getAllSchemaChanges(testLedgerPath);

      expect(schemaEntries[0].schemaChanges[0]).toHaveProperty('table');
      expect(schemaEntries[0].schemaChanges[0]).toHaveProperty('operation');
      expect(schemaEntries[0].schemaChanges[0]).toHaveProperty('migration');
    });
  });

  describe('Type Safety', () => {
    it('should return properly typed LedgerEntry objects', () => {
      const entries = readLedger(testLedgerPath);

      entries.forEach((entry) => {
        expect(typeof entry.iterationId).toBe('string');
        expect(typeof entry.timestamp).toBe('string');
        expect(typeof entry.humanPrompt).toBe('string');
        expect(Array.isArray(entry.artifacts.created)).toBe(true);
        expect(Array.isArray(entry.artifacts.modified)).toBe(true);
        expect(Array.isArray(entry.schemaChanges)).toBe(true);
      });
    });
  });
});

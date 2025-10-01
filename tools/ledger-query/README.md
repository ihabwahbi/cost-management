# @cost-mgmt/ledger-query

Query utilities for the Architectural Ledger.

## Overview

The Architectural Ledger is an append-only JSONL file that records all development decisions, changes, and artifacts created during the project lifecycle. This package provides utilities to query and analyze ledger entries.

## Ledger Purpose

The ledger serves as:
- **Change History** - Complete audit trail of all modifications
- **Agent Context** - AI agents can query ledger to understand project state
- **Architecture Traceability** - Links features to requirements and decisions
- **Impact Analysis** - Find dependencies and affected components

## Installation

```bash
pnpm install
```

## Usage

```typescript
import {
  readLedger,
  findCell,
  getHistory,
  findDependents,
  getRecentChanges,
  getEntriesByStory,
} from '@cost-mgmt/ledger-query';

// Find all entries related to PO Mapping
const results = findCell('POMapping');
console.log(results);

// Get complete history of changes to a specific Cell
const history = getHistory('KPICard');

// Find all Cells that depend on a tRPC procedure
const dependents = findDependents('projects.getKPIs');

// Get all changes in the last week
const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const recentChanges = getRecentChanges(lastWeek);

// Get all entries for a specific story
const story11Entries = getEntriesByStory('1.1');
```

## API

### `readLedger(ledgerPath?: string): LedgerEntry[]`

Reads all entries from ledger.jsonl.

**Parameters:**
- `ledgerPath` - Optional path to ledger file (defaults to `./ledger.jsonl`)

**Returns:** Array of ledger entries

### `findCell(searchTerm: string, ledgerPath?: string): LedgerEntry[]`

Find Cell or artifact by search term.

Searches in:
- Artifact IDs
- Artifact paths  
- Human prompts
- Metadata notes

**Parameters:**
- `searchTerm` - Text to search for (case-insensitive)
- `ledgerPath` - Optional path to ledger file

**Returns:** Array of matching entries

### `getHistory(cellId: string, ledgerPath?: string): LedgerEntry[]`

Get complete history of changes for a specific Cell/artifact.

**Parameters:**
- `cellId` - The artifact ID to get history for
- `ledgerPath` - Optional path to ledger file

**Returns:** Array of entries that created or modified the artifact

### `findDependents(apiId: string, ledgerPath?: string): LedgerEntry[]`

Find Cells/artifacts that depend on a specific API procedure.

**Parameters:**
- `apiId` - The API procedure ID (e.g., "projects.getById")
- `ledgerPath` - Optional path to ledger file

**Returns:** Array of entries that reference the API

**Note:** Full implementation requires Cell manifests with dataContract info

### `getRecentChanges(since: Date, ledgerPath?: string): LedgerEntry[]`

Get recent ledger entries since a specific date.

**Parameters:**
- `since` - Date to get entries from
- `ledgerPath` - Optional path to ledger file

**Returns:** Array of entries sorted by timestamp (newest first)

### `getEntriesByStory(storyId: string, ledgerPath?: string): LedgerEntry[]`

Get all entries for a specific story.

**Parameters:**
- `storyId` - Story ID (e.g., "1.1", "1.2")
- `ledgerPath` - Optional path to ledger file

**Returns:** Array of entries for the story

### `getAllSchemaChanges(ledgerPath?: string): LedgerEntry[]`

Get all entries that include database schema changes.

**Parameters:**
- `ledgerPath` - Optional path to ledger file

**Returns:** Array of entries with schema changes

## Ledger Entry Schema

```typescript
interface LedgerEntry {
  iterationId: string;          // Unique iteration ID
  timestamp: string;            // ISO 8601 timestamp
  humanPrompt: string;          // Original user instruction
  
  artifacts: {
    created: Array<{
      type: 'cell' | 'api' | 'schema' | 'package' | 'feature' | 'library' | 'tool' | 'epic';
      id: string;
      path?: string;
    }>;
    modified: Array<{
      type?: string;
      id?: string;
      path?: string;
      changes?: string[];
    }>;
  };
  
  schemaChanges: Array<{
    table: string;
    operation: 'create' | 'alter' | 'drop';
    migration: string;
  }>;
  
  metadata?: {
    agent?: string;
    duration?: number;
    iterationCount?: number;
    storyId?: string;
    tasks?: string[];
    note?: string;
    [key: string]: any;
  };
}
```

## Example Ledger Entry

```json
{
  "iterationId": "iter_20251001_foundationSetup",
  "timestamp": "2025-10-01T14:30:00Z",
  "humanPrompt": "Implement Story 1.1: Foundation Setup for Living Blueprint Architecture",
  "artifacts": {
    "created": [
      {"type": "package", "id": "@cost-mgmt/db", "path": "packages/db"},
      {"type": "package", "id": "@cost-mgmt/api", "path": "packages/api"},
      {"type": "tool", "id": "cell-validator", "path": "tools/cell-validator"}
    ],
    "modified": [
      {"type": "package", "path": "package.json", "changes": ["Converted to Turborepo monorepo"]}
    ]
  },
  "schemaChanges": [],
  "metadata": {
    "agent": "dev",
    "storyId": "1.1",
    "tasks": ["Turborepo setup", "Drizzle ORM setup", "tRPC API setup"]
  }
}
```

## Testing

```bash
pnpm test
```

## Type Checking

```bash
pnpm type-check
```

## Future Enhancements

- [ ] CLI interface for ledger queries
- [ ] Graph visualization of dependencies
- [ ] Export to various formats (CSV, JSON, Markdown)
- [ ] Statistical analysis (frequency, duration, etc.)
- [ ] Integration with Cell manifests for deeper dependency tracking

## Documentation

- [Living Blueprint Architecture - Ledger](../../docs/living-blueprint-architecture.md#23-pillar-3-the-architectural-ledger)

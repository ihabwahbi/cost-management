/**
 * Ledger Entry Type Definitions
 */

export interface LedgerArtifact {
  type: 'cell' | 'api' | 'schema' | 'package' | 'feature' | 'library' | 'tool' | 'epic';
  id: string;
  path?: string;
}

export interface LedgerModification {
  type?: string;
  id?: string;
  path?: string;
  changes?: string[];
}

export interface LedgerSchemaChange {
  table: string;
  operation: 'create' | 'alter' | 'drop';
  migration: string;
}

export interface LedgerMetadata {
  agent?: string;
  duration?: number;
  iterationCount?: number;
  storyId?: string;
  tasks?: string[];
  note?: string;
  [key: string]: any;
}

export interface LedgerEntry {
  iterationId: string;
  timestamp: string;
  humanPrompt: string;
  artifacts: {
    created: LedgerArtifact[];
    modified: LedgerModification[];
  };
  schemaChanges: LedgerSchemaChange[];
  metadata?: LedgerMetadata;
}

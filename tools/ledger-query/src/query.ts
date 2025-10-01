/**
 * Ledger Query Functions
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { LedgerEntry } from './types.js';

/**
 * Read all entries from ledger.jsonl
 */
export function readLedger(ledgerPath?: string): LedgerEntry[] {
  const path = ledgerPath || join(process.cwd(), 'ledger.jsonl');
  
  try {
    const content = readFileSync(path, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    return lines.map((line) => JSON.parse(line) as LedgerEntry);
  } catch (error) {
    console.error(`Failed to read ledger: ${error}`);
    return [];
  }
}

/**
 * Find Cell or artifact by search term
 * 
 * Searches in:
 * - Artifact IDs
 * - Artifact paths
 * - Human prompts
 * - Metadata notes
 */
export function findCell(searchTerm: string, ledgerPath?: string): LedgerEntry[] {
  const entries = readLedger(ledgerPath);
  const normalizedSearch = searchTerm.toLowerCase();
  
  return entries.filter((entry) => {
    // Search in artifact IDs
    const hasMatchingArtifact = entry.artifacts.created.some(
      (artifact) => artifact.id.toLowerCase().includes(normalizedSearch)
    );
    
    // Search in paths
    const hasMatchingPath = entry.artifacts.created.some(
      (artifact) => artifact.path?.toLowerCase().includes(normalizedSearch)
    );
    
    // Search in human prompt
    const hasMatchingPrompt = entry.humanPrompt.toLowerCase().includes(normalizedSearch);
    
    // Search in metadata note
    const hasMatchingNote = entry.metadata?.note?.toLowerCase().includes(normalizedSearch);
    
    return hasMatchingArtifact || hasMatchingPath || hasMatchingPrompt || hasMatchingNote;
  });
}

/**
 * Get history of changes for a specific Cell/artifact
 */
export function getHistory(cellId: string, ledgerPath?: string): LedgerEntry[] {
  const entries = readLedger(ledgerPath);
  
  return entries.filter((entry) => {
    // Check created artifacts
    const wasCreated = entry.artifacts.created.some((artifact) => artifact.id === cellId);
    
    // Check modified artifacts
    const wasModified = entry.artifacts.modified.some((mod) => mod.id === cellId);
    
    return wasCreated || wasModified;
  });
}

/**
 * Find Cells/artifacts that depend on a specific API procedure
 * 
 * Note: This is a placeholder for future implementation when Cells
 * have their manifests stored in the ledger with dataContract info
 */
export function findDependents(apiId: string, ledgerPath?: string): LedgerEntry[] {
  const entries = readLedger(ledgerPath);
  
  // For now, search in metadata for API references
  return entries.filter((entry) => {
    const metadata = JSON.stringify(entry.metadata || {}).toLowerCase();
    return metadata.includes(apiId.toLowerCase());
  });
}

/**
 * Get recent ledger entries since a specific date
 */
export function getRecentChanges(since: Date, ledgerPath?: string): LedgerEntry[] {
  const entries = readLedger(ledgerPath);
  const sinceTime = since.getTime();
  
  return entries.filter((entry) => {
    const entryTime = new Date(entry.timestamp).getTime();
    return entryTime >= sinceTime;
  }).sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

/**
 * Get all entries for a specific story
 */
export function getEntriesByStory(storyId: string, ledgerPath?: string): LedgerEntry[] {
  const entries = readLedger(ledgerPath);
  
  return entries.filter((entry) => {
    return entry.metadata?.storyId === storyId;
  });
}

/**
 * Get all schema changes
 */
export function getAllSchemaChanges(ledgerPath?: string): LedgerEntry[] {
  const entries = readLedger(ledgerPath);
  
  return entries.filter((entry) => {
    return entry.schemaChanges && entry.schemaChanges.length > 0;
  });
}

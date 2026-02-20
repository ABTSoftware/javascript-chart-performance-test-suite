/**
 * Import test results from various formats
 */

import { getDB } from '../indexeddb/database';
import { STORE_NAME, RESERVED_RESULT_SET_LOCAL } from '../../types/database';
import { saveResultSet, getResultSetById } from '../indexeddb/resultSets';
import { saveTestResult } from '../indexeddb/testResults';
import type { TestResult } from '../../types/testResults';
import type { ResultSet } from '../../types/database';
import { parseStorageState, simpleHash } from './storageStateParser';
import { parseSimpleJson } from './jsonParser';

/**
 * Import results into a specific result set
 */
export async function importResults(
  records: TestResult[],
  resultSetId: string,
  resultSetLabel: string,
  source: ResultSet['source'] = 'import'
): Promise<void> {
  const db = getDB();

  // Save result set metadata
  await saveResultSet({
    id: resultSetId,
    label: resultSetLabel,
    source,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Write all records with the new resultSetId prefix
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  for (const record of records) {
    // Strip any existing resultSetId prefix from the id
    const baseId =
      record.id.includes('_') && record.resultSetId
        ? record.id.substring(record.resultSetId.length + 1)
        : record.id;

    const newRecord: TestResult = {
      ...record,
      id: `${resultSetId}_${baseId}`,
      resultSetId: resultSetId,
    };

    store.put(newRecord);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Auto-import from Playwright storage-state.json
 */
export async function autoImportStorageState(): Promise<void> {
  try {
    const response = await fetch('/tests/storage-state.json');
    if (!response.ok) return;

    const text = await response.text();
    const records = parseStorageState(text);
    if (records.length === 0) return;

    // Simple content hash to skip re-import when nothing changed
    const hash = simpleHash(text);
    const existingHash = localStorage.getItem('storageStateHash');
    if (existingHash === hash) {
      console.log('storage-state.json unchanged, skipping auto-import');
      return;
    }

    // Ensure "Local" result set metadata exists
    const existingRs = await getResultSetById(RESERVED_RESULT_SET_LOCAL);
    if (!existingRs) {
      await saveResultSet({
        id: RESERVED_RESULT_SET_LOCAL,
        label: 'Local',
        source: 'system',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Upsert records into "local" (preserves any manual test results)
    const db = getDB();
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const record of records) {
      let baseId = record.id;
      // Strip any existing resultSetId prefix
      if (record.resultSetId && baseId.startsWith(record.resultSetId + '_')) {
        baseId = baseId.substring(record.resultSetId.length + 1);
      }

      const newRecord: TestResult = {
        ...record,
        id: `${RESERVED_RESULT_SET_LOCAL}_${baseId}`,
        resultSetId: RESERVED_RESULT_SET_LOCAL,
      };

      store.put(newRecord);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    localStorage.setItem('storageStateHash', hash);
    console.log(`Auto-imported ${records.length} result(s) from storage-state.json into Local`);
  } catch (error) {
    console.warn(
      'Auto-import of storage-state.json skipped:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Detect and parse import file format
 */
export function detectAndParseImportFile(jsonString: string): {
  records: TestResult[];
  source: ResultSet['source'];
} {
  const parsed = JSON.parse(jsonString);

  // Check if it's Playwright format
  if (parsed.origins) {
    return {
      records: parseStorageState(jsonString),
      source: 'playwright',
    };
  }

  // Otherwise, simple JSON format
  return {
    records: parseSimpleJson(jsonString),
    source: 'json',
  };
}

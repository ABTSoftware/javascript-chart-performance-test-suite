/**
 * Parse Playwright storage-state.json format
 */

import { DB_NAME, STORE_NAME } from '../../types/database';
import type { TestResult } from '../../types/testResults';

/**
 * Decode Playwright's base64-encoded IndexedDB value
 */
function decodePlaywrightValue(encoded: string): any {
  try {
    // Playwright encodes IndexedDB values as base64 JSON
    const decoded = atob(encoded);
    return JSON.parse(decoded);
  } catch (error) {
    console.warn('Failed to decode Playwright value:', error);
    return null;
  }
}

/**
 * Parse Playwright storage-state.json format
 */
export function parseStorageState(jsonString: string): TestResult[] {
  const state = JSON.parse(jsonString);
  const records: TestResult[] = [];

  if (!state.origins || !Array.isArray(state.origins)) return records;

  for (const origin of state.origins) {
    if (!origin.indexedDB || !Array.isArray(origin.indexedDB)) continue;

    for (const idb of origin.indexedDB) {
      if (idb.name !== DB_NAME) continue;

      for (const store of idb.stores) {
        if (store.name !== STORE_NAME) continue;

        for (const rec of store.records) {
          const decoded = decodePlaywrightValue(rec.valueEncoded);
          if (decoded && decoded.id && decoded.chartLibrary && decoded.testCase) {
            records.push(decoded as TestResult);
          }
        }
      }
    }
  }

  return records;
}

/**
 * Simple hash function for content comparison
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash.toString(36);
}

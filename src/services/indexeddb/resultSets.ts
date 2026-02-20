/**
 * IndexedDB operations for result sets
 */

import { getDB } from './database';
import { RESULT_SETS_STORE, RESERVED_RESULT_SET_LOCAL } from '../../types/database';
import type { ResultSet } from '../../types/database';
import { deleteTestResultsByResultSet } from './testResults';

/**
 * Get all result sets
 */
export async function getAllResultSets(): Promise<ResultSet[]> {
  try {
    const db = getDB();
    const tx = db.transaction([RESULT_SETS_STORE], 'readonly');
    const store = tx.objectStore(RESULT_SETS_STORE);

    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as ResultSet[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Exception in getAllResultSets:', error);
    return [];
  }
}

/**
 * Get a result set by ID
 */
export async function getResultSetById(resultSetId: string): Promise<ResultSet | null> {
  try {
    const db = getDB();
    const tx = db.transaction([RESULT_SETS_STORE], 'readonly');
    const store = tx.objectStore(RESULT_SETS_STORE);

    return new Promise((resolve, reject) => {
      const req = store.get(resultSetId);
      req.onsuccess = () => resolve((req.result as ResultSet) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Exception in getResultSetById:', error);
    return null;
  }
}

/**
 * Save or update a result set
 */
export async function saveResultSet(metadata: ResultSet): Promise<void> {
  const db = getDB();
  const tx = db.transaction([RESULT_SETS_STORE], 'readwrite');
  const store = tx.objectStore(RESULT_SETS_STORE);

  return new Promise((resolve, reject) => {
    const req = store.put(metadata);
    req.onsuccess = () => {
      console.log('Result set saved:', metadata.id);
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a result set and all its associated test results
 * @throws Error if trying to delete the reserved "local" result set
 */
export async function deleteResultSet(resultSetId: string): Promise<void> {
  // Prevent deleting the local result set
  if (resultSetId === RESERVED_RESULT_SET_LOCAL) {
    throw new Error('Cannot delete the "Local" result set');
  }

  const db = getDB();

  // Delete all test results for this result set first
  await deleteTestResultsByResultSet(resultSetId);

  // Then delete the result set metadata
  const tx = db.transaction([RESULT_SETS_STORE], 'readwrite');
  const rsStore = tx.objectStore(RESULT_SETS_STORE);

  return new Promise((resolve, reject) => {
    const req = rsStore.delete(resultSetId);

    tx.oncomplete = () => {
      console.log('Result set deleted:', resultSetId);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Generate a URL-safe slug from a result set label
 */
export function generateResultSetId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

/**
 * Create a new result set with generated ID
 */
export async function createResultSet(
  label: string,
  source: ResultSet['source'] = 'import'
): Promise<ResultSet> {
  const id = generateResultSetId(label);
  const now = Date.now();

  const resultSet: ResultSet = {
    id,
    label,
    source,
    createdAt: now,
    updatedAt: now,
  };

  await saveResultSet(resultSet);
  return resultSet;
}

/**
 * Check if a result set ID is already in use
 */
export async function resultSetExists(resultSetId: string): Promise<boolean> {
  const resultSet = await getResultSetById(resultSetId);
  return resultSet !== null;
}

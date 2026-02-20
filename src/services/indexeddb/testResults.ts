/**
 * IndexedDB operations for test results
 */

import { getDB } from './database';
import { STORE_NAME } from '../../types/database';
import type { TestResult } from '../../types/testResults';

/**
 * Get all test results from the database
 */
export async function getAllTestResults(): Promise<TestResult[]> {
  try {
    const db = getDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = (event) => {
        const results = (event.target as IDBRequest<TestResult[]>).result || [];
        console.log('Retrieved from IndexedDB:', results.length, 'records');
        resolve(results);
      };

      request.onerror = (event) => {
        console.error('IndexedDB retrieval error:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error('Exception in getAllTestResults:', error);
    return [];
  }
}

/**
 * Get test results for a specific result set
 */
export async function getResultsByResultSet(resultSetId: string): Promise<TestResult[]> {
  try {
    const db = getDB();
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('resultSetId');

    return new Promise((resolve, reject) => {
      const req = index.getAll(resultSetId);
      req.onsuccess = () => resolve((req.result as TestResult[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Exception in getResultsByResultSet:', error);
    return [];
  }
}

/**
 * Get test results for a specific chart library
 */
export async function getResultsByLibrary(chartLibrary: string): Promise<TestResult[]> {
  try {
    const db = getDB();
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('chartLibrary');

    return new Promise((resolve, reject) => {
      const req = index.getAll(chartLibrary);
      req.onsuccess = () => resolve((req.result as TestResult[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Exception in getResultsByLibrary:', error);
    return [];
  }
}

/**
 * Get test results for a specific test case
 */
export async function getResultsByTestCase(testCase: string): Promise<TestResult[]> {
  try {
    const db = getDB();
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('testCase');

    return new Promise((resolve, reject) => {
      const req = index.getAll(testCase);
      req.onsuccess = () => resolve((req.result as TestResult[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Exception in getResultsByTestCase:', error);
    return [];
  }
}

/**
 * Save or update a test result
 */
export async function saveTestResult(testResult: TestResult): Promise<void> {
  const db = getDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const req = store.put(testResult);
    req.onsuccess = () => {
      console.log('Test result saved:', testResult.id);
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a test result by ID
 */
export async function deleteTestResult(id: string): Promise<void> {
  const db = getDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => {
      console.log('Test result deleted:', id);
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete all test results for a specific result set
 */
export async function deleteTestResultsByResultSet(resultSetId: string): Promise<void> {
  const db = getDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('resultSetId');

  return new Promise((resolve, reject) => {
    const cursorReq = index.openCursor(resultSetId);

    cursorReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => {
      console.log('All test results deleted for result set:', resultSetId);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Group results by test case
 */
export function groupResultsByTestCase(allResults: TestResult[]): Record<string, Record<string, TestResult['results']>> {
  const resultsByTestCase: Record<string, Record<string, TestResult['results']>> = {};

  allResults.forEach((result) => {
    if (!resultsByTestCase[result.testCase]) {
      resultsByTestCase[result.testCase] = {};
    }
    resultsByTestCase[result.testCase][result.chartLibrary] = result.results;
  });

  return resultsByTestCase;
}

/**
 * Group results by test case and result set
 */
export function groupResultsByTestCaseAndResultSet(
  allResults: TestResult[]
): Record<string, Record<string, Record<string, TestResult['results']>>> {
  const grouped: Record<string, Record<string, Record<string, TestResult['results']>>> = {};

  allResults.forEach((result) => {
    const tc = result.testCase;
    const rs = result.resultSetId;
    const lib = result.chartLibrary;

    if (!grouped[tc]) grouped[tc] = {};
    if (!grouped[tc][rs]) grouped[tc][rs] = {};
    grouped[tc][rs][lib] = result.results;
  });

  return grouped;
}

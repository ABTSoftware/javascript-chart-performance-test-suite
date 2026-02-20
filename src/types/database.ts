/**
 * IndexedDB database schema and types
 */

/**
 * Source of a result set
 */
export type ResultSetSource = 'system' | 'playwright' | 'json' | 'import';

/**
 * Result set metadata - represents a collection of test results
 */
export interface ResultSet {
  /** Unique identifier (URL-safe slug) */
  id: string;
  /** Human-readable label */
  label: string;
  /** How the result set was created */
  source: ResultSetSource;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
}

/**
 * Database constants
 */
export const DB_NAME = 'ChartPerformanceResults';
export const DB_VERSION = 3;
export const STORE_NAME = 'testResults';
export const RESULT_SETS_STORE = 'resultSets';
export const RESERVED_RESULT_SET_LOCAL = 'local';

/**
 * IndexedDB store names
 */
export type StoreName = typeof STORE_NAME | typeof RESULT_SETS_STORE;

/**
 * Hook for managing test results
 */

import { useState, useEffect, useCallback } from 'react';
import { useIndexedDB } from '../contexts/IndexedDBContext';
import { getAllTestResults, getResultsByResultSet } from '../services/indexeddb/testResults';
import type { TestResult } from '../types/testResults';

/**
 * Hook to fetch and manage test results
 * @param resultSetId - Optional: filter by result set ID
 */
export function useTestResults(resultSetId?: string) {
  const { isInitialized } = useIndexedDB();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchResults = useCallback(async () => {
    if (!isInitialized) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = resultSetId
        ? await getResultsByResultSet(resultSetId)
        : await getAllTestResults();

      setResults(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch test results');
      setError(error);
      console.error('Error fetching test results:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, resultSetId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const refetch = useCallback(() => {
    return fetchResults();
  }, [fetchResults]);

  return {
    results,
    isLoading,
    error,
    refetch,
  };
}

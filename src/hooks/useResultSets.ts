/**
 * Hook for managing result sets
 */

import { useState, useEffect, useCallback } from 'react';
import { useIndexedDB } from '../contexts/IndexedDBContext';
import {
  getAllResultSets,
  saveResultSet,
  deleteResultSet,
  createResultSet,
} from '../services/indexeddb/resultSets';
import type { ResultSet } from '../types/database';

/**
 * Hook to fetch and manage result sets
 */
export function useResultSets() {
  const { isInitialized } = useIndexedDB();
  const [resultSets, setResultSets] = useState<ResultSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchResultSets = useCallback(async () => {
    if (!isInitialized) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await getAllResultSets();
      // Sort by creation date (newest first)
      data.sort((a, b) => b.createdAt - a.createdAt);

      setResultSets(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch result sets');
      setError(error);
      console.error('Error fetching result sets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  useEffect(() => {
    fetchResultSets();
  }, [fetchResultSets]);

  const refetch = useCallback(() => {
    return fetchResultSets();
  }, [fetchResultSets]);

  const create = useCallback(
    async (label: string, source: ResultSet['source'] = 'import') => {
      try {
        const resultSet = await createResultSet(label, source);
        await refetch();
        return resultSet;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create result set');
        console.error('Error creating result set:', error);
        throw error;
      }
    },
    [refetch]
  );

  const update = useCallback(
    async (resultSet: ResultSet) => {
      try {
        await saveResultSet(resultSet);
        await refetch();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update result set');
        console.error('Error updating result set:', error);
        throw error;
      }
    },
    [refetch]
  );

  const remove = useCallback(
    async (resultSetId: string) => {
      try {
        await deleteResultSet(resultSetId);
        await refetch();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete result set');
        console.error('Error deleting result set:', error);
        throw error;
      }
    },
    [refetch]
  );

  return {
    resultSets,
    isLoading,
    error,
    refetch,
    create,
    update,
    remove,
  };
}

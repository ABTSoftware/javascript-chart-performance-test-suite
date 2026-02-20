/**
 * IndexedDB Context - provides database connection to the app
 */

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { initIndexedDB, isDBInitialized } from '../services/indexeddb/database';

interface IndexedDBContextValue {
  /** IndexedDB database instance */
  db: IDBDatabase | null;
  /** Whether the database is initialized and ready */
  isInitialized: boolean;
  /** Error during initialization, if any */
  error: Error | null;
  /** Re-initialize the database */
  reinitialize: () => Promise<void>;
}

const IndexedDBContext = createContext<IndexedDBContextValue | null>(null);

interface IndexedDBProviderProps {
  children: ReactNode;
}

/**
 * IndexedDB Provider - initializes database and provides it to children
 */
export function IndexedDBProvider({ children }: IndexedDBProviderProps) {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initialize = async () => {
    try {
      setError(null);
      const database = await initIndexedDB();
      setDb(database);
      setIsInitialized(true);
      console.log('IndexedDB initialized in context');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize IndexedDB');
      setError(error);
      console.error('Failed to initialize IndexedDB:', error);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  const reinitialize = async () => {
    setIsInitialized(false);
    await initialize();
  };

  const value: IndexedDBContextValue = {
    db,
    isInitialized,
    error,
    reinitialize,
  };

  return <IndexedDBContext.Provider value={value}>{children}</IndexedDBContext.Provider>;
}

/**
 * Hook to access IndexedDB context
 * @throws Error if used outside of IndexedDBProvider
 */
export function useIndexedDB(): IndexedDBContextValue {
  const context = useContext(IndexedDBContext);
  if (!context) {
    throw new Error('useIndexedDB must be used within IndexedDBProvider');
  }
  return context;
}

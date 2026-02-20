/**
 * Filters Context - manages filter state for result sets, libraries, and metrics
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Metric } from '../types/charts';

interface FiltersContextValue {
  /** Selected result set IDs */
  checkedResultSets: Set<string>;
  /** Selected library names */
  checkedLibraries: Set<string>;
  /** Selected metric type */
  selectedMetric: Metric;
  /** Toggle a result set selection */
  toggleResultSet: (id: string) => void;
  /** Toggle a library selection */
  toggleLibrary: (name: string) => void;
  /** Set the selected metric */
  setMetric: (metric: Metric) => void;
  /** Set all result sets */
  setResultSets: (ids: string[]) => void;
  /** Set all libraries */
  setLibraries: (names: string[]) => void;
  /** Check if a result set is selected */
  isResultSetChecked: (id: string) => boolean;
  /** Check if a library is selected */
  isLibraryChecked: (name: string) => boolean;
}

const FiltersContext = createContext<FiltersContextValue | null>(null);

interface FiltersProviderProps {
  children: ReactNode;
}

/**
 * Filters Provider - manages filter state
 */
export function FiltersProvider({ children }: FiltersProviderProps) {
  const [checkedResultSets, setCheckedResultSets] = useState<Set<string>>(new Set());
  const [checkedLibraries, setCheckedLibraries] = useState<Set<string>>(new Set());
  const [selectedMetric, setSelectedMetric] = useState<Metric>('fps');

  const toggleResultSet = useCallback((id: string) => {
    setCheckedResultSets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleLibrary = useCallback((name: string) => {
    setCheckedLibraries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  }, []);

  const setMetric = useCallback((metric: Metric) => {
    setSelectedMetric(metric);
  }, []);

  const setResultSets = useCallback((ids: string[]) => {
    setCheckedResultSets(new Set(ids));
  }, []);

  const setLibraries = useCallback((names: string[]) => {
    setCheckedLibraries(new Set(names));
  }, []);

  const isResultSetChecked = useCallback(
    (id: string) => {
      return checkedResultSets.has(id);
    },
    [checkedResultSets]
  );

  const isLibraryChecked = useCallback(
    (name: string) => {
      return checkedLibraries.has(name);
    },
    [checkedLibraries]
  );

  const value: FiltersContextValue = {
    checkedResultSets,
    checkedLibraries,
    selectedMetric,
    toggleResultSet,
    toggleLibrary,
    setMetric,
    setResultSets,
    setLibraries,
    isResultSetChecked,
    isLibraryChecked,
  };

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

/**
 * Hook to access Filters context
 */
export function useFilters(): FiltersContextValue {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFilters must be used within FiltersProvider');
  }
  return context;
}

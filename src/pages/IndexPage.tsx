/**
 * Index Page - Test runner dashboard
 */

import React, { useEffect, useMemo } from 'react';
import { useTestResults } from '../hooks/useTestResults';
import { useResultSets } from '../hooks/useResultSets';
import { useFilters } from '../contexts/FiltersContext';
import { ResultSetFilters } from '../components/index/ResultSetFilters';
import { LibraryFilters } from '../components/index/LibraryFilters';
import { MetricSelector } from '../components/index/MetricSelector';
import { ImportExportButtons } from '../components/index/ImportExportButtons';
import { TestTable } from '../components/index/TestTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { autoImportStorageState } from '../services/import-export/importer';
import { CHARTS } from '../utils/chartLibraries';
import { RESERVED_RESULT_SET_LOCAL } from '../types/database';
import { E_TEST_NAME } from '../constants/testNames';

export function IndexPage() {
  const { results, isLoading, error, refetch: refetchResults } = useTestResults();
  const { resultSets } = useResultSets();
  const { checkedResultSets, checkedLibraries, setResultSets, setLibraries } = useFilters();

  // Auto-import from Playwright on mount
  useEffect(() => {
    const importData = async () => {
      await autoImportStorageState();
      await refetchResults();
    };
    importData();
  }, [refetchResults]);

  // Initialize filters when data loads
  useEffect(() => {
    const rsIdSet = new Set<string>();
    const libSet = new Set<string>();

    // Always include all chart libraries
    CHARTS.forEach((c) => libSet.add(c.name));

    // Add result set IDs from data
    results.forEach((r) => {
      rsIdSet.add(r.resultSetId || RESERVED_RESULT_SET_LOCAL);
    });

    // Check "Local" by default
    if (rsIdSet.has(RESERVED_RESULT_SET_LOCAL)) {
      setResultSets([RESERVED_RESULT_SET_LOCAL]);
    } else if (rsIdSet.size > 0) {
      // Fallback: check first available set
      setResultSets([Array.from(rsIdSet)[0]]);
    }

    // Check all libraries by default
    setLibraries(Array.from(libSet));
  }, [results, setResultSets, setLibraries]);

  // Get available result sets and libraries
  const availableResultSetIds = useMemo(() => {
    const set = new Set<string>();
    results.forEach((r) => set.add(r.resultSetId || RESERVED_RESULT_SET_LOCAL));
    return set;
  }, [results]);

  const availableLibraries = useMemo(() => {
    const set = new Set<string>();
    CHARTS.forEach((c) => set.add(c.name));
    return set;
  }, []);

  // Filter results based on selected filters
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const rsMatch = checkedResultSets.has(r.resultSetId || RESERVED_RESULT_SET_LOCAL);
      const libMatch = checkedLibraries.has(r.chartLibrary.split(' ')[0]); // Match base library name
      return rsMatch && libMatch;
    });
  }, [results, checkedResultSets, checkedLibraries]);

  // Get all test names
  const testNames = Object.values(E_TEST_NAME);

  return (
    <div className={isLoading ? '' : 'results-ready'}>
      <div className="sticky-header">
        <div className="page-header">
          <h1>Performance Comparison Test Suite</h1>
          <nav className="page-nav">
            <a href="charts-react.html">Charts View</a>
          </nav>
        </div>
        <div id="filter-panel">
          <ResultSetFilters availableResultSetIds={availableResultSetIds} />
          <ImportExportButtons />
        </div>
        <div id="filter-panel-libs">
          <LibraryFilters availableLibraries={availableLibraries} />
        </div>
        <MetricSelector />
      </div>

      <p>
        Click RUN on any chart library / test case to run the test. After that <strong>close the tab</strong> before
        starting any new tests
      </p>
      <p>Refresh the homepage to view updated results</p>

      {error && (
        <div style={{ color: 'red', padding: '20px', background: '#fff5f5', borderRadius: '5px' }}>
          Error loading test results: {error.message}
        </div>
      )}

      {isLoading ? <LoadingSpinner message="Loading test results..." /> : <TestTable filteredResults={filteredResults} />}
    </div>
  );
}

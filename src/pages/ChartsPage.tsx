/**
 * Charts Page - Performance visualization dashboard
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTestResults } from '../hooks/useTestResults';
import { useResultSets } from '../hooks/useResultSets';
import { useFilters } from '../contexts/FiltersContext';
import { ResultSetFilters } from '../components/index/ResultSetFilters';
import { LibraryFilters } from '../components/index/LibraryFilters';
import { MetricSelector } from '../components/index/MetricSelector';
import { ChartTypeToggle, type ChartType } from '../components/charts/ChartTypeToggle';
import { ChartSection } from '../components/charts/ChartSection';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { autoImportStorageState } from '../services/import-export/importer';
import { RESERVED_RESULT_SET_LOCAL } from '../types/database';
import { E_TEST_NAME } from '../constants/testNames';

export function ChartsPage() {
  const { results, isLoading, error, refetch } = useTestResults();
  const { resultSets } = useResultSets();
  const { checkedResultSets, checkedLibraries, setResultSets, setLibraries } = useFilters();
  const [chartType, setChartType] = useState<ChartType>('line');

  // Auto-import from Playwright on mount
  useEffect(() => {
    const importData = async () => {
      await autoImportStorageState();
      await refetch();
    };
    importData();
  }, [refetch]);

  // Initialize filters when data loads
  useEffect(() => {
    if (results.length === 0) return;

    const rsIdSet = new Set<string>();
    const libSet = new Set<string>();

    results.forEach((r) => {
      rsIdSet.add(r.resultSetId || RESERVED_RESULT_SET_LOCAL);
      // Extract short library name
      const shortName = r.chartLibrary.split(' ')[0];
      libSet.add(shortName);
    });

    // Check "Local" by default
    if (rsIdSet.has(RESERVED_RESULT_SET_LOCAL)) {
      setResultSets([RESERVED_RESULT_SET_LOCAL]);
    } else if (rsIdSet.size > 0) {
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
    results.forEach((r) => {
      const shortName = r.chartLibrary.split(' ')[0];
      set.add(shortName);
    });
    return set;
  }, [results]);

  // Filter results based on selected filters
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const rsMatch = checkedResultSets.has(r.resultSetId || RESERVED_RESULT_SET_LOCAL);
      const shortLibName = r.chartLibrary.split(' ')[0];
      const libMatch = checkedLibraries.has(shortLibName);
      return rsMatch && libMatch;
    });
  }, [results, checkedResultSets, checkedLibraries]);

  // Get all test names
  const testNames = Object.values(E_TEST_NAME);

  if (error) {
    return (
      <div style={{ color: 'red', padding: '40px', background: '#fff5f5', borderRadius: '5px', margin: '40px' }}>
        Error loading test results: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading results and initializing charts..." />;
  }

  if (results.length === 0) {
    return (
      <div id="loading" style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
        No results found. Run some tests from the index page first.
      </div>
    );
  }

  return (
    <div>
      <div className="sticky-header">
        <div className="page-header">
          <h1>Performance Results - Charts</h1>
          <nav className="page-nav">
            <a href="index-react.html">Test Suite</a>
          </nav>
        </div>
        <div id="filter-panel" style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
          <ResultSetFilters availableResultSetIds={availableResultSetIds} />
          <ChartTypeToggle chartType={chartType} onChange={setChartType} />
        </div>
        <div id="filter-panel-libs" style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
          <LibraryFilters availableLibraries={availableLibraries} />
        </div>
        <div style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
          <MetricSelector />
        </div>
      </div>

      <div id="charts-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        {testNames.map((testName) => (
          <ChartSection
            key={testName}
            testName={testName}
            results={filteredResults}
            chartType={chartType}
          />
        ))}
      </div>
    </div>
  );
}

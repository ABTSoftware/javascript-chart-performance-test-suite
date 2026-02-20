/**
 * Test table component - displays test cases and results
 */

import React, { useMemo } from 'react';
import { useFilters } from '../../contexts/FiltersContext';
import { useTestResults } from '../../hooks/useTestResults';
import { CHARTS, getChartLibraryPath } from '../../utils/chartLibraries';
import { E_TEST_NAME } from '../../constants/testNames';
import { groupResultsByTestCase } from '../../services/indexeddb/testResults';
import { calculateBenchmarkScore } from '../../services/calculations/benchmarkScore';
import { getMetricValue, formatMetricValue } from '../../services/calculations/metrics';
import type { TestResult, TestResultRecord } from '../../types/testResults';

interface TestTableProps {
  /** Filtered results to display */
  filteredResults: TestResult[];
}

/**
 * Get short library name (remove version)
 */
function getShortLibName(fullName: string): string {
  return fullName.split(' ')[0];
}

/**
 * Get color for metric value based on performance
 */
function getMetricColor(value: number | null, isHigherBetter: boolean, min: number, max: number): string {
  if (value === null || min === max) return '#fff';

  const ratio = (value - min) / (max - min);
  const goodRatio = isHigherBetter ? ratio : 1 - ratio;

  if (goodRatio >= 0.8) return '#d4edda'; // Green
  if (goodRatio >= 0.5) return '#fff3cd'; // Yellow
  return '#f8d7da'; // Red
}

export function TestTable({ filteredResults }: TestTableProps) {
  const { selectedMetric, checkedLibraries } = useFilters();

  // Group results by test case
  const resultsByTestCase = useMemo(() => {
    return groupResultsByTestCase(filteredResults);
  }, [filteredResults]);

  // Get visible charts
  const visibleCharts = useMemo(() => {
    return CHARTS.filter((c) => checkedLibraries.has(c.name));
  }, [checkedLibraries]);

  // Determine if metric is "higher is better"
  const isHigherBetter = selectedMetric === 'fps' || selectedMetric === 'frames' || selectedMetric === 'ingestion';

  // Get all test names
  const testNames = Object.values(E_TEST_NAME);

  return (
    <div id="testsTableContainer">
      <h2>Test Cases / Results</h2>

      {testNames.map((testName) => {
        const testResults = resultsByTestCase[testName] || {};
        const hasAnyResults = Object.keys(testResults).length > 0;

        // Calculate benchmark scores for this test
        const benchmarkScores: Array<{ name: string; score: number }> = [];
        visibleCharts.forEach((chart) => {
          const fullLibName = Object.keys(testResults).find((lib) => getShortLibName(lib) === chart.name);
          if (fullLibName) {
            const results = testResults[fullLibName];
            const score = calculateBenchmarkScore({ test: results });
            benchmarkScores.push({ name: chart.name, score });
          }
        });
        benchmarkScores.sort((a, b) => b.score - a.score);

        return (
          <div key={testName} style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '10px' }}>{testName}</h3>

            {/* Main results table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Config</th>
                  {visibleCharts.map((chart) => (
                    <th key={chart.name} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                      {chart.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Get unique configs */}
                {(() => {
                  const configSet = new Set<string>();
                  Object.values(testResults).forEach((results) => {
                    results.forEach((result) => {
                      const config = result.config;
                      const configKey = `${config.series}×${config.points}${config.charts ? ` (${config.charts}ch)` : ''}${config.increment ? ` +${config.increment}` : ''}`;
                      configSet.add(configKey);
                    });
                  });

                  const configs = Array.from(configSet);

                  // If no configs, show a RUN row
                  if (configs.length === 0) {
                    return (
                      <tr>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>-</td>
                        {visibleCharts.map((chart, idx) => {
                          const testGroupId = Object.keys(E_TEST_NAME).indexOf(
                            Object.keys(E_TEST_NAME).find((k) => E_TEST_NAME[k as keyof typeof E_TEST_NAME] === testName) || ''
                          ) + 1;
                          const href = getChartLibraryPath(chart.name, testName);
                          return (
                            <td key={chart.name} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                              <a
                                href={`${href}?test_group_id=${testGroupId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}
                              >
                                RUN
                              </a>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }

                  return configs.map((configKey) => {
                    // Find metric values for this config across all libraries
                    const metricValues: number[] = [];
                    visibleCharts.forEach((chart) => {
                      const fullLibName = Object.keys(testResults).find((lib) => getShortLibName(lib) === chart.name);
                      if (fullLibName) {
                        const results = testResults[fullLibName];
                        const configResults = results.filter((r) => {
                          const config = r.config;
                          const key = `${config.series}×${config.points}${config.charts ? ` (${config.charts}ch)` : ''}${config.increment ? ` +${config.increment}` : ''}`;
                          return key === configKey;
                        });

                        configResults.forEach((result) => {
                          const value = getMetricValue(result, selectedMetric);
                          if (value > 0) metricValues.push(value);
                        });
                      }
                    });

                    const min = metricValues.length > 0 ? Math.min(...metricValues) : 0;
                    const max = metricValues.length > 0 ? Math.max(...metricValues) : 0;

                    return (
                      <tr key={configKey}>
                        <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>{configKey}</td>
                        {visibleCharts.map((chart) => {
                          const fullLibName = Object.keys(testResults).find((lib) => getShortLibName(lib) === chart.name);

                          if (!fullLibName) {
                            // No results, show RUN link
                            const testGroupId = Object.keys(E_TEST_NAME).indexOf(
                              Object.keys(E_TEST_NAME).find((k) => E_TEST_NAME[k as keyof typeof E_TEST_NAME] === testName) || ''
                            ) + 1;
                            const href = getChartLibraryPath(chart.name, testName);
                            return (
                              <td key={chart.name} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                                <a
                                  href={`${href}?test_group_id=${testGroupId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}
                                >
                                  RUN
                                </a>
                              </td>
                            );
                          }

                          const results = testResults[fullLibName];
                          const configResults = results.filter((r) => {
                            const config = r.config;
                            const key = `${config.series}×${config.points}${config.charts ? ` (${config.charts}ch)` : ''}${config.increment ? ` +${config.increment}` : ''}`;
                            return key === configKey;
                          });

                          if (configResults.length === 0) {
                            return (
                              <td key={chart.name} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                                -
                              </td>
                            );
                          }

                          // Use first result
                          const result = configResults[0];
                          const metricValue = getMetricValue(result, selectedMetric);
                          const formatted = formatMetricValue(metricValue, selectedMetric);
                          const bgColor = getMetricColor(metricValue, isHigherBetter, min, max);

                          if (result.isErrored) {
                            return (
                              <td
                                key={chart.name}
                                style={{
                                  border: '1px solid #ccc',
                                  padding: '8px',
                                  textAlign: 'center',
                                  backgroundColor: '#f8d7da',
                                  color: '#721c24',
                                }}
                                title={result.errorReason || 'Error'}
                              >
                                {result.errorReason || 'ERROR'}
                              </td>
                            );
                          }

                          return (
                            <td
                              key={chart.name}
                              style={{
                                border: '1px solid #ccc',
                                padding: '8px',
                                textAlign: 'center',
                                backgroundColor: bgColor,
                              }}
                            >
                              {formatted}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>

            {/* Benchmark scores */}
            {benchmarkScores.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>
                  Chart Bench: {testName}
                  <span
                    style={{ fontSize: '14px', color: '#007bff', cursor: 'help', marginLeft: '8px' }}
                    title="Benchmark Score: Weighted composite of FPS (65%), Init Time (20%), Frames (10%), and Memory (5%)"
                  >
                    ⓘ
                  </span>
                </h4>
                <table style={{ borderCollapse: 'collapse', width: 'auto', maxWidth: '500px', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                      <th style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'center' }}>Rank</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'left' }}>Library</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'center' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarkScores.map((entry, index) => {
                      const maxScore = benchmarkScores[0].score;
                      const scoreRatio = maxScore > 0 ? entry.score / maxScore : 0;
                      let bgColor = '#f8d7da';
                      let textColor = '#721c24';

                      if (maxScore > 0) {
                        if (scoreRatio >= 0.9) {
                          bgColor = '#d4edda';
                          textColor = '#155724';
                        } else if (scoreRatio >= 0.7) {
                          bgColor = '#fff3cd';
                          textColor = '#856404';
                        }
                      }

                      return (
                        <tr key={entry.name}>
                          <td
                            style={{
                              border: '1px solid #ccc',
                              padding: '6px 10px',
                              textAlign: 'center',
                              fontWeight: 'bold',
                            }}
                          >
                            {index + 1}
                          </td>
                          <td
                            style={{
                              border: '1px solid #ccc',
                              padding: '6px 10px',
                              fontWeight: 'bold',
                            }}
                          >
                            {entry.name}
                          </td>
                          <td
                            style={{
                              border: '1px solid #ccc',
                              padding: '6px 10px',
                              textAlign: 'center',
                              fontWeight: 'bold',
                              backgroundColor: bgColor,
                              color: textColor,
                            }}
                          >
                            {Math.round(entry.score)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Chart section component - displays charts for a single test group
 */

import React from 'react';
import type { TestResult } from '../../types/testResults';
import { groupResultsByTestCase } from '../../services/indexeddb/testResults';
import { calculateBenchmarkScore } from '../../services/calculations/benchmarkScore';

interface ChartSectionProps {
  testName: string;
  results: TestResult[];
  chartType: 'line' | 'column';
}

export function ChartSection({ testName, results, chartType }: ChartSectionProps) {
  // Group results by test case
  const grouped = groupResultsByTestCase(results);
  const testResults = grouped[testName] || {};

  // Check if we have any data
  const hasData = Object.keys(testResults).length > 0;

  // Calculate benchmark scores
  const benchmarkScores: Array<{ name: string; score: number }> = [];
  Object.keys(testResults).forEach((libName) => {
    const libraryResults = testResults[libName];
    const score = calculateBenchmarkScore({ test: libraryResults });
    benchmarkScores.push({ name: libName.split(' ')[0], score });
  });
  benchmarkScores.sort((a, b) => b.score - a.score);

  if (!hasData) {
    return (
      <div className="chart-section" style={{ marginBottom: '40px' }}>
        <h3 style={{ marginBottom: '8px' }}>{testName}</h3>
        <div className="no-data">
          No data available for this test
        </div>
      </div>
    );
  }

  return (
    <div className="chart-section" style={{ marginBottom: '40px' }}>
      <h3 style={{ marginBottom: '8px' }}>{testName}</h3>

      {/* Performance chart placeholder */}
      <div className="chart-div" style={{
        width: '850px',
        height: '400px',
        border: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
        marginBottom: '10px'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>
            📊 {chartType === 'line' ? 'Line' : 'Column'} Chart
          </div>
          <div style={{ fontSize: '14px' }}>
            {Object.keys(testResults).length} libraries, {testResults[Object.keys(testResults)[0]]?.length || 0} data points
          </div>
          <div style={{ fontSize: '12px', marginTop: '8px', fontStyle: 'italic' }}>
            (SciChart visualization will be added in Phase 7)
          </div>
        </div>
      </div>

      {/* Benchmark chart */}
      {benchmarkScores.length > 0 && (
        <div>
          <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Benchmark Scores</h4>
          <div className="benchmark-chart-div" style={{
            width: '850px',
            height: '200px',
            border: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9f9f9'
          }}>
            <div style={{ padding: '20px' }}>
              {benchmarkScores.map((entry, index) => (
                <div key={entry.name} style={{ marginBottom: '8px', fontSize: '14px' }}>
                  <strong>{index + 1}.</strong> {entry.name}: <strong>{Math.round(entry.score)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

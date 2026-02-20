/**
 * Export test results to JSON
 */

import { getAllTestResults, getResultsByResultSet } from '../indexeddb/testResults';
import type { TestResult } from '../../types/testResults';

/**
 * Export results to downloadable JSON file
 * @param resultSetId - Result set ID to export, or '__all__' for all results
 */
export async function exportResults(resultSetId: string): Promise<void> {
  let results: TestResult[];

  if (resultSetId === '__all__') {
    results = await getAllTestResults();
  } else {
    results = await getResultsByResultSet(resultSetId);
  }

  if (results.length === 0) {
    alert('No results to export.');
    return;
  }

  // Strip resultSetId prefix from IDs for portability
  const exportData = results.map((result) => {
    const baseId =
      result.resultSetId && result.id.startsWith(result.resultSetId + '_')
        ? result.id.substring(result.resultSetId.length + 1)
        : result.id;

    return {
      ...result,
      id: baseId,
    };
  });

  const exportObj = {
    ChartPerformanceResults: {
      testResults: exportData,
      exportedAt: new Date().toISOString(),
      resultSetId,
    },
  };

  const json = JSON.stringify(exportObj, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const filename =
    resultSetId === '__all__'
      ? 'ChartPerformanceResults-All.json'
      : `ChartPerformanceResults-${resultSetId}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log(`Exported ${results.length} result(s) to ${filename}`);
}

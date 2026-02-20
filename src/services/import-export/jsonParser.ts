/**
 * Parse simple JSON export formats
 */

import type { TestResult } from '../../types/testResults';

/**
 * Parse simple JSON formats (ChartPerformanceResults.json or flat array)
 */
export function parseSimpleJson(jsonString: string): TestResult[] {
  const parsed = JSON.parse(jsonString);

  // Format: { ChartPerformanceResults: { testResults: [...] } }
  if (parsed.ChartPerformanceResults && Array.isArray(parsed.ChartPerformanceResults.testResults)) {
    return parsed.ChartPerformanceResults.testResults;
  }

  // Format: { testResults: [...] }
  if (parsed.testResults && Array.isArray(parsed.testResults)) {
    return parsed.testResults;
  }

  // Format: flat array of records
  if (Array.isArray(parsed)) {
    return parsed;
  }

  throw new Error('Unrecognized JSON format');
}

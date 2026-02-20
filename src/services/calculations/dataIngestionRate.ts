/**
 * Data ingestion rate calculation
 */

import type { TestResultRecord } from '../../types/testResults';
import type { TestType } from '../../types/performance';
import { E_TEST_NAME } from '../../constants/testNames';

/**
 * Detect test type from test name for ingestion rate calculation
 */
function detectTestType(testName: string): TestType {
  // Static tests: data loaded once at initialization
  if (
    testName === E_TEST_NAME.N_X_M ||
    testName === E_TEST_NAME.COLUMN ||
    testName === E_TEST_NAME.CANDLESTICK ||
    testName === E_TEST_NAME.MOUNTAIN ||
    testName === E_TEST_NAME.POINTCLOUD_3D ||
    testName === E_TEST_NAME.SURFACE_3D
  ) {
    return 'static';
  }

  // Realtime regenerate: all data regenerated each frame
  if (
    testName === E_TEST_NAME.SCATTER ||
    testName === E_TEST_NAME.LINE ||
    testName === E_TEST_NAME.POINT_LINE
  ) {
    return 'realtime-regenerate';
  }

  // Streaming: incremental append each frame
  if (
    testName === E_TEST_NAME.FIFO ||
    testName === E_TEST_NAME.SERIES_COMPRESSION ||
    testName === E_TEST_NAME.MULTI_CHART
  ) {
    return 'streaming';
  }

  // Heatmap: 2D matrix
  if (testName === E_TEST_NAME.HEATMAP) {
    return 'heatmap';
  }

  return 'static';
}

/**
 * Calculate data ingestion rate in points per second
 * @param result - Test result record
 * @param testName - Name of the test
 * @returns Data ingestion rate in points/second, or null if cannot be calculated
 */
export function calculateDataIngestionRate(
  result: TestResultRecord,
  testName: string
): number | null {
  if (!result || !result.config) return null;

  const config = result.config;
  const series = config.series || 1;
  const points = config.points || 0;
  const increment = config.increment || 0;
  const charts = config.charts || 1;
  const numberOfFrames = result.numberOfFrames || 0;
  const benchmarkTimeFirstFrame = result.benchmarkTimeFirstFrame || 0;
  const updateFramesTime = result.updateFramesTime || 0;
  const totalDatapointsProcessed = result.totalDatapointsProcessed;

  // Detect test type from test name
  const testType = detectTestType(testName);

  // ─── Static tests: calculate from initialization time ───
  if (testType === 'static') {
    // Formula: (series × points × charts) / benchmarkTimeFirstFrame × 1000
    if (benchmarkTimeFirstFrame > 0) {
      return (series * points * charts) / benchmarkTimeFirstFrame * 1000;
    }
    return null;
  }

  // ─── FIFO test: special handling for cumulative totals ───
  if (testType === 'streaming' && testName === E_TEST_NAME.FIFO) {
    if (updateFramesTime > 0 && numberOfFrames > 0 && increment > 0) {
      // Total datapoints = initial data + incremental data across all frames
      const initialDatapoints = series * points * charts;
      const incrementalDatapoints = increment * series * numberOfFrames * charts;
      const totalDatapoints = initialDatapoints + incrementalDatapoints;
      return totalDatapoints / updateFramesTime * 1000;
    }
  }

  // ─── Dynamic tests: use tracked datapoints (preferred method) ───
  if (
    totalDatapointsProcessed !== undefined &&
    totalDatapointsProcessed !== null &&
    updateFramesTime > 0
  ) {
    return totalDatapointsProcessed / updateFramesTime * 1000;
  }

  // ─── Fallback formulas for dynamic tests ───
  if (testType === 'realtime-regenerate') {
    // Formula: (series × points × numberOfFrames) / updateFramesTime × 1000
    if (updateFramesTime > 0 && numberOfFrames > 0) {
      return (series * points * numberOfFrames) / updateFramesTime * 1000;
    }
  } else if (testType === 'streaming') {
    // Formula: (increment × series × numberOfFrames × charts) / updateFramesTime × 1000
    if (updateFramesTime > 0 && numberOfFrames > 0 && increment > 0) {
      return (increment * series * numberOfFrames * charts) / updateFramesTime * 1000;
    }
  } else if (testType === 'heatmap') {
    // Heatmap: 2D matrix (points = side length, total cells = points × points)
    // Formula: (points × points × numberOfFrames) / updateFramesTime × 1000
    if (updateFramesTime > 0 && numberOfFrames > 0) {
      return (points * points * numberOfFrames) / updateFramesTime * 1000;
    }
  }

  return null;
}

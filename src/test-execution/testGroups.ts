/**
 * Test groups configuration and result tracking
 * Migrated from before.js
 */

import type { TestConfig, TestGroup } from '../types/testConfig';
import type { TestResultRecord } from '../types/testResults';
import { G_TEST_GROUP_NAME } from '../constants/testNames';

const testDuration = 5000; // 5 seconds

/**
 * Test group configurations
 */
export const G_TEST_GROUPS: Record<number, TestGroup> = {
  1: {
    name: G_TEST_GROUP_NAME.LINE_PERFORMANCE_TEST,
    tests: [
      { series: 100, points: 100, testDuration },
      { series: 200, points: 200, testDuration },
      { series: 500, points: 500, testDuration },
      { series: 1000, points: 1000, testDuration },
      { series: 2000, points: 2000, testDuration },
      { series: 4000, points: 4000, testDuration },
      { series: 8000, points: 8000, testDuration },
    ],
  },
  2: {
    name: G_TEST_GROUP_NAME.SCATTER_PERFORMANCE_TEST,
    tests: [
      { series: 1, points: 1000, testDuration },
      { series: 1, points: 10000, testDuration },
      { series: 1, points: 50000, testDuration },
      { series: 1, points: 100000, testDuration },
      { series: 1, points: 200000, testDuration },
      { series: 1, points: 500000, testDuration },
      { series: 1, points: 1000000, testDuration },
      { series: 1, points: 5000000, testDuration },
      { series: 1, points: 10000000, testDuration },
    ],
  },
  // Add more test groups as needed...
};

/**
 * Global results array
 */
export const G_RESULT: TestResultRecord[] = [];

/**
 * Get test group by ID
 */
export function gGetTestGroup(testGroupId: number): TestGroup | undefined {
  return G_TEST_GROUPS[testGroupId];
}

/**
 * Get or create result record at index
 */
export function gGetResultRecord(index: number): TestResultRecord {
  if (!G_RESULT[index]) {
    G_RESULT.push({
      config: {} as TestConfig,
      configLibName: '',
      configLibVersion: '',
      timestampTestStart: 0,
      timestampLibLoaded: 0,
      timestampFirstFrameWithoutDataRendered: 0,
      timestampDataGenerated: 0,
      timestampInitialDataAppended: 0,
      timestampFirstFrameWithDataRendered: 0,
      timestampTestFinish: 0,
      heapSizeTestStart: 0,
      heapSizeTestFinish: 0,
      benchmarkTimeLibLoad: 0,
      benchmarkTimeFirstFrame: 0,
      dataGenerationTime: 0,
      benchmarkTimeInitialDataAppend: 0,
      updateFramesTime: 0,
      numberOfFrames: 0,
      benchmarkFPS: 0,
      averageFPS: 0,
      minFPS: 0,
      maxFPS: 0,
      frameTimings: [],
      isErrored: false,
      errorReason: null,
      totalDatapointsProcessed: 0,
      dataIngestionRate: 0,
      memory: 0,
    });
  }
  return G_RESULT[index];
}

/**
 * Set library info for result
 */
export function gSetLibInfo(index: number, libName: string, libVersion: string): void {
  const result = gGetResultRecord(index);
  result.configLibName = libName;
  result.configLibVersion = libVersion;
}

/**
 * Mark test as started
 */
export function gTestStarted(testConfig: TestConfig, index: number): number {
  const result = gGetResultRecord(index);
  result.config = testConfig;
  result.timestampTestStart = performance.now();
  return result.timestampTestStart;
}

/**
 * Mark library as loaded
 */
export function gTestLibLoaded(index: number): number {
  const result = gGetResultRecord(index);
  result.timestampLibLoaded = performance.now();
  result.benchmarkTimeLibLoad = result.timestampLibLoaded - result.timestampTestStart;
  return result.timestampLibLoaded;
}

/**
 * Mark first frame rendered
 */
export function gTestFirstFrameRendered(index: number): number {
  const result = gGetResultRecord(index);
  result.timestampFirstFrameWithDataRendered = performance.now();
  result.benchmarkTimeFirstFrame = result.timestampFirstFrameWithDataRendered - result.timestampTestStart;
  return result.timestampFirstFrameWithDataRendered;
}

/**
 * Mark data generated
 */
export function gTestDataGenerated(index: number): number {
  const result = gGetResultRecord(index);
  result.timestampDataGenerated = performance.now();
  result.dataGenerationTime = result.timestampDataGenerated - (result.timestampFirstFrameWithoutDataRendered || 0);
  return result.timestampDataGenerated;
}

/**
 * Mark initial data appended
 */
export function gTestInitialDataAppended(index: number): number {
  const result = gGetResultRecord(index);
  result.timestampInitialDataAppended = performance.now();
  result.benchmarkTimeInitialDataAppend = result.timestampInitialDataAppended - result.timestampDataGenerated;
  return result.timestampInitialDataAppended;
}

/**
 * Mark test as finished
 */
export function gTestFinished(
  index: number,
  frames: number,
  memory: number,
  frameTimings: number[],
  isErrored: boolean = false,
  errorReason: TestResultRecord['errorReason'] = null
): void {
  const result = gGetResultRecord(index);
  result.numberOfFrames = frames;
  result.timestampTestFinish = performance.now();
  result.updateFramesTime = result.timestampTestFinish - result.timestampInitialDataAppended;
  result.frameTimings = frameTimings;
  result.isErrored = isErrored;
  result.errorReason = errorReason;

  // Calculate average FPS using actual test time
  result.averageFPS = (1000 * frames) / result.updateFramesTime;
  result.benchmarkFPS = result.averageFPS; // Keep for backwards compatibility

  // Calculate min/max FPS from individual frame timings
  if (frameTimings && frameTimings.length > 0) {
    const MAX_REALISTIC_FPS = 240; // Cap at realistic monitor refresh rate
    const fpsValues = frameTimings.map((timing) => {
      const fps = 1000 / timing;
      return Math.min(fps, MAX_REALISTIC_FPS);
    });

    result.minFPS = Math.min(...fpsValues);
    result.maxFPS = Math.max(...fpsValues);
  } else {
    result.minFPS = result.averageFPS;
    result.maxFPS = result.averageFPS;
  }

  result.memory = memory;
}

/**
 * Set total datapoints processed (for ingestion rate calculation)
 */
export function gSetTotalDatapointsProcessed(index: number, count: number): void {
  const result = gGetResultRecord(index);
  result.totalDatapointsProcessed = count;
}

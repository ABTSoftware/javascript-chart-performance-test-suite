/**
 * Test configuration defining the parameters for a performance test
 */
export interface TestConfig {
  /** Number of series/lines in the test */
  series: number;
  /** Number of data points per series */
  points: number;
  /** Optional: Number of points to add per frame (for streaming tests) */
  increment?: number;
  /** Optional: Number of charts (for multi-chart tests) */
  charts?: number;
  /** Duration of the test in milliseconds */
  testDuration: number;
  /** Optional: Enable debug mode */
  debug?: boolean;
}

/**
 * Error reasons for test failures
 */
export type TestErrorReason = 'HANGING' | 'SKIPPED' | 'UNSUPPORTED' | 'ERROR_APPEND_DATA' | null;

/**
 * Complete record of a single test execution with all measurements
 */
export interface TestResultRecord {
  // Configuration
  config: TestConfig;
  configLibName: string;
  configLibVersion: string;

  // Timestamps (milliseconds since test start)
  timestampTestStart: number;
  timestampLibLoaded: number;
  timestampFirstFrameWithoutDataRendered?: number;
  timestampDataGenerated: number;
  timestampInitialDataAppended: number;
  timestampFirstFrameWithDataRendered?: number;
  timestampTestFinish: number;

  // Memory measurements (bytes)
  heapSizeTestStart?: number;
  heapSizeTestFinish?: number;
  /** Memory usage in MB */
  memory: number;

  // Timing benchmarks (milliseconds)
  benchmarkTimeLibLoad: number;
  benchmarkTimeFirstFrame: number;
  dataGenerationTime: number;
  benchmarkTimeInitialDataAppend: number;
  updateFramesTime: number;

  // Performance metrics
  numberOfFrames: number;
  benchmarkFPS: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  /** Frame-by-frame timing data (milliseconds per frame) */
  frameTimings: number[];

  // Data ingestion metrics
  totalDatapointsProcessed?: number;
  /** Data ingestion rate in points per second */
  dataIngestionRate?: number;

  // Error handling
  isErrored: boolean;
  errorReason: TestErrorReason;
}

/**
 * Aggregated test results for a specific library and test case
 */
export interface TestResult {
  /** Composite ID: {resultSetId}_{chartLibrary}_{testCase} */
  id: string;
  /** Chart library name with version (e.g., "SciChart.js 3.0.0") */
  chartLibrary: string;
  /** Test case name (e.g., "N line series M points") */
  testCase: string;
  /** Array of individual test run results */
  results: TestResultRecord[];
  /** Result set ID this belongs to */
  resultSetId: string;
  /** Timestamp when results were saved */
  timestamp: number;
}

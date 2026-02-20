import type { TestConfig } from './testResults';

// Re-export TestConfig for convenience
export type { TestConfig } from './testResults';

/**
 * Test group definition - collection of test configurations for a specific test type
 */
export interface TestGroup {
  /** Test group name */
  name: string;
  /** Array of test configurations */
  tests: TestConfig[];
}

/**
 * Test group names matching the application's test categories
 */
export type TestGroupName =
  | 'N line series M points'
  | 'Brownian Motion Scatter Series'
  | 'Line series which is unsorted in x'
  | 'Point series, sorted, updating y-values'
  | 'Column chart with data ascending in X'
  | 'Candlestick series test'
  | 'FIFO / ECG Chart Performance Test'
  | 'Mountain Chart Performance Test'
  | 'Series Compression Test'
  | 'Multi Chart Performance Test'
  | 'Uniform Heatmap Performance Test'
  | '3D Point Cloud Performance Test'
  | '3D Surface Performance Test';

/**
 * Test function return type - interface that all test implementations must follow
 */
export interface TestFunctionReturn {
  /** Create and initialize the chart */
  createChart: () => Promise<void | false>;
  /** Generate test data */
  generateData: () => void;
  /** Append initial data to the chart */
  appendData: () => void;
  /**
   * Update the chart for the current frame
   * @param frame - Current frame number
   * @returns Number of datapoints processed in this frame (for ingestion rate calculation)
   */
  updateChart: (frame: number) => number | undefined;
  /** Clean up and delete the chart */
  deleteChart: () => void;
}

/**
 * Test function signature - matches the library test file exports
 */
export type TestFunction = (
  seriesNum: number,
  pointsNum: number,
  increment?: number,
  charts?: number
) => TestFunctionReturn;

/**
 * Library test exports interface - what each library's test file must export
 */
export interface LibraryTestExports {
  eLibName: () => string;
  eLibVersion: () => string;
  getSupportedTests: () => string[];
  eLinePerformanceTest?: TestFunction;
  eScatterPerformanceTest?: TestFunction;
  eXYLinePerformanceTest?: TestFunction;
  ePointLinePerformanceTest?: TestFunction;
  eColumnPerformanceTest?: TestFunction;
  eCandlestickPerformanceTest?: TestFunction;
  eFifoEcgPerformanceTest?: TestFunction;
  eMountainPerformanceTest?: TestFunction;
  eSeriesCompressionPerformanceTest?: TestFunction;
  eMultiChartPerformanceTest?: TestFunction;
  eHeatmapPerformanceTest?: TestFunction;
  ePointCloud3DPerformanceTest?: TestFunction;
  eSurface3DPerformanceTest?: TestFunction;
}

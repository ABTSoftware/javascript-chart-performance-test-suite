/**
 * Performance measurement types
 */

/**
 * Real-time performance metrics during test execution
 */
export interface PerformanceMetrics {
  /** Current FPS */
  fps: number;
  /** Current memory usage in MB */
  memory: number;
  /** Current frame time in milliseconds */
  frameTime: number;
}

/**
 * Test type categories for data ingestion rate calculation
 */
export type TestType = 'static' | 'realtime-regenerate' | 'streaming' | 'heatmap';

/**
 * Benchmark score weights for different metrics
 */
export interface BenchmarkWeights {
  fps: number;
  memory: number;
  initialization: number;
}

/**
 * System information displayed during test execution
 */
export interface SystemInfo {
  userAgent: string;
  platform: string;
  cores: number;
  memory: number;
  screenResolution: string;
}

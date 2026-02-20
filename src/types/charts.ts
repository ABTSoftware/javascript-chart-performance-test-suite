import type { TestGroupName } from './testConfig';

/**
 * Custom test configuration for a specific chart library
 */
export interface CustomTestConfig {
  /** Custom HTML page path for this test */
  path: string;
  /** Test group name this custom config applies to */
  test: TestGroupName;
}

/**
 * Chart library configuration
 */
export interface ChartLibrary {
  /** Library name (e.g., "SciChart.js") */
  name: string;
  /** Default HTML page path */
  path: string;
  /** Optional custom test configurations */
  custom?: CustomTestConfig[];
}

/**
 * Chart type for visualizations
 */
export type ChartType = 'line' | 'column';

/**
 * Performance metric types
 */
export type Metric = 'fps' | 'memory' | 'initialization' | 'frames' | 'ingestion';

/**
 * Metric display configuration
 */
export interface MetricConfig {
  /** Metric key */
  key: Metric;
  /** Display label */
  label: string;
  /** Unit of measurement */
  unit: string;
  /** Format function for displaying values */
  format?: (value: number) => string;
}

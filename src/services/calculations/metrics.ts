/**
 * Metric utility functions
 */

import type { Metric } from '../../types/charts';
import type { TestResultRecord } from '../../types/testResults';

/**
 * Get the metric value from a test result based on the metric type
 */
export function getMetricValue(result: TestResultRecord, metric: Metric): number {
  switch (metric) {
    case 'fps':
      return result.averageFPS || 0;
    case 'memory':
      return result.memory || 0;
    case 'initialization':
      return result.benchmarkTimeFirstFrame || 0;
    case 'frames':
      return result.numberOfFrames || 0;
    case 'ingestion':
      return result.dataIngestionRate || 0;
    default:
      return 0;
  }
}

/**
 * Format a metric value for display
 */
export function formatMetricValue(value: number, metric: Metric): string {
  if (value === 0) return 'N/A';

  switch (metric) {
    case 'fps':
      return `${value.toFixed(2)} FPS`;
    case 'memory':
      return `${value.toFixed(2)} MB`;
    case 'initialization':
      return `${value.toFixed(2)} ms`;
    case 'frames':
      return value.toFixed(0);
    case 'ingestion':
      return `${formatNumber(value)} pts/s`;
    default:
      return value.toString();
  }
}

/**
 * Format a number with K/M/B suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}

/**
 * Get metric display configuration
 */
export function getMetricConfig(metric: Metric) {
  const configs = {
    fps: {
      key: 'fps' as const,
      label: 'FPS',
      unit: 'FPS',
      higherIsBetter: true,
    },
    memory: {
      key: 'memory' as const,
      label: 'Memory',
      unit: 'MB',
      higherIsBetter: false,
    },
    initialization: {
      key: 'initialization' as const,
      label: 'Init Time',
      unit: 'ms',
      higherIsBetter: false,
    },
    frames: {
      key: 'frames' as const,
      label: 'Total Frames',
      unit: 'frames',
      higherIsBetter: true,
    },
    ingestion: {
      key: 'ingestion' as const,
      label: 'Data Ingestion Rate',
      unit: 'pts/s',
      higherIsBetter: true,
    },
  };

  return configs[metric];
}

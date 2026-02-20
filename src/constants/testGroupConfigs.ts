/**
 * Test group configuration definitions
 * Used to build category labels for charts
 */

import type { TestConfig } from '../types/testResults';
import { E_TEST_NAME } from './testNames';

export const TEST_GROUP_CONFIGS: Record<string, TestConfig[]> = {
  [E_TEST_NAME.N_X_M]: [
    { series: 100, points: 100, testDuration: 5000 },
    { series: 200, points: 200, testDuration: 5000 },
    { series: 500, points: 500, testDuration: 5000 },
    { series: 1000, points: 1000, testDuration: 5000 },
    { series: 2000, points: 2000, testDuration: 5000 },
    { series: 4000, points: 4000, testDuration: 5000 },
    { series: 8000, points: 8000, testDuration: 5000 },
  ],
  [E_TEST_NAME.SCATTER]: [
    { series: 1, points: 1000, testDuration: 5000 },
    { series: 1, points: 10000, testDuration: 5000 },
    { series: 1, points: 50000, testDuration: 5000 },
    { series: 1, points: 100000, testDuration: 5000 },
    { series: 1, points: 200000, testDuration: 5000 },
    { series: 1, points: 500000, testDuration: 5000 },
    { series: 1, points: 1000000, testDuration: 5000 },
    { series: 1, points: 5000000, testDuration: 5000 },
    { series: 1, points: 10000000, testDuration: 5000 },
  ],
  [E_TEST_NAME.LINE]: [
    { series: 1, points: 1000, testDuration: 5000 },
    { series: 1, points: 10000, testDuration: 5000 },
    { series: 1, points: 50000, testDuration: 5000 },
    { series: 1, points: 100000, testDuration: 5000 },
    { series: 1, points: 200000, testDuration: 5000 },
    { series: 1, points: 500000, testDuration: 5000 },
    { series: 1, points: 1000000, testDuration: 5000 },
    { series: 1, points: 5000000, testDuration: 5000 },
    { series: 1, points: 10000000, testDuration: 5000 },
  ],
  // Add other test groups as needed...
};

/**
 * Format a number with K/M suffix
 */
export function formatNumber(n: number): string {
  if (n >= 1000000) return n / 1000000 + 'M';
  if (n >= 1000) return n / 1000 + 'K';
  return String(n);
}

/**
 * Convert config to display label
 */
export function configToLabel(cfg: TestConfig): string {
  if (cfg.charts && cfg.charts > 1) {
    return cfg.charts + ' charts';
  }
  if (cfg.series > 1) {
    return cfg.series + ' x ' + formatNumber(cfg.points) + ' pts';
  }
  return formatNumber(cfg.points) + ' pts';
}

/**
 * Create unique key for a config
 */
export function configKey(cfg: TestConfig): string {
  return `${cfg.series}|${cfg.points}|${cfg.charts || 0}`;
}

/**
 * Test name constants matching the original E_TEST_NAME from shared.js
 */
export const E_TEST_NAME = {
  N_X_M: 'N line series M points',
  SCATTER: 'Brownian Motion Scatter Series',
  LINE: 'Line series which is unsorted in x',
  POINT_LINE: 'Point series, sorted, updating y-values',
  COLUMN: 'Column chart with data ascending in X',
  CANDLESTICK: 'Candlestick series test',
  FIFO: 'FIFO / ECG Chart Performance Test',
  MOUNTAIN: 'Mountain Chart Performance Test',
  SERIES_COMPRESSION: 'Series Compression Test',
  MULTI_CHART: 'Multi Chart Performance Test',
  HEATMAP: 'Uniform Heatmap Performance Test',
  POINTCLOUD_3D: '3D Point Cloud Performance Test',
  SURFACE_3D: '3D Surface Performance Test',
} as const;

/**
 * Type for test name values
 */
export type TestName = typeof E_TEST_NAME[keyof typeof E_TEST_NAME];

/**
 * Test group name constants matching the original G_TEST_GROUP_NAME
 */
export const G_TEST_GROUP_NAME = {
  LINE_PERFORMANCE_TEST: 'N line series M points',
  SCATTER_PERFORMANCE_TEST: 'Brownian Motion Scatter Series',
  XY_LINE_PERFORMANCE_TEST: 'Line series which is unsorted in x',
  POINT_LINE_PERFORMANCE_TEST: 'Point series, sorted, updating y-values',
  COLUMN_PERFORMANCE_TEST: 'Column chart with data ascending in X',
  CANDLESTICK_PERFORMANCE_TEST: 'Candlestick series test',
  FIFO_ECG_PERFORMANCE_TEST: 'FIFO / ECG Chart Performance Test',
  MOUNTAIN_PERFORMANCE_TEST: 'Mountain Chart Performance Test',
  SERIES_COMPRESSION_PERFORMANCE_TEST: 'Series Compression Test',
  MULTI_CHART_PERFORMANCE_TEST: 'Multi Chart Performance Test',
  HEATMAP_PERFORMANCE_TEST: 'Uniform Heatmap Performance Test',
  POINTCLOUD_3D_PERFORMANCE_TEST: '3D Point Cloud Performance Test',
  SURFACE_3D_PERFORMANCE_TEST: '3D Surface Performance Test',
} as const;

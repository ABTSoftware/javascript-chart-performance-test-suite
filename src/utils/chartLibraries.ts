import type { ChartLibrary } from '../types/charts';
import { E_TEST_NAME } from '../constants/testNames';

/**
 * Chart library configurations matching the original CHARTS from shared.js
 */
export const CHARTS: ChartLibrary[] = [
  {
    name: 'SciChart.js',
    path: 'public/scichart/scichart.html',
  },
  {
    name: 'Highcharts',
    path: 'public/highcharts/highcharts.html',
    custom: [
      {
        path: 'public/highcharts/highcharts_stock_charts.html',
        test: E_TEST_NAME.CANDLESTICK,
      },
    ],
  },
  {
    name: 'Chart.js',
    path: 'public/chartjs/chartjs.html',
    custom: [
      {
        path: 'public/chartjs/chartjs_candlestick.html',
        test: E_TEST_NAME.CANDLESTICK,
      },
    ],
  },
  {
    name: 'Plotly.js',
    path: 'public/plotly/plotly.html',
  },
  {
    name: 'Apache ECharts',
    path: 'public/echarts/echarts.html',
  },
  {
    name: 'uPlot',
    path: 'public/uPlot/uPlot.html',
  },
  {
    name: 'ChartGPU',
    path: 'public/chartgpu/chartgpu.html',
  },
  {
    name: 'Lcjs',
    path: 'public/lcjsv4/lcjs.html',
  },
];

/**
 * Get the HTML page path for a chart library and test
 */
export function getChartLibraryPath(libraryName: string, testName: string): string {
  const chart = CHARTS.find(c => c.name === libraryName);
  if (!chart) {
    throw new Error(`Unknown chart library: ${libraryName}`);
  }

  // Check for custom test page
  const customConfig = chart.custom?.find(c => c.test === testName);
  if (customConfig) {
    return customConfig.path;
  }

  return chart.path;
}

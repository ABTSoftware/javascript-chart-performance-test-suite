/**
 * Chart library color scheme
 */

export const LIBRARY_COLORS: Record<string, string> = {
  'SciChart.js': '#4083E8',
  'Highcharts': '#2B2D42',
  'Chart.js': '#FF8CFF',
  'Plotly.js': '#806EFA',
  'Apache ECharts': '#FF3946',
  'uPlot': '#2A9D8F',
  'ChartGPU': '#F4A261',
  'Lcjs': '#E76F51',
};

/**
 * Dash patterns for distinguishing result sets
 */
export const DASH_PATTERNS = [
  [], // solid
  [10, 5], // dashed
  [2, 4], // dotted
  [10, 5, 2, 5], // dash-dot
];

/**
 * Get color for a library by name
 */
export function getColorForLibrary(libName: string): string {
  for (const [key, color] of Object.entries(LIBRARY_COLORS)) {
    if (libName.startsWith(key)) return color;
  }
  return '#888888';
}

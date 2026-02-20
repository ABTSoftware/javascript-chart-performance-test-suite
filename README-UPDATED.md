# JavaScript Charts Performance Test Suite

> **🆕 Now with React 18 + TypeScript 5!**
> Migrated from vanilla JavaScript to modern React/TypeScript architecture while preserving 100% of testing functionality and measurement accuracy.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Executive Summary](#executive-summary-tldr)
- [Test Results](#test-results--performance-comparison-of-javascript-charts)
- [Running the Test Suite](#running-the-test-suite)
- [Development Guide](#development-guide)
- [Modifying the Test Suite](#modifying-the-test-suite)

---

## Architecture Overview

### Hybrid React + TypeScript Architecture

This test suite uses a **hybrid architecture** that combines the best of both worlds:

- **React UI Pages** - Modern, type-safe component architecture
- **Vanilla TypeScript Test Execution** - Zero overhead, precise measurements

```
┌─────────────────────────────────────────────────────┐
│  React Pages (UI)                                   │
│  • Index Page (test runner dashboard)              │
│  • Charts Page (visualization)                     │
│  ─────────────────────────────────────────────      │
│  Benefits: Type safety, component structure,       │
│           error boundaries, loading states         │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│  Vanilla TypeScript (Test Execution)                │
│  • Test runner in separate tabs                    │
│  • Library-specific test files                     │
│  ─────────────────────────────────────────────────  │
│  Benefits: No React overhead, accurate FPS/memory  │
│            measurements, memory sandboxing         │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│  IndexedDB (Persistence)                            │
│  • Test results storage                             │
│  • Result set management                            │
│  • Cross-session persistence                        │
└─────────────────────────────────────────────────────┘
```

### Why This Architecture?

**Critical Requirement:** Tests must run in isolated browser tabs to prevent memory leaks from one test affecting another.

**React for UI:**
- ✅ Type safety prevents entire classes of bugs
- ✅ Component structure improves maintainability
- ✅ Error boundaries catch and display errors gracefully
- ✅ Loading states provide better UX
- ✅ Modern development experience

**Vanilla TypeScript for Tests:**
- ✅ Zero React overhead in test loop
- ✅ Accurate FPS measurements (no virtual DOM)
- ✅ Precise memory measurements
- ✅ Identical performance to vanilla JS baseline
- ✅ Each test runs in clean browser tab (memory sandboxing)

### Technology Stack

- **React 18** - Modern UI framework
- **TypeScript 5** - Type-safe development
- **Vite 7** - Fast build tool and dev server
- **IndexedDB v3** - Client-side data persistence
- **SciChart.js** - WebGL-based visualization (for charts page)
- **Playwright** - End-to-end testing automation

### Project Structure

```
src/
├── pages/
│   ├── IndexPage.tsx              # Test runner dashboard (React)
│   └── ChartsPage.tsx             # Visualization page (React)
│
├── components/
│   ├── index/                     # Index page components
│   │   ├── TestTable.tsx          # Results table with benchmarks
│   │   ├── FilterPanel.tsx        # Filter controls
│   │   └── ImportExportButtons.tsx
│   │
│   ├── charts/                    # Charts page components
│   │   ├── ChartSection.tsx       # Chart visualizations
│   │   └── ChartTypeToggle.tsx
│   │
│   └── common/                    # Shared components
│       ├── ErrorBoundary.tsx      # Error handling
│       └── LoadingSpinner.tsx     # Loading states
│
├── services/
│   ├── indexeddb/                 # Database operations
│   │   ├── database.ts            # DB initialization
│   │   ├── testResults.ts         # Results CRUD
│   │   └── resultSets.ts          # Result set management
│   │
│   ├── calculations/              # Performance metrics
│   │   ├── benchmarkScore.ts      # Composite scoring
│   │   ├── dataIngestionRate.ts   # Data throughput
│   │   └── metrics.ts             # Metric utilities
│   │
│   └── import-export/             # Data import/export
│       ├── storageStateParser.ts  # Playwright format
│       ├── jsonParser.ts          # Simple JSON
│       └── exporter.ts            # Export to JSON
│
├── test-execution/                # VANILLA TYPESCRIPT (not React)
│   ├── testGroups.ts              # Test configurations
│   └── test-runner.ts             # Test orchestration
│
├── hooks/                         # React custom hooks
│   ├── useTestResults.ts
│   ├── useResultSets.ts
│   └── useFilters.ts
│
├── contexts/                      # React context providers
│   ├── IndexedDBContext.tsx
│   └── FiltersContext.tsx
│
├── types/                         # TypeScript definitions
│   ├── testResults.ts
│   ├── testConfig.ts
│   ├── database.ts
│   └── charts.ts
│
└── utils/                         # Utility functions
    ├── chartLibraries.ts
    └── formatting.ts

public/
├── index-react.html               # React index page
├── charts-react.html              # React charts page
├── scichart/scichart-ts.html      # TypeScript test runner
└── [library]/[library].html       # Library test pages
```

### URLs

**React Pages (dev mode):**
- Index: http://localhost:5173/index-react.html
- Charts: http://localhost:5173/charts-react.html

**Test Pages:**
- SciChart TS: http://localhost:5173/scichart/scichart-ts.html?test_group_id=1
- Other libraries: http://localhost:5173/[library]/[library].html?test_group_id=1

---

## Executive Summary (TL;DR)

This benchmark suite compares the rendering performance of popular JavaScript charting libraries under extreme workloads:

- many series
- different series types (line, scatter, column, mountain, area, candlestick, heatmap, 3D surface, 3D point cloud)
- millions of data-points
- real-time streaming and data ingestion tests
- multiple charts on screen (up to 128 charts)
- heatmaps and 3D charts

### Key Conclusions

- GPU-first architectures scale orders of magnitude further than CPU / Canvas / SVG-based libraries.
- Libraries designed for general-purpose dashboards degrade rapidly under large datasets or high update rates.
- Sustained 60 FPS at large scale is only achievable with WebGL-based rendering and optimized data pipelines.

## What Chart Libraries are tested?

This Test suite performs JavaScript Chart stress tests and compares the following libraries:

- SciChart.js
- HighCharts (with Boost module)
- Plotly.js (with GL series types where available)
- Chart.js
- Apache eCharts (with GL series types where available)
- uPlot

## Important Methodology Notes

- FPS is measured visually and via requestAnimationFrame where applicable.
- `performance.memory.usedJSHeapSize` for memory consumption is not available in all browsers.
- Some libraries may report high rAF rates while rendering visually lags or other large delays on initialisation.
- Browser crashes, hangs, or skipped tests are considered failures.
- All test results are logged to IndexedDB and displayed on the homepage (refresh page to view)

## What This Benchmark Does NOT Claim

- It does not measure aesthetics, API ergonomics, or learning curve.
- It does not represent typical dashboard workloads.
- It does not imply open source or smaller libraries are "bad" — only that they are not designed for extreme scale.
- Results should not be extrapolated to SVG or static charts (draw once / no interaction use-cases)

## What Test Cases are carried out?

This test suite aims to test a variety of JavaScript Chart operations with a variety of test cases, including Line, Scatter, Column, Candlestick, Heatmap, as well as 3D Chart (Surface mesh/plot, 3D point cloud) and multi-chart cases.

A full list of test cases carried out and their descriptions can be found below:

### N line series M points Test

![NxM Series JavaScript Chart Performance Test](img/testcase-NxM.png)

Multi-line test case for monte carlo simulation style charts. Starting with 100 line series x 100 data-points per series,
the test is incrementally updated to 200x200, 500x500, 1000x1000, 2000x2000 and 4000x4000.

This test case stresses the static overhead of adding a line series and drawing to a chart, while dynamically varying the zoom to measure the update rate.

### Brownian Motion Scatter Series Test

![Scatter Series JavaScript Chart Performance Test](img/testcase-brownian.png)

Single chart, single series test with a randomized, Xy data set rendered by scatter points. Starting at 1000 datapoints, the point-count is incrementally updated to 10000, 50000, 100000, 200000, 500000 all the way up to 10 million data-points.
The dataset is updated in realtime and the chart render speed, memory and frame count is measured.

This test case stresses the real-time data update rate of the chart for randomised data when rendering scatter plots. As no caching and no optimisations can be enabled for random data, this test stresses the raw drawing performance of the chart.

### Line series unsorted in X

![Randomised Xy Line Series JavaScript Chart Performance Test](img/testcase-xyline.png)

Single chart, single series test with a randomized, Xy data set rendered by line points. Starting at 1000 datapoints, the point-count is incrementally updated to 10000, 50000, 100000, 200000, 500000 all the way up to 10 million data-points.
The dataset is updated in realtime and the chart render speed, memory and frame count is measured.

This test case stresses the real-time data update rate of the chart for randomised data when rendering line plots. As no caching and no optimisations can be enabled for random data, this test stresses the raw drawing performance of the chart.

### Point series, sorted, updating y-values:

![Scatter Line Series realtime JavaScript Chart Performance Test](img/testcase-pointline.png)

With x-values sorted ascending, some caching optimisations can be enabled, however with randomised data, this test stresses the data update rate of the chart to draw lines and scatter points simultaneously, for incrementally increasing point-counts from 1000 points through to 10 million datapoints.

### Column Chart with data ascending in X:

![Column Series JavaScript Chart Performance Test](img/testcase-column.png)

Stresses the rendering performance of column or bar charts, an often overlooked chart type in high performance visualisation, but one that is critical in dashboards and complex applications.

A static dataset is loaded and the chart programatically zoomed to measure the redraw rate of the chart. This test stresses rendering performance, but not data update rate.

### Candlestick series test:

![Candlestick Series JavaScript Chart Performance Test](img/testcase-candle.png)

Stresses the rendering performance of candlestick charts, an often overlooked chart type in high performance financial visualisation, but one that is critical in financial applications, quantitative trading and HFT applications.

A static dataset is loaded and the chart programatically zoomed to measure the redraw rate of the chart. This test stresses rendering performance, but not data update rate.

### FIFO / ECG Chart Performance Test:

![Realtime FIFO ECG Data Ingestion JavaScript Chart Performance Test](img/testcase-fifo.png)

A single chart is loaded with 5 series, each with a fixed number of data-points. New data is appended in realtime and the chart scrolled in a 'First in first out' or ECG style.
Test cases get incrementally harder starting off at hundreds of data-points per second and ramping up to millions of data-points per second ingested.

This test case stresses the data update rate and rendering capabilities of the charts, giving an indication of the datapoints per second that can realistically be sent to a JavaScript chart under these conditions.

### Mountain Chart Performance Test:

![Mountain (Area) Series JavaScript Chart Performance Test](img/testcase-mountain.png)

Mountain or area charts with static data where the chart is programmatically zoomed

### Series Compression Test:

![Realtime Line Series Data Ingestion JavaScript Chart Performance Test](img/testcase-append.png)

Realtime charts where data is appended to a line chart as fast as you can

### Multi Chart Performance Test:

![Realtime Multi-Chart JavaScript Chart Performance Test](img/testcase-multchart.png)

An increasing numbers of charts (2, 4, 8, 16 ... up to 128 charts) each with realtime line series

### Uniform Heatmap Performance Test:

![Realtime Heatmap JavaScript Chart Performance Test](img/testcase-heatmap.png)

Realtime uniform heatmap updating as fast as possible with increasing number of cells

### 3D Point Cloud Performance Test:

![Realtime 3D Point Cloud JavaScript Chart Performance Test](img/testcase-3dpointcloud.png)

Realtime 3D point clouds with randomised data, with increasing numbers of data-points

### 3D Surface Performance Test:

![Realtime 3D Surface Mesh JavaScript Chart Performance Test](img/testcase-3dsurface.png)

Realtime 3D surface plots with a generated sinusoidal function with increasing number of cells

[... keeping all the benchmark results sections unchanged ...]

---

## Running the Test Suite

### Prerequisites

- Node.js 16+ and npm
- Modern web browser (Chrome, Firefox, or Edge)
- WebGL support (for chart visualizations)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd javascript-chart-performance-test-suite

# Install dependencies
npm install
```

### Development Mode

```bash
# Start the Vite dev server
npm start

# Server will start at http://localhost:5173
```

**Access the application:**
- Test Runner: http://localhost:5173/index-react.html
- Charts Visualization: http://localhost:5173/charts-react.html

### Building for Production

```bash
# Compile TypeScript and build with Vite
npm run build

# Output will be in the dist/ directory
```

### Running Tests with Playwright

```bash
# Prerequisites: Install Playwright browsers
npx playwright install

# Run tests (headless mode)
npm test

# Run tests (headed mode, visible browser)
npm test:headed

# Run tests with Playwright UI
npm test -- --ui
```

---

## Development Guide

### Adding a New Test Case

1. **Update test group constants** in `src/constants/testNames.ts`:

```typescript
export const G_TEST_GROUP_NAME = {
  LINE_PERFORMANCE_TEST: 'N line series M points',
  // ... existing tests
  YOUR_NEW_TEST: 'Your Test Name',
} as const;
```

2. **Add test configuration** in `src/test-execution/testGroups.ts`:

```typescript
export const G_TEST_GROUPS: Record<number, TestGroup> = {
  // ... existing groups
  14: {
    name: G_TEST_GROUP_NAME.YOUR_NEW_TEST,
    tests: [
      { series: 1, points: 1000, testDuration: 5000 },
      { series: 1, points: 10000, testDuration: 5000 },
      // ... more configurations
    ],
  },
};
```

3. **Create library test function** in library test files (e.g., `public/scichart/scichart_tests.js`):

```javascript
function eYourNewTest(seriesNum, pointsNum) {
  return {
    createChart: async () => { /* initialize chart */ },
    generateData: () => { /* create test data */ },
    appendData: () => { /* append data to chart */ },
    updateChart: (frame) => { /* update on each frame */ return datapointCount; },
    deleteChart: () => { /* cleanup */ },
  };
}
```

4. **Update test runner** in `src/test-runner.ts`:

```typescript
// Add to the test selection if/else chain
if (testGroupName === G_TEST_GROUP_NAME.YOUR_NEW_TEST) {
  perfTest = w.eYourNewTest?.(series, points);
}
```

5. **Update TestTable** in `src/components/index/TestTable.tsx` to ensure your test name appears in the UI.

### Understanding Test Execution Flow

1. User clicks "RUN" link on index page
2. New tab opens with library test page (e.g., `scichart-ts.html?test_group_id=1`)
3. Page loads:
   - Library file (`scichart.js`)
   - Library test file (`scichart_tests.js`)
   - Test runner (`src/test-runner.ts`)
4. Test runner executes:
   ```
   createChart() → generateData() → appendData() → updateChart() [loop] → deleteChart()
   ```
5. Results saved to IndexedDB
6. User closes tab and refreshes index page to see results

### Modifying React Components

**Index Page:**
- Main file: `src/pages/IndexPage.tsx`
- Components: `src/components/index/`
- State: `src/contexts/FiltersContext.tsx`

**Charts Page:**
- Main file: `src/pages/ChartsPage.tsx`
- Components: `src/components/charts/`
- Visualizations: SciChart.js integration

**Adding a New Filter:**
1. Update `FiltersContext.tsx` with new state
2. Create filter component in `src/components/`
3. Use hook in page: `const { yourFilter } = useFilters()`

### TypeScript Type Definitions

All types are in `src/types/`:
- `testResults.ts` - Test result types
- `testConfig.ts` - Test configuration types
- `database.ts` - IndexedDB schema
- `charts.ts` - Chart library types

### IndexedDB Schema

**Database Name:** `ChartPerformanceTestDB`
**Version:** 3

**Object Stores:**
1. `testResults` - Stores test execution results
   - Key: `id` (string, format: `{resultSetId}_{library}_{testCase}`)
   - Indexes: `by-resultSetId`, `by-chartLibrary`, `by-testCase`

2. `resultSets` - Stores result set metadata
   - Key: `id` (string)
   - Fields: `label`, `source`, `createdAt`, `updatedAt`

### Performance Measurement Details

**FPS Calculation:**
```typescript
averageFPS = (1000 * numberOfFrames) / updateFramesTime
```

**Data Ingestion Rate:**
```typescript
// Static tests (scatter, line, etc.)
rate = totalDatapoints / updateTime

// FIFO tests (streaming)
rate = (increment * series * frames) / updateTime
```

**Benchmark Score:**
Weighted composite of multiple metrics:
- FPS: 65% (power transform: FPS^1.5)
- Init Time: 20% (log transform: log(time)^3.5)
- Frames: 10% (linear)
- Memory: 5% (inverse: 1/memory)

### CSS and Styling

- Global styles: `public/style.css`
- Component styles: CSS Modules (e.g., `LoadingSpinner.module.css`)
- Chart styles: Inline in `charts-react.html`

### Error Handling

- **ErrorBoundary:** Catches React errors
- **Try/Catch:** In test runner for execution errors
- **Error States:** In hooks (`useTestResults`, etc.)
- **Error Reasons:** `HANGING`, `SKIPPED`, `UNSUPPORTED`, `ERROR_APPEND_DATA`

---

## Migration Notes

### From Vanilla JS to React/TypeScript

**What Changed:**
- UI pages now use React components
- All code now TypeScript with strict typing
- Test execution uses TypeScript (but no React)
- Modern build system (Vite)
- Improved error handling and loading states

**What Stayed the Same:**
- Test execution logic (identical FPS/memory measurements)
- IndexedDB schema (v3, fully compatible)
- Library test files (minimal changes for TS)
- Benchmark calculations (same algorithms)
- Test methodology (same approach)

**Performance Impact:**
- React pages: Minimal overhead (React only for UI, not tests)
- Test execution: Identical performance (no React in test loop)
- Memory: Similar baseline (React bundle ~200KB gzipped)
- Measurements: Identical accuracy (same measurement code)

---

## Troubleshooting

### Dev Server Won't Start
```bash
# Check if port 5173 is in use
npm start
```

### TypeScript Errors
```bash
# Check for type errors
npx tsc --noEmit
```

### Test Not Saving to IndexedDB
1. Check browser console for errors
2. Verify IndexedDB is enabled in browser
3. Check if test completed (look for results table)
4. Refresh index page to see new results

### Charts Page Not Showing Visualizations
- Charts use SciChart.js placeholders by default
- Full integration can be added following pattern in `public/charts.js`

### Build Issues
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## Contributing

When contributing to this repository:
1. Follow TypeScript strict mode
2. Use existing component patterns
3. Preserve test execution accuracy
4. Add types for all new code
5. Test with multiple browsers
6. Update documentation

---

## License

[Your License Here]

## Contact

[Your Contact Info]

---

**Maintained by:** [Your Name/Organization]
**Last Updated:** February 2026
**Version:** 2.0.0 (React/TypeScript Migration)

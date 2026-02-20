# Architecture Documentation

## Overview

The JavaScript Chart Performance Test Suite uses a **hybrid architecture** combining React for UI and vanilla TypeScript for test execution. This document explains the architectural decisions, patterns, and rationale.

---

## Core Principles

### 1. Separation of Concerns

**UI Layer (React):**
- Test runner dashboard
- Results visualization
- Filter controls
- Import/export functionality

**Execution Layer (Vanilla TS):**
- Test orchestration
- Performance measurements
- Chart library integration
- Memory sandboxing

**Data Layer (IndexedDB):**
- Result persistence
- Result set management
- Cross-session storage

### 2. Zero Test Overhead

**Critical Requirement:** Test execution must have zero framework overhead to ensure accurate FPS and memory measurements.

**Solution:** Tests run in separate tabs with vanilla TypeScript (no React virtual DOM, no React reconciliation, no React lifecycle overhead).

### 3. Type Safety

**All code is strictly typed TypeScript:**
- Compile-time error detection
- IDE autocomplete and refactoring
- Self-documenting code
- Reduced runtime errors

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  TAB 1: Index Page (React)                             │   │
│  │  • http://localhost:5173/index-react.html              │   │
│  │  ───────────────────────────────────────────────────── │   │
│  │  Components:                                           │   │
│  │    - TestTable                                         │   │
│  │    - FilterPanel                                       │   │
│  │    - ImportExportButtons                               │   │
│  │  State:                                                │   │
│  │    - FiltersContext (result sets, libraries, metric)  │   │
│  │    - IndexedDBContext (DB connection)                  │   │
│  └────────────────────────────────────────────────────────┘   │
│                          │                                     │
│                          │ clicks "RUN"                        │
│                          ↓                                     │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  TAB 2: Test Execution (Vanilla TS)                   │   │
│  │  • http://localhost:5173/scichart/scichart-ts.html    │   │
│  │    ?test_group_id=1                                    │   │
│  │  ───────────────────────────────────────────────────── │   │
│  │  Loaded Scripts:                                       │   │
│  │    1. SciChart library (index.min.js)                  │   │
│  │    2. Library tests (scichart_tests.js)                │   │
│  │    3. Test runner (src/test-runner.ts)                 │   │
│  │                                                        │   │
│  │  Test Loop:                                            │   │
│  │    while (time < duration) {                           │   │
│  │      const before = performance.now();                 │   │
│  │      perfTest.updateChart(frame);                      │   │
│  │      await requestAnimationFrame();                    │   │
│  │      const after = performance.now();                  │   │
│  │      frameTimings.push(after - before);                │   │
│  │    }                                                   │   │
│  │                                                        │   │
│  │  Measurements:                                         │   │
│  │    - FPS via rAF timing                                │   │
│  │    - Memory via performance.memory                     │   │
│  │    - Init time via performance.now()                   │   │
│  └────────────────────────────────────────────────────────┘   │
│                          │                                     │
│                          │ saves results                       │
│                          ↓                                     │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  IndexedDB                                             │   │
│  │  ───────────────────────────────────────────────────── │   │
│  │  testResults:                                          │   │
│  │    - id: "local_SciChart_LineTest"                     │   │
│  │    - chartLibrary: "SciChart.js 5.0.0"                 │   │
│  │    - testCase: "N line series M points"                │   │
│  │    - results: [ {...}, {...}, ... ]                    │   │
│  │                                                        │   │
│  │  resultSets:                                           │   │
│  │    - id: "local"                                       │   │
│  │    - label: "Local"                                    │   │
│  │    - source: "system"                                  │   │
│  └────────────────────────────────────────────────────────┘   │
│                          │                                     │
│                          │ reads results                       │
│                          ↓                                     │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  TAB 3: Charts Page (React)                            │   │
│  │  • http://localhost:5173/charts-react.html             │   │
│  │  ───────────────────────────────────────────────────── │   │
│  │  Components:                                           │   │
│  │    - ChartSection (per test group)                     │   │
│  │    - SciChartWrapper (visualization)                   │   │
│  │    - ChartTypeToggle (line/column)                     │   │
│  │  Renders:                                              │   │
│  │    - Performance charts for each test                  │   │
│  │    - Benchmark scores                                  │   │
│  │    - Comparison across libraries                       │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## React Component Architecture

### Component Hierarchy

```
App (Entry Points)
├── main.tsx (Index Page)
│   └── ErrorBoundary
│       └── IndexedDBProvider
│           └── FiltersProvider
│               └── IndexPage
│                   ├── FilterPanel
│                   │   ├── ResultSetFilters
│                   │   ├── LibraryFilters
│                   │   └── MetricSelector
│                   ├── ImportExportButtons
│                   └── TestTable
│
└── charts.tsx (Charts Page)
    └── ErrorBoundary
        └── IndexedDBProvider
            └── FiltersProvider
                └── ChartsPage
                    ├── FilterPanel
                    ├── ChartTypeToggle
                    └── ChartSection []
                        └── SciChartWrapper (optional)
```

### Context Providers

**IndexedDBContext:**
- Singleton database connection
- Initialization state
- Error handling
- Reinitialization capability

**FiltersContext:**
- Result set selection
- Library selection
- Metric selection
- Filter state persistence

### Custom Hooks

**useTestResults:**
```typescript
interface UseTestResultsReturn {
  results: TestResult[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

**useResultSets:**
```typescript
interface UseResultSetsReturn {
  resultSets: ResultSet[];
  isLoading: boolean;
  error: Error | null;
  create: (resultSet: ResultSet) => Promise<void>;
  remove: (id: string) => Promise<void>;
  update: (id: string, changes: Partial<ResultSet>) => Promise<void>;
}
```

**useFilters:**
```typescript
interface UseFiltersReturn {
  checkedResultSets: Set<string>;
  checkedLibraries: Set<string>;
  selectedMetric: Metric;
  toggleResultSet: (id: string) => void;
  toggleLibrary: (name: string) => void;
  setMetric: (metric: Metric) => void;
}
```

---

## Test Execution Architecture

### Test Runner Flow

```typescript
// 1. Parse query params
const testGroupId = parseInt(urlParams.get('test_group_id'));
const testGroup = gGetTestGroup(testGroupId);

// 2. For each test configuration
for (const testConfig of testGroup.tests) {
  // 3. Start test
  gTestStarted(testConfig, index);

  // 4. Get library test function
  const perfTest = w.eLinePerformanceTest?.(series, points);

  // 5. Execute test lifecycle
  await perfTest.createChart();     // Create chart instance
  gTestLibLoaded(index);

  perfTest.generateData();          // Generate test data
  gTestDataGenerated(index);

  perfTest.appendData();            // Append to chart
  gTestInitialDataAppended(index);

  // 6. Test loop
  const testStartTime = performance.now();
  while (performance.now() - testStartTime < testDuration) {
    const frameBefore = performance.now();

    const datapointCount = perfTest.updateChart(frame);
    if (datapointCount) totalDatapointsProcessed += datapointCount;

    await requestAnimationFrame();

    const frameAfter = performance.now();
    frameTimings.push(frameAfter - frameBefore);
    frame++;
  }

  // 7. Cleanup
  gTestFinished(index, frame, memory, frameTimings);
  perfTest.deleteChart();
}

// 8. Save to IndexedDB
await saveTestResult(testResult);
```

### Library Test Interface

All library test files must implement this interface:

```typescript
interface TestFunctionReturn {
  createChart: () => Promise<void | false>;
  generateData: () => void;
  appendData: () => void;
  updateChart: (frame: number) => number | undefined;
  deleteChart: () => void;
}
```

**Example Implementation:**
```javascript
// scichart_tests.js
function eLinePerformanceTest(seriesNum, pointsNum) {
  let chart, series, data;

  return {
    createChart: async () => {
      chart = await SciChartSurface.create('chart-root');
      // ... setup chart
    },

    generateData: () => {
      data = generateLineData(seriesNum, pointsNum);
    },

    appendData: () => {
      for (let i = 0; i < seriesNum; i++) {
        series[i].dataSeries.appendRange(data[i].x, data[i].y);
      }
    },

    updateChart: (frame) => {
      // Update data or zoom
      chart.zoomExtents();
      return undefined; // Or return datapoint count
    },

    deleteChart: () => {
      chart.delete();
    },
  };
}
```

---

## Data Flow

### Test Result Creation

```
Test Execution
    ↓
gTestStarted() → Creates TestResultRecord in G_RESULT array
    ↓
gTestLibLoaded() → Records timestamp
    ↓
gTestDataGenerated() → Records timestamp
    ↓
gTestInitialDataAppended() → Records timestamp
    ↓
Test Loop → Collects frame timings
    ↓
gTestFinished() → Calculates FPS, min/max FPS
    ↓
calculateDataIngestionRate() → Adds ingestion rate
    ↓
saveTestResult() → Persists to IndexedDB
    ↓
IndexedDB testResults store
```

### Test Result Retrieval

```
IndexPage Component
    ↓
useTestResults() hook
    ↓
getAllTestResults() service
    ↓
IndexedDB testResults store
    ↓
groupResultsByTestCase() utility
    ↓
TestTable component renders
```

### Filter Application

```
User toggles filter
    ↓
FiltersContext state updates
    ↓
filteredResults useMemo recomputes
    ↓
TestTable re-renders with new data
```

---

## IndexedDB Schema

### Database Structure

```typescript
Database: ChartPerformanceTestDB
Version: 3

ObjectStore: testResults
├── keyPath: "id"
├── indexes:
│   ├── by-resultSetId (resultSetId)
│   ├── by-chartLibrary (chartLibrary)
│   └── by-testCase (testCase)
└── records:
    └── TestResult {
          id: string,
          chartLibrary: string,
          testCase: string,
          results: TestResultRecord[],
          resultSetId: string,
          timestamp: number
        }

ObjectStore: resultSets
├── keyPath: "id"
└── records:
    └── ResultSet {
          id: string,
          label: string,
          source: 'system' | 'playwright' | 'json' | 'import',
          createdAt: number,
          updatedAt: number
        }
```

### Migration Strategy

**v2 → v3:**
- Consolidate legacy result sets to "local"
- Preserve existing data
- Add resultSets object store
- Add indexes to testResults

---

## Performance Optimization Strategies

### 1. Test Execution Isolation

**Problem:** Memory leaks from one test affecting subsequent tests

**Solution:**
- Each test runs in separate browser tab
- Tab closed after test completion
- Clean slate for each library/test combination

### 2. React Rendering Optimization

**Index Page:**
- `useMemo` for filtered results
- `useMemo` for grouped data
- `useCallback` for event handlers
- Context prevents prop drilling

**Charts Page:**
- Lazy loading for chart components
- Chart reuse where possible
- Efficient re-rendering on filter changes

### 3. IndexedDB Optimization

**Read Operations:**
- Batch reads where possible
- Index usage for filtering
- Cursor-based iteration for large datasets

**Write Operations:**
- Transaction batching
- Async writes don't block UI
- Auto-commit transactions

### 4. Bundle Size Optimization

**Code Splitting:**
- Separate bundles for index and charts pages
- Library code loaded on-demand
- Vite automatic chunk splitting

**Tree Shaking:**
- ES modules for better tree shaking
- Dead code elimination
- No unused dependencies

---

## Error Handling Strategy

### Levels of Error Handling

**1. Component Level:**
```typescript
// ErrorBoundary catches render errors
<ErrorBoundary>
  <IndexPage />
</ErrorBoundary>
```

**2. Hook Level:**
```typescript
// Hooks return error state
const { results, error } = useTestResults();
if (error) {
  // Display error to user
}
```

**3. Service Level:**
```typescript
// Services throw errors
try {
  await saveTestResult(result);
} catch (error) {
  console.error('Save failed:', error);
  throw error; // Propagate to caller
}
```

**4. Test Execution Level:**
```typescript
// Test errors marked in results
try {
  perfTest.appendData();
} catch (error) {
  gTestFinished(i, 0, 0, [], true, 'ERROR_APPEND_DATA');
}
```

### Error Categories

**Test Execution Errors:**
- `HANGING` - Setup time exceeds test duration
- `SKIPPED` - Skipped due to previous error
- `UNSUPPORTED` - Library doesn't support test type
- `ERROR_APPEND_DATA` - Error during data append

**Application Errors:**
- IndexedDB initialization failure
- Import/export errors
- Network errors (for Playwright imports)
- Component render errors

---

## Testing Strategy

### Unit Testing (Future)

**Candidate Functions:**
- Benchmark score calculation
- Data ingestion rate calculation
- Metric value extraction
- Formatting utilities

### Integration Testing (Current)

**Playwright Tests:**
- End-to-end test execution
- Result persistence verification
- Page rendering validation
- Cross-browser compatibility

### Manual Testing

**Critical Paths:**
- Test execution accuracy
- FPS measurement precision
- Memory measurement accuracy
- Result persistence
- Filter functionality
- Import/export

---

## Build and Deployment

### Development Build

```bash
npm start
# Vite dev server with HMR
# TypeScript compilation on-the-fly
# Source maps enabled
```

### Production Build

```bash
npm run build
# 1. TypeScript compilation (tsc)
# 2. Vite bundling
# 3. Code minification
# 4. Asset optimization
# Output: dist/ directory
```

### Build Optimization

**Vite Configuration:**
- Multi-page build
- Code splitting
- Asset inlining (<4KB)
- CSS extraction
- Source map generation

---

## Security Considerations

### IndexedDB

**No sensitive data stored:**
- Only test results (public benchmarks)
- No user credentials
- No personal information

**Cross-origin isolation:**
- IndexedDB scoped to origin
- No cross-domain access

### Import/Export

**File validation:**
- JSON structure validation
- Type checking on import
- Sanitization of imported data

**No code execution:**
- JSON only (no eval, no Function constructor)
- Strict parsing

---

## Browser Compatibility

### Supported Browsers

- **Chrome 90+** (Primary target)
- **Firefox 88+**
- **Edge 90+**
- **Safari 14+** (IndexedDB support required)

### Required Features

- ✅ IndexedDB v2
- ✅ ES2020 features
- ✅ requestAnimationFrame
- ✅ performance.memory (Chrome only)
- ✅ WebGL 2.0 (for SciChart visualizations)

### Polyfills

None required for target browsers.

---

## Future Architecture Improvements

### Potential Enhancements

1. **Web Workers**
   - Offload heavy calculations
   - Background data processing
   - Non-blocking imports

2. **Service Workers**
   - Offline capability
   - Cache test results
   - Background sync

3. **WebAssembly**
   - High-performance calculations
   - Data transformation
   - Compression algorithms

4. **React Query**
   - Better data fetching
   - Automatic refetching
   - Optimistic updates

5. **Virtual Scrolling**
   - Large test result tables
   - Improved performance
   - Better UX for large datasets

---

## Conclusion

The hybrid architecture successfully balances:
- **Modern development experience** (React + TypeScript)
- **Test accuracy** (vanilla TS execution, zero overhead)
- **Type safety** (strict TypeScript throughout)
- **Performance** (optimized rendering and data flow)
- **Maintainability** (clear separation of concerns)

This architecture provides a solid foundation for future enhancements while preserving the critical requirement of accurate performance measurements.

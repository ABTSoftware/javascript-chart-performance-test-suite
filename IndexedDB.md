# IndexedDB Schema Documentation

## Overview

This document describes the IndexedDB schema used by the Chart Performance Test Suite to persist test results locally in the browser. The database stores performance benchmarks for various chart libraries across different test scenarios, enabling comparison and analysis over time.

**Database Name:** `ChartPerformanceResults`
**Current Version:** `3`
**Storage Location:** Browser's IndexedDB (persistent local storage)

---

## Object Stores

The database contains two main object stores:

### 1. `testResults`

Stores the actual performance test results for each chart library and test case combination.

**Configuration:**
- **Key Path:** `id` (composite string: `{resultSetId}_{chartLibrary}_{testCase}`)
- **Auto Increment:** No
- **Indices:**
  - `chartLibrary` (non-unique) - Enables querying by library name
  - `testCase` (non-unique) - Enables querying by test type
  - `resultSetId` (non-unique) - Enables querying by result set

### 2. `resultSets`

Stores metadata about result set collections (groups of related test results).

**Configuration:**
- **Key Path:** `id`
- **Auto Increment:** No
- **Indices:** None

---

## Data Schemas

### `testResults` Record

Each record in the `testResults` store represents all test results for a specific library and test case combination.

```javascript
{
  // Primary key (composite)
  id: "local_SciChart.js 3.0.0_N line series M points",

  // Identification fields
  chartLibrary: "SciChart.js 3.0.0",        // Library name with version
  testCase: "N line series M points",       // Test case name
  resultSetId: "local",                     // Result set this belongs to

  // Metadata
  timestamp: 1708300000000,                 // When saved (Date.now())

  // Results array - one entry per test configuration
  results: [
    {
      // Test configuration
      config: {
        series: 100,                        // Number of series to render
        points: 100,                        // Number of points per series
        testDuration: 5000,                 // Test duration in milliseconds
        charts: 1,                          // Number of charts (optional)
        increment: 100                      // Point increment for FIFO tests (optional)
      },

      // Library info
      configLibName: "SciChart.js",         // Library name
      configLibVersion: "3.0.0",            // Library version

      // Timing measurements (all in milliseconds from performance.now())
      timestampTestStart: 1234.56,          // When test started
      timestampLibLoaded: 1456.78,          // When library finished loading
      timestampFirstFrameWithoutDataRendered: 1567.89, // First empty frame
      timestampDataGenerated: 1678.90,      // When data generation completed
      timestampInitialDataAppended: 2345.67,// When initial data was appended
      timestampTestFinish: 7890.12,         // When test completed

      // Memory measurements
      heapSizeTestStart: 50000000,          // JS heap size at start (bytes)
      heapSizeTestFinish: 150000000,        // JS heap size at finish (bytes)
      memory: 143.2,                        // Memory usage in MB

      // Performance metrics (all in milliseconds except FPS and frame count)
      benchmarkTimeLibLoad: 222.22,         // Time to load library & create chart
      benchmarkTimeFirstFrame: 333.33,      // Time from start to first rendered frame
      dataGenerationTime: 111.01,           // Time spent generating test data
      benchmarkTimeInitialDataAppend: 666.77, // Time to append initial data
      updateFramesTime: 5544.45,            // Time spent in update loop

      // Frame statistics
      numberOfFrames: 300,                  // Total frames rendered
      averageFPS: 54.12,                    // Average FPS (calculated from actual duration)
      benchmarkFPS: 54.12,                  // Legacy alias for averageFPS
      minFPS: 42.50,                        // Minimum FPS during test (capped at 240)
      maxFPS: 60.00,                        // Maximum FPS during test (capped at 240)

      // Note: frameTimings array is excluded from persistence to save space

      // Error handling
      isErrored: false,                     // Whether test encountered an error
      errorReason: null                     // Error reason if isErrored is true
                                            // Possible values: "UNSUPPORTED", "SKIPPED",
                                            // "ERROR_APPEND_DATA", "HANGING"
    },
    // ... more test configuration results
  ]
}
```

#### Field Descriptions

**Timing Fields:**
- `timestampTestStart` - The time from test start for the library to load and create the chart surface
- `timestampLibLoaded` - When the library finished loading (includes chart surface creation)
- `timestampFirstFrameWithoutDataRendered` - When the first empty frame was rendered
- `timestampDataGenerated` - When test data generation completed
- `timestampInitialDataAppended` - When initial data was appended to the chart
- `timestampTestFinish` - When the test loop completed

**Benchmark Metrics:**
- `benchmarkTimeLibLoad` - Time spent loading library and creating chart (libLoaded - testStart)
- `benchmarkTimeFirstFrame` - Total time to first frame with data (firstFrameRendered - testStart)
- `dataGenerationTime` - Time spent generating test data (dataGenerated - firstFrameRendered)
- `benchmarkTimeInitialDataAppend` - Time to append data to chart (initialDataAppended - dataGenerated)
- `updateFramesTime` - Time spent in the update/render loop (testFinish - initialDataAppended)

**FPS Calculations:**
- `averageFPS` - Calculated as `(1000 * numberOfFrames) / updateFramesTime`
- `minFPS` / `maxFPS` - Calculated from individual frame timings, capped at 240 FPS for realism
- Frame timings are capped at minimum 4.17ms (240 FPS) to filter out unrealistic cached/empty frames

**Error States:**
- `UNSUPPORTED` - Test type not implemented for this library
- `SKIPPED` - Skipped due to previous test failure
- `ERROR_APPEND_DATA` - Failed during data append operation
- `HANGING` - Test exceeded time limit during setup

---

### `resultSets` Record

Metadata about result set collections. Each result set groups related test results together (e.g., "Local", "Production Baseline", "Imported from CI").

```javascript
{
  // Primary key
  id: "local",                              // Unique identifier (URL-safe slug)

  // Display information
  label: "Local",                           // Human-readable name

  // Metadata
  source: "system",                         // How this set was created
                                            // Values: "system", "import", "playwright"
  createdAt: 1708300000000,                 // Creation timestamp (Date.now())
  updatedAt: 1708300000000                  // Last update timestamp (Date.now())
}
```

#### Reserved Result Sets

- **`local`** - Special reserved result set for locally-run tests. Cannot be deleted.

---

## Example Data

### Complete `testResults` Example

```javascript
{
  id: "local_SciChart.js 3.0.0_Brownian Motion Scatter Series",
  chartLibrary: "SciChart.js 3.0.0",
  testCase: "Brownian Motion Scatter Series",
  resultSetId: "local",
  timestamp: 1708300000000,
  results: [
    {
      config: {
        series: 1,
        points: 1000,
        testDuration: 5000
      },
      configLibName: "SciChart.js",
      configLibVersion: "3.0.0",
      timestampTestStart: 1000.00,
      timestampLibLoaded: 1250.00,
      timestampFirstFrameWithoutDataRendered: 1300.00,
      timestampDataGenerated: 1350.00,
      timestampInitialDataAppended: 1400.00,
      timestampTestFinish: 6400.00,
      heapSizeTestStart: 50000000,
      heapSizeTestFinish: 65000000,
      memory: 62.0,
      benchmarkTimeLibLoad: 250.00,
      benchmarkTimeFirstFrame: 400.00,
      dataGenerationTime: 50.00,
      benchmarkTimeInitialDataAppend: 50.00,
      updateFramesTime: 5000.00,
      numberOfFrames: 300,
      averageFPS: 60.00,
      benchmarkFPS: 60.00,
      minFPS: 58.50,
      maxFPS: 60.00,
      isErrored: false,
      errorReason: null
    },
    {
      config: {
        series: 1,
        points: 10000,
        testDuration: 5000
      },
      configLibName: "SciChart.js",
      configLibVersion: "3.0.0",
      timestampTestStart: 7000.00,
      timestampLibLoaded: 7200.00,
      timestampFirstFrameWithoutDataRendered: 7250.00,
      timestampDataGenerated: 7350.00,
      timestampInitialDataAppended: 7500.00,
      timestampTestFinish: 12500.00,
      heapSizeTestStart: 65000000,
      heapSizeTestFinish: 95000000,
      memory: 90.5,
      benchmarkTimeLibLoad: 200.00,
      benchmarkTimeFirstFrame: 500.00,
      dataGenerationTime: 100.00,
      benchmarkTimeInitialDataAppend: 150.00,
      updateFramesTime: 5000.00,
      numberOfFrames: 250,
      averageFPS: 50.00,
      benchmarkFPS: 50.00,
      minFPS: 45.20,
      maxFPS: 55.00,
      isErrored: false,
      errorReason: null
    }
  ]
}
```

### `resultSets` Examples

```javascript
// System result set (cannot be deleted)
{
  id: "local",
  label: "Local",
  source: "system",
  createdAt: 1708300000000,
  updatedAt: 1708300000000
}

// Imported result set
{
  id: "production-baseline-2024",
  label: "Production Baseline 2024",
  source: "import",
  createdAt: 1708305000000,
  updatedAt: 1708305000000
}

// Playwright automated test results
{
  id: "ci-run-1234",
  label: "CI Run #1234",
  source: "playwright",
  createdAt: 1708310000000,
  updatedAt: 1708310000000
}
```

---

## Database Operations

### Common Queries

#### Get all results for a specific library
```javascript
const tx = db.transaction(['testResults'], 'readonly');
const index = tx.objectStore('testResults').index('chartLibrary');
const results = await index.getAll('SciChart.js 3.0.0');
```

#### Get all results for a specific test case
```javascript
const tx = db.transaction(['testResults'], 'readonly');
const index = tx.objectStore('testResults').index('testCase');
const results = await index.getAll('N line series M points');
```

#### Get all results for a result set
```javascript
const tx = db.transaction(['testResults'], 'readonly');
const index = tx.objectStore('testResults').index('resultSetId');
const results = await index.getAll('local');
```

#### Save new test results
```javascript
const data = {
  id: `${resultSetId}_${chartLibrary}_${testCase}`,
  chartLibrary,
  testCase,
  results,
  resultSetId,
  timestamp: Date.now()
};

const tx = db.transaction(['testResults'], 'readwrite');
await tx.objectStore('testResults').put(data);
```

---

## Migration History

### Version 1 → Version 2
- Created `resultSets` object store
- Added `resultSetId` index to `testResults`

### Version 2 → Version 3
- Consolidated legacy result set IDs (`default`, `playwright`, `latest-run`) into reserved `local` result set
- Ensured "Local" result set metadata exists
- Migrated all legacy prefixed records to use `local` result set ID

---

## Notes

- **Frame Timings Excluded**: The `frameTimings` array (which can contain thousands of entries) is intentionally excluded from persistence to reduce storage size
- **FPS Capping**: FPS values are capped at 240 FPS maximum to filter out unrealistic values from cached/empty frames
- **Memory Measurement**: Memory values use `window.performance.memory.usedJSHeapSize` which may fluctuate due to non-deterministic garbage collection
- **Error Handling**: Tests that fail, hang, or are unsupported are marked with `isErrored: true` and an appropriate `errorReason`
- **Result Set ID Format**: Custom result set IDs are URL-safe slugs (lowercase, alphanumeric with hyphens, max 60 chars)

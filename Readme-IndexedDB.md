# IndexedDB Schema Documentation

This document describes the schema and structure of data stored in IndexedDB for the Chart Performance Testing application.

## Database Configuration

- **Database Name**: `ChartPerformanceResults`
- **Database Version**: `1`
- **Object Store Name**: `testResults`

## Object Store Schema

The `testResults` object store uses the following configuration:

- **Key Path**: `id` (primary key)
- **Indexes**:
  - `chartLibrary` (non-unique)
  - `testCase` (non-unique)

## Data Structure

Each record stored in the `testResults` object store follows this schema:

### Root Object

```typescript
interface TestResultRecord {
  id: string;                    // Primary key: "{chartLibrary}_{testCase}"
  chartLibrary: string;          // e.g., "SciChart.js 3.4.615", "Chart.js 3.7.0"
  testCase: string;              // e.g., "N line series M points", "Brownian Motion Scatter Series"
  results: TestResult[];         // Array of individual test results
  timestamp: number;             // Unix timestamp when results were saved
}
```

### Test Result Schema

Each item in the `results` array contains the following structure:

```typescript
interface TestResult {
  // Configuration
  config: TestConfig;
  configLibName: string;         // Library name (e.g., "SciChart.js")
  configLibVersion: string;      // Library version (e.g., "3.4.615")
  
  // Timing measurements (all in milliseconds)
  timestampTestStart: number;
  timestampLibLoaded: number;
  timestampFirstFrameWithDataRendered: number;
  timestampDataGenerated: number;
  timestampInitialDataAppended: number;
  timestampTestFinish: number;
  
  // Calculated benchmark times (milliseconds)
  benchmarkTimeLibLoad: number;           // Time to load library and create chart
  benchmarkTimeFirstFrame: number;       // Total time from start to first rendered frame
  benchmarkTimeInitialDataAppend: number; // Time to append initial data
  dataGenerationTime: number;            // Time to generate test data
  updateFramesTime: number;               // Time spent updating frames during test
  
  // Performance metrics
  numberOfFrames: number;         // Total frames rendered during test
  benchmarkFPS: number;          // Average FPS (legacy, same as averageFPS)
  averageFPS: number;            // Average FPS: (1000 * frames) / actualTestDuration
  minFPS: number;                // Minimum FPS from individual frame timings
  maxFPS: number;                // Maximum FPS from individual frame timings (capped at 240)
  memory: number;                // Memory usage in MB at test completion
  
  // Error handling
  isErrored: boolean;            // Whether the test encountered an error
  errorReason: string | null;    // Error reason: 'HANGING', 'ERROR_APPEND_DATA', 'UNSUPPORTED', 'SKIPPED', etc.
  
  // Frame timing data (excluded from persistence to save space)
  frameTimings?: number[];       // Individual frame render times in milliseconds
}
```

### Test Configuration Schema

```typescript
interface TestConfig {
  series: number;        // Number of data series
  points: number;        // Number of data points per series
  testDuration: number;  // Test duration in milliseconds (typically 5000)
  increment?: number;    // Points to add per frame (for streaming tests)
  charts?: number;       // Number of charts (for multi-chart tests)
}
```

## Example Data

### Sample Record

```json
{
  "id": "SciChart.js 3.4.615_N line series M points",
  "chartLibrary": "SciChart.js 3.4.615",
  "testCase": "N line series M points",
  "timestamp": 1642678800000,
  "results": [
    {
      "config": {
        "series": 100,
        "points": 100,
        "testDuration": 5000
      },
      "configLibName": "SciChart.js",
      "configLibVersion": "3.4.615",
      "timestampTestStart": 1642678800000,
      "timestampLibLoaded": 1642678800150,
      "timestampFirstFrameWithDataRendered": 1642678800300,
      "timestampDataGenerated": 1642678800200,
      "timestampInitialDataAppended": 1642678800250,
      "timestampTestFinish": 1642678805300,
      "benchmarkTimeLibLoad": 150,
      "benchmarkTimeFirstFrame": 300,
      "benchmarkTimeInitialDataAppend": 50,
      "dataGenerationTime": 50,
      "updateFramesTime": 5000,
      "numberOfFrames": 300,
      "benchmarkFPS": 60.0,
      "averageFPS": 60.0,
      "minFPS": 58.5,
      "maxFPS": 62.1,
      "memory": 45.2,
      "isErrored": false,
      "errorReason": null
    }
  ]
}
```

## Error States

When tests fail, the `isErrored` field is set to `true` and `errorReason` contains one of:

- `'HANGING'` - Test exceeded time limit during setup
- `'ERROR_APPEND_DATA'` - Error occurred during data append phase
- `'UNSUPPORTED'` - Test type not implemented for this library
- `'SKIPPED'` - Test skipped due to previous failures or low FPS

## Data Persistence Notes

1. **Frame Timings Excluded**: The `frameTimings` array is excluded from persistence to reduce storage size, as it can contain thousands of timing measurements.

2. **FPS Calculations**: 
   - `averageFPS` is calculated as `(1000 * numberOfFrames) / actualTestDuration`
   - `minFPS` and `maxFPS` are derived from individual frame timings, capped at 240 FPS for realistic values

3. **Memory Measurements**: Memory is measured using `window.performance.memory.usedJSHeapSize` and may not immediately reflect chart deletion due to non-deterministic garbage collection.

4. **Timestamp Precision**: All timestamps use `performance.now()` for high-resolution timing measurements.

# Phase 8: Testing and Validation Checklist

## Build and Configuration ✅

- [x] TypeScript compiles without errors (`npx tsc --noEmit`)
- [x] Project builds successfully (`npm run build`)
- [ ] Dev server starts without errors (`npm start`)
- [ ] All entry points configured correctly in vite.config.ts

## React Pages Testing

### Index Page (`/index-react.html`)

#### Page Load
- [ ] Page loads without JavaScript errors
- [ ] React app renders correctly
- [ ] IndexedDB initializes successfully
- [ ] System info displays (if applicable)

#### UI Components
- [ ] Header displays with "Performance Comparison Test Suite" title
- [ ] Navigation link to "Charts View" works
- [ ] Filter panels render:
  - [ ] Result Set Filters
  - [ ] Library Filters
  - [ ] Metric Selector (FPS, Memory, Init, Frames, Ingestion)
- [ ] Import/Export buttons render
- [ ] Test table renders

#### Functionality
- [ ] Result set checkboxes filter results
- [ ] Library checkboxes filter results
- [ ] Metric selector changes displayed values
- [ ] "Import Results" button opens file picker
- [ ] "Export Selected" button downloads JSON
- [ ] Auto-import from `storage-state.json` works
- [ ] RUN links open in new tabs with correct URLs
- [ ] Test configurations display correctly (e.g., "100×100")

#### State Management
- [ ] Filters persist across component re-renders
- [ ] Results update after import
- [ ] Page refreshes pull latest data from IndexedDB

#### Loading and Error States
- [ ] Loading spinner shows while data loads
- [ ] Error message displays if IndexedDB fails
- [ ] Error boundary catches React errors

### Charts Page (`/charts-react.html`)

#### Page Load
- [ ] Page loads without JavaScript errors
- [ ] React app renders correctly
- [ ] IndexedDB initializes successfully

#### UI Components
- [ ] Header displays with "Performance Results - Charts" title
- [ ] Navigation link to "Test Suite" works
- [ ] Filter panels render:
  - [ ] Result Set Filters
  - [ ] Library Filters
  - [ ] Metric Selector
  - [ ] Chart Type Toggle (Line/Column)
- [ ] Chart sections render for each test group

#### Functionality
- [ ] Result set filter updates charts
- [ ] Library filter updates chart series
- [ ] Metric selector changes Y-axis values
- [ ] Chart type toggle switches between line and column
- [ ] Charts display placeholder or real visualizations
- [ ] "No results found" message shows when appropriate

#### Loading and Error States
- [ ] Loading spinner shows while data loads
- [ ] Error message displays if IndexedDB fails
- [ ] Error boundary catches React errors

## Test Execution Pages

### SciChart TypeScript Test Runner (`/scichart/scichart-ts.html`)

#### Page Load
- [ ] Page loads without JavaScript errors
- [ ] Test runner TypeScript module loads
- [ ] Library test file loads (`scichart_tests.js`)
- [ ] SciChart library loads

#### Test Execution
- [ ] Test starts automatically with `?test_group_id=1`
- [ ] System info displays
- [ ] Chart renders in `#chart-root` div
- [ ] Test loop runs for configured duration (5 seconds)
- [ ] FPS calculated correctly
- [ ] Memory measured accurately
- [ ] Frame timings captured
- [ ] Results table displays after completion
- [ ] Results saved to IndexedDB
- [ ] Chart cleaned up after test

#### Error Handling
- [ ] Unsupported tests marked as "UNSUPPORTED"
- [ ] Hanging tests (setup > duration) marked as "HANGING"
- [ ] Errors during execution marked as "ERROR_APPEND_DATA"
- [ ] Subsequent tests marked as "SKIPPED" after error

### Original Test Pages (Vanilla JS)

Test that original pages still work for comparison:

- [ ] `/scichart/scichart.html?test_group_id=1`
- [ ] `/echarts/echarts.html?test_group_id=1`
- [ ] `/highcharts/highcharts.html?test_group_id=1`
- [ ] `/chartjs/chartjs.html?test_group_id=1`
- [ ] `/plotly/plotly.html?test_group_id=1`
- [ ] `/uPlot/uPlot.html?test_group_id=1`
- [ ] `/chartgpu/chartgpu.html?test_group_id=1`
- [ ] `/lcjsv4/lcjs.html?test_group_id=1`

## IndexedDB Testing

### Database Initialization
- [ ] Database opens with correct name
- [ ] Database version is 3
- [ ] `testResults` object store exists
- [ ] `resultSets` object store exists
- [ ] Indexes created correctly

### Data Operations
- [ ] Save test result to IndexedDB
- [ ] Retrieve all test results
- [ ] Retrieve results by result set ID
- [ ] Save result set metadata
- [ ] Delete result set and associated results
- [ ] Group results by test case

### Data Integrity
- [ ] Results persist across page refreshes
- [ ] Results survive browser restart
- [ ] Schema migration from v2 to v3 works (if applicable)
- [ ] Legacy data preserved during migration

## Calculation Accuracy

### Benchmark Scoring
- [ ] FPS component calculated correctly (weight: 65%)
- [ ] Init time component calculated correctly (weight: 20%)
- [ ] Frames component calculated correctly (weight: 10%)
- [ ] Memory component calculated correctly (weight: 5%)
- [ ] Power transformation applied (FPS^1.5, log(initTime)^3.5)
- [ ] Normalization across configs works
- [ ] Total score calculated correctly

### Data Ingestion Rate
- [ ] Static tests: `totalDatapoints / updateTime`
- [ ] FIFO tests: `increment * series * frames / updateTime`
- [ ] Rates display in correct units (pts/sec)
- [ ] Zero ingestion rate for unsupported tests

### Metric Calculations
- [ ] Average FPS: `(1000 * frames) / updateTime`
- [ ] Min FPS from frame timings (capped at 240)
- [ ] Max FPS from frame timings (capped at 240)
- [ ] Memory in MB from heap size
- [ ] Init time from first frame timestamp

### Color Coding
- [ ] Green for good performance (ratio >= 0.8)
- [ ] Yellow for medium performance (ratio >= 0.5)
- [ ] Red for poor performance (ratio < 0.5)
- [ ] Color logic correct for "higher is better" metrics
- [ ] Color logic correct for "lower is better" metrics

## Import/Export Testing

### Import Formats
- [ ] Playwright storage-state.json format
- [ ] Simple JSON array format
- [ ] Simple JSON object format
- [ ] Invalid JSON shows error

### Playwright Format
- [ ] Base64-decoded IndexedDB values parsed
- [ ] Result sets extracted correctly
- [ ] Results mapped to database schema
- [ ] Duplicate results not created

### Export
- [ ] Export includes selected result sets only
- [ ] Export JSON format is valid
- [ ] Export includes all fields
- [ ] frameTimings excluded from export
- [ ] Downloaded file has correct filename

### Auto-Import
- [ ] Automatically imports from `/tests/storage-state.json`
- [ ] Only imports on initial load
- [ ] No duplicate imports on refresh
- [ ] Errors logged but don't break app

## Browser Compatibility

### Chrome (Primary)
- [ ] All pages load
- [ ] IndexedDB works
- [ ] WebGL works (for SciChart)
- [ ] Performance measurements accurate

### Firefox
- [ ] All pages load
- [ ] IndexedDB works
- [ ] WebGL works
- [ ] Performance measurements accurate

### Edge
- [ ] All pages load
- [ ] IndexedDB works
- [ ] WebGL works
- [ ] Performance measurements accurate

## Performance Baseline Comparison

Run a full test suite on **ONE** library (e.g., SciChart) and compare to baseline:

### Line Performance Test (test_group_id=1)
- [ ] 100×100 - FPS within 5% of baseline
- [ ] 200×200 - FPS within 5% of baseline
- [ ] 500×500 - FPS within 5% of baseline
- [ ] 1000×1000 - FPS within 5% of baseline
- [ ] Memory within 10% of baseline
- [ ] Init time within 10% of baseline

### Scatter Performance Test (test_group_id=2)
- [ ] 1×1000 - FPS within 5% of baseline
- [ ] 1×10000 - FPS within 5% of baseline
- [ ] Memory within 10% of baseline

## Known Issues and Limitations

### Current State
- ✅ TypeScript compilation working
- ✅ React pages created
- ✅ IndexedDB service layer complete
- ✅ Loading and error states added
- ⚠️ SciChart visualizations use placeholders (can be completed later)
- ⚠️ Build config picks up old HTML files (needs fix)

### Build Configuration
- `npm run build` builds old `public/index.html` instead of `public/index-react.html`
- Output goes to `public/dist/` instead of `./dist/`
- Need to exclude old HTML files from build

### Playwright Tests
- Existing tests target old vanilla JS pages
- Tests look for `.results-table-ready` and `.results-ready` classes
- May need to update test selectors for React pages

## Next Steps After Testing

### Critical Fixes
- [ ] Fix vite.config.ts build entry points
- [ ] Add `.results-ready` class to IndexPage when loaded
- [ ] Add `.results-table-ready` class to test runner when complete
- [ ] Update Playwright tests for React pages

### Optional Enhancements
- [ ] Complete SciChart visualizations in ChartsPage
- [ ] Add more CSS Modules to components
- [ ] Add unit tests for calculations
- [ ] Add E2E tests for critical paths

### Documentation
- [ ] Update README with React/TypeScript architecture
- [ ] Document hybrid approach (React UI + vanilla test execution)
- [ ] Create migration guide from vanilla JS
- [ ] Add developer guide for extending

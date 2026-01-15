# JavaScript Charts Performance Test Suite

This test suite demonstrates the performance of several JavaScript Chart libraries in a variety of test cases, 
to determine which perform the best under demanding and varied conditions.

## What Chart Libraries are tested? 

This Test suite performs JavaScript Chart stress tests and compares the following libraries:

- SciChart.js
- HighCharts (with Boost module)
- Plotly.js (with GL series types where available)
- Chart.js
- Apache eCharts (with GL series types where available)
- uPlot

> Care has been taken to ensure the latest version of libraries are used, and tests are fair and equitable where feature differences or API differences occur between the libraries. 
> 
> For example: Data is generated in the same manner, all test cases use Float64 data and all tests aim to minimise GC load by re-using data arrays passed to the charts. We only want to test the charts, not data generation time
> 
> FPS (Frames per second) is measured in the same manner for all libraries / test cases using `requestAnimationFrame` and `performance.now` and memory usage is reported using `window.performance.memory?.usedJSHeapSize`

## What Test Cases are carried out?

This test suite aims to test a variety of JavaScript Chart operations with a variety of test cases, including Line, Scatter, Column, Candlestick, Heatmap, as well as 3D Chart (Surface mesh/plot, 3D point cloud) and multi-chart cases.

A full list of test cases carried out and their descriptions can be found below:

- **N line series M points:** Multi (line) series charts (hundreds, or even thousands of line series on a chart)
- **Brownian Motion Scatter Series:** randomised, Xy scatter charts
- **Line series unsorted in X:** randomised, Xy line charts
- **Point series, sorted, updating y-values:** lines with scatter points where X-values are sorted
- **Column Chart with data ascending in X:** Column or bar charts with static data where the chart is programmatically zoomed
- **Candlestick series test:** Candlestick charts with static data where the chart is programmatically zoomed
- **FIFO / ECG Chart Performance Test:** Realtime scrolling 'first in first out' ECG style charts with 5 series and millions of data-points
- **Mountain Chart Performance Test:** Mountain or area charts with static data where the chart is programmatically zoomed
- **Series Compression Test:** Realtime charts where data is appended to a line chart as fast as you can
- **Multi Chart Performance Test:** An increasing numbers of charts (2, 4, 8, 16 ... up to 128 charts) each with realtime line series
- **Uniform Heatmap Performance Test:** Realtime uniform heatmap updating as fast as possible with increasing number of cells
- **3D Point Cloud Performance Test:** Realtime 3D point clouds with randomised data, with increasing numbers of data-points
- **3D Surface Performance Test:** Realtime 3D surface plots with a generated sinusoidal function with increasing number of cells


## Running the Test Suite

Open this folder in terminal and run the following commands:

-   `npm install`
-   `npm start`

Then visit https://localhost:5173 in your web browser.

![Homepage showing javascript chart tests](img/homepage.png)

Start any test by clicking "RUN" in the table. It's recommended to only run one test at a time to ensure the CPU usage of each chart stress test does not interfere with another.

### Running an Individual Stress Test 

The stress test page looks like this. Several tests will be run in sequence with ever more demanding requirements (more datapoints, more series, more charts). The test will automatically stop when completed.

![Test page showing javascript chart stress test](img/testpage.png)

Each test lasts 10 seconds. Each test case may have 5-10 total test runs. Leave the test to run until completion when the results table is shown. 

> **Note:** If any stress-test drops below 2 FPS, hangs, or is errored, subsequent tests will be skipped for that chart library / test case  
>
> The max data-point limit for realtime tests is capped at 100 Million datapoints to fit inside Google Chrome memory limits.

Some stats on the Stress Test page include:

- **System information:** Current browser, GPU, WebGL renderer, Platform, CPU cores, Video RAM
- **Immediate stats:**
  - **Current FPS:** Showing the immediate "Frames per Second" (FPS) or refresh rate in Hertz
  - **Frame count:** the number of frames that have rendered since the start of the test
  - **Memory:** Immediate JavaScript memory (polled using `window.performance.memory?.usedJSHeapSize`). This may not be available on all browsers
  - **Datapoints:** the total datapoint count currently displayed (will include all datapoints for multi-chart tests)

### Viewing Test results

Once a test case has completed, the results will be displayed in a table. This table can be copy-pasted to Excel or downloaded.

![JavaScript Chart Stress Test Results page](img/resultspage.png)

This results table includes:

- The library name and version, e.g. "SciChart.js 5.0.0"
- The test case type e.g. "Brownian Motion Scatter Series"
- The number of datapoints e.g. "10,000"
- The number of series on the chart
- The number of charts (or blank for single-chart cases)
- The time to library load in milliseconds
- The time to first frame in milliseconds
- The time to append data (data update rate)
- The JS memory used as reported by `window.performance.memory?.usedJSHeapSize`
- The Min, Max and Average (mean) FPS
- The total frames rendered in the test
- Any error conditions e.g. 'OK', 'HANGING', 'ERRORED'

## Modifying the Test Suite 

### Adding a new Test Case

1. Create a test type by updating G_TEST_GROUP_NAME in `public/before.js`. For example `CANDLESTICK_PERFORMANCE_TEST`
2. Add test group record to `G_TEST_GROUPS`. For example

```javascript
const G_TEST_GROUPS = {
    ...
    5: {
        name: G_TEST_GROUP_NAME.CANDLESTICK_PERFORMANCE_TEST,
            tests: [
            {
                series: 1,
                points: 1000,
                testDuration: 5000,
            },
            ...
            ]
        }
    }
}
```
3. Create a test function for each test group in the suite. For example `eCandlestickPerformanceTest` in `scichart.js`
4. Update select test if/else statement in `public/after.js`. For example

```javascript
if (testGroupName === G_TEST_GROUP_NAME.CANDLESTICK_PERFORMANCE_TEST) {
    perfTest = eCandlestickPerformanceTest(seriesNumber, pointsNumber);
}
```

4. Update `generateCharts()` function in `public/main.js` file to add new tests to the index page.

### The order of method calls

For any performance test, for example for eLinePerformanceTest, the order of calls is as follows:

1. `createChart` creates a chart
2. `generateData` generates data
3. `appendData` appends data
4. `updateChart` updates the chart
5. `deleteChart` deletes the chart

# JavaScript Charts Performance Test Suite

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

## Running the Test Suite

Open this folder in terminal and run the following commands:

-   `npm install`
-   `npm start`

Then visit https://localhost:5173 in your web browser.

![Homepage showing javascript chart tests](img/homepage.png)

Start any test by clicking "RUN" in the table. Each test will open a new tab and run until completion. 

It's recommended to only run one test at a time to ensure the CPU usage of each chart stress test does not interfere with another.

Close the tab after test completion and refresh the homepage to see updated results. 

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

## Test Results / Performance Comparison of JavaScript Charts

with the following hardware, these test results are achieved:

> **User Agent:** Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36  
> **GPU Vendor:** Google Inc. (NVIDIA)  
> **GPU Renderer:** ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Laptop GPU (0x00002717) Direct3D11 vs_5_0 ps_5_0, D3D11)  
> **ANGLE:** Yes (ANGLE)  
> **Platform:** Win32  
> **CPU:** Intel Core i9-14900HX (2.2GHz)  
> **Hardware Concurrency:** 32 cores  
> **Video Memory:** 16 GB  

### Thousands of Line Series, Thousands of points 

In this test, Plotly.js runs but crashes the browser at high point counts, hence results were not recorded. Hanging means the chart hangs (more than 5 seconds to initialise). Skipped means subsequent tests are skipped due to either low FPS or error conditions.

SciChart comes out at as the clear winner achieving >60 FPS for 1000 line series each with 1000 points, and able to render up to 8000 series with 8000 points per series.

| Parameters               | SciChart.js (Avg FPS) | Highcharts (Avg FPS) | Chart.js (Avg FPS) | Plotly.js (Avg FPS) | Apache ECharts (Avg FPS) | uPlot (Avg FPS) |
|--------------------------|:---------------------:|:--------------------:|:------------------:|:-------------------:|:------------------------:|:---------------:|
| 100 points, 100 series   |         237.45        |         41.39        |        9.61        |          -          |           92.96          |      234.09     |
| 200 points, 200 series   |         235.88        |         21.00        |        2.64        |          -          |           40.61          |      217.22     |
| 500 points, 500 series   |         117.79        |        HANGING       |        0.43        |          -          |           9.12           |      55.72      |
| 1000 points, 1000 series |         60.86         |        SKIPPED       |       SKIPPED      |          -          |           2.51           |      17.39      |
| 2000 points, 2000 series |         27.54         |        SKIPPED       |       SKIPPED      |          -          |           0.62           |       3.95      |
| 4000 points, 4000 series |          9.97         |        SKIPPED       |       SKIPPED      |          -          |          SKIPPED         |       1.16      |
| 8000 points, 8000 series |          2.76         |        SKIPPED       |       SKIPPED      |          -          |          SKIPPED         |     SKIPPED     |

### Randomised Scatter Series Performance Test Results

In these tests, uPlot does not support unsorted scatter data, so data must be sorted first. Several charts either hit error states "Hanging" 

In this test, SciChart comes out as the clear winner, able to render 1,000,000 points at 53.77 FPS (almost 60 FPS) and able to render a total of 10,000,000 points. Other charts hang or are skipped due to low FPS at lower data-point counts.

| Parameters                | SciChart.js (Avg FPS) | Highcharts (Avg FPS) | Chart.js (Avg FPS) | Plotly.js (Avg FPS) | Apache ECharts (Avg FPS) | uPlot (Avg FPS) |
|---------------------------|:---------------------:|:--------------------:|:------------------:|:-------------------:|:------------------------:|:---------------:|
| 1000 points, 1 series     |         238.08        |         71.09        |        83.80       |        150.39       |          226.96          |      232.47     |
| 10000 points, 1 series    |         238.81        |         50.77        |        10.11       |        137.14       |           85.49          |      13.09      |
| 50000 points, 1 series    |         239.04        |         19.45        |        2.03        |        85.39        |          HANGING         |     HANGING     |
| 100000 points, 1 series   |         238.36        |         12.80        |        0.99        |        28.18        |          SKIPPED         |     SKIPPED     |
| 200000 points, 1 series   |         200.26        |         10.03        |       SKIPPED      |        14.70        |          SKIPPED         |     SKIPPED     |
| 500000 points, 1 series   |         88.64         |         6.76         |       SKIPPED      |         5.73        |          SKIPPED         |     SKIPPED     |
| 1000000 points, 1 series  |         53.77         |         4.20         |       SKIPPED      |         2.65        |          SKIPPED         |     SKIPPED     |
| 5000000 points, 1 series  |          9.90         |         1.18         |       SKIPPED      |         0.40        |          SKIPPED         |     SKIPPED     |
| 10000000 points, 1 series |          3.95         |        SKIPPED       |       SKIPPED      |       SKIPPED       |          SKIPPED         |     SKIPPED     |

### Randomlised XY Line Series (unsorted data) performance test results

The randomised Xy Line series test case is similar to the scatter plot test, except that it renders polylines with unsorted Xy data. In this test uPlot which does not support unsorted data, must have data sorted before drawing. 

SciChart comes out at the clear winner able to render 1,000,000 points at 54.64 FPS and a total of 10,000,000 points

| Parameters                | SciChart.js (Avg FPS) | Highcharts (Avg FPS) | Chart.js (Avg FPS) | Plotly.js (Avg FPS) | Apache ECharts (Avg FPS) | uPlot (Avg FPS) |
|---------------------------|:---------------------:|:--------------------:|:------------------:|:-------------------:|:------------------------:|:---------------:|
| 1000 points, 1 series     |         237.79        |         67.01        |        80.61       |        145.34       |          233.57          |      234.50     |
| 10000 points, 1 series    |         238.23        |         52.89        |        9.87        |        127.88       |          104.84          |      237.70     |
| 50000 points, 1 series    |         237.94        |         25.95        |        1.99        |        69.58        |           20.57          |      200.33     |
| 100000 points, 1 series   |         236.58        |         16.71        |       SKIPPED      |        23.41        |           10.58          |      111.13     |
| 200000 points, 1 series   |         190.20        |         12.15        |       SKIPPED      |        11.76        |           4.78           |      58.55      |
| 500000 points, 1 series   |         86.14         |         7.36         |       SKIPPED      |         4.46        |           1.64           |      25.09      |
| 1000000 points, 1 series  |         53.64         |         4.22         |       SKIPPED      |         2.07        |          SKIPPED         |      11.53      |
| 5000000 points, 1 series  |          8.23         |         1.13         |       SKIPPED      |         0.37        |          SKIPPED         |       2.06      |
| 10000000 points, 1 series |          2.61         |        SKIPPED       |       SKIPPED      |       SKIPPED       |          SKIPPED         |       1.03      |

### Column series static data test results

In Static Column charts, SciChart excels, able to draw 10,000,000 columns or bars at 240 FPS. The reason is the data here is not updating, this just measures static drawing of a large dataset. 

HighCharts, Plotly.js, Apache e-Charts performed well up to 10,000 bars, 1,000 bars and 100,000 bars respectively. Chart.js, Plotly and eCharts had severeal skipped tests with none of them able to render 200,000 or more columns without either error or very slow FPS (<2 FPS)

| Parameters                | SciChart.js (Avg FPS) | Highcharts (Avg FPS) | Chart.js (Avg FPS) | Plotly.js (Avg FPS) | Apache ECharts (Avg FPS) | uPlot (Avg FPS) |
|---------------------------|:---------------------:|:--------------------:|:------------------:|:-------------------:|:------------------------:|:---------------:|
| 1000 points, 1 series     |         237.03        |         77.26        |       141.62       |        74.56        |          219.17          |      232.88     |
| 10000 points, 1 series    |         238.34        |         73.58        |        21.25       |         9.88        |          144.56          |      159.47     |
| 50000 points, 1 series    |         238.40        |         21.59        |        3.70        |         1.78        |          106.53          |      36.52      |
| 100000 points, 1 series   |         237.88        |         12.32        |        1.72        |       SKIPPED       |           78.72          |      19.07      |
| 200000 points, 1 series   |         238.01        |         9.39         |       SKIPPED      |       SKIPPED       |     ERROR_APPEND_DATA    |       7.64      |
| 500000 points, 1 series   |         238.71        |         6.20         |       SKIPPED      |       SKIPPED       |          SKIPPED         |       2.89      |
| 1000000 points, 1 series  |         237.44        |         3.35         |       SKIPPED      |       SKIPPED       |          SKIPPED         |       1.25      |
| 5000000 points, 1 series  |         237.95        |         0.76         |       SKIPPED      |       SKIPPED       |          SKIPPED         |     SKIPPED     |
| 10000000 points, 1 series |         237.06        |        SKIPPED       |       SKIPPED      |       SKIPPED       |          SKIPPED         |     SKIPPED     |

### Candlestick chart static data test results

In static candlestick charts, SciChart excels, able to draw 10,000,000 candles at ~240 FPS. Candlesticks are complex geometry including a box with an outline, and high/low wick. As a result several chart libraries fail to handle large volumes of candles at reasonable levels of performance.

For example, plotly.js could not render 10,000 candles without the frame-rate dropping to 3.77FPS. e-Charts was able to render 100,000 candles at 30.77 FPS but quickly dropped thereafter. HighCharts also struggled with more than 1,000 candles, with a refresh rate of only 0.60 FPS at 10,000 candles.

Another artefact noted in this test: Chart.js performance results show `requestAnimationFrame` able to tick at 56 FPS for 1,000 candles (but dropping to 1 FPS for 50,000) but in actual fact, the viewable refresh rate seemed to be much lower. We suspect the visual refresh rate may be decoupled from browser refreshes.

| Parameters                | SciChart.js (Avg FPS) | Highcharts (Avg FPS) | Chart.js (Avg FPS) | Plotly.js (Avg FPS) | Apache ECharts (Avg FPS) | uPlot (Avg FPS) |
|---------------------------|:---------------------:|:--------------------:|:------------------:|:-------------------:|:------------------------:|:---------------:|
| 1000 points, 1 series     |         235.86        |         18.76        |        56.69       |        33.71        |          234.25          |      233.94     |
| 10000 points, 1 series    |         236.13        |         0.60         |        7.09        |         3.77        |          172.47          |      68.07      |
| 50000 points, 1 series    |         237.00        |        SKIPPED       |        1.06        |         0.57        |           56.82          |      14.28      |
| 100000 points, 1 series   |         237.21        |        SKIPPED       |       SKIPPED      |       SKIPPED       |           30.77          |       7.08      |
| 200000 points, 1 series   |         235.62        |        SKIPPED       |       SKIPPED      |       SKIPPED       |           15.60          |       2.99      |
| 500000 points, 1 series   |         237.24        |        SKIPPED       |       SKIPPED      |       SKIPPED       |           6.84           |       0.99      |
| 1000000 points, 1 series  |         236.81        |        SKIPPED       |       SKIPPED      |       SKIPPED       |           3.87           |     SKIPPED     |
| 5000000 points, 1 series  |         236.36        |        SKIPPED       |       SKIPPED      |       SKIPPED       |           0.68           |     SKIPPED     |
| 10000000 points, 1 series |         233.93        |        SKIPPED       |       SKIPPED      |       SKIPPED       |          SKIPPED         |     SKIPPED     |

### FIFO / ECG Streaming Line Chart Performance Test Results

For a highly dynamic dataset, with 5 line series each with 'first in first out' streaming, the type of chart used in real-time telemetry monitoring or ECG monitoring, the libraries performed as follows.

SciChart was the clear winner, able to render 5x series streaming with 1,000,000 points each at 83 FPS, and a total data update rate of over 10,000,000 data-points per second ingested. The most demanding scenario tested was 10,000,000 datapoints x 5 series which SciChart could handle at 19.16 FPS.

Other chart libraries would struggle to perform, some struggling beyond 5x series of 10,000 datapoints and several hanging or skipped tests due to low FPS beyond 100,000 datapoints x 5 series.

| Parameters                | SciChart.js (Avg FPS) | Highcharts (Avg FPS) | Chart.js (Avg FPS) | Plotly.js (Avg FPS) | Apache ECharts (Avg FPS) | uPlot (Avg FPS) |
|---------------------------|:---------------------:|:--------------------:|:------------------:|:-------------------:|:------------------------:|:---------------:|
| 100 points, 5 series      |         238.10        |         71.22        |       119.52       |        116.89       |          233.26          |      231.11     |
| 10000 points, 5 series    |         238.18        |         18.98        |        18.09       |        69.91        |           26.38          |      239.33     |
| 100000 points, 5 series   |         238.07        |         3.87         |       HANGING      |         6.52        |           2.21           |      111.16     |
| 1000000 points, 5 series  |         83.23         |         0.66         |       SKIPPED      |         0.56        |          HANGING         |      13.38      |
| 5000000 points, 5 series  |         29.40         |        SKIPPED       |       SKIPPED      |       SKIPPED       |          SKIPPED         |       2.70      |
| 10000000 points, 5 series |         19.16         |        SKIPPED       |       SKIPPED      |       SKIPPED       |          SKIPPED         |       1.41      |

### Multi chart performance test results

Single chart, single series tests reveal raw throughput of charts, but can chart libraries scale with number of charts on screen?

In this test, SciChart excels being able to render 128 WebGL charts on screen, each with up to 1,000,000 points (starting at 10k points) at 15 FPS. 32 charts could be rendered at 45.84 FPS and 16 charts at 67.97 FPS.

Most chart libraries strugged with this test, with notably Plotly.js unable to render more than 8 WebGL charts on screen at once before WebGL context loss issues. Chart.js struggled to render just 4 charts at 1.6 FPS, and eCharts, while able to render 64 charts, was only outputting 1.57 FPS with this number of graphs on screen.

| Parameters                         | SciChart.js (Avg FPS) | Highcharts (Avg FPS) | Chart.js (Avg FPS) | Plotly.js (Avg FPS) | Apache ECharts (Avg FPS) | uPlot (Avg FPS) |
|------------------------------------|:---------------------:|:--------------------:|:------------------:|:-------------------:|:------------------------:|:---------------:|
| 10000 points, 1 series, 1 charts   |         237.17        |         11.11        |        4.43        |        35.68        |           20.72          |      151.91     |
| 10000 points, 1 series, 2 charts   |         220.27        |         6.32         |        2.71        |        26.29        |           14.46          |      87.91      |
| 10000 points, 1 series, 4 charts   |         154.43        |         3.30         |        1.60        |        19.58        |           9.79           |      46.12      |
| 10000 points, 1 series, 8 charts   |         108.81        |         1.57         |       SKIPPED      |        13.75        |           6.41           |      23.74      |
| 10000 points, 1 series, 16 charts  |         67.97         |        SKIPPED       |       SKIPPED      |         1.06        |           4.38           |      12.09      |
| 10000 points, 1 series, 32 charts  |         45.84         |        SKIPPED       |       SKIPPED      |       SKIPPED       |           2.67           |       6.12      |
| 10000 points, 1 series, 64 charts  |         26.05         |        SKIPPED       |       SKIPPED      |       SKIPPED       |           1.57           |       3.06      |
| 10000 points, 1 series, 128 charts |         15.12         |        SKIPPED       |       SKIPPED      |       SKIPPED       |          SKIPPED         |       1.13      |

### Uniform Heatmap Chart Performance test results

In this test, a 2D uniform heatmap with a color map is updated with real-time data. SciChart excelled being able to render a 1000x1000 heatmap at 42.44 FPS. HighCharts, while supporting a heatmap struggled to render 200x200 heatmaps at 5.83 FPS vs. SciChart's 215.76 FPS. Plotly.js was able to render 200x200 heatmaps at 82.64 FPS but dropped to 5.16 FPS at 1000x1000 cells, vs. SciChart's 42.44 FPS. Apache eCharts was only able to render a 200x200 heatmap at 5.89 FPS. Only SciChart.js was able to render higher volume heatmaps such as 2000x2000, 4000x4000 or 8000x8000. 

Note: Chart.js does not support a heatmap and uPlot, we couldn't get this to work.

| Parameters             | SciChart.js (Avg FPS) | Highcharts (Avg FPS) | Chart.js (Avg FPS) | Plotly.js (Avg FPS) | Apache ECharts (Avg FPS) | uPlot (Avg FPS) |
|------------------------|:---------------------:|:--------------------:|:------------------:|:-------------------:|:------------------------:|:---------------:|
| 100 points, 1 series   |         227.63        |         19.77        |     Unsupported    |        145.67       |           21.77          |   Unsupported   |
| 200 points, 1 series   |         215.76        |         5.83         |          -         |        82.64        |           5.89           |        -        |
| 500 points, 1 series   |         130.37        |         1.00         |          -         |        19.16        |           0.88           |        -        |
| 1000 points, 1 series  |         42.44         |        SKIPPED       |          -         |         5.16        |          SKIPPED         |        -        |
| 2000 points, 1 series  |          8.42         |        SKIPPED       |          -         |         1.26        |          SKIPPED         |        -        |
| 4000 points, 1 series  |          2.04         |        SKIPPED       |          -         |       SKIPPED       |          SKIPPED         |        -        |
| 8000 points, 1 series  |          0.34         |        SKIPPED       |          -         |       SKIPPED       |          SKIPPED         |        -        |
| 16000 points, 1 series |        SKIPPED        |        SKIPPED       |          -         |       SKIPPED       |          SKIPPED         |        -        |

### 3D Point Cloud Chart Performance Test Results

3D Charts are also tested, only Plotly.js, Apache eCharts and SciChart.js support 3D point clouds, so HighCharts, Chart.js and uPlot were excluded from these tests.

For rendering 3D point clouds, SciChart.js excels, able to render 100,000 point point-clouds at 135 FPS, or 1,000,000 point point-clouds at 17.25 FPS. Plotly.js could manage 1.44 FPS for 100k points and eCharts was able to manage 9.69 FPS at 100k points. Both libraries were under <2 FPS for 1,000,000 point point clouds and further test results were skipped.

| Parameters               | SciChart.js (Avg FPS) |     Highcharts (Avg FPS)      |     Chart.js (Avg FPS)      | Plotly.js (Avg FPS) | Apache ECharts (Avg FPS) |      uPlot (Avg FPS)      |
|--------------------------|:---------------------:|:-----------------------------:|:---------------------------:|:-------------------:|:------------------------:|:-------------------------:|
| 100 points, 1 series     |         233.18        |          Unsupported          |         Unsupported         |        89.37        |          233.46          |        Unsupported        |
| 1000 points, 1 series    |         235.04        |               -               |              -              |        52.25        |          233.57          |             -             |
| 10000 points, 1 series   |         234.63        |               -               |              -              |        13.38        |           87.76          |             -             |
| 100000 points, 1 series  |         135.12        |               -               |              -              |         1.44        |           9.69           |             -             |
| 1000000 points, 1 series |         17.25         |               -               |              -              |       SKIPPED       |           1.30           |             -             |
| 2000000 points, 1 series |          8.35         |               -               |              -              |       SKIPPED       |          SKIPPED         |             -             |
| 4000000 points, 1 series |          4.15         |               -               |              -              |       SKIPPED       |          SKIPPED         |             -             |

### 3D Surface Mesh Performance Test Results

For 3D surface meshes, SciChart.js excels, being able to render a 500x500 mesh at 92.15 FPS and 1000x1000 mesh at 26.51 FPS. Plotly.js was able to render 500x500 at 5.47 FPS and 1000x1000 at 1.43 FPS. eCharts was able to render 500x500 at 2.47 FPS and 1000x1000 at 0.53 FPS. 

Only SciChart.js could render larger data volumes, such as 2000x2000 or 4000x4000 3D surface meshes, with other chart libraries skipped due to low performance.

| Parameters            | SciChart.js (Avg FPS) | Highcharts (Avg FPS) | Chart.js (Avg FPS) | Plotly.js (Avg FPS) | Apache ECharts (Avg FPS) | uPlot (Avg FPS) |
|-----------------------|:---------------------:|:--------------------:|:------------------:|:-------------------:|:------------------------:|:---------------:|
| 100 points, 1 series  |         232.78        |           -          |          -         |        27.03        |           40.24          |        -        |
| 200 points, 1 series  |         233.55        |           -          |          -         |        25.10        |           15.51          |        -        |
| 500 points, 1 series  |         92.15         |           -          |          -         |         5.47        |           2.47           |        -        |
| 1000 points, 1 series |         26.51         |           -          |          -         |         1.43        |           0.53           |        -        |
| 2000 points, 1 series |          6.25         |           -          |          -         |       SKIPPED       |          SKIPPED         |        -        |
| 4000 points, 1 series |          1.51         |           -          |          -         |       SKIPPED       |          SKIPPED         |        -        |
| 8000 points, 1 series |        SKIPPED        |           -          |          -         |       SKIPPED       |          SKIPPED         |        -        |

### Test Result Conclusions

## Suitability by Use Case

| Use Case                                     | Suitable Libraries                          | Notes                                       |
|----------------------------------------------|---------------------------------------------|---------------------------------------------|
| Small dashboards (<10k points)               | Chart.js, Highcharts, ECharts, Plotly, uPlot | All perform adequately                      |
| Large datasets (≥100k - 1M points)           | SciChart                                    | Others degrade or fail                      |
| Real-time streaming (ECG/FIFO)               | SciChart                                    | Sustained FPS under load                    |
| Many series (1000+)                          | SciChart                                    | CPU-based libraries stall                   |
| Heatmaps (1M+ cells)                         | SciChart                                    | Others skipped or unsupported               |
| 3D charts                                    | SciChart                                    | Others crash or skip                        |
| Combined dashboards with several chart types | SciChart                                    | Others have cumulative performance problems |

## Final Conclusion

JavaScript charting performance is fundamentally architecture-bound.
CPU-based and general-purpose charting libraries cannot scale to large, real-time, or multi-surface workloads.
Only GPU-accelerated, purpose-built charting engines remain usable at extreme scale.

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


## Running tests automation via Playwright

The automated test solution runs the app and opens each test case sequentially.
At the end of each test case it screenshots the page with results in the table and saves them as PDF.  
After all test cases were executed the final "Results Summary" test in suite takes a PDF snapshot of the final results table at main app page.  

**Prerequisites**
Playwright setup: `npm playwright install`

**How to run**

- `npm run test` - default runs tests in headless mode
- `npm run test:headed` - runs tests in headed mode
- *Playwright UI Mode*: run either of scripts with `-- --ui`, e.g. `npm run test:headed -- --ui`
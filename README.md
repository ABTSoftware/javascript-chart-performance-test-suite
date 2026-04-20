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
- ChartGPU
- LightningChart (LCJS)

## Important Methodology Notes & Metrics

The test suite records a number of metrics which are stored in IndexedDB. These can be run as a batch (see Playwright instructions below) and imported, or run one by one via the UI.

- FPS is measured visually and via requestAnimationFrame where applicable.
- Initialisation Time is measured as the time from start of the test to first render (time to first render, milliseconds)
- Memory is recorded via `performance.memory.usedJSHeapSize`. This is only available in the Chromium browsers
- Data ingestion rate is calculated on a per-test basis: e.g. for static tests Data Ingestion Rate = numberOfPoints / timeToFirstRender. For dynamic tests, its numberOfPointsPerFrame * FPS.
- Total frames is output as a metric

Notes: 
- Some libraries may report high rAF rates while rendering visually lags or other large delays on initialisation, e.g. Chart.js.
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

### Randomised Scatter Series Performance Test Results

SciChart.js scored the highest FPS all in 9 out of 9 test configurations. SciChart.js maintained over 237 FPS up to 200,000 points. At 50,000 points, HighCharts (20.00 FPS), Chart.js (2.08 FPS), eCharts and uPlot did not complete the test at this level, while Plotly.js (87.58 FPS), ChartGPU (107.55 FPS) and LCJS v8 (196.33 FPS) remained competitive at that scale. At 10 million points, SciChart.js recorded 5.39 FPS -- approximately 41% faster than LCJS v8 (3.81 FPS) and 7x faster than ChartGPU (0.76 FPS). At 1 million points, SciChart.js (59.33 FPS) was approximately 55% faster than LCJS v8 (38.40 FPS), 17x faster than HighCharts (3.46 FPS) and 26x faster than Plotly.js (2.31 FPS).

| Fastest | Parameters | SciChart.js (FPS) | HighCharts (FPS) | Chart.js (FPS) | Plotly.js (FPS) | eCharts (FPS) | uPlot (FPS) | ChartGPU (FPS) | LCJS v8 (FPS) |
|--------:|------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| SciChart.js | 1,000 points, 1 series | 236.99 | 71.75 | 80.78 | 147.05 | 210.21 | 196.68 | 236.22 | 224.58 |
| SciChart.js | 10,000 points, 1 series | 239.32 | 48.94 | 9.91 | 132.32 | 44.41 | 10.73 | 238.48 | 234.69 |
| SciChart.js | 50,000 points, 1 series | 239.21 | 20.00 | 2.08 | 87.58 | Hanging | Hanging | 107.55 | 196.33 |
| SciChart.js | 100,000 points, 1 series | 239.37 | 13.31 | 1.06 | 23.92 | Skipped | Skipped | 55.91 | 131.13 |
| SciChart.js | 200,000 points, 1 series | 237.52 | 10.54 | 0.50 | 10.54 | Skipped | Skipped | 27.81 | 97.84 |
| SciChart.js | 500,000 points, 1 series | 98.71 | 6.25 | Skipped | 4.54 | Skipped | Skipped | 10.17 | 67.14 |
| SciChart.js | 1,000,000 points, 1 series | 59.33 | 3.46 | Skipped | 2.31 | Skipped | Skipped | 4.55 | 38.40 |
| SciChart.js | 5,000,000 points, 1 series | 10.54 | 0.89 | Skipped | 0.37 | Skipped | Skipped | 1.06 | 7.32 |
| SciChart.js | 10,000,000 points, 1 series | 5.39 | Skipped | Skipped | Skipped | Skipped | Skipped | 0.45 | 3.81 |

### Randomised XY Line Series (unsorted data) Performance Test Results

SciChart.js scored the highest FPS in all 9 out of 9 test configurations. This test renders polylines with unsorted XY data, which is particularly demanding on rendering engines. SciChart.js maintained over 236 FPS through 50,000 points and sustained 50.31 FPS at 1 million points. At 10 million points, SciChart.js recorded 2.86 FPS -- approximately 4x faster than LCJS v8 (0.66 FPS). ChartGPU was skipped at 10M points as the previous test had a low FPS warning. At 1 million points, SciChart.js (50.31 FPS) was approximately 5x faster than LCJS v8 (9.99 FPS), 10x faster than ChartGPU (5.31 FPS) and 16x faster than HighCharts (3.18 FPS). Apache eCharts and uPlot both reported very low FPS at 50,000 points (0.21 and 0.11 respectively) and did not continue beyond 100,000 points. Chart.js did not continue beyond 50,000 points.

| Fastest | Parameters | SciChart.js (FPS) | HighCharts (FPS) | Chart.js (FPS) | Plotly.js (FPS) | eCharts (FPS) | uPlot (FPS) | ChartGPU (FPS) | LCJS v8 (FPS) |
|--------:|------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| SciChart.js | 1,000 points, 1 series | 236.96 | 55.40 | 73.57 | 133.62 | 62.36 | 52.64 | 235.18 | 224.06 |
| SciChart.js | 10,000 points, 1 series | 237.37 | 50.26 | 3.37 | 113.66 | 3.77 | 3.77 | 236.05 | 220.41 |
| SciChart.js | 50,000 points, 1 series | 236.85 | 26.39 | 0.26 | 58.66 | 0.21 | 0.11 | 109.75 | 162.51 |
| SciChart.js | 100,000 points, 1 series | 236.76 | 16.89 | Skipped | 17.46 | Skipped | Skipped | 58.77 | 87.89 |
| SciChart.js | 200,000 points, 1 series | 194.96 | 12.19 | Skipped | 8.18 | Skipped | Skipped | 28.31 | 46.91 |
| SciChart.js | 500,000 points, 1 series | 89.43 | 5.86 | Skipped | 2.92 | Skipped | Skipped | 10.98 | 19.33 |
| SciChart.js | 1,000,000 points, 1 series | 50.31 | 3.18 | Skipped | 1.30 | Skipped | Skipped | 5.31 | 9.99 |
| SciChart.js | 5,000,000 points, 1 series | 9.39 | 0.81 | Skipped | Hanging | Skipped | Skipped | 0.95 | 1.80 |
| SciChart.js | 10,000,000 points, 1 series | 2.86 | Skipped | Skipped | Skipped | Skipped | Skipped | Skipped | 0.66 |

### Sorted Point Series (Updating Y-Values) Performance Test Results

SciChart.js scored the highest FPS in 7 out of 9 test configurations, with ChartGPU taking 2 wins at the smallest data sizes (1,000 and 10,000 points). This test measures the performance of updating Y-values on a sorted point series. SciChart.js maintained over 232 FPS through 100,000 points and recorded 62.94 FPS at 1 million points. At 10 million points, SciChart.js recorded 4.82 FPS -- approximately 5x faster than both ChartGPU (0.95 FPS) and LCJS v8 (0.91 FPS). At 1 million points, SciChart.js (62.94 FPS) was approximately 5x faster than LCJS v8 (13.11 FPS), 11x faster than ChartGPU (5.54 FPS) and 18x faster than HighCharts (3.48 FPS). eCharts did not continue beyond 50,000 points, and uPlot did not complete the test at that threshold.

| Fastest | Parameters | SciChart.js (FPS) | HighCharts (FPS) | Chart.js (FPS) | Plotly.js (FPS) | eCharts (FPS) | uPlot (FPS) | ChartGPU (FPS) | LCJS v8 (FPS) |
|--------:|------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| ChartGPU | 1,000 points, 1 series | 232.98 | 74.86 | 53.40 | 151.60 | 47.02 | 57.99 | 236.13 | 227.58 |
| ChartGPU | 10,000 points, 1 series | 235.00 | 58.80 | 9.72 | 114.92 | 5.80 | 12.79 | 238.11 | 213.43 |
| SciChart.js | 50,000 points, 1 series | 235.87 | 27.16 | 1.79 | 60.23 | 0.63 | Hanging | 112.06 | 231.88 |
| SciChart.js | 100,000 points, 1 series | 234.77 | 17.59 | 0.93 | 23.65 | Skipped | Skipped | 58.57 | 150.75 |
| SciChart.js | 200,000 points, 1 series | 205.01 | 12.64 | Skipped | 11.19 | Skipped | Skipped | 29.28 | 79.47 |
| SciChart.js | 500,000 points, 1 series | 94.45 | 6.67 | Skipped | 4.24 | Skipped | Skipped | 10.91 | 27.99 |
| SciChart.js | 1,000,000 points, 1 series | 62.94 | 3.48 | Skipped | 1.95 | Skipped | Skipped | 5.54 | 13.11 |
| SciChart.js | 5,000,000 points, 1 series | 11.69 | 0.90 | Skipped | 0.37 | Skipped | Skipped | 1.11 | 2.25 |
| SciChart.js | 10,000,000 points, 1 series | 4.82 | Skipped | Skipped | Skipped | Skipped | Skipped | 0.55 | 0.91 |

### Column Series Static Data Test Results

SciChart.js scored the highest FPS in all 9 out of 9 test configurations. This test measures static rendering of column/bar charts. SciChart.js maintained approximately 235–239 FPS across all data sizes up to 10 million points, demonstrating that its column rendering performance is nearly independent of data volume. At 10 million points, SciChart.js (237.03 FPS) was approximately 316x faster than ChartGPU (0.75 FPS), the only other library that could render at that scale. LCJS v8 performed well through 200,000 points (215.90 FPS) but did not complete the test at 500,000 points. At 1 million points, SciChart.js (238.79 FPS) was approximately 23x faster than ChartGPU (10.59 FPS) and 80x faster than HighCharts (3.00 FPS). Chart.js did not continue beyond 100,000 points, Plotly.js did not continue beyond 100,000 points, and Apache eCharts encountered an error at 200,000 points and did not continue beyond that threshold.

| Fastest | Parameters | SciChart.js (FPS) | HighCharts (FPS) | Chart.js (FPS) | Plotly.js (FPS) | eCharts (FPS) | uPlot (FPS) | ChartGPU (FPS) | LCJS v8 (FPS) |
|--------:|------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| SciChart.js | 1,000 points, 1 series | 235.55 | 57.52 | 127.22 | 83.97 | 20.79 | 231.03 | 233.71 | 224.11 |
| SciChart.js | 10,000 points, 1 series | 238.56 | 60.97 | 19.80 | 9.15 | 95.29 | 166.52 | 237.92 | 234.57 |
| SciChart.js | 50,000 points, 1 series | 239.09 | 21.56 | 3.80 | 1.09 | 91.42 | 32.96 | 156.43 | 206.34 |
| SciChart.js | 100,000 points, 1 series | 239.14 | 13.77 | 1.75 | 0.31 | 34.12 | 15.52 | 91.76 | 131.22 |
| SciChart.js | 200,000 points, 1 series | 239.36 | 9.97 | Skipped | Skipped | Error | 6.57 | 47.59 | 215.90 |
| SciChart.js | 500,000 points, 1 series | 239.44 | 6.10 | - | Skipped | Skipped | 2.17 | 21.14 | Hanging |
| SciChart.js | 1,000,000 points, 1 series | 238.79 | 3.00 | - | Skipped | Skipped | 0.82 | 10.59 | Skipped |
| SciChart.js | 5,000,000 points, 1 series | 238.23 | 0.80 | - | Skipped | Skipped | Skipped | 1.83 | Skipped |
| SciChart.js | 10,000,000 points, 1 series | 237.03 | Skipped | - | Skipped | Skipped | Skipped | 0.75 | Skipped |

### Candlestick Chart Static Data Test Results

SciChart.js scored the highest FPS in 7 out of 9 test configurations, with ChartGPU taking 2 wins at the smallest data sizes (1,000 and 10,000 points). Candlesticks are complex geometry (box with outline and high/low wick), making this a demanding test for rendering engines. SciChart.js maintained over 228 FPS across all data sizes up to 10 million candles. At 10 million points, SciChart.js (228.04 FPS) was approximately 35x faster than ChartGPU (6.46 FPS), the only other library that could render at that scale. At 1 million points, SciChart.js (234.66 FPS) was approximately 4.5x faster than ChartGPU (52.32 FPS) and 21x faster than LCJS v8 (10.94 FPS). HighCharts did not complete the test at 1,000 points and did not continue thereafter. Plotly.js did not complete the test at 50,000 points, Chart.js did not continue beyond 50,000 points, and uPlot did not continue beyond 500,000 points. LCJS v8 performed well through 200,000 points (141.16 FPS) but did not complete the test at 5 million points. Apache eCharts did not complete the test at 5 million points and did not continue beyond that.

| Fastest | Parameters | SciChart.js (FPS) | HighCharts (FPS) | Chart.js (FPS) | Plotly.js (FPS) | eCharts (FPS) | uPlot (FPS) | ChartGPU (FPS) | LCJS v8 (FPS) |
|--------:|------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| ChartGPU | 1,000 points, 1 series | 236.08 | Hanging | 49.78 | 26.15 | 230.10 | 230.22 | 236.79 | 224.30 |
| ChartGPU | 10,000 points, 1 series | 236.18 | Skipped | 7.89 | 2.17 | 139.48 | 59.85 | 237.62 | 217.39 |
| SciChart.js | 50,000 points, 1 series | 234.73 | Skipped | 0.91 | Hanging | 46.46 | 13.90 | 234.22 | 193.82 |
| SciChart.js | 100,000 points, 1 series | 234.84 | Skipped | Skipped | Skipped | 28.32 | 6.63 | 215.54 | 146.85 |
| SciChart.js | 200,000 points, 1 series | 233.60 | Skipped | Skipped | Skipped | 15.97 | 2.86 | 156.95 | 141.16 |
| SciChart.js | 500,000 points, 1 series | 234.46 | Skipped | Skipped | Skipped | 7.65 | 0.89 | 89.42 | 37.64 |
| SciChart.js | 1,000,000 points, 1 series | 234.66 | Skipped | Skipped | Skipped | 3.75 | Skipped | 52.32 | 10.94 |
| SciChart.js | 5,000,000 points, 1 series | 232.69 | Skipped | Skipped | Skipped | Hanging | Skipped | 12.63 | Hanging |
| SciChart.js | 10,000,000 points, 1 series | 228.04 | Skipped | Skipped | Skipped | Skipped | Skipped | 6.46 | Skipped |

### Mountain (Area) Chart Performance Test Results

SciChart.js scored the highest FPS in 7 out of 9 test configurations, with uPlot taking 2 wins at 50,000 and 200,000 points. This test measures mountain (area) chart rendering performance. SciChart.js, LCJS v8, and uPlot all showed strong performance at moderate data sizes, with all three exceeding 230 FPS at 10,000 points. Plotly.js also performed well through 1 million points (126.19 FPS) but did not complete the test at 5 million points. At 10 million points, SciChart.js (236.00 FPS) was approximately 7% faster than LCJS v8 (220.89 FPS) and 15x faster than uPlot (16.21 FPS). Chart.js did not continue beyond 50,000 points, and Apache eCharts did not continue beyond 1 million points.

| Fastest | Parameters | SciChart.js (FPS) | HighCharts (FPS) | Chart.js (FPS) | Plotly.js (FPS) | eCharts (FPS) | uPlot (FPS) | ChartGPU (FPS) | LCJS v8 (FPS) |
|--------:|------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| SciChart.js | 1,000 points, 1 series | 238.31 | 206.32 | 44.02 | 226.12 | 197.73 | 231.06 | 235.70 | 219.77 |
| SciChart.js | 10,000 points, 1 series | 239.28 | 63.32 | 5.30 | 222.98 | 94.54 | 239.18 | 237.26 | 226.17 |
| uPlot | 50,000 points, 1 series | 238.79 | 19.17 | 1.04 | 217.65 | 30.40 | 239.22 | 138.85 | 236.25 |
| SciChart.js | 100,000 points, 1 series | 237.53 | 12.20 | 0.51 | 199.57 | 15.65 | 235.97 | 74.18 | 232.25 |
| uPlot | 200,000 points, 1 series | 236.18 | 8.37 | Skipped | 172.56 | 6.97 | 236.41 | 43.81 | 232.68 |
| SciChart.js | 500,000 points, 1 series | 239.53 | 4.34 | Skipped | 175.57 | 2.26 | 189.43 | 18.66 | 234.72 |
| SciChart.js | 1,000,000 points, 1 series | 239.39 | 2.56 | Skipped | 126.19 | 0.86 | 119.94 | 9.85 | 233.35 |
| SciChart.js | 5,000,000 points, 1 series | 237.01 | 0.50 | Skipped | Hanging | Skipped | 30.50 | 1.53 | 228.01 |
| SciChart.js | 10,000,000 points, 1 series | 236.00 | Skipped | Skipped | Skipped | Skipped | 16.21 | 0.74 | 220.89 |

### FIFO / ECG Streaming Line Chart Performance Test Results

This test measures first-in-first-out streaming with 5 line series, the type of chart used in real-time telemetry or ECG monitoring. LCJS v8 scored the highest FPS in 3 out of 6 test configurations (at 1 million, 5 million and 10 million points), SciChart.js scored fastest in 2 configurations (10,000 and 100,000 points), and ChartGPU took 1 win at the smallest data size (100 points).

At 10 million points, LCJS v8 (31.50 FPS) was approximately 62% faster than SciChart.js (19.40 FPS). Both libraries significantly outperformed the field at this scale: uPlot recorded 1.25 FPS while all other libraries did not continue. At 100,000 points, SciChart.js (236.14 FPS) and LCJS v8 (235.78 FPS) were nearly identical, both well ahead of uPlot (97.92 FPS) and ChartGPU (29.08 FPS). Chart.js did not complete the test at 100,000 points, HighCharts and Apache eCharts did not complete the test at 1 million points, and ChartGPU encountered an error at 5 million points.

| Fastest | Parameters | SciChart.js (FPS) | HighCharts (FPS) | Chart.js (FPS) | Plotly.js (FPS) | eCharts (FPS) | uPlot (FPS) | ChartGPU (FPS) | LCJS v8 (FPS) |
|--------:|------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| SciChart.js | 100 points, 5 series | 235.13 | 67.17 | 102.14 | 106.29 | 212.86 | 230.72 | 211.79 | 222.02 |
| SciChart.js | 10,000 points, 5 series | 235.69 | 18.82 | 17.35 | 62.77 | 17.08 | 184.10 | 142.91 | 234.71 |
| SciChart.js | 100,000 points, 5 series | 236.14 | 3.92 | Hanging | 5.75 | 1.62 | 97.92 | 29.08 | 235.78 |
| LCJS v8 | 1,000,000 points, 5 series | 79.21 | Hanging | Skipped | 0.61 | Hanging | 12.15 | 3.36 | 81.35 |
| LCJS v8 | 5,000,000 points, 5 series | 29.09 | Skipped | Skipped | Skipped | Skipped | 2.56 | Hanging | 31.53 |
| LCJS v8 | 10,000,000 points, 5 series | 19.40 | Skipped | Skipped | Skipped | Skipped | 1.25 | Skipped | 31.50 |

### Series Compression (Data Aggregation) Performance Test Results

This test evaluates how libraries perform when data is incrementally appended and the chart must compress/aggregate the visible series. LCJS v8 scored the highest FPS in 2 out of 5 test configurations (100,000 and 1 million points), while SciChart.js took 2 wins at 1,000 and 10,000 points. At 10 million points, SciChart.js (21.84 FPS) narrowly edged LCJS v8 (20.91 FPS), with uPlot (6.18 FPS) and HighCharts (0.38 FPS) also completing the test. ChartGPU encountered an error at 10 million points and Plotly.js did not complete the test at that scale.

At 1 million points, LCJS v8 (155.83 FPS) was approximately 2.2x faster than SciChart.js (69.38 FPS), 6x faster than uPlot (27.32 FPS) and 13.4x faster than ChartGPU (11.57 FPS). Chart.js did not continue beyond 1 million points, and Apache eCharts did not continue beyond 1 million points.

| Fastest | Parameters | SciChart.js (FPS) | HighCharts (FPS) | Chart.js (FPS) | Plotly.js (FPS) | eCharts (FPS) | uPlot (FPS) | ChartGPU (FPS) | LCJS v8 (FPS) |
|--------:|------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| SciChart.js | 1,000 points, 1 series | 238.16 | 85.75 | 23.18 | 114.65 | 86.79 | 231.82 | 233.43 | 228.12 |
| SciChart.js | 10,000 points, 1 series | 239.14 | 35.63 | 7.19 | 46.00 | 26.88 | 218.36 | 121.85 | 237.86 |
| LCJS v8 | 100,000 points, 1 series | 173.61 | 13.98 | 1.84 | 11.89 | 6.17 | 87.83 | 46.54 | 226.50 |
| LCJS v8 | 1,000,000 points, 1 series | 69.38 | 3.13 | 0.35 | 2.34 | 0.63 | 27.32 | 11.57 | 155.83 |
| SciChart.js | 10,000,000 points, 1 series | 21.84 | 0.38 | Skipped | Hanging | Skipped | 6.18 | 1.97 | 20.91 |

### Multi Chart Performance Test Results

This test measures how libraries scale with multiple charts on screen simultaneously, showing a mixture of real-time and static data in line, column, mountain, and scatter series, each with 100,000 data points. SciChart.js scored the highest FPS in 6 out of 8 test configurations, with LCJS v8 taking 2 wins at 1 and 2 charts.

At 32 charts, SciChart.js (26.78 FPS) was approximately 8x faster than ChartGPU (3.29 FPS) and 56x faster than HighCharts (0.48 FPS). LCJS v8 did not complete the test at 32 charts. SciChart.js was the only library able to render 64 and 128 charts, recording 12.46 FPS and 7.90 FPS respectively. Apache eCharts and uPlot did not complete the test at 2 charts, Chart.js did not continue beyond 2 charts, and Plotly.js did not continue beyond 4 charts.

| Fastest | Parameters | SciChart.js (FPS) | HighCharts (FPS) | Chart.js (FPS) | Plotly.js (FPS) | eCharts (FPS) | uPlot (FPS) | ChartGPU (FPS) | LCJS v8 (FPS) |
|--------:|------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| LCJS v8 | 100,000 points, 1 series, 1 chart | 155.75 | 13.53 | 1.84 | 11.04 | 4.85 | 79.31 | 50.16 | 220.39 |
| LCJS v8 | 100,000 points, 1 series, 2 charts | 124.67 | 7.57 | 0.77 | 8.41 | Hanging | Hanging | 36.25 | 166.78 |
| SciChart.js | 100,000 points, 1 series, 4 charts | 103.76 | 3.30 | Skipped | 0.54 | Skipped | Skipped | 23.95 | 71.55 |
| SciChart.js | 100,000 points, 1 series, 8 charts | 71.09 | 1.74 | Skipped | Skipped | Skipped | Skipped | 13.07 | 31.45 |
| SciChart.js | 100,000 points, 1 series, 16 charts | 42.75 | 1.08 | Skipped | Skipped | Skipped | Skipped | 6.60 | 10.60 |
| SciChart.js | 100,000 points, 1 series, 32 charts | 26.78 | 0.48 | Skipped | Skipped | Skipped | Skipped | 3.29 | Hanging |
| SciChart.js | 100,000 points, 1 series, 64 charts | 12.46 | Skipped | Skipped | Skipped | Skipped | Skipped | Skipped | Skipped |
| SciChart.js | 100,000 points, 1 series, 128 charts | 7.90 | Skipped | Skipped | Skipped | Skipped | Skipped | - | Skipped |

### Thousands of Line Series, Thousands of Points

This test measures how libraries handle increasing numbers of series, each with a correspondingly increasing number of points. Plotly.js scored the highest FPS in 4 out of 7 test configurations (200–2,000 series), LCJS v8 took 1 win (4,000 series), and SciChart.js took 2 wins (100 and 8,000 series).

Plotly.js and LCJS v8 showed strong mid-range performance but both did not complete the test at higher series counts. At 4,000 series x 4,000 points, LCJS v8 (15.49 FPS) was approximately 60% faster than SciChart.js (9.67 FPS) — the only two libraries able to render at that scale. However, SciChart.js was the only library able to render 8,000 series x 8,000 points (2.19 FPS). HighCharts did not complete the test at 200 series, Chart.js did not continue beyond 1,000 series, and Apache eCharts did not complete the test at 2,000 series. ChartGPU did not complete the test at 4,000 series.

| Fastest | Parameters | SciChart.js (FPS) | HighCharts (FPS) | Chart.js (FPS) | Plotly.js (FPS) | eCharts (FPS) | uPlot (FPS) | ChartGPU (FPS) | LCJS v8 (FPS) |
|--------:|------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| SciChart.js | 100 points, 100 series | 235.30 | 41.76 | 10.48 | 225.46 | 82.97 | 183.49 | 185.95 | 224.70 |
| Plotly.js | 200 points, 200 series | 235.92 | Hanging | 2.77 | 238.77 | 36.69 | 43.16 | 81.16 | 231.64 |
| Plotly.js | 500 points, 500 series | 129.03 | Skipped | 0.47 | 148.25 | 7.86 | 6.10 | 34.09 | 134.99 |
| Plotly.js | 1,000 points, 1,000 series | 63.71 | Skipped | Skipped | 94.28 | 1.88 | 1.52 | 13.43 | 78.70 |
| Plotly.js | 2,000 points, 2,000 series | 27.43 | Skipped | Skipped | 49.14 | Hanging | 0.29 | 3.86 | 39.65 |
| LCJS v8 | 4,000 points, 4,000 series | 9.67 | Skipped | Skipped | Hanging | Skipped | Skipped | Hanging | 15.49 |
| SciChart.js | 8,000 points, 8,000 series | 2.19 | Skipped | Skipped | Skipped | Skipped | Skipped | Skipped | Hanging |

### Uniform Heatmap Chart Performance Test Results

This test updates a 2D uniform heatmap with a colour map in real time. Chart.js, uPlot, and ChartGPU do not support heatmaps and were excluded. SciChart.js scored the highest FPS in 5 out of 7 test configurations (the 16,000 grid test was not completed by any library), with LCJS v8 taking 2 wins at the largest renderable sizes (4,000 and 8,000 grid points).

SciChart.js maintained over 235 FPS for small heatmaps (100–200 grid size) and recorded 39.97 FPS at 1,000 grid size. At 8,000 grid points, LCJS v8 (0.64 FPS) was approximately 33% faster than SciChart.js (0.48 FPS). Plotly.js did not complete the test at 4,000 grid points, and HighCharts and Apache eCharts did not continue beyond 200 grid points. At 16,000 grid points, no library was able to complete the test.

| Fastest | Parameters | SciChart.js (FPS) | HighCharts (FPS) | Plotly.js (FPS) | eCharts (FPS) | LCJS v8 (FPS) |
|--------:|------------|:---:|:---:|:---:|:---:|:---:|
| SciChart.js | 100 points, 1 series | 235.67 | 16.39 | 122.39 | 19.24 | 228.79 |
| SciChart.js | 200 points, 1 series | 235.76 | 4.85 | 72.34 | 5.18 | 231.02 |
| SciChart.js | 500 points, 1 series | 143.55 | 0.82 | 17.40 | 0.67 | 93.16 |
| SciChart.js | 1,000 points, 1 series | 39.97 | Skipped | 4.75 | Skipped | 27.75 |
| SciChart.js | 2,000 points, 1 series | 9.48 | Skipped | 1.16 | Skipped | 6.87 |
| LCJS v8 | 4,000 points, 1 series | 2.32 | Skipped | Hanging | Skipped | 2.94 |
| LCJS v8 | 8,000 points, 1 series | 0.48 | Skipped | Skipped | Skipped | 0.64 |
| - | 16,000 points, 1 series | Skipped | Skipped | Skipped | Skipped | Skipped |

### 3D Point Cloud Chart Performance Test Results

Only SciChart.js, Plotly.js, Apache eCharts, and LCJS v8 support 3D point clouds; HighCharts, Chart.js, ChartGPU, and uPlot were excluded. SciChart.js scored the highest FPS in 4 out of 7 test configurations, Apache eCharts took 2 wins at the smallest sizes (100 and 1,000 points), and LCJS v8 took 1 win at 10,000 points.

At 4 million points, SciChart.js (3.51 FPS) was approximately 2x faster than LCJS v8 (1.76 FPS) — the only two libraries able to render at that scale. At 100,000 points, SciChart.js (121.34 FPS) was approximately 48% faster than LCJS v8 (81.76 FPS) and 14x faster than Apache eCharts (8.60 FPS). Plotly.js encountered an error at 1 million points and did not continue beyond that. Apache eCharts did not continue beyond 2 million points.

| Fastest | Parameters | SciChart.js (FPS) | Plotly.js (FPS) | eCharts (FPS) | LCJS v8 (FPS) |
|--------:|------------|:---:|:---:|:---:|:---:|
| eCharts | 100 points, 1 series | 228.32 | 83.98 | 229.36 | 225.67 |
| eCharts | 1,000 points, 1 series | 230.18 | 51.24 | 239.69 | 236.47 |
| LCJS v8 | 10,000 points, 1 series | 229.52 | 12.59 | 82.37 | 236.65 |
| SciChart.js | 100,000 points, 1 series | 121.34 | 1.41 | 8.60 | 81.76 |
| SciChart.js | 1,000,000 points, 1 series | 15.09 | Error | 1.25 | 7.28 |
| SciChart.js | 2,000,000 points, 1 series | 7.52 | Skipped | 0.67 | 3.84 |
| SciChart.js | 4,000,000 points, 1 series | 3.51 | Skipped | Skipped | 1.76 |

### 3D Surface Mesh Performance Test Results

Only SciChart.js, Plotly.js, Apache eCharts, and LCJS v8 support 3D surface meshes; HighCharts, Chart.js, ChartGPU, and uPlot were excluded. SciChart.js scored the highest FPS in 5 out of 6 completable test configurations, with LCJS v8 taking 1 win at 4,000 grid points. At 8,000 grid points, neither SciChart.js nor LCJS v8 completed the test.

At 500 grid size, SciChart.js (95.62 FPS) was approximately 44% faster than LCJS v8 (66.45 FPS). At 4,000 grid points, LCJS v8 (1.76 FPS) was approximately 38% faster than SciChart.js (1.28 FPS). Plotly.js did not complete the test at 2,000 grid points, and Apache eCharts did not continue beyond 1,000 grid points.

| Fastest | Parameters | SciChart.js (FPS) | Plotly.js (FPS) | eCharts (FPS) | LCJS v8 (FPS) |
|--------:|------------|:---:|:---:|:---:|:---:|
| SciChart.js | 100 points, 1 series | 229.21 | 26.71 | 40.95 | 224.76 |
| SciChart.js | 200 points, 1 series | 231.35 | 24.41 | 15.02 | 193.44 |
| SciChart.js | 500 points, 1 series | 95.62 | 5.07 | 2.40 | 66.45 |
| SciChart.js | 1,000 points, 1 series | 27.69 | 1.34 | 0.48 | 19.06 |
| SciChart.js | 2,000 points, 1 series | 5.96 | Hanging | Skipped | 4.49 |
| LCJS v8 | 4,000 points, 1 series | 1.28 | Skipped | Skipped | 1.76 |
| - | 8,000 points, 1 series | Hanging | Skipped | Skipped | Hanging |

### Test Result Conclusions

## Aggregation of Test Scores

Based on FPS alone, across 102 test configurations spanning 13 test categories and 8 chart libraries:

- **SciChart.js** achieved the highest FPS score in 74 out of 102 test configurations (73%), with an average of 153.4 FPS, dominating 10 of 13 test categories including Line series which is unsorted in x, Column chart with data ascending in X, Brownian Motion Scatter Series and 7 more.
- **LightningChart** (LCJS v8) placed second overall with 15 wins out of 102 configurations (avg 127.9 FPS), and saw its best overall performance in the Series Compression Test.
- **ChartGPU** placed third overall with 5 wins out of 102 configurations (avg 94.0 FPS).

By running the test application, you can also view data such as data-ingestion rate, memory usage and initialisation time, plus, browse pre-recorded results on four hardware configurations (Intel, ARM, Apple and Raspberry Pi).

## Final Conclusion

JavaScript charting performance is fundamentally architecture-bound.
CPU-based and general-purpose charting libraries cannot scale to large, real-time, or multi-surface workloads.
Only GPU-accelerated, purpose-built charting engines remain usable at extreme scale.

## Running the Test Suite

Open this folder in terminal and run the following commands:

-   `npm install`
-   `npm start`

Then visit https://localhost:5173 in your web browser.

![Homepage showing javascript chart tests](img/homepage.png)

### Viewing pre-recorded results

We've included a number of pre-canned results from different hardware (Intel i9 / nVidia 4090, ARM Snapdragon) that you can view. Select these under the **Result Sets** section.

You can toggle between which metric to analyze on the homepage: FPS (Frames per second), Memory usage (MB), Initialisation Time (milliseconds), Total Frames, Data Ingestion rate (points per second)


### Running an Individual Stress Test

You can run your own tests by clicking ">" in the table header on the homepage. Each test will open a new tab and run until completion.

> **It's recommended to only run one test at a time to ensure the CPU usage of each chart stress test does not interfere with another.**
>
> **Close the tab after test completion. The homepage will automatically update with the test results.**

The stress test page looks like this. Several tests will be run in sequence with ever more demanding requirements (more datapoints, more series, more charts). The test will automatically stop when completed.

![Test page showing javascript chart stress test](img/testpage.png)

Each test lasts 3 seconds. Each test case may have 5-10 total test runs. Leave the test to run until completion when the results table is shown.

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

Once a test case has completed, the results will be persisted to IndexedDB and displayed in a table. 

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

If you close the tab and return to the homepage, the main tables will update with the test results (loaded from IndexedDB).

## Viewing Results as Charts

We've included a charts page which shows the FPS results in chart format. Click "Charts View" at the top of the page to switch to this.

![Charts page showing javascript chart test results](img/chartspage.png)

## Running tests automation via Playwright

**EXPERIMENTAL** 

The automated test solution runs the app and opens each test case sequentially.
At the end of each test case it screenshots the page with results in the table and saves them as PDF.  
After all test cases were executed the final "Results Summary" test in suite takes a PDF snapshot of the final results table at main app page.

**Prerequisites**
Playwright setup: `npx playwright install`

**How to run**

- `npm run test` - default runs tests in headless mode
- `npm run test:headed` - runs tests in headed mode
- *Playwright UI Mode*: run either of scripts with `-- --ui`, e.g. `npm run test:headed -- --ui`

Playwright outputs PDFs with results and also a JSON file that can be imported via the UI to visualise results in tables/charts.

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



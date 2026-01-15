# Performance Test Chart.js

## Size

The main lib is located here `lib/chart.js`. Only 2D chart types are supported by Chart.js and 3D chart test cases are excluded.

For candlestick charts additional modules `chartjs-chart-financial.js` and `chartjs-adapter-luxon` are included

| File                           | Size        | Size (GZipped) |
|--------------------------------|-------------|----------------|
| chart.js                       | 191KB       | 63KB           |
| chartjs-chart-financial.js     | 20KB        | 5KB            |
| chartjs-adapter-luxon@1.0.0.js | 2KB         | 1KB            |
| luxon@1.26.0.js                | 71KB        | 21KB           |
| **TOTAL**                      | **281KB**   | **90KB**       |

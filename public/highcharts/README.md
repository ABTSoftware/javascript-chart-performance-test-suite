# Performance Test Highcharts 12.4.0

## Size

The main lib is located here `lib/highchart.js` it is being used for all chart types but candlestick chart.

| File          | Size      | Size (GZipped) |
|---------------|-----------|----------------|
| highcharts.js | 293KB     | |
| heatmap.js    | 20KB      | |
| highstock.js  | 374KB     | |
| exporting.js  | 27KB      | |
| boost.js      | 44KB      | |
| **TOTAL**     | **744KB** | |

For stock charts a separate module is being used `lib/highstock.js` and `lib/exporting.js`

## Boost module

To turn on/off the boost module, which uses canvas instead of svg, use this setting in `highcharts_tests.js`

```javascript
const IS_BOOST_ENABLED = true;
```

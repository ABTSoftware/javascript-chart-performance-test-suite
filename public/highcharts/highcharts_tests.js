'use strict';

const IS_BOOST_ENABLED = true;

function eLibName() {
    return IS_BOOST_ENABLED ? 'Highcharts (with boost)' : 'Highcharts (without boost)';
}

function eLibVersion() {
    return '9.3.2';
}

function getSupportedTests() {
    return [
        "N line series M points",
        "Brownian Motion Scatter Series", 
        "Line series which is unsorted in x",
        "Point series, sorted, updating y-values",
        "Column chart with data ascending in X",
        "Candlestick series test",
        "FIFO / ECG Chart Performance Test",
        "Mountain Chart Performance Test",
        "Series Compression Test",
        "Multi Chart Performance Test",
        "Uniform Heatmap Performance Test"
    ];
}

/**
 * LINE_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eLinePerformanceTest(seriesNum, pointsNum) {
    let DATA;
    let chart;
    let delta;
    let visibleRangeMin;
    let visibleRangeMax;

    const createChart = async () => {
        if (seriesNum > 100) {
            console.warn('Highcharts append data take too much time for series > 100 so we will skip further tests');
        }
        chart = Highcharts.chart('chart-root', {
            chart: {
                animation: false,
                type: 'line',
                zoomType: 'x',
                panning: true,
                panKey: 'shift',
                events: {
                    // render: () => console.log('highcharts rendered'),
                    // redraw: () => console.log('highcharts redraw'),
                },
            },
            boost: {
                useGPUTranslations: true,
                // Chart-level boost when there are more than 5 series in the chart
                seriesThreshold: 5,
                enabled: IS_BOOST_ENABLED,
            },
            title: {
                text: null
            },
            tooltip: {
                enabled: false,
            },
            plotOptions: {
                series: {
                    animation: false,
                    states: {
                        hover: {
                            enabled: false,
                        },
                    },
                },
            },
            yAxis: {
                startOnTick: false,
                endOnTick: false,
            },
            xAxis: {
                accessibility: {
                    rangeDescription: 'X',
                },
            },
            legend: { enabled: false },
        });
    };

    const generateData = () => {
        const xyValuesArrArr = [];
        const strokeArr = [];
        for (let i = 0; i < seriesNum; i++) {
            xyValuesArrArr.push([]);

            // Generate points
            let prevYValue = 0;
            for (let j = 0; j < pointsNum; j++) {
                const curYValue = Math.random() * 10 - 5;
                xyValuesArrArr[i].push([j, prevYValue + curYValue]);
                prevYValue += curYValue;
            }
        }
        DATA = { xyValuesArrArr, strokeArr };
    };

    const appendData = () => {
        const { xyValuesArrArr } = DATA;
        for (let i = 0; i < seriesNum; i++) {
            chart.addSeries({
                name: `series_${i}`,
                data: xyValuesArrArr[i],
            });
        }
        visibleRangeMin = chart.yAxis[0].min;
        visibleRangeMax = chart.yAxis[0].max;
        const maxVal = Math.max(Math.abs(visibleRangeMin), Math.abs(visibleRangeMax));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        visibleRangeMin -= delta;
        visibleRangeMax += delta;
        chart.yAxis[0].setExtremes(visibleRangeMin, visibleRangeMax, true);
        return seriesNum * chart.series[0].data.length;
    };

    const deleteChart = () => {};

    return {
        createChart,
        generateData,
        appendData,
        updateChart,
        deleteChart,
    };
}

/**
 * SCATTER_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eScatterPerformanceTest(seriesNum, pointsNum) {
    let DATA;
    let chart;
    const X_MAX = 100;
    const Y_MAX = 50;

    const createChart = async () => {
        const EXTRA = 10;
        chart = Highcharts.chart('chart-root', {
            chart: {
                type: 'scatter',
                zoomType: 'xy',
            },
            boost: {
                enabled: IS_BOOST_ENABLED,
                useGPUTranslations: true,
                seriesThreshold: 0,
            },
            title: {
                text: null
            },
            xAxis: {
                startOnTick: false,
                endOnTick: false,
                min: -EXTRA,
                max: X_MAX + EXTRA,
            },
            yAxis: {
                title: {
                    text: 'Y',
                },
                min: -EXTRA,
                max: Y_MAX + EXTRA,
            },
            legend: {
                enabled: false,
            },
            plotOptions: {
                scatter: {
                    marker: {
                        radius: 5,
                        states: {
                            hover: {
                                enabled: false,
                                lineColor: 'rgb(100,100,100)',
                            },
                        },
                    },
                    states: {
                        hover: {
                            marker: {
                                enabled: false,
                            },
                        },
                    },
                    tooltip: {
                        headerFormat: '<b>{series.name}</b><br>',
                        pointFormat: '{point.x} cm, {point.y} kg',
                        enabled: false,
                    },
                },
            },
        });
    };

    const generateNextPoints = (pointsNum$, valuesArr) => {
        const newValuesArr = [];

        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = valuesArr ? valuesArr[i][0] : Math.round(Math.random() * X_MAX);
            const x = prevXValue + (Math.random() - 0.5);
            const prevYValue = valuesArr ? valuesArr[i][1] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newValuesArr.push([x, y]);
        }

        return newValuesArr;
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined);
    };

    const appendData = () => {
        chart.addSeries({
            name: 'series',
            data: DATA,
        });
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA);
        chart.series[0].remove();
        chart.addSeries({
            name: 'series',
            data: DATA,
        });
        return seriesNum * pointsNum;
    };

    const deleteChart = () => {};

    return {
        createChart,
        generateData,
        appendData,
        updateChart,
        deleteChart,
    };
}

/**
 * SCATTER_LINE_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eScatterLinePerformanceTest(seriesNum, pointsNum) {
    let DATA;
    let chart;
    const X_MAX = 100;
    const Y_MAX = 50;

    const createChart = async () => {
        const EXTRA = 10;
        chart = Highcharts.chart('chart-root', {
            chart: {
                type: 'line',
            },
            title: {
                text: null
            },
            boost: {
                enabled: IS_BOOST_ENABLED,
                useGPUTranslations: true,
                seriesThreshold: 0,
            },
            xAxis: {
                startOnTick: false,
                endOnTick: false,
                min: -EXTRA,
                max: X_MAX + EXTRA,
            },
            yAxis: {
                min: -EXTRA,
                max: Y_MAX + EXTRA,
            },
            legend: {
                enabled: false,
            },
            plotOptions: {
                scatter: {
                    marker: {
                        radius: 5,
                        states: {
                            hover: {
                                enabled: false,
                                lineColor: 'rgb(100,100,100)',
                            },
                        },
                    },
                    states: {
                        hover: {
                            marker: {
                                enabled: false,
                            },
                        },
                    },
                    tooltip: {
                        headerFormat: '<b>{series.name}</b><br>',
                        pointFormat: '{point.x} cm, {point.y} kg',
                        enabled: false,
                    },
                },
            },
        });
    };

    const generateNextPoints = (pointsNum$, valuesArr) => {
        const newValuesArr = [];

        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = valuesArr ? valuesArr[i][0] : Math.round(Math.random() * X_MAX);
            const x = prevXValue + (Math.random() - 0.5);
            const prevYValue = valuesArr ? valuesArr[i][1] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newValuesArr.push([x, y]);
        }

        return newValuesArr;
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined);
    };

    const appendData = () => {
        chart.addSeries({
            name: 'series',
            data: DATA,
        });
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA);
        chart.series[0].remove();
        chart.addSeries({
            name: 'series',
            data: DATA,
        });
        return chart.series[0].data.length;
    };

    const deleteChart = () => {};

    return {
        createChart,
        generateData,
        appendData,
        updateChart,
        deleteChart,
    };
}

/**
 * POINT_LINE_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function ePointLinePerformanceTest(seriesNum, pointsNum) {
    let DATA;
    let chart;
    const Y_MAX = 50;

    const createChart = async () => {
        const EXTRA = 10;
        chart = Highcharts.chart('chart-root', {
            chart: {
                type: 'line',
            },
            title: {
                text: null
            },
            boost: {
                enabled: IS_BOOST_ENABLED,
                useGPUTranslations: true,
                seriesThreshold: 0,
            },
            yAxis: {
                min: -EXTRA,
                max: Y_MAX + EXTRA,
            },
            legend: {
                enabled: false,
            },
            plotOptions: {
                line: {
                    marker: {
                        enabled: true,
                        radius: 5,
                        fillColor: 'white',
                        lineColor: 'blue',
                        lineWidth: 1,
                        states: {
                            hover: {
                                enabled: false,
                            },
                        },
                    },
                    lineWidth: 2,
                    color: 'blue',
                    states: {
                        hover: {
                            enabled: false,
                        },
                    },
                    tooltip: {
                        enabled: false,
                    },
                },
            },
        });
    };

    const generateNextPoints = (pointsNum$, valuesArr) => {
        const newValuesArr = [];

        for (let i = 0; i < pointsNum$; i++) {
            const prevYValue = valuesArr ? valuesArr[i][1] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newValuesArr.push([i, y]);
        }

        return newValuesArr;
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined);
    };

    const appendData = () => {
        chart.addSeries({
            name: 'series',
            data: DATA,
        });
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA);
        chart.series[0].remove();
        chart.addSeries({
            name: 'series',
            data: DATA,
        });
        return chart.series[0].data.length;
    };

    const deleteChart = () => {};

    return {
        createChart,
        generateData,
        appendData,
        updateChart,
        deleteChart,
    };
}

/**
 * COLUMN_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eColumnPerformanceTest(seriesNum, pointsNum) {
    let DATA;
    let chart;
    let delta;
    let visibleRangeMin;
    let visibleRangeMax;

    const createChart = async () => {
        chart = Highcharts.chart('chart-root', {
            chart: {
                animation: false,
                type: 'column',
            },
            boost: {
                useGPUTranslations: true,
                // Chart-level boost when there are more than 5 series in the chart
                seriesThreshold: 5,
                enabled: IS_BOOST_ENABLED,
            },
            title: {
                text: null
            },
            tooltip: {
                enabled: false,
            },
            plotOptions: {
                series: {
                    animation: false,
                    states: {
                        hover: {
                            enabled: false,
                        },
                    },
                },
            },
            yAxis: {
                startOnTick: false,
                endOnTick: false,
            },
            xAxis: {
                accessibility: {
                    rangeDescription: 'X',
                },
            },
            legend: { enabled: false },
        });
    };

    const generateData = () => {
        const xyValuesArrArr = [];
        const strokeArr = [];
        for (let i = 0; i < seriesNum; i++) {
            xyValuesArrArr.push([]);

            // Generate points
            let prevYValue = 0;
            for (let j = 0; j < pointsNum; j++) {
                const curYValue = Math.random() * 10 - 5;
                xyValuesArrArr[i].push([j, prevYValue + curYValue]);
                prevYValue += curYValue;
            }
        }
        DATA = { xyValuesArrArr, strokeArr };
    };

    const appendData = () => {
        const { xyValuesArrArr } = DATA;
        for (let i = 0; i < seriesNum; i++) {
            chart.addSeries({
                name: `series_${i}`,
                data: xyValuesArrArr[i],
            });
        }
        visibleRangeMin = chart.yAxis[0].min;
        visibleRangeMax = chart.yAxis[0].max;
        const maxVal = Math.max(Math.abs(visibleRangeMin), Math.abs(visibleRangeMax));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        visibleRangeMin -= delta;
        visibleRangeMax += delta;
        chart.yAxis[0].setExtremes(visibleRangeMin, visibleRangeMax, true);
        return seriesNum * chart.series[0].data.length;
    };

    const deleteChart = () => {};

    return {
        createChart,
        generateData,
        appendData,
        updateChart,
        deleteChart,
    };
}

/**
 * CANDLESTICK_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eCandlestickPerformanceTest(seriesNum, pointsNum) {
    let DATA;
    let chart;
    let delta;
    let visibleRangeMin;
    let visibleRangeMax;

    const createChart = async () => {
        chart = Highcharts.chart('chart-root', {
            boost: {
                useGPUTranslations: true,
                // Chart-level boost when there are more than 5 series in the chart
                seriesThreshold: 5,
                enabled: IS_BOOST_ENABLED,
            },
            title: {
                text: null
            },
            tooltip: {
                enabled: false,
            },
            plotOptions: {
                series: {
                    animation: false,
                    states: {
                        hover: {
                            enabled: false,
                        },
                    },
                },
            },
            yAxis: {
                startOnTick: false,
                endOnTick: false,
            },
            xAxis: {
                accessibility: {
                    rangeDescription: 'X',
                },
            },
            legend: { enabled: false },
        });
    };

    const generateData = () => {
        const xohlcValuesArr = [];

        for (let i = 0; i < pointsNum; i++) {
            const open = Math.random();
            const close = Math.random();
            const val1 = Math.random();
            const val2 = Math.random();
            const high = Math.max(val1, val2, open, close);
            const low = Math.min(val1, val2, open, close);
            xohlcValuesArr.push([i, open, high, low, close]);
        }

        DATA = xohlcValuesArr;
    };

    const appendData = () => {
        chart.addSeries({
            type: 'candlestick',
            name: 'OHLC series',
            data: DATA,
        });
        visibleRangeMin = chart.yAxis[0].min;
        visibleRangeMax = chart.yAxis[0].max;
        const maxVal = Math.max(Math.abs(visibleRangeMin), Math.abs(visibleRangeMax));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        visibleRangeMin -= delta;
        visibleRangeMax += delta;
        chart.yAxis[0].setExtremes(visibleRangeMin, visibleRangeMax, true);
        return seriesNum * chart.series[0].data.length;
    };

    const deleteChart = () => {};

    return {
        createChart,
        generateData,
        appendData,
        updateChart,
        deleteChart,
    };
}

/**
 * FIFO_ECG_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @param incrementPoints
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eFifoEcgPerformanceTest(seriesNum, pointsNum, incrementPoints) {
    let DATA;
    let chart;
    let size = 0;

    const createChart = async () => {
        // if (pointsNum > 10000) {
        //     console.warn('Highcharts is too slow for points > 10000');
        //     return false;
        // }
        chart = Highcharts.chart('chart-root', {
            chart: {
                animation: false,
                type: 'line',
            },
            boost: {
                useGPUTranslations: true,
                seriesThreshold: 1,
                enabled: IS_BOOST_ENABLED,
            },
            title: {
                text: null
            },
            tooltip: {
                enabled: false,
            },
            plotOptions: {
                series: {
                    animation: false,
                    states: {
                        hover: {
                            enabled: false,
                        },
                    },
                },
            },
            yAxis: {
                startOnTick: false,
                endOnTick: false,
            },
            xAxis: {
                startOnTick: false,
                endOnTick: false,
            },
            legend: { enabled: false },
        });
    };

    const generateDataInner = (seriesNum$, pointsNum$, startIndex = 0) => {
        const xyArrArr = [];
        for (let i = 0; i < seriesNum$; i++) {
            const yOffset = i * 2;
            const xyArr = [];
            for (let j = 0; j < pointsNum$; j++) {
                const x = startIndex + j;
                const y = Math.random() + yOffset;
                xyArr.push([x,y])
            }
            xyArrArr.push(xyArr);
        }
        // if (startIndex === 0) {
        //     console.log(xyArrArr);
        // }
        return xyArrArr;
    };

    const generateData = () => {
        DATA = generateDataInner(seriesNum, pointsNum);
    };

    const appendData = () => {
        const xyArrArr = DATA;
        for (let i = 0; i < seriesNum; i++) {
            chart.addSeries({
                name: `series_${i}`,
                data: xyArrArr[i],
            });
        }
        chart.yAxis[0].setExtremes(0, 9, true);
        size += pointsNum;
    };

    const updateChart = (_frame) => {
        const xyArrArr = generateDataInner(seriesNum, incrementPoints, size)
        chart.series.forEach((s, index) => {
            const xyArr = xyArrArr[index];
            xyArr.forEach(xy => s.addPoint(xy, false));
        })
        size += incrementPoints;
        chart.xAxis[0].setExtremes(size - pointsNum, size, true);
        // chart.redraw();
        return seriesNum * size;
    };

    const deleteChart = () => {};

    return {
        createChart,
        generateData,
        appendData,
        updateChart,
        deleteChart,
    };
}

/**
 * MOUNTAIN_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eMountainPerformanceTest(seriesNum, pointsNum) {
    let DATA;
    let chart;
    let delta;
    let visibleRangeMin;
    let visibleRangeMax;

    const createChart = async () => {
        chart = Highcharts.chart('chart-root', {
            chart: {
                animation: false,
                type: 'area',
            },
            boost: {
                useGPUTranslations: true,
                // Chart-level boost when there are more than 5 series in the chart
                seriesThreshold: 5,
                enabled: IS_BOOST_ENABLED,
            },
            title: {
                text: null
            },
            tooltip: {
                enabled: false,
            },
            plotOptions: {
                series: {
                    animation: false,
                    states: {
                        hover: {
                            enabled: false,
                        },
                    },
                },
            },
            yAxis: {
                startOnTick: false,
                endOnTick: false,
            },
            xAxis: {
                accessibility: {
                    rangeDescription: 'X',
                },
            },
            legend: { enabled: false },
        });
    };

    const generateData = () => {
        const xyValuesArrArr = [];
        const strokeArr = [];
        for (let i = 0; i < seriesNum; i++) {
            xyValuesArrArr.push([]);

            // Generate points
            let prevYValue = 0;
            for (let j = 0; j < pointsNum; j++) {
                const curYValue = Math.random() * 10 - 5;
                xyValuesArrArr[i].push([j, prevYValue + curYValue]);
                prevYValue += curYValue;
            }
        }
        DATA = { xyValuesArrArr, strokeArr };
    };

    const appendData = () => {
        const { xyValuesArrArr } = DATA;
        for (let i = 0; i < seriesNum; i++) {
            chart.addSeries({
                name: `series_${i}`,
                data: xyValuesArrArr[i],
            });
        }
        visibleRangeMin = chart.yAxis[0].min;
        visibleRangeMax = chart.yAxis[0].max;
        const maxVal = Math.max(Math.abs(visibleRangeMin), Math.abs(visibleRangeMax));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        visibleRangeMin -= delta;
        visibleRangeMax += delta;
        chart.yAxis[0].setExtremes(visibleRangeMin, visibleRangeMax, true);
        return seriesNum * chart.series[0].data.length;
    };

    const deleteChart = () => {};

    return {
        createChart,
        generateData,
        appendData,
        updateChart,
        deleteChart,
    };
}

/**
 * SERIES_COMPRESSION_PERFORMANCE_TEST
 * @param _seriesNum
 * @param pointsNum
 * @param incrementPoints
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eSeriesCompressionPerformanceTest(_seriesNum, pointsNum, incrementPoints) {
    let DATA;
    let chart;
    let size = 0;
    let prevYValue = 0;

    const createChart = async () => {
        // if (pointsNum > 10000) {
        //     console.warn('Highcharts is too slow for points > 10000');
        //     return false;
        // }
        chart = Highcharts.chart('chart-root', {
            chart: {
                animation: false,
                type: 'line',
            },
            boost: {
                useGPUTranslations: true,
                seriesThreshold: 1,
                enabled: IS_BOOST_ENABLED,
            },
            title: {
                text: null
            },
            tooltip: {
                enabled: false,
            },
            plotOptions: {
                series: {
                    animation: false,
                    states: {
                        hover: {
                            enabled: false,
                        },
                    },
                },
            },
            yAxis: {
                startOnTick: false,
                endOnTick: false,
            },
            xAxis: {
                accessibility: {
                    rangeDescription: 'X',
                },
            },
            legend: { enabled: false },
        });
    };

    const generateDataInner = (pointsNum$, startIndex = 0) => {
        const xyArr = [];
        for (let i = 0; i < pointsNum$; i++) {
            const curYValue = Math.random() * 10 - 5;
            prevYValue += curYValue;
            xyArr.push([startIndex + i, prevYValue])
        }
        return xyArr;
    };

    const generateData = () => {
        DATA = generateDataInner(pointsNum);
    };

    const appendData = () => {
        const xyArr = DATA;
        chart.addSeries({
            name: "series",
            data: xyArr,
        });
        size += pointsNum;
    };

    const updateChart = (_frame) => {
        const xyArr = generateDataInner(incrementPoints, size);
        const series = chart.series[0];
        xyArr.forEach(xy => series.addPoint(xy, false));
        size += incrementPoints;
        chart.redraw();
        return series.data.length;
    };

    const deleteChart = () => {};

    return {
        createChart,
        generateData,
        appendData,
        updateChart,
        deleteChart,
    };
}

/**
 * MULTI_CHART_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @param incrementPoints
 * @param chartsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eMultiChartPerformanceTest(seriesNum, pointsNum, incrementPoints, chartsNum) {
    let charts = [];
    let DATA;
    let prevYValue = 0;
    const appendCount = incrementPoints;
    const chartRootDiv = document.getElementById('chart-root');

    // Calculate grid dimensions based on number of charts
    const getGridDimensions = (numCharts) => {
        if (numCharts === 1) return { cols: 1, rows: 1 };
        if (numCharts === 2) return { cols: 2, rows: 1 };
        if (numCharts === 4) return { cols: 2, rows: 2 };
        if (numCharts === 8) return { cols: 4, rows: 2 };
        if (numCharts === 16) return { cols: 4, rows: 4 };
        if (numCharts === 32) return { cols: 8, rows: 4 };
        if (numCharts === 64) return { cols: 8, rows: 8 };
        if (numCharts === 128) return { cols: 16, rows: 8 };
        // Fallback for other numbers
        const cols = Math.ceil(Math.sqrt(numCharts));
        const rows = Math.ceil(numCharts / cols);
        return { cols, rows };
    };

    const createChart = async () => {
        // Initialise random seed for fair comparison
        fastRandomSeed = 1;

        // Clear the chart root
        chartRootDiv.innerHTML = '';

        // Get grid dimensions
        const { cols, rows } = getGridDimensions(chartsNum);
        const chartWidth = 100 / cols;
        const chartHeight = 100 / rows;

        // Create container divs for each chart in grid layout
        for (let c = 0; c < chartsNum; c++) {
            const chartDiv = document.createElement('div');
            chartDiv.id = `chart-${c}`;
            chartDiv.style.width = `${chartWidth}%`;
            chartDiv.style.height = `${chartHeight}%`;
            chartDiv.style.position = 'absolute';
            chartDiv.style.left = `${(c % cols) * chartWidth}%`;
            chartDiv.style.top = `${Math.floor(c / cols) * chartHeight}%`;
            chartRootDiv.appendChild(chartDiv);
        }

        // Set chart root to use absolute positioning
        chartRootDiv.style.position = 'relative';

        // Create each chart
        try {
            for (let c = 0; c < chartsNum; c++) {
                const chart = Highcharts.chart(`chart-${c}`, {
                    chart: {
                        animation: false,
                        type: 'line',
                    },
                    boost: {
                        useGPUTranslations: true,
                        seriesThreshold: 1,
                        enabled: IS_BOOST_ENABLED,
                    },
                    title: {
                        text: null
                    },
                    tooltip: {
                        enabled: false,
                    },
                    plotOptions: {
                        series: {
                            animation: false,
                            states: {
                                hover: {
                                    enabled: false,
                                },
                            },
                        },
                    },
                    yAxis: {
                        startOnTick: false,
                        endOnTick: false,
                    },
                    xAxis: {
                        accessibility: {
                            rangeDescription: 'X',
                        },
                    },
                    legend: { enabled: false },
                });
                charts.push(chart);
            }
        } catch (error) {
            console.error('Failed to create charts:', error);
            charts = [];
            return false;
        }
    };

    const generateDataInner = (pointsNum$, startIndex) => {
        const xyArr = [];

        for (let i = 0; i < pointsNum$; i++) {
            const curYValue = fastRandom() * 10 - 5;
            prevYValue += curYValue;
            xyArr.push([startIndex + i, prevYValue]);
        }
        return xyArr;
    };

    const generateData = () => {
        DATA = generateDataInner(pointsNum, 0);
    };

    const appendData = () => {
        const xyArr = DATA;
        
        // Add data to each chart
        for (let c = 0; c < chartsNum; c++) {
            charts[c].addSeries({
                name: "series",
                data: xyArr,
            });
        }
    };

    const updateChart = (_frame) => {
        const xyArr = generateDataInner(appendCount, charts[0].series[0].data.length);
        
        // Update all charts with the same data
        for (let c = 0; c < chartsNum; c++) {
            const series = charts[c].series[0];
            xyArr.forEach(xy => series.addPoint(xy, false));
            charts[c].redraw();
        }
        
        return seriesNum * charts[0].series[0].data.length * chartsNum;
    };

    const deleteChart = () => {
        charts = [];
    };

    return {
        createChart,
        generateData,
        appendData,
        updateChart,
        deleteChart,
    };
}

/**
 * HEATMAP_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eHeatmapPerformanceTest(seriesNum, pointsNum) {
    let chart;
    let DATA;
    const heatmapSize = pointsNum; // pointsNum represents the side length of the heatmap (e.g., 100 = 100x100)

    const createChart = async () => {
        chart = Highcharts.chart('chart-root', {
            chart: {
                type: 'heatmap',
                animation: false,
            },
            title: {
                text: null
            },
            xAxis: {
                categories: Array.from({ length: heatmapSize }, (_, i) => i.toString()),
            },
            yAxis: {
                categories: Array.from({ length: heatmapSize }, (_, i) => i.toString()),
                title: null,
            },
            colorAxis: {
                min: 0,
                max: 1,
            },
            legend: {
                enabled: false,
            },
            tooltip: {
                enabled: false,
            },
            boost: {
                useGPUTranslations: true
            },
            plotOptions: {
                heatmap: {
                    animation: false,
                },
            },
        });
    };

    const generateData = () => {
        const heatmapData = [];
        for (let y = 0; y < heatmapSize; y++) {
            for (let x = 0; x < heatmapSize; x++) {
                heatmapData.push([x, y, Math.random()]);
            }
        }
        DATA = heatmapData;
    };

    const appendData = () => {
        chart.addSeries({
            name: 'Heatmap Data',
            data: DATA,
            dataLabels: {
                enabled: false,
            },
        });
    };

    const updateChart = (_frame) => {
        // Generate new random heatmap data
        // const newHeatmapData = [];
        let i = 0;
        for (let y = 0; y < heatmapSize; y++) {
            for (let x = 0; x < heatmapSize; x++, i++) {
                DATA[i] = [x, y, Math.random()];
            }
        }
        
        // Remove old series and add new one
        chart.series[0].update({ data: DATA});
        
        return heatmapSize * heatmapSize;
    };

    const deleteChart = () => {};

    return {
        createChart,
        generateData,
        appendData,
        updateChart,
        deleteChart,
    };
}

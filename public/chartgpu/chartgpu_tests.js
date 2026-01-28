'use strict';

// Helper to ensure ChartGPU is loaded
async function waitForChartGPU() {
    if (typeof window.ChartGPU !== 'undefined') {
        return;
    }
    return new Promise((resolve) => {
        window.addEventListener('chartgpu-loaded', resolve, { once: true });
    });
}

function eLibName() {
    return 'ChartGPU';
}

function eLibVersion() {
    return '0.1.6';
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
        // Note: ChartGPU does not yet support 3D or heatmap
    ];
}

/**
 * LINE_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eLinePerformanceTest(seriesNum, pointsNum) {
    let chart;
    let DATA;
    let delta;
    let yMin = -300;
    let yMax = 300;
    let storedSeries;

    const createChart = async () => {
        await waitForChartGPU();
        const container = document.getElementById('chart-root');

        const series = [];
        for (let i = 0; i < seriesNum; i++) {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            const color = `rgb(${r}, ${g}, ${b})`;

            series.push({
                type: 'line',
                name: `Series ${i}`,
                data: [],
                color: color,
                lineStyle: { width: 2, opacity: 1 },
                sampling: 'none'
            });
        }

        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', min: 0, max: pointsNum, name: 'X' },
            yAxis: { type: 'value', min: yMin, max: yMax, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: series
        };

        chart = await ChartGPU.create(container, options);
    };

    const generateData = () => {
        const seriesDataArrays = [];

        for (let i = 0; i < seriesNum; i++) {
            const seriesData = [];
            let prevYValue = 0;
            for (let j = 0; j < pointsNum; j++) {
                const curYValue = Math.random() * 10 - 5;
                prevYValue += curYValue;
                seriesData.push([j, prevYValue]);
            }
            seriesDataArrays.push(seriesData);
        }

        DATA = { seriesDataArrays };
    };

    const appendData = () => {
        const { seriesDataArrays } = DATA;

        const series = [];
        for (let i = 0; i < seriesNum; i++) {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            const color = `rgb(${r}, ${g}, ${b})`;

            series.push({
                type: 'line',
                name: `Series ${i}`,
                data: seriesDataArrays[i],
                color: color,
                lineStyle: { width: 2, opacity: 1 },
                sampling: 'none'
            });
        }

        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', min: 0, max: pointsNum, name: 'X' },
            yAxis: { type: 'value', min: yMin, max: yMax, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: series
        };

        chart.setOption(options);
        storedSeries = series;

        const maxVal = Math.max(Math.abs(yMin), Math.abs(yMax));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        yMin -= delta;
        yMax += delta;

        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', min: 0, max: pointsNum, name: 'X' },
            yAxis: { type: 'value', min: yMin, max: yMax, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: storedSeries
        };
        chart.setOption(options);

        return seriesNum * pointsNum;
    };

    const deleteChart = () => {
        chart?.dispose();
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
 * SCATTER_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eScatterPerformanceTest(seriesNum, pointsNum) {
    let chart;
    let DATA;
    const X_MAX = 100;
    const Y_MAX = 50;
    const EXTRA = 10;

    const createChart = async () => {
        await waitForChartGPU();
        const EXTRA = 10;
        const container = document.getElementById('chart-root');

        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', min: -EXTRA, max: X_MAX + EXTRA, name: 'X' },
            yAxis: { type: 'value', min: -EXTRA, max: Y_MAX + EXTRA, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'scatter',
                name: 'Scatter',
                data: [],
                color: '#00FF00',
                symbolSize: 5,
                sampling: 'none'
            }]
        };

        chart = await ChartGPU.create(container, options);
    };

    const generateNextPoints = (pointsNum$, prevData) => {
        const newData = [];

        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = prevData ? prevData[i][0] : Math.round(Math.random() * X_MAX);
            const x = prevXValue + (Math.random() - 0.5);
            const prevYValue = prevData ? prevData[i][1] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newData.push([x, y]);
        }

        return newData;
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined);
    };

    const appendData = () => {
        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', min: -EXTRA, max: X_MAX + EXTRA, name: 'X' },
            yAxis: { type: 'value', min: -EXTRA, max: Y_MAX + EXTRA, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'scatter',
                name: 'Scatter',
                data: DATA,
                color: '#00FF00',
                symbolSize: 5,
                sampling: 'none'
            }]
        };
        chart.setOption(options);
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA);
        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', min: -EXTRA, max: X_MAX + EXTRA, name: 'X' },
            yAxis: { type: 'value', min: -EXTRA, max: Y_MAX + EXTRA, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'scatter',
                name: 'Scatter',
                data: DATA,
                color: '#00FF00',
                symbolSize: 5,
                sampling: 'none'
            }]
        };
        chart.setOption(options);
        return pointsNum;
    };

    const deleteChart = () => {
        chart?.dispose();
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
 * SCATTER_LINE_PERFORMANCE_TEST (unsorted in x)
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eScatterLinePerformanceTest(seriesNum, pointsNum) {
    let chart;
    let DATA;
    const X_MAX = 100;
    const Y_MAX = 50;
    const EXTRA = 10;

    const createChart = async () => {
        await waitForChartGPU();
        const EXTRA = 10;
        const container = document.getElementById('chart-root');

        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', min: -EXTRA, max: X_MAX + EXTRA, name: 'X' },
            yAxis: { type: 'value', min: -EXTRA, max: Y_MAX + EXTRA, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'line',
                name: 'Line',
                data: [],
                color: '#00FF00',
                lineStyle: { width: 2, opacity: 1 },
                sampling: 'none'
            }]
        };

        chart = await ChartGPU.create(container, options);
    };

    const generateNextPoints = (pointsNum$, prevData) => {
        const newData = [];

        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = prevData ? prevData[i][0] : Math.round(Math.random() * X_MAX);
            const x = prevXValue + (Math.random() - 0.5);
            const prevYValue = prevData ? prevData[i][1] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newData.push([x, y]);
        }

        return newData;
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined);
    };

    const appendData = () => {
        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', min: -EXTRA, max: X_MAX + EXTRA, name: 'X' },
            yAxis: { type: 'value', min: -EXTRA, max: Y_MAX + EXTRA, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'line',
                name: 'Line',
                data: DATA,
                color: '#00FF00',
                lineStyle: { width: 2, opacity: 1 },
                sampling: 'none'
            }]
        };
        chart.setOption(options);
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA);
        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', min: -EXTRA, max: X_MAX + EXTRA, name: 'X' },
            yAxis: { type: 'value', min: -EXTRA, max: Y_MAX + EXTRA, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'line',
                name: 'Line',
                data: DATA,
                color: '#00FF00',
                lineStyle: { width: 2, opacity: 1 },
                sampling: 'none'
            }]
        };
        chart.setOption(options);
        return pointsNum;
    };

    const deleteChart = () => {
        chart?.dispose();
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
 * POINT_LINE_PERFORMANCE_TEST (sorted, updating y-values)
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function ePointLinePerformanceTest(seriesNum, pointsNum) {
    let chart;
    let DATA;
    const Y_MAX = 50;
    const EXTRA = 10;

    const createChart = async () => {
        await waitForChartGPU();
        const EXTRA = 10;
        const container = document.getElementById('chart-root');

        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', min: -EXTRA, max: Y_MAX + EXTRA, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'scatter',
                name: 'Points',
                data: [],
                color: '#00FF00',
                symbolSize: 10
            }]
        };

        chart = await ChartGPU.create(container, options);
    };

    const generateNextPoints = (pointsNum$, prevData) => {
        const newData = [];

        for (let i = 0; i < pointsNum$; i++) {
            const x = i;
            const prevYValue = prevData ? prevData[i][1] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newData.push([x, y]);
        }

        return newData;
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined);
    };

    const appendData = () => {
        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', min: -EXTRA, max: Y_MAX + EXTRA, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'scatter',
                name: 'Points',
                data: DATA,
                color: '#00FF00',
                symbolSize: 10
            }]
        };
        chart.setOption(options);
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA);
        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', min: -EXTRA, max: Y_MAX + EXTRA, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'scatter',
                name: 'Points',
                data: DATA,
                color: '#00FF00',
                symbolSize: 10
            }]
        };
        chart.setOption(options);
        return pointsNum;
    };

    const deleteChart = () => {
        chart?.dispose();
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
 * COLUMN_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eColumnPerformanceTest(seriesNum, pointsNum) {
    let chart;
    let DATA;
    let delta;
    let yMin;
    let yMax;

    const createChart = async () => {
        await waitForChartGPU();
        const container = document.getElementById('chart-root');

        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'bar',
                name: 'Column',
                data: [],
                color: '#4a9eff',
                sampling: 'none'
            }]
        };

        chart = await ChartGPU.create(container, options);
    };

    const generateData = () => {
        const data = [];
        let prevYValue = 0;
        for (let i = 0; i < pointsNum; i++) {
            const curYValue = Math.random() * 10 - 5;
            prevYValue += curYValue;
            data.push([i, prevYValue]);
        }

        DATA = { data };
    };

    const appendData = () => {
        const { data } = DATA;
        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'bar',
                name: 'Column',
                data: data,
                color: '#4a9eff',
                sampling: 'none'
            }]
        };
        chart.setOption(options);

        // Get y-axis range
        const allYValues = data.map(d => d[1]);
        yMin = Math.min(...allYValues);
        yMax = Math.max(...allYValues);
        const maxVal = Math.max(Math.abs(yMin), Math.abs(yMax));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        yMin -= delta;
        yMax += delta;

        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', min: yMin, max: yMax, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'bar',
                name: 'Column',
                data: DATA.data,
                color: '#4a9eff',
                sampling: 'none'
            }]
        };
        chart.setOption(options);

        return pointsNum;
    };

    const deleteChart = () => {
        chart?.dispose();
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
 * CANDLESTICK_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eCandlestickPerformanceTest(seriesNum, pointsNum) {
    let chart;
    let DATA;
    let delta;
    let yMax;

    const createChart = async () => {
        await waitForChartGPU();
        const container = document.getElementById('chart-root');

        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'candlestick',
                name: 'Candlestick',
                data: [],
                style: 'classic',
                itemStyle: {
                    upColor: '#26a69a',
                    downColor: '#ef5350',
                    upBorderColor: '#26a69a',
                    downBorderColor: '#ef5350',
                    borderWidth: 1
                }
            }]
        };

        chart = await ChartGPU.create(container, options);
    };

    const generateData = () => {
        const data = [];

        for (let i = 0; i < pointsNum; i++) {
            const open = Math.random();
            const close = Math.random();
            const val1 = Math.random();
            const val2 = Math.random();
            const high = Math.max(val1, val2, open, close);
            const low = Math.min(val1, val2, open, close);
            // Format: [timestamp/x, open, close, low, high]
            data.push([i, open, close, low, high]);
        }

        DATA = { data };
    };

    const appendData = () => {
        const { data } = DATA;
        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'candlestick',
                name: 'Candlestick',
                data: data,
                style: 'classic',
                itemStyle: {
                    upColor: '#26a69a',
                    downColor: '#ef5350',
                    upBorderColor: '#26a69a',
                    downBorderColor: '#ef5350',
                    borderWidth: 1
                }
            }]
        };
        chart.setOption(options);

        // Get max y value for delta calculation
        const allYValues = data.flatMap(d => [d[1], d[2], d[3], d[4]]);
        yMax = Math.max(...allYValues);
        delta = yMax / 300;
    };

    const updateChart = (_frame) => {
        yMax += delta;

        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', min: 0, max: yMax, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'candlestick',
                name: 'Candlestick',
                data: DATA.data,
                style: 'classic',
                itemStyle: {
                    upColor: '#26a69a',
                    downColor: '#ef5350',
                    upBorderColor: '#26a69a',
                    downBorderColor: '#ef5350',
                    borderWidth: 1
                }
            }]
        };
        chart.setOption(options);

        return pointsNum;
    };

    const deleteChart = () => {
        chart?.dispose();
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
 * FIFO_ECG_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @param incrementPoints
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eFifoEcgPerformanceTest(seriesNum, pointsNum, incrementPoints) {
    let chart;
    let DATA;
    let nextX = pointsNum;
    const appendCount = incrementPoints;

    const createChart = async () => {
        await waitForChartGPU();
        const container = document.getElementById('chart-root');

        const series = [];
        for (let i = 0; i < seriesNum; i++) {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            const color = `rgb(${r}, ${g}, ${b})`;

            series.push({
                type: 'line',
                name: `Series ${i}`,
                data: [],
                color: color,
                lineStyle: { width: 2, opacity: 1 },
                sampling: 'lttb',
                samplingThreshold: 2500
            });
        }

        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', min: 0, max: 9, name: 'Y' },
            tooltip: { show: false },
            autoScroll: true,
            animation: false,
            series: series
        };

        chart = await ChartGPU.create(container, options);
    };

    const generateDataInner = (seriesNum$, pointsNum$, startIndex) => {
        const seriesDataArrays = [];

        for (let i = 0; i < seriesNum$; i++) {
            const seriesData = [];
            const yOffset = i * 2;
            for (let j = 0; j < pointsNum$; j++) {
                const x = startIndex + j;
                const val = Math.random() + yOffset;
                seriesData.push([x, val]);
            }
            seriesDataArrays.push(seriesData);
        }

        return seriesDataArrays;
    };

    const generateData = () => {
        DATA = generateDataInner(seriesNum, pointsNum, 0);
    };

    const appendData = () => {
        const series = [];
        for (let i = 0; i < seriesNum; i++) {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            const color = `rgb(${r}, ${g}, ${b})`;

            series.push({
                type: 'line',
                name: `Series ${i}`,
                data: DATA[i],
                color: color,
                lineStyle: { width: 2, opacity: 1 },
                sampling: 'lttb',
                samplingThreshold: 2500
            });
        }

        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', min: 0, max: 9, name: 'Y' },
            tooltip: { show: false },
            autoScroll: true,
            animation: false,
            series: series
        };

        chart.setOption(options);
    };

    const updateChart = (_frame) => {
        const newData = generateDataInner(seriesNum, appendCount, nextX);
        nextX += appendCount;

        // Append new data to each series
        for (let i = 0; i < seriesNum; i++) {
            chart.appendData(i, newData[i]);
        }

        // Keep buffer size reasonable (sliding window)
        const totalPoints = DATA[0].length + appendCount;
        if (totalPoints > pointsNum * 2) {
            // Reset with sliding window
            for (let i = 0; i < seriesNum; i++) {
                DATA[i] = DATA[i].slice(-pointsNum).concat(newData[i]);
            }

            const series = [];
            for (let i = 0; i < seriesNum; i++) {
                const r = Math.floor(Math.random() * 256);
                const g = Math.floor(Math.random() * 256);
                const b = Math.floor(Math.random() * 256);
                const color = `rgb(${r}, ${g}, ${b})`;

                series.push({
                    type: 'line',
                    name: `Series ${i}`,
                    data: DATA[i],
                    color: color,
                    lineStyle: { width: 2, opacity: 1 },
                    sampling: 'lttb',
                    samplingThreshold: 2500
                });
            }

            chart.setOption({
                grid: { left: 70, right: 24, top: 24, bottom: 44 },
                xAxis: { type: 'value', name: 'X' },
                yAxis: { type: 'value', min: 0, max: 9, name: 'Y' },
                tooltip: { show: false },
                autoScroll: true,
                animation: false,
                series: series
            });
        } else {
            for (let i = 0; i < seriesNum; i++) {
                DATA[i] = DATA[i].concat(newData[i]);
            }
        }

        return seriesNum * nextX;
    };

    const deleteChart = () => {
        chart?.dispose();
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
 * MOUNTAIN_PERFORMANCE_TEST (Area chart)
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eMountainPerformanceTest(seriesNum, pointsNum) {
    let chart;
    let DATA;
    let delta;
    let yMin;
    let yMax;

    const createChart = async () => {
        await waitForChartGPU();
        const container = document.getElementById('chart-root');

        // ChartGPU uses line with areaStyle for mountain/area charts
        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'line',
                name: 'Mountain',
                data: [],
                color: '#4a9eff',
                lineStyle: { width: 2, opacity: 1 },
                areaStyle: { opacity: 0.3 }, // This makes it a mountain/area chart
                sampling: 'none'
            }]
        };

        chart = await ChartGPU.create(container, options);
    };

    const generateData = () => {
        const data = [];
        let prevYValue = 0;
        for (let i = 0; i < pointsNum; i++) {
            const curYValue = Math.random() * 10 - 5;
            prevYValue += curYValue;
            data.push([i, prevYValue]);
        }

        DATA = { data };
    };

    const appendData = () => {
        const { data } = DATA;
        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'line',
                name: 'Mountain',
                data: data,
                color: '#4a9eff',
                lineStyle: { width: 2, opacity: 1 },
                areaStyle: { opacity: 0.3 },
                sampling: 'none'
            }]
        };
        chart.setOption(options);

        // Get y-axis range
        const allYValues = data.map(d => d[1]);
        yMin = Math.min(...allYValues);
        yMax = Math.max(...allYValues);
        const maxVal = Math.max(Math.abs(yMin), Math.abs(yMax));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        yMin -= delta;
        yMax += delta;

        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', min: yMin, max: yMax, name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'line',
                name: 'Mountain',
                data: DATA.data,
                color: '#4a9eff',
                lineStyle: { width: 2, opacity: 1 },
                areaStyle: { opacity: 0.3 },
                sampling: 'none'
            }]
        };
        chart.setOption(options);

        return pointsNum;
    };

    const deleteChart = () => {
        chart?.dispose();
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
 * SERIES_COMPRESSION_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @param incrementPoints
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eSeriesCompressionPerformanceTest(seriesNum, pointsNum, incrementPoints) {
    let chart;
    let DATA;
    let prevYValue = 0;
    const appendCount = incrementPoints;

    const createChart = async () => {
        await waitForChartGPU();
        // Initialize random seed for fair comparison
        fastRandomSeed = 1;

        const container = document.getElementById('chart-root');

        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'line',
                name: 'Compression',
                data: [],
                color: '#00FF00',
                lineStyle: { width: 2, opacity: 1 },
                sampling: 'lttb',
                samplingThreshold: 5000
            }]
        };

        chart = await ChartGPU.create(container, options);
    };

    const generateDataInner = (pointsNum$, startIndex) => {
        const data = [];

        for (let i = 0; i < pointsNum$; i++) {
            const curYValue = fastRandom() * 10 - 5;
            const x = startIndex + i;
            prevYValue += curYValue;
            data.push([x, prevYValue]);
        }

        return data;
    };

    const generateData = () => {
        DATA = generateDataInner(pointsNum, 0);
    };

    const appendData = () => {
        const options = {
            grid: { left: 70, right: 24, top: 24, bottom: 44 },
            xAxis: { type: 'value', name: 'X' },
            yAxis: { type: 'value', name: 'Y' },
            tooltip: { show: false },
            animation: false,
            series: [{
                type: 'line',
                name: 'Compression',
                data: DATA,
                color: '#00FF00',
                lineStyle: { width: 2, opacity: 1 },
                sampling: 'lttb',
                samplingThreshold: 5000
            }]
        };
        chart.setOption(options);
    };

    const updateChart = (_frame) => {
        const newData = generateDataInner(appendCount, DATA.length);

        // Append new data
        chart.appendData(0, newData);
        DATA = DATA.concat(newData);

        return DATA.length;
    };

    const deleteChart = () => {
        chart?.dispose();
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
    let showLabels;

    // Calculate grid dimensions
    const getGridDimensions = (numCharts) => {
        if (numCharts === 1) return { cols: 1, rows: 1 };
        if (numCharts === 2) return { cols: 2, rows: 1 };
        if (numCharts === 4) return { cols: 2, rows: 2 };
        if (numCharts === 8) return { cols: 4, rows: 2 };
        if (numCharts === 16) return { cols: 4, rows: 4 };
        if (numCharts === 32) return { cols: 8, rows: 4 };
        if (numCharts === 64) return { cols: 8, rows: 8 };
        if (numCharts === 128) return { cols: 16, rows: 8 };
        const cols = Math.ceil(Math.sqrt(numCharts));
        const rows = Math.ceil(numCharts / cols);
        return { cols, rows };
    };

    const createChart = async () => {
        await waitForChartGPU();
        // Initialize random seed for fair comparison
        fastRandomSeed = 1;

        // Clear the chart root
        chartRootDiv.innerHTML = '';

        // Get grid dimensions
        const { cols, rows } = getGridDimensions(chartsNum);
        const chartWidth = 100 / cols;
        const chartHeight = 100 / rows;

        // Set chart root to use absolute positioning
        chartRootDiv.style.position = 'relative';

        // Store showLabels for use in appendData
        showLabels = chartsNum < 16;

        // Create container divs and charts
        for (let c = 0; c < chartsNum; c++) {
            const chartDiv = document.createElement('div');
            chartDiv.id = `chart-${c}`;
            chartDiv.style.width = `${chartWidth}%`;
            chartDiv.style.height = `${chartHeight}%`;
            chartDiv.style.position = 'absolute';
            chartDiv.style.left = `${(c % cols) * chartWidth}%`;
            chartDiv.style.top = `${Math.floor(c / cols) * chartHeight}%`;
            chartRootDiv.appendChild(chartDiv);
            const options = {
                grid: {
                    left: showLabels ? 70 : 10,
                    right: showLabels ? 24 : 10,
                    top: showLabels ? 24 : 10,
                    bottom: showLabels ? 44 : 10
                },
                xAxis: {
                    type: 'value',
                    name: showLabels ? 'X' : '',
                    show: showLabels
                },
                yAxis: {
                    type: 'value',
                    name: showLabels ? 'Y' : '',
                    show: showLabels
                },
                tooltip: { show: false },
                animation: false,
                series: [{
                    type: 'line',
                    name: 'Data',
                    data: [],
                    color: '#00FF00',
                    lineStyle: { width: 2, opacity: 1 },
                    sampling: 'lttb',
                    samplingThreshold: 5000
                }]
            };

            const chart = await ChartGPU.create(chartDiv, options);
            charts.push(chart);
        }
    };

    const generateDataInner = (pointsNum$, startIndex) => {
        const data = [];

        for (let i = 0; i < pointsNum$; i++) {
            const curYValue = fastRandom() * 10 - 5;
            const x = startIndex + i;
            prevYValue += curYValue;
            data.push([x, prevYValue]);
        }

        return data;
    };

    const generateData = () => {
        DATA = generateDataInner(pointsNum, 0);
    };

    const appendData = () => {
        // Apply same data to all charts
        for (let c = 0; c < chartsNum; c++) {
            const options = {
                grid: {
                    left: showLabels ? 70 : 10,
                    right: showLabels ? 24 : 10,
                    top: showLabels ? 24 : 10,
                    bottom: showLabels ? 44 : 10
                },
                xAxis: {
                    type: 'value',
                    name: showLabels ? 'X' : '',
                    show: showLabels
                },
                yAxis: {
                    type: 'value',
                    name: showLabels ? 'Y' : '',
                    show: showLabels
                },
                tooltip: { show: false },
                animation: false,
                series: [{
                    type: 'line',
                    name: 'Data',
                    data: DATA,
                    color: '#00FF00',
                    lineStyle: { width: 2, opacity: 1 },
                    sampling: 'lttb',
                    samplingThreshold: 5000
                }]
            };
            charts[c].setOption(options);
        }
    };

    const updateChart = (_frame) => {
        const newData = generateDataInner(appendCount, DATA.length);

        // Append to all charts
        for (let c = 0; c < chartsNum; c++) {
            charts[c].appendData(0, newData);
        }

        DATA = DATA.concat(newData);

        return seriesNum * DATA.length * chartsNum;
    };

    const deleteChart = () => {
        for (let c = 0; c < chartsNum; c++) {
            charts[c]?.dispose();
        }
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

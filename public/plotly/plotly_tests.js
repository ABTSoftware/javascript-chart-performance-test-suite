'use strict';

function eLibName() {
    return 'Plotly.js';
}

function eLibVersion() {
    return '2.8.3';
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
        "Uniform Heatmap Performance Test",
        "3D Point Cloud Performance Test",
        "3D Surface Performance Test"
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
    let CHART;
    let delta;

    const createChart = async () => {
        if (seriesNum > 4000) {
            console.warn("Plotly.js crashes the browser at this number of series so we'll skip further tests");
            return false;
        }
        CHART = document.getElementById('chart-root');
        Plotly.newPlot(CHART, [], {
            margin: { t: 0 },
            showlegend: false,
            hovermode: false,
        });
    };

    const generateData = () => {
        const xValuesArr = [];
        const yValuesArrArr = [];
        for (let i = 0; i < seriesNum; i++) {
            yValuesArrArr.push([]);

            // Generate points
            let prevYValue =0;
            for (let j = 0; j < pointsNum; j++) {
                if (i === 0) xValuesArr.push(j);
                const curYValue = Math.random() * 10 - 5;
                yValuesArrArr[i].push(prevYValue + curYValue);
                prevYValue += curYValue;
            }
        }
        DATA = [];
        yValuesArrArr.forEach((yValuesArr) =>
            DATA.push({
                x: xValuesArr,
                y: yValuesArr,
                type: 'scattergl',
                mode: 'lines',
            })
        );
    };

    const appendData = () => {
        // console.log('DATA', DATA);
        Plotly.addTraces(CHART, DATA);
        // console.log('layout', CHART.layout);
        const currentVisibleRange = CHART.layout.yaxis.range;
        // console.log('current visible range', currentVisibleRange);
        const maxVal = Math.max(Math.abs(currentVisibleRange[0]), Math.abs(currentVisibleRange[1]));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        const currentVisibleRange = CHART.layout.yaxis.range;
        Plotly.relayout(CHART, {
            'yaxis.range': [currentVisibleRange[0] - delta, currentVisibleRange[1] + delta],
        });
        return seriesNum * CHART.data[0].x.length;
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
    let CHART;
    const X_MAX = 100;
    const Y_MAX = 50;
    const EXTRA = 10;

    const layout = {
        margin: { t: 0 },
        showlegend: false,
        xaxis: {
            range: [-EXTRA, X_MAX + EXTRA],
        },
        yaxis: {
            range: [-EXTRA, Y_MAX + EXTRA],
        },
        hovermode: false,
    };

    const createChart = async () => {
        CHART = document.getElementById('chart-root');
        Plotly.newPlot(CHART, [], layout);
    };

    let newXValuesArr = [];
    let newYValuesArr = [];
    const generateNextPointsInner = (pointsNum$, xValuesArr, yValuesArr) => {
        // Every frame we call generateNextPoints. Re-use the same array if possible to avoid GC
        newXValuesArr = pointsNum$ > newXValuesArr.length ? new Array(pointsNum$) : newXValuesArr;
        newYValuesArr = pointsNum$ > newYValuesArr.length ? new Array(pointsNum$) : newYValuesArr;

        const hasInputData = xValuesArr && yValuesArr;

        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = hasInputData ? xValuesArr[i] : Math.round(Math.random() * X_MAX);
            const x = prevXValue + (Math.random() - 0.5);
            newXValuesArr[i] = x;
            const prevYValue = hasInputData ? yValuesArr[i] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newYValuesArr[i] = y;
        }

        return { xValuesArr: newXValuesArr, yValuesArr: newYValuesArr };
    };

    const generateData = () => {
        DATA = generateNextPointsInner(pointsNum, undefined, undefined);
    };

    const appendData = () => {
        const { xValuesArr, yValuesArr } = DATA;
        Plotly.addTraces(CHART, [
            {
                type: 'scattergl',
                mode: 'markers',
                x: xValuesArr,
                y: yValuesArr,
                marker: {
                    color: 'blue',
                },
            },
        ]);
    };

    const updateChart = (_frame) => {
        DATA = generateNextPointsInner(pointsNum, DATA.xValuesArr, DATA.yValuesArr);
        const { xValuesArr, yValuesArr } = DATA;
        // console.log('real data', xValuesArr, yValuesArr);
        // const xTest = [1, 2, 3];
        // const yTest = [10, 20, 30];
        // console.log('test data', xTest, yTest);
        const data_update = { 'marker.color': 'blue', x: [xValuesArr], y: [yValuesArr] };
        Plotly.update(CHART, data_update);
        return xValuesArr.length;
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
    let CHART;
    const X_MAX = 100;
    const Y_MAX = 50;
    const EXTRA = 10;

    const layout = {
        margin: { t: 0 },
        showlegend: false,
        xaxis: {
            range: [-EXTRA, X_MAX + EXTRA],
        },
        yaxis: {
            range: [-EXTRA, Y_MAX + EXTRA],
        },
        hovermode: false,
    };

    const createChart = async () => {
        CHART = document.getElementById('chart-root');
        Plotly.newPlot(CHART, [], layout);
    };

    const generateNextPointsInner = (pointsNum$, xValuesArr, yValuesArr) => {
        const newXValuesArr = [];
        const newYValuesArr = [];

        const hasInputData = xValuesArr && yValuesArr;

        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = hasInputData ? xValuesArr[i] : Math.round(Math.random() * X_MAX);
            const x = prevXValue + (Math.random() - 0.5);
            newXValuesArr.push(x);
            const prevYValue = hasInputData ? yValuesArr[i] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newYValuesArr.push(y);
        }

        return { xValuesArr: newXValuesArr, yValuesArr: newYValuesArr };
    };

    const generateData = () => {
        DATA = generateNextPointsInner(pointsNum, undefined, undefined);
    };

    const appendData = () => {
        const { xValuesArr, yValuesArr } = DATA;
        Plotly.addTraces(CHART, [
            {
                type: 'scattergl',
                mode: 'lines',
                x: xValuesArr,
                y: yValuesArr,
            },
        ]);
    };

    const updateChart = (_frame) => {
        DATA = generateNextPointsInner(pointsNum, DATA.xValuesArr, DATA.yValuesArr);
        const { xValuesArr, yValuesArr } = DATA;
        // console.log('real data', xValuesArr, yValuesArr);
        // const xTest = [1, 2, 3];
        // const yTest = [10, 20, 30];
        // console.log('test data', xTest, yTest);
        const data_update = { 'marker.color': 'blue', x: [xValuesArr], y: [yValuesArr] };
        Plotly.update(CHART, data_update);
        return xValuesArr.length;
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
    let CHART;
    const Y_MAX = 50;
    const EXTRA = 10;

    const layout = {
        margin: { t: 0 },
        showlegend: false,
        yaxis: {
            range: [-EXTRA, Y_MAX + EXTRA],
        },
        hovermode: false,
    };

    const createChart = async () => {
        CHART = document.getElementById('chart-root');
        Plotly.newPlot(CHART, [], layout);
    };

    let newXYValuesArr = [];
    const generateNextPoints = (pointsNum$, xyValuesArr) => {
        // Every frame we call generateNextPoints. Re-use the same array if possible to avoid GC
        newXYValuesArr = pointsNum$ > newXYValuesArr.length ? new Array(pointsNum$) : newXYValuesArr;

        for (let i = 0; i < pointsNum$; i++) {
            const prevYValue = xyValuesArr ? xyValuesArr[i].y : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newXYValuesArr[i] = { x: i, y };
        }

        return newXYValuesArr;
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined);
    };

    const appendData = () => {
        const xyValuesArr = DATA;
        const xValuesArr = xyValuesArr.map(point => point.x);
        const yValuesArr = xyValuesArr.map(point => point.y);
        
        Plotly.addTraces(CHART, [
            {
                type: 'scattergl',
                mode: 'lines+markers',
                x: xValuesArr,
                y: yValuesArr,
                marker: {
                    color: 'white',
                    size: 10,
                    line: {
                        color: 'blue',
                        width: 1
                    }
                },
                line: {
                    color: 'blue',
                    width: 2
                }
            },
        ]);
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA);
        const xyValuesArr = DATA;
        const xValuesArr = xyValuesArr.map(point => point.x);
        const yValuesArr = xyValuesArr.map(point => point.y);
        
        const data_update = { 
            x: [xValuesArr], 
            y: [yValuesArr],
            'marker.color': 'white',
            'line.color': 'blue'
        };
        Plotly.update(CHART, data_update);
        return xValuesArr.length;
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
    let CHART;
    let delta;

    const layout = {
        margin: { t: 0 },
        showlegend: false,
        hovermode: false,
    };

    const createChart = async () => {
        CHART = document.getElementById('chart-root');
        Plotly.newPlot(CHART, [], layout);
    };

    const generateData = () => {
        const xValuesArr = [];
        const yValuesArrArr = [];
        for (let i = 0; i < seriesNum; i++) {
            yValuesArrArr.push([]);

            // Generate points
            let prevYValue = 0;
            for (let j = 0; j < pointsNum; j++) {
                if (i === 0) xValuesArr.push(j);
                const curYValue = Math.random() * 10 - 5;
                yValuesArrArr[i].push(prevYValue + curYValue);
                prevYValue += curYValue;
            }
        }
        DATA = [];
        yValuesArrArr.forEach((yValuesArr) =>
            DATA.push({
                type: 'bar',
                x: xValuesArr,
                y: yValuesArr,
            })
        );
        console.log('DATA', DATA);
    };

    const appendData = () => {
        Plotly.addTraces(CHART, DATA);
        const currentVisibleRange = CHART.layout.yaxis.range;
        const maxVal = Math.max(Math.abs(currentVisibleRange[0]), Math.abs(currentVisibleRange[1]));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        const currentVisibleRange = CHART.layout.yaxis.range;
        Plotly.relayout(CHART, {
            'yaxis.range': [currentVisibleRange[0] - delta, currentVisibleRange[1] + delta],
        });
        return seriesNum * CHART.data[0].x.length;
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
    let CHART;
    let delta;

    const layout = {
        margin: { t: 0 },
        showlegend: false,
        hovermode: false,
    };

    const createChart = async () => {
        CHART = document.getElementById('chart-root');
        // Ensure 3D rendering by explicitly setting the plot type
        await Plotly.newPlot(CHART, [], layout, { 
            displayModeBar: false,
            plotGlPixelRatio: window.devicePixelRatio || 1
        });
    };

    const generateData = () => {
        const xValuesArr = [];
        const openValuesArr = [];
        const highValuesArr = [];
        const lowValuesArr = [];
        const closeValuesArr = [];

        for (let i = 0; i < pointsNum; i++) {
            const open = Math.random();
            const close = Math.random();
            const val1 = Math.random();
            const val2 = Math.random();
            const high = Math.max(val1, val2, open, close);
            const low = Math.min(val1, val2, open, close);
            xValuesArr.push(i);
            openValuesArr.push(open);
            highValuesArr.push(high);
            lowValuesArr.push(low);
            closeValuesArr.push(close);
        }

        DATA = [
            {
                x: xValuesArr,
                open: openValuesArr,
                high: highValuesArr,
                low: lowValuesArr,
                close: closeValuesArr,
                decreasing: { line: { color: '#7F7F7F' } },
                increasing: { line: { color: '#17BECF' } },
                line: { color: 'rgba(31,119,180,1)' },
                type: 'candlestick',
                xaxis: 'x',
                yaxis: 'y',
            },
        ];
    };

    const appendData = () => {
        Plotly.addTraces(CHART, DATA);
        const currentVisibleRange = CHART.layout.yaxis.range;
        const maxVal = Math.max(Math.abs(currentVisibleRange[0]), Math.abs(currentVisibleRange[1]));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        const currentVisibleRange = CHART.layout.yaxis.range;
        Plotly.relayout(CHART, {
            'yaxis.range': [currentVisibleRange[0] - delta, currentVisibleRange[1] + delta],
        });
        return seriesNum * CHART.data[0].x.length;
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
    let CHART;
    let size = 0;

    const createChart = async () => {
        CHART = document.getElementById('chart-root');
        Plotly.newPlot(
            CHART,
            [],
            {
                margin: { t: 0 },
                showlegend: false,
                hovermode: false,
            },
            { displayModeBar: false }
        );
    };

    const generateDataInner = (seriesNum$, pointsNum$, startIndex = 0) => {
        const xArr = [];
        const yArrArr = [];
        for (let i = 0; i < seriesNum$; i++) {
            const yOffset = i * 2;
            const yArr = [];
            for (let j = 0; j < pointsNum$; j++) {
                if (i === 0) xArr.push(startIndex + j);
                const y = Math.random() + yOffset;
                yArr.push(y);
            }
            yArrArr.push(yArr);
        }
        return { xArr, yArrArr };
    };

    const generateData = () => {
        DATA = generateDataInner(seriesNum, pointsNum);
    };

    const appendData = () => {
        const data2 = [];
        for (let i = 0; i < seriesNum; i++) {
            data2.push({
                type: 'scattergl',
                mode: 'lines',
                x: DATA.xArr,
                y: DATA.yArrArr[i],
            });
        }
        Plotly.addTraces(CHART, data2);
        size += pointsNum;
    };

    const updateChart = (_frame) => {
        const { xArr, yArrArr } = generateDataInner(seriesNum, incrementPoints, size);
        
        // Use extendTraces with maxpoints for efficient FIFO behaviour
        const xArrArr = [];
        const seriesIndexArr = [];
        for (let i = 0; i < seriesNum; i++) {
            xArrArr.push(xArr);
            seriesIndexArr.push(i);
        }
        const data2 = {
            x: xArrArr,
            y: yArrArr,
        };
        
        // Extend traces with automatic FIFO using maxpoints
        Plotly.extendTraces(CHART, data2, seriesIndexArr, pointsNum);
        
        size += incrementPoints;
        
        // Update the visible range to show the latest data
        Plotly.relayout(CHART, { 'xaxis.range': [size - pointsNum, size] });
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
    let CHART;
    let delta;

    const layout = {
        margin: { t: 0 },
        showlegend: false,
        hovermode: false,
    };

    const createChart = async () => {
        CHART = document.getElementById('chart-root');
        Plotly.newPlot(CHART, [], layout);
    };

    const generateData = () => {
        const xValuesArr = [];
        const yValuesArrArr = [];
        for (let i = 0; i < seriesNum; i++) {
            yValuesArrArr.push([]);

            // Generate points
            let prevYValue = 0;
            for (let j = 0; j < pointsNum; j++) {
                if (i === 0) xValuesArr.push(j);
                const curYValue = Math.random() * 10 - 5;
                yValuesArrArr[i].push(prevYValue + curYValue);
                prevYValue += curYValue;
            }
        }
        DATA = [];
        yValuesArrArr.forEach((yValuesArr) =>
            DATA.push({
                type: 'scattergl',
                fill: 'tozeroy',
                x: xValuesArr,
                y: yValuesArr,
            })
        );
        console.log('DATA', DATA);
    };

    const appendData = () => {
        Plotly.addTraces(CHART, DATA);
        const currentVisibleRange = CHART.layout.yaxis.range;
        const maxVal = Math.max(Math.abs(currentVisibleRange[0]), Math.abs(currentVisibleRange[1]));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        const currentVisibleRange = CHART.layout.yaxis.range;
        Plotly.relayout(CHART, {
            'yaxis.range': [currentVisibleRange[0] - delta, currentVisibleRange[1] + delta],
        });
        return seriesNum * CHART.data[0].x.length;
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
    let CHART;
    let size = 0;
    let prevYValue = 0;

    const createChart = async () => {
        CHART = document.getElementById('chart-root');
        Plotly.newPlot(
            CHART,
            [],
            {
                margin: { t: 0 },
                showlegend: false,
                hovermode: false,
            },
            { displayModeBar: false }
        );
    };

    const generateDataInner = (pointsNum$, startIndex = 0) => {
        const xArr = [];
        const yArr = [];
        for (let i = 0; i < pointsNum$; i++) {
            const curYValue = Math.random() * 10 - 5;
            prevYValue += curYValue;
            xArr.push(startIndex + i);
            yArr.push(prevYValue);
        }
        return { xArr, yArr };
    };

    const generateData = () => {
        DATA = generateDataInner(pointsNum);
    };

    const appendData = () => {
        const { xArr, yArr } = DATA;
        Plotly.addTraces(CHART, [{ 
            type: 'scattergl',
            mode: 'lines',
            x: xArr, 
            y: yArr 
        }]);
        size += pointsNum;
    };

    const updateChart = (_frame) => {
        const { xArr, yArr } = generateDataInner(incrementPoints, size);
        Plotly.extendTraces(CHART, { x: [xArr], y: [yArr]}, [0]);
        size += incrementPoints;
        return CHART.data[0].x.length;
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
    let chartDivs = [];
    let DATA;
    let size = 0;
    let prevYValue = 0;
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
            chartDivs.push(chartDiv);
        }

        // Set chart root to use absolute positioning
        chartRootDiv.style.position = 'relative';

        // Create each chart
        try {
            for (let c = 0; c < chartsNum; c++) {
                Plotly.newPlot(
                    `chart-${c}`,
                    [],
                    {
                        margin: { t: 0 },
                        showlegend: false,
                        hovermode: false,
                    },
                    { displayModeBar: false }
                );
            }
        } catch (error) {
            console.error('Failed to create charts:', error);
            if (error.message && error.message.includes('WebGL context')) {
                return 'CONTEXT_LIMIT';
            }
            return false;
        }
    };

    const generateDataInner = (pointsNum$, startIndex = 0) => {
        const xArr = [];
        const yArr = [];
        for (let i = 0; i < pointsNum$; i++) {
            const curYValue = fastRandom() * 10 - 5;
            prevYValue += curYValue;
            xArr.push(startIndex + i);
            yArr.push(prevYValue);
        }
        return { xArr, yArr };
    };

    const generateData = () => {
        DATA = generateDataInner(pointsNum);
    };

    const appendData = () => {
        const { xArr, yArr } = DATA;
        
        // Add data to each chart
        for (let c = 0; c < chartsNum; c++) {
            Plotly.addTraces(`chart-${c}`, [{ 
                type: 'scattergl',
                mode: 'lines',
                x: xArr, 
                y: yArr 
            }]);
        }
        size += pointsNum;
    };

    const updateChart = (_frame) => {
        const { xArr, yArr } = generateDataInner(incrementPoints, size);
        
        // Update all charts with the same data
        for (let c = 0; c < chartsNum; c++) {
            Plotly.extendTraces(`chart-${c}`, { x: [xArr], y: [yArr]}, [0]);
        }
        
        size += incrementPoints;
        return document.getElementById('chart-0').data[0].x.length;
    };

    const deleteChart = () => {
        chartDivs = [];
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
 * 3D_POINTCLOUD_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function e3dPointCloudPerformanceTest(seriesNum, pointsNum) {
    let CHART;
    let DATA;
    const pointCloudSize = pointsNum;

    const layout = {
        margin: { t: 0, l: 0, r: 0, b: 0 },
        showlegend: false,
        hovermode: false,
        scene: {
            aspectratio: {
                x: 1,
                y: 1,
                z: 1
            },
            camera: {
                center: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                eye: {
                    x: 1.25,
                    y: 1.25,
                    z: 1.25
                },
                up: {
                    x: 0,
                    y: 0,
                    z: 1
                }
            },
            xaxis: { 
                range: [-100, 100],
                type: 'linear',
                zeroline: false
            },
            yaxis: { 
                range: [-100, 100],
                type: 'linear',
                zeroline: false
            },
            zaxis: { 
                range: [-100, 100],
                type: 'linear',
                zeroline: false
            }
        }
    };

    const createChart = async () => {
        CHART = document.getElementById('chart-root');
        // Ensure 3D rendering for surface plots
        await Plotly.newPlot(CHART, [{
            type: 'scatter3d',
            mode: 'markers',
            x: [],
            y: [],
            z: [],
            marker: { size: 1 }
        }], layout, {
            displayModeBar: false,
            plotGlPixelRatio: window.devicePixelRatio || 1
        });
    };

    let newXValuesArr = new Float64Array(0);
    let newYValuesArr = new Float64Array(0);
    let newZValuesArr = new Float64Array(0);
    
    const generateNextPoints = (pointsNum$, xValuesArr, yValuesArr, zValuesArr) => {
        // Every frame we call generateNextPoints. Re-use the same array if possible to avoid GC
        newXValuesArr = pointsNum$ > newXValuesArr.length ? new Float64Array(pointsNum$) : newXValuesArr;
        newYValuesArr = pointsNum$ > newYValuesArr.length ? new Float64Array(pointsNum$) : newYValuesArr;
        newZValuesArr = pointsNum$ > newZValuesArr.length ? new Float64Array(pointsNum$) : newZValuesArr;

        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = xValuesArr ? xValuesArr[i] : Math.random() * 200 - 100;
            const x = prevXValue + (Math.random() - 0.5) * 2;
            newXValuesArr[i] = x;
            
            const prevYValue = yValuesArr ? yValuesArr[i] : Math.random() * 200 - 100;
            const y = prevYValue + (Math.random() - 0.5) * 2;
            newYValuesArr[i] = y;
            
            const prevZValue = zValuesArr ? zValuesArr[i] : Math.random() * 200 - 100;
            const z = prevZValue + (Math.random() - 0.5) * 2;
            newZValuesArr[i] = z;
        }

        return { 
            xValues: Array.from(newXValuesArr),
            yValues: Array.from(newYValuesArr),
            zValues: Array.from(newZValuesArr)
        };
    };

    const generateData = () => {
        DATA = generateNextPoints(pointCloudSize, undefined, undefined, undefined);
    };

    const appendData = () => {
        const { xValues, yValues, zValues } = DATA;
        
        Plotly.addTraces(CHART, [{
            x: xValues,
            y: yValues,
            z: zValues,
            mode: 'markers',
            type: 'scatter3d',
            marker: {
                size: 1,
                color: 'rgb(0, 255, 0)',
                opacity: 0.8,
                line: {
                    width: 0
                }
            }
        }]);
    };

    const updateChart = (_frame) => {
        // Generate new Brownian motion 3D points for dynamic updating
        DATA = generateNextPoints(pointCloudSize, DATA.xValues, DATA.yValues, DATA.zValues);
        const { xValues, yValues, zValues } = DATA;
        
        const data_update = { 
            x: [xValues], 
            y: [yValues], 
            z: [zValues],
            'marker.color': 'rgb(0, 255, 0)'
        };
        Plotly.update(CHART, data_update, {}, [0]);

        return pointCloudSize;
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
 * 3D_SURFACE_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function e3dSurfacePerformanceTest(seriesNum, pointsNum) {
    let CHART;
    let surfaceData;
    let DATA;
    const surfaceSize = pointsNum; // pointsNum represents the side length of the surface (e.g., 100 = 100x100)

    const layout = {
        margin: { t: 0, l: 0, r: 0, b: 0 },
        showlegend: false,
        hovermode: false,
        scene: {
            aspectratio: {
                x: 1,
                y: 1,
                z: 1
            },
            camera: {
                center: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                eye: {
                    x: 1.25,
                    y: 1.25,
                    z: 1.25
                },
                up: {
                    x: 0,
                    y: 0,
                    z: 1
                }
            },
            xaxis: { 
                title: 'X Axis',
                type: 'linear',
                zeroline: false
            },
            yaxis: { 
                title: 'Y Axis',
                type: 'linear',
                zeroline: false
            },
            zaxis: { 
                title: 'Z Axis', 
                range: [-0.5, 0.5],
                type: 'linear',
                zeroline: false
            }
        }
    };

    const createChart = async () => {
        CHART = document.getElementById('chart-root');
        Plotly.newPlot(CHART, [], layout, { displayModeBar: false });
    };

    const zeroArray2D = (dimensions) => {
        if (!dimensions) {
            return undefined;
        }
        const array = [];

        for (let i = 0; i < dimensions[0]; ++i) {
            array.push(dimensions.length === 1 ? 0 : zeroArray2D(dimensions.slice(1)));
        }

        return array;
    };

    const generateData = () => {
        // Create a 2D array for surface heights
        surfaceData = zeroArray2D([surfaceSize, surfaceSize]);
        
        // Fill with initial random data
        for (let z = 0; z < surfaceSize; z++) {
            for (let x = 0; x < surfaceSize; x++) {
                surfaceData[z][x] = Math.random() * 0.6 - 0.3; // Random values between -0.3 and 0.3
            }
        }

        DATA = { surfaceData };
    };

    const appendData = () => {
        const { surfaceData } = DATA;

        Plotly.addTraces(CHART, [{
            z: surfaceData,
            type: 'surface',
            colorscale: 'Viridis',
            showscale: false,
            name: '3D Surface'
        }]);
    };

    let frame = 0;
    const updateChart = (_frameNumber) => {
        // Generate new surface data with animated wave pattern
        const f = frame / 10;
        
        for (let z = 0; z < surfaceSize; z++) {
            const zVal = z - surfaceSize / 2;
            for (let x = 0; x < surfaceSize; x++) {
                const xVal = x - surfaceSize / 2;
                // Create animated wave pattern similar to the SciChart example
                const y = (Math.cos(xVal * 0.2 + f) + Math.cos(zVal * 0.2 + f)) / 5;
                surfaceData[z][x] = y;
            }
        }

        // Update the surface with new height data
        const data_update = { z: [surfaceData] };
        Plotly.update(CHART, data_update, {}, [0]);
        frame++;

        return surfaceSize * surfaceSize;
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
 * HEATMAP_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eHeatmapPerformanceTest(seriesNum, pointsNum) {
    let CHART;
    let DATA;
    const heatmapSize = pointsNum;

    const createChart = async () => {
        CHART = document.getElementById('chart-root');
        await Plotly.newPlot(CHART, [], {
            margin: { t: 0 },
            showlegend: false,
            hovermode: false,
        });
    };

    const generateData = () => {
        const z = [];
        for (let y = 0; y < heatmapSize; y++) {
            const row = [];
            for (let x = 0; x < heatmapSize; x++) {
                row.push(Math.random());
            }
            z.push(row);
        }
        DATA = z;
    };

    const appendData = () => {
        Plotly.addTraces(CHART, [{
            z: DATA,
            type: 'heatmap',
            colorscale: 'Viridis',
            showscale: false,
        }]);
    };

    const updateChart = (_frame) => {
        // Generate new random heatmap data
        const newZ = [];
        for (let y = 0; y < heatmapSize; y++) {
            const row = [];
            for (let x = 0; x < heatmapSize; x++) {
                row.push(Math.random());
            }
            newZ.push(row);
        }
        
        const data_update = { z: [newZ] };
        Plotly.update(CHART, { z: [newZ] }, {}, [0]);
        
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

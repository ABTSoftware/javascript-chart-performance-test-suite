'use strict';

function eLibName() {
    return 'Chart.js';
}

function eLibVersion() {
    return '3.7.0';
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
        "Multi Chart Performance Test"
        // Note: Heatmap not supported in Chart.js
    ];
}

/**
 * LINE_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eLinePerformanceTest(seriesNum, pointsNum) {
    let CHART;
    let DATA;
    let delta;

    const createChart = async () => {
        const config = {
            type: 'line',
            options: {
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                    },
                },
                elements: {
                    point: {
                        radius: 0,
                    },
                },
                animation: {
                    duration: 0, // general animation time
                },
                responsive: true,
                maintainAspectRatio: false
            },
        };
        CHART = new Chart(document.getElementById('chartjs-root'), config);
    };

    const updateYVisibleRangeInner = (chart$, min, max) => {
        chart$.options.scales = {
            x: {
                min: 0,
                max: pointsNum,
            },
            y: {
                min,
                max,
                ticks: {
                    callback: function(value, index, values) {
                        return value.toFixed(1);
                    }
                }
            },
        };
    };

    const generateData = () => {
        const labels = [];
        const datasets = [];
        const getRandomColor = function () {
            const r = Math.floor(Math.random() * 255);
            const g = Math.floor(Math.random() * 255);
            const b = Math.floor(Math.random() * 255);
            return 'rgb(' + r + ',' + g + ',' + b + ')';
        };
        for (let i = 0; i < seriesNum; i++) {
            // Generate points
            let prevYValue = 0;
            const data = [];
            for (let j = 0; j < pointsNum; j++) {
                // we need only one set of labels
                if (i === 0) labels.push(j);
                const curYValue = Math.random() * 10 - 5;
                const y = prevYValue + curYValue;
                data.push(y);
                prevYValue += curYValue;
            }
            datasets.push({
                data: data,
                borderColor: getRandomColor(),
                pointRadius: 0,
                borderWidth: 2,
            });
        }

        DATA = { labels, datasets };
    };

    const appendData = () => {
        CHART.data.labels = DATA.labels;
        CHART.data.datasets = DATA.datasets;
        CHART.update();

        const visibleRangeMin = CHART.scales.y.min;
        const visibleRangeMax = CHART.scales.y.max;
        const maxVal = Math.max(Math.abs(visibleRangeMin), Math.abs(visibleRangeMax));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        const visibleRangeMin = CHART.scales.y.min - delta;
        const visibleRangeMax = CHART.scales.y.max + delta;
        updateYVisibleRangeInner(CHART, visibleRangeMin, visibleRangeMax);
        CHART.update();
        return seriesNum * CHART.data.datasets[0].data.length;
    };

    const deleteChart = () => {
        CHART.destroy();
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
    let CHART;
    let DATA;

    const X_MAX = 100;
    const Y_MAX = 50;

    const createChart = async () => {
        const config = {
            type: 'scatter',
            options: {
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                    },
                },
                animation: {
                    duration: 0,
                },
                responsive: true,
                maintainAspectRatio: false
            },
        };
        CHART = new Chart(document.getElementById('chartjs-root'), config);
    };

    const generateNextPoints = (pointsNum$, data) => {
        const newData = [];
        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = data ? data[i].x : Math.round(Math.random() * X_MAX);
            const x = prevXValue + (Math.random() - 0.5);
            const prevYValue = data ? data[i].y : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newData.push({ x, y });
        }

        const datasets = [
            {
                data: newData,
                backgroundColor: '#1f4e79',
                borderColor: '#1f4e79',
            },
        ];

        return { datasets };
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum);
    };

    const appendData = () => {
        CHART.data.datasets = DATA.datasets;
        CHART.update();
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA.datasets[0].data);
        CHART.clear();
        CHART.data.datasets = DATA.datasets;
        CHART.update();
        return seriesNum * pointsNum;
    };

    const deleteChart = () => {
        CHART.destroy();
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
 * SCATTER_LINE_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eScatterLinePerformanceTest(seriesNum, pointsNum) {
    let CHART;
    let DATA;

    const X_MAX = 100;
    const Y_MAX = 50;

    const createChart = async () => {
        const config = {
            type: 'scatter',
            options: {
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                    },
                },
                elements: {
                    point: {
                        radius: 0,
                    },
                },
                animation: {
                    duration: 0,
                },
                responsive: true,
                maintainAspectRatio: false
            },
        };
        CHART = new Chart(document.getElementById('chartjs-root'), config);
    };

    const generateNextPoints = (pointsNum$, data) => {
        const newData = [];
        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = data ? data[i].x : Math.round(Math.random() * X_MAX);
            const x = prevXValue + (Math.random() - 0.5);
            const prevYValue = data ? data[i].y : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newData.push({ x, y });
        }

        const datasets = [
            {
                data: newData,
                tension: 0,
                fill: false,
                showLine: true,
                pointRadius: 0,
                borderColor: '#1f4e79',
                backgroundColor: '#1f4e79',
            },
        ];

        return { datasets };
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum);
    };

    const appendData = () => {
        CHART.data.datasets = DATA.datasets;

        CHART.update();
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA.datasets[0].data);
        CHART.clear();
        CHART.data.datasets = DATA.datasets;
        CHART.update();
        return DATA.datasets[0].data.length;
    };

    const deleteChart = () => {
        CHART.destroy();
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
 * POINT_LINE_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function ePointLinePerformanceTest(seriesNum, pointsNum) {
    let CHART;
    let DATA;
    const Y_MAX = 50;

    const createChart = async () => {
        const config = {
            type: 'line',
            options: {
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                    },
                },
                elements: {
                    point: {
                        radius: 5,
                        backgroundColor: 'white',
                        borderColor: '#1f4e79',
                        borderWidth: 1,
                    },
                    line: {
                        borderColor: '#1f4e79',
                        borderWidth: 2,
                    },
                },
                animation: {
                    duration: 0,
                },
                responsive: true,
                maintainAspectRatio: false
            },
        };
        CHART = new Chart(document.getElementById('chartjs-root'), config);
    };

    const generateNextPoints = (pointsNum$, data) => {
        const newData = [];
        for (let i = 0; i < pointsNum$; i++) {
            const prevYValue = data ? data[i] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newData.push(y);
        }

        const labels = Array.from({ length: pointsNum$ }, (_, i) => i);
        const datasets = [
            {
                data: newData,
                borderColor: '#1f4e79',
                backgroundColor: 'white',
                pointRadius: 5,
                pointBorderColor: '#1f4e79',
                pointBorderWidth: 1,
                pointBackgroundColor: 'white',
                borderWidth: 2,
            },
        ];

        return { labels, datasets };
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum);
    };

    const appendData = () => {
        CHART.data.labels = DATA.labels;
        CHART.data.datasets = DATA.datasets;
        CHART.update();
    };

    const updateChart = (_frame) => {
        const prevData = CHART.data.datasets[0].data;
        DATA = generateNextPoints(pointsNum, prevData);
        CHART.data.labels = DATA.labels;
        CHART.data.datasets = DATA.datasets;
        CHART.update();
        return seriesNum * pointsNum;
    };

    const deleteChart = () => {
        CHART.destroy();
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
    let CHART;
    let DATA;
    let delta;
    let min = 0;
    let max = 0;

    const createChart = async () => {
        const config = {
            type: 'bar',
            options: {
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                    },
                },
                animation: {
                    duration: 0
                },
                responsiveAnimationDuration: 0,
                elements: {
                    point: {
                        radius: 0,
                    },
                },
                responsive: true,
                maintainAspectRatio: false
            },
        };
        CHART = new Chart(document.getElementById('chartjs-root'), config);
    };

    const generateData = () => {
        const labels = [];
        const data = [];

        let prevYValue = 0;
        for (let i = 0; i < pointsNum; i++) {
            const curYValue = Math.random() * 10 - 5;
            labels.push(i);
            prevYValue += curYValue;
            data.push(prevYValue);
        }
        delta = Math.max.apply(null, data) / 300;

        DATA = { labels, data };
    };

    const appendData = () => {
        CHART.data.labels = DATA.labels;
        CHART.data.datasets = [
            {
                data: DATA.data,
                backgroundColor: '#1f4e79',
                borderColor: '#1f4e79',
            },
        ];
        CHART.update('none');
    };

    const updateChart = (_frame) => {
        CHART.options.scales = {
            y: {
                afterDataLimits(scale) {
                    scale.max += max;
                    scale.min -= min;
                },
            },
        };
        min += delta;
        max += delta;
        CHART.update('none');
        return CHART.data.datasets[0].data.length;
    };

    const deleteChart = () => {
        CHART.destroy();
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
    const ctx = document.getElementById('chartjs-root').getContext('2d');
    let CHART;
    let DATA;
    let delta;
    let max = 0;

    const createChart = async () => {
        CHART = new Chart(ctx, {
            type: 'candlestick',
            options: {
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                    },
                },
                elements: {
                    point: {
                        radius: 0,
                    },
                },
                responsive: true,
                maintainAspectRatio: false
            },
        });
    };

    const generateData = () => {
        const labels = [];
        const barData = [];

        for (let i = 0; i < pointsNum; i++) {
            const open = Math.random();
            const close = Math.random();
            const val1 = Math.random();
            const val2 = Math.random();
            const high = Math.max(val1, val2, open, close);
            const low = Math.min(val1, val2, open, close);
            labels.push(i);
            barData.push({
                x: i,
                o: open,
                h: high,
                l: low,
                c: close,
            });
        }

        delta =
            Math.max.apply(
                null,
                barData.map((dataItem) => dataItem.o)
            ) / 300;

        DATA = { barData, labels };
    };

    const appendData = () => {
        CHART.data.labels = DATA.labels;
        CHART.data.datasets = [
            {
                data: DATA.barData,
                borderColor: '#1f4e79',
                backgroundColor: '#1f4e79',
            },
        ];

        CHART.update();
    };

    const updateChart = () => {
        CHART.options.scales = {
            y: {
                afterDataLimits(scale) {
                    scale.max += max;
                },
            },
        };
        max += delta;
        CHART.update();
        return CHART.data.datasets[0].data.length;
    };

    const deleteChart = () => {
        CHART.destroy();
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
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eFifoEcgPerformanceTest(seriesNum, pointsNum, incrementPoints) {
    let CHART;
    let DATA;

    const appendCount = incrementPoints;
    let index = 0;

    const createChart = async () => {
        const config = {
            type: 'line',
            options: {
                elements: {
                    point: {
                        radius: 0,
                    },
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                    },
                },
                animation: {
                    duration: 0,
                },
                responsive: true,
                maintainAspectRatio: false
            },
        };
        CHART = new Chart(document.getElementById('chartjs-root'), config);
    };

    const generateDataInner = (seriesNum$, pointsNum$, startIndex = 0) => {
        const labels = [];
        const datasets = [];
        for (let i = 0; i < seriesNum$; i++) {
            const yOffset = i * 2;
            const data = [];
            for (let j = 0; j < pointsNum$; j++) {
                if (i === 0) labels.push(startIndex + j);
                const val = Math.random() + yOffset;
                data.push(val);
            }
            datasets.push({
                data,
                borderColor: '#1f4e79',
                backgroundColor: '#1f4e79',
            });
        }
        return { labels, datasets };
    };

    const generateData = () => {
        DATA = generateDataInner(seriesNum, pointsNum);
    };

    const appendData = () => {
        CHART.data.labels = DATA.labels;
        CHART.data.datasets = DATA.datasets;
        CHART.update();
    };

    const updateChart = (_frame) => {
        index += DATA.labels.length;
        const { labels, datasets } = generateDataInner(seriesNum, appendCount, index);
        DATA.labels = labels;
        DATA.datasets = datasets;
        CHART.data.labels = DATA.labels;
        CHART.data.datasets = DATA.datasets;
        CHART.update();
        return DATA.datasets[0].data.length;
    };

    const deleteChart = () => {
        CHART.destroy();
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
 * MOUNTAIN_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eMountainPerformanceTest(seriesNum, pointsNum) {
    let CHART;
    let DATA;
    let delta;
    let min = 0;
    let max = 0;

    const createChart = async () => {
        const config = {
            type: 'line',
            options: {
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                    },
                    filler: {
                        propagate: false,
                    },
                },
                interaction: {
                    intersect: false,
                },
                animation: {
                    duration: 0,
                },
                elements: {
                    point: {
                        radius: 0,
                    },
                },
                responsive: true,
                maintainAspectRatio: false
            },
        };
        CHART = new Chart(document.getElementById('chartjs-root'), config);
    };

    const generateData = () => {
        const labels = [];
        const data = [];
        const empty = [];
        let prevYValue = 0;
        for (let i = 0; i < pointsNum; i++) {
            const curYValue = Math.random() * 10 - 5;
            labels.push(i);
            prevYValue += curYValue;
            data.push(prevYValue);
            empty.push(0);
        }
        delta = Math.max.apply(null, data) / 300;

        DATA = { labels, data, empty };
    };

    const appendData = () => {
        CHART.data.labels = DATA.labels;
        CHART.data.datasets = [
            {
                data: DATA.data,
                fill: '1',
                backgroundColor: '#1f4e79',
                borderColor: '#1f4e79',
            },
            {
                data: DATA.empty,
                backgroundColor: 'transparent',
                borderColor: 'transparent',
            },
        ];
        CHART.update();
    };

    const updateChart = (_frame) => {
        CHART.options.scales = {
            y: {
                afterDataLimits(scale) {
                    scale.max += max;
                    scale.min -= min;
                },
            },
        };
        min += delta;
        max += delta;
        CHART.update();
        return CHART.data.datasets[0].data.length;
    };

    const deleteChart = () => {
        CHART.destroy();
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
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eSeriesCompressionPerformanceTest(seriesNum, pointsNum, incrementPoints) {
    let CHART;
    let DATA;
    let prevYValue = 0;

    const appendCount = incrementPoints;

    const createChart = async () => {
        const config = {
            type: 'line',
            options: {
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                    },
                },
                elements: {
                    point: {
                        radius: 0,
                    },
                },
                animation: {
                    duration: 0,
                },
                responsive: true,
                maintainAspectRatio: false
            },
        };
        CHART = new Chart(document.getElementById('chartjs-root'), config);
    };

    const generateDataInner = (pointsNum$, startIndex) => {
        const labels = [];
        const data = [];

        for (let i = 0; i < pointsNum$; i++) {
            const curYValue = Math.random() * 10 - 5;
            labels.push(startIndex + i);
            prevYValue += curYValue;
            data.push(prevYValue);
        }
        return { labels, data };
    };

    const generateData = () => {
        DATA = generateDataInner(appendCount, 0);
    };

    const appendData = () => {
        CHART.data.labels = DATA.labels;
        CHART.data.datasets = [
            {
                data: DATA.data,
                borderColor: '#1f4e79',
                backgroundColor: '#1f4e79',
            },
        ];
        CHART.update();
    };

    const updateChart = (_frame) => {
        const { labels, data } = generateDataInner(appendCount, CHART.data.datasets[0].data.length);
        CHART.data.labels = CHART.data.labels.concat(labels);
        CHART.data.datasets[0].data = CHART.data.datasets[0].data.concat(data);
        CHART.update();
        return CHART.data.datasets[0].data.length;
    };

    const deleteChart = () => {
        CHART.destroy();
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
    let CHARTS = [];
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

        // Create container canvases for each chart in grid layout
        for (let c = 0; c < chartsNum; c++) {
            const chartDiv = document.createElement('div');
            chartDiv.id = `chart-${c}`;
            chartDiv.style.width = `${chartWidth}%`;
            chartDiv.style.height = `${chartHeight}%`;
            chartDiv.style.position = 'absolute';
            chartDiv.style.left = `${(c % cols) * chartWidth}%`;
            chartDiv.style.top = `${Math.floor(c / cols) * chartHeight}%`;
            const chartCanvas = document.createElement('canvas');
            chartCanvas.id = `chart-canvas-${c}`;
            chartCanvas.style.display = 'block';
            chartDiv.appendChild(chartCanvas);
            chartRootDiv.appendChild(chartDiv);
        }

        // Create each chart
        try {
            for (let c = 0; c < chartsNum; c++) {
                const config = {
                    type: 'line',
                    options: {
                        plugins: {
                            legend: {
                                display: false,
                            },
                            tooltip: {
                                enabled: false,
                            },
                        },
                        elements: {
                            point: {
                                radius: 0,
                            },
                        },
                        animation: {
                            duration: 0,
                        },
                        responsive: true,
                        maintainAspectRatio: false
                    },
                };
                const chart = new Chart(document.getElementById(`chart-canvas-${c}`), config);
                CHARTS.push(chart);
            }
        } catch (error) {
            console.error('Failed to create charts:', error);
            // Clean up any created charts
            CHARTS.forEach(chart => chart?.destroy());
            CHARTS = [];
            return false;
        }
    };

    const generateDataInner = (pointsNum$, startIndex) => {
        const labels = [];
        const data = [];

        for (let i = 0; i < pointsNum$; i++) {
            const curYValue = fastRandom() * 10 - 5;
            labels.push(startIndex + i);
            prevYValue += curYValue;
            data.push(prevYValue);
        }
        return { labels, data };
    };

    const generateData = () => {
        DATA = generateDataInner(pointsNum, 0);
    };

    const appendData = () => {
        const { labels, data } = DATA;
        
        // Add data to each chart
        for (let c = 0; c < chartsNum; c++) {
            CHARTS[c].data.labels = labels;
            CHARTS[c].data.datasets = [
                {
                    data: data,
                    borderColor: '#1f4e79',
                    backgroundColor: '#1f4e79',
                },
            ];
            CHARTS[c].update();
        }
    };

    const updateChart = (_frame) => {
        const { labels, data } = generateDataInner(appendCount, CHARTS[0].data.datasets[0].data.length);
        
        // Update all charts with the same data
        for (let c = 0; c < chartsNum; c++) {
            CHARTS[c].data.labels = CHARTS[c].data.labels.concat(labels);
            CHARTS[c].data.datasets[0].data = CHARTS[c].data.datasets[0].data.concat(data);
            CHARTS[c].update();
        }
        
        return seriesNum * CHARTS[0].data.datasets[0].data.length * chartsNum;
    };

    const deleteChart = () => {
        CHARTS.forEach(chart => chart?.destroy());
        CHARTS = [];
    };

    return {
        createChart,
        generateData,
        appendData,
        updateChart,
        deleteChart,
    };
}

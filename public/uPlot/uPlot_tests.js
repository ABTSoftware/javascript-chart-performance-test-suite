'use strict';

function eLibName() {
    return 'uPlot';
}

function eLibVersion() {
    return '1.6.18';
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
        // Note realtime updating heatmap not supported in uPlot
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
    let delta;
    let DATA;
    let yAxis;

    const createChart = async () => {
        let opts = {
            width: 800,
            height: 600,
            padding: [10, 10, 10, 10],
            cursor: {
                show: false,
            },
            legend: {
                show: false,
            },
            scales: {
                x: {
                    time: false,
                },
                y: { auto: true, min: -300, max: 300 },
            },
        };

        chart = new uPlot(opts, [], document.getElementById('chart-root'));
    };

    const generateData = () => {
        const xValues = [...Array(pointsNum).keys()];
        const seriesDataArrays = [];
        const colorValuesArr = [];
        for (let i = 0; i < seriesNum; i++) {
            seriesDataArrays.push([]);
            const r = Math.random() * 255;
            const g = Math.random() * 255;
            const b = Math.random() * 255;
            colorValuesArr.push(`rgba(${r},${g},${b},1)`);

            // Generate points
            let prevYValue = 0;
            for (let j = 0; j < pointsNum; j++) {
                const curYValue = Math.random() * 10 - 5;
                const x = j;
                const y = prevYValue + curYValue;
                seriesDataArrays[i].push(y);
                prevYValue += curYValue;
            }
        }

        const xyValuesArrArr = [xValues, ...seriesDataArrays];

        DATA = { xyValuesArrArr, colorValuesArr };
    };

    const appendData = () => {
        const { xyValuesArrArr, colorValuesArr } = DATA;
        chart.setData(xyValuesArrArr);

        for (let i = 0; i < seriesNum; i++) {
            console.log('addSeries');
            chart.addSeries(
                {
                    stroke: colorValuesArr[i],
                    width: 2,
                },
                i + 1
            );
        }

        const min = chart.scales.y.min;
        const max = chart.scales.y.max;
        const maxVal = Math.max(Math.abs(max), Math.abs(min));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        chart.setScale('y', { min: chart.scales.y.min - delta, max: chart.scales.y.max + delta });
        return seriesNum * chart.data[0].length;
    };

    const deleteChart = () => {
        chart?.destroy();
        const chartDiv = document.getElementById('chart-root');
        chartDiv.innerHTML = '';
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

    const createChart = async () => {
        const EXTRA = 10;
        
        let opts = {
            width: 800,
            height: 600,
            padding: [10, 10, 10, 10],
            cursor: {
                show: false,
            },
            legend: {
                show: false,
            },
            scales: {
                x: {
                    time: false,
                    auto: false,
                    min: -EXTRA,
                    max: X_MAX + EXTRA,
                },
                y: { auto: false, min: -EXTRA, max: Y_MAX + EXTRA },
            },
            series: [
                {},
                {
                    stroke: 'blue',
                    width: 0,
                    paths: () => null,
                    points: {
                        show: true,
                        size: 5,
                        stroke: 'blue',
                        fill: 'blue',
                    },
                },
            ],
        };

        chart = new uPlot(opts, [], document.getElementById('chart-root'));
    };

    const generateNextPoints = (pointsNum$, data) => {
        const newXValuesArr = [];
        const newYValuesArr = [];

        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = data ? data[0][i] : Math.round(Math.random() * X_MAX);
            const x = prevXValue + (Math.random() - 0.5);
            newXValuesArr.push(x);
            const prevYValue = data ? data[1][i] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newYValuesArr.push(y);
        }

        return [newXValuesArr, newYValuesArr];
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined);
    };

    const appendData = () => {
        chart.setData(DATA);
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA);
        chart.setData(DATA);
        return seriesNum * pointsNum;
    };

    const deleteChart = () => {
        chart?.destroy();
        const chartDiv = document.getElementById('chart-root');
        chartDiv.innerHTML = '';
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
    let chart;
    let DATA;
    const X_MAX = 100;
    const Y_MAX = 50;

    const createChart = async () => {
        const EXTRA = 10;
        let opts = {
            width: 800,
            height: 600,
            padding: [10, 10, 10, 10],
            cursor: {
                show: false,
            },
            legend: {
                show: false,
            },
            scales: {
                x: {
                    time: false,
                    auto: false,
                    min: -EXTRA,
                    max: X_MAX + EXTRA,
                },
                y: { auto: false, min: -EXTRA, max: Y_MAX + EXTRA },
            },
            series: [
                {},
                {
                    stroke: 'blue',
                    width: 2,
                    points: {
                        show: false,
                    },
                    spanGaps: false,
                    // Custom path function to handle unsorted x-values
                    // uPlot's default line drawing assumes x-values are sorted, but in this test
                    // we have Brownian motion where x-values can be unsorted. This custom path
                    // function manually draws lines connecting points in data array order rather
                    // than x-coordinate sorted order, which is what we want for this test case.
                    paths: (u, seriesIdx, idx0, idx1) => {
                        const ctx = new Path2D();
                        const xs = u.data[0];  // x-values array
                        const ys = u.data[seriesIdx];  // y-values array for this series
                        
                        // Draw lines connecting points in data order (not x-sorted order)
                        let first = true;
                        for (let i = 0; i < xs.length; i++) {
                            // Convert data values to pixel coordinates
                            const x = u.valToPos(xs[i], 'x', true);
                            const y = u.valToPos(ys[i], 'y', true);
                            
                            if (first) {
                                ctx.moveTo(x, y);  // Start the path at first point
                                first = false;
                            } else {
                                ctx.lineTo(x, y);  // Draw line to next point
                            }
                        }
                        
                        // Return the path for stroke rendering (no fill or clipping needed)
                        return { stroke: ctx, fill: null, clip: null };
                    }
                },
            ],
        };

        chart = new uPlot(opts, [], document.getElementById('chart-root'));
    };

    const generateNextPoints = (pointsNum$, data) => {
        const newXValuesArr = [];
        const newYValuesArr = [];

        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = data ? data[0][i] : Math.round(Math.random() * X_MAX);
            const x = prevXValue + (Math.random() - 0.5);
            newXValuesArr.push(x);
            const prevYValue = data ? data[1][i] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newYValuesArr.push(y);
        }

        return [newXValuesArr, newYValuesArr];
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined);
    };

    const appendData = () => {
        chart.setData(DATA);
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA);
        chart.setData(DATA);
        return DATA[0].length;
    };

    const deleteChart = () => {
        chart?.destroy();
        const chartDiv = document.getElementById('chart-root');
        chartDiv.innerHTML = '';
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
    let chart;
    let DATA;
    const Y_MAX = 50;

    const createChart = async () => {
        const EXTRA = 10;
        let opts = {
            width: 800,
            height: 600,
            padding: [10, 10, 10, 10],
            cursor: {
                show: false,
            },
            legend: {
                show: false,
            },
            scales: {
                x: {
                    time: false,
                },
                y: { auto: false, min: -EXTRA, max: Y_MAX + EXTRA },
            },
            series: [
                {},
                {
                    stroke: 'blue',
                    width: 2,
                    points: {
                        show: true,
                        size: 10,
                        stroke: 'blue',
                        fill: 'white',
                        width: 1,
                    },
                },
            ],
        };

        chart = new uPlot(opts, [], document.getElementById('chart-root'));
    };

    const generateNextPoints = (pointsNum$, yValuesArr) => {
        const newXValuesArr = [];
        const newYValuesArr = [];

        for (let i = 0; i < pointsNum$; i++) {
            newXValuesArr.push(i);
            const prevYValue = yValuesArr ? yValuesArr[i] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newYValuesArr.push(y);
        }

        return [newXValuesArr, newYValuesArr];
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined);
    };

    const appendData = () => {
        chart.setData(DATA);
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA[1]);
        chart.setData(DATA);
        return DATA[0].length;
    };

    const deleteChart = () => {
        chart?.destroy();
        const chartDiv = document.getElementById('chart-root');
        chartDiv.innerHTML = '';
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
    let delta;
    let DATA;

    function columnPlugin({
        columnWidth = 0.8,
        columnColor = '#4ab650',
        columnOutline = '#000000',
        outlineWidth = 1,
    } = {}) {
        function drawColumns(u) {
            if (!DATA) {
                return;
            }

            u.ctx.save();

            let [iMin, iMax] = u.series[0].idxs;
            let columnWidthPx = (u.bbox.width / (iMax - iMin)) * columnWidth;

            for (let i = iMin; i <= iMax; i++) {
                let xVal = DATA[0][i];
                let yVal = DATA[1][i];

                let xPos = u.valToPos(xVal, 'x', true);
                let yPos = u.valToPos(yVal, 'y', true);
                let zeroPos = u.valToPos(0, 'y', true);

                let columnHeight = Math.abs(yPos - zeroPos);
                let columnX = xPos - columnWidthPx / 2;
                let columnY = Math.min(yPos, zeroPos);

                // Draw column outline
                u.ctx.fillStyle = columnOutline;
                u.ctx.fillRect(
                    Math.round(columnX),
                    Math.round(columnY),
                    Math.round(columnWidthPx),
                    Math.round(columnHeight)
                );

                // Draw column fill
                u.ctx.fillStyle = columnColor;
                u.ctx.fillRect(
                    Math.round(columnX + outlineWidth),
                    Math.round(columnY + outlineWidth),
                    Math.round(columnWidthPx - outlineWidth * 2),
                    Math.round(columnHeight - outlineWidth * 2)
                );
            }

            u.ctx.restore();
        }

        return {
            opts: (u, opts) => {
                uPlot.assign(opts, {
                    cursor: {
                        points: {
                            show: false,
                        },
                    },
                });

                opts.series.forEach((series) => {
                    series.paths = () => null;
                    series.points = { show: false };
                });
            },
            hooks: {
                draw: drawColumns,
            },
        };
    }

    const createChart = async () => {
        let opts = {
            width: 800,
            height: 600,
            padding: [10, 10, 10, 10],
            cursor: {
                show: false,
            },
            legend: {
                show: false,
            },
            scales: {
                x: {
                    time: false,
                },
                y: { auto: true },
            },
            plugins: [columnPlugin()],
            series: [{}, {}],
        };

        chart = new uPlot(opts, [], document.getElementById('chart-root'));
    };

    const generateData = () => {
        const xValues = [];
        const yValues = [];

        let prevYValue = 0;
        for (let i = 0; i < pointsNum; i++) {
            const curYValue = Math.random() * 10 - 5;
            xValues.push(i);
            prevYValue += curYValue;
            yValues.push(prevYValue);
        }

        DATA = [xValues, yValues];
        const maxVal = Math.max(...yValues.map(Math.abs));
        delta = maxVal / 300;
    };

    const appendData = () => {
        chart.setData(DATA);
    };

    const updateChart = (_frame) => {
        chart.setScale('y', { min: chart.scales.y.min - delta, max: chart.scales.y.max + delta });
        return seriesNum * DATA[0].length;
    };

    const deleteChart = () => {
        chart?.destroy();
        const chartDiv = document.getElementById('chart-root');
        chartDiv.innerHTML = '';
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
    let yAxis;
    let delta;
    let DATA;

    function candlestickPlugin({
        gap = 2,
        shadowColor = '#000000',
        bearishColor = '#e54245',
        bullishColor = '#4ab650',
        bodyMaxWidth = 20,
        shadowWidth = 2,
        bodyOutline = 1,
    } = {}) {
        function drawCandles(u) {
            if (!DATA) {
                return;
            }

            u.ctx.save();

            const offset = (shadowWidth % 2) / 2;

            u.ctx.translate(offset, offset);

            let [iMin, iMax] = u.series[0].idxs;

            for (let i = iMin; i <= iMax; i++) {
                let xVal = DATA[0][i];
                let open = DATA[1][i];
                let high = DATA[2][i];
                let low = DATA[3][i];
                let close = DATA[4][i];

                let timeAsX = u.valToPos(xVal, 'x', true);
                let lowAsY = u.valToPos(low, 'y', true);
                let highAsY = u.valToPos(high, 'y', true);
                let openAsY = u.valToPos(open, 'y', true);
                let closeAsY = u.valToPos(close, 'y', true);

                // shadow rect
                let shadowHeight = Math.max(highAsY, lowAsY) - Math.min(highAsY, lowAsY);
                let shadowX = timeAsX - shadowWidth / 2;
                let shadowY = Math.min(highAsY, lowAsY);

                u.ctx.fillStyle = shadowColor;
                u.ctx.fillRect(
                    Math.round(shadowX),
                    Math.round(shadowY),
                    Math.round(shadowWidth),
                    Math.round(shadowHeight)
                );

                // body rect
                let columnWidth = u.bbox.width / (iMax - iMin);
                let bodyWidth = Math.min(bodyMaxWidth, columnWidth - gap);
                let bodyHeight = Math.max(closeAsY, openAsY) - Math.min(closeAsY, openAsY);
                let bodyX = timeAsX - bodyWidth / 2;
                let bodyY = Math.min(closeAsY, openAsY);
                let bodyColor = open > close ? bearishColor : bullishColor;

                u.ctx.fillStyle = shadowColor;
                u.ctx.fillRect(Math.round(bodyX), Math.round(bodyY), Math.round(bodyWidth), Math.round(bodyHeight));

                u.ctx.fillStyle = bodyColor;
                u.ctx.fillRect(
                    Math.round(bodyX + bodyOutline),
                    Math.round(bodyY + bodyOutline),
                    Math.round(bodyWidth - bodyOutline * 2),
                    Math.round(bodyHeight - bodyOutline * 2)
                );
            }

            u.ctx.translate(-offset, -offset);

            u.ctx.restore();
        }

        return {
            opts: (u, opts) => {
                uPlot.assign(opts, {
                    cursor: {
                        points: {
                            show: false,
                        },
                    },
                });

                opts.series.forEach((series) => {
                    series.paths = () => null;
                    series.points = { show: false };
                });
            },
            hooks: {
                draw: drawCandles,
            },
        };
    }

    const createChart = async () => {
        let opts = {
            width: 800,
            height: 600,
            padding: [10, 10, 10, 10],
            cursor: {
                show: false,
            },
            legend: {
                show: false,
            },
            scales: {
                x: {
                    time: false,
                },
                y: { auto: true, min: 0, max: 1 },
            },
            plugins: [candlestickPlugin()],
            series: [{}, {}, {}, {}],
        };

        chart = new uPlot(opts, [], document.getElementById('chart-root'));
    };

    const generateData = () => {
        // date, open, high, low, close
        const ohlcDataArr = [[], [], [], [], []];

        for (let i = 0; i < pointsNum; i++) {
            const date = i;
            const open = Math.random();
            const close = Math.random();
            const val1 = Math.random();
            const val2 = Math.random();
            const high = Math.max(val1, val2, open, close);
            const low = Math.min(val1, val2, open, close);

            ohlcDataArr[0].push(date);
            ohlcDataArr[1].push(open);
            ohlcDataArr[2].push(high);
            ohlcDataArr[3].push(low);
            ohlcDataArr[4].push(close);
        }
        DATA = ohlcDataArr;
    };

    const appendData = () => {
        chart.setData(DATA);

        const min = chart.scales.y.min;
        const max = chart.scales.y.max;

        const maxVal = Math.abs(max);
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        chart.setScale('y', { min: 0, max: chart.scales.y.max + delta });
        return seriesNum * DATA[0].length;
    };

    const deleteChart = () => {
        chart?.destroy();
        const chartDiv = document.getElementById('chart-root');
        chartDiv.innerHTML = '';
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
    let DATA = [];
    const appendCount = incrementPoints;
    let index = 0;

    const createChart = async () => {
        let opts = {
            width: 800,
            height: 600,
            padding: [10, 10, 10, 10],
            cursor: {
                show: false,
            },
            legend: {
                show: false,
            },
            scales: {
                x: {
                    time: false,
                    auto: false,
                    min: 0,
                    max: pointsNum,
                },
                y: { 
                    auto: false, 
                    min: 0, 
                    max: seriesNum * 2 + 1 
                },
            },
        };

        chart = new uPlot(opts, [], document.getElementById('chart-root'));
    };

    const generateDataInner = (seriesNum$, pointsNum$, startIndex = 0) => {
        const result = [];
        
        // Generate x values (first array)
        const xArr = [];
        for (let j = 0; j < pointsNum$; j++) {
            xArr.push(startIndex + j);
        }
        result.push(xArr);
        
        // Generate y values for each series
        for (let i = 0; i < seriesNum$; i++) {
            const yOffset = i * 2;
            const yArr = [];
            for (let j = 0; j < pointsNum$; j++) {
                const val = Math.random() + yOffset;
                yArr.push(val);
            }
            result.push(yArr);
        }
        
        return result;
    };

    const generateData = () => {
        DATA = generateDataInner(seriesNum, pointsNum);
    };

    const appendData = () => {
        // Add series dynamically after setting initial data
        chart.setData(DATA);
        
        // Add series for each data array (skip first which is x-axis)
        for (let i = 1; i < DATA.length; i++) {
            const hue = (360 * (i-1)) / seriesNum;
            chart.addSeries({
                stroke: `hsl(${hue}, 70%, 50%)`,
                width: 2,
                points: {
                    show: false,
                },
            }, i);
        }
        
        index += pointsNum;
    };

    const updateChart = (_frame) => {
        const newData = generateDataInner(seriesNum, appendCount, index);
        
        // Append new data to existing data
        const updatedData = [];
        
        // Handle x values (first array)
        updatedData[0] = [...DATA[0], ...newData[0]];
        
        // Handle y values for each series
        for (let i = 1; i <= seriesNum; i++) {
            updatedData[i] = [...DATA[i], ...newData[i]];
        }
        
        // Keep only the last 'pointsNum' points for sliding window effect
        if (updatedData[0].length > pointsNum) {
            const excess = updatedData[0].length - pointsNum;
            for (let i = 0; i < updatedData.length; i++) {
                updatedData[i] = updatedData[i].slice(excess);
            }
        }
        
        DATA = updatedData;
        chart.setData(DATA);
        
        // Update x-axis range to show sliding window
        const xMin = DATA[0][0];
        const xMax = DATA[0][DATA[0].length - 1];
        chart.setScale('x', { min: xMin, max: xMax });
        
        index += appendCount;
        return seriesNum * index;
    };

    const deleteChart = () => {
        chart?.destroy();
        const chartDiv = document.getElementById('chart-root');
        chartDiv.innerHTML = '';
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
    let chart;
    let yAxis;
    let delta;
    let DATA;

    const createChart = async () => {
        let opts = {
            width: 800,
            height: 600,
            padding: [10, 10, 10, 10],
            cursor: {
                show: false,
            },
            legend: {
                show: false,
            },
            scales: {
                x: {
                    time: false,
                },
                y: { auto: true, min: -100, max: 100 },
            },
            series: [
                {},
                {
                    stroke: 'red',
                    fill: 'rgba(255,0,0,0.1)',
                },
            ],
        };

        chart = new uPlot(opts, [], document.getElementById('chart-root'));
    };

    const generateData = () => {
        let min = Number.MAX_VALUE;
        let max = Number.MIN_VALUE;
        const updateMinMax = (value) => {
            if (value < min) min = value;
            if (value > max) max = value;
        };
        const xValues = [];
        const areaRangeSeriesPointsArr = [];

        let prevYValue = 0;
        for (let i = 0; i < pointsNum; i++) {
            const curYValue = Math.random() * 10 - 5;
            prevYValue += curYValue;
            xValues.push(i);
            // we need to keep track of min/max values by ourselves or to use setTimeout, because
            // chart.scales.y.min does not get updated right away
            updateMinMax(prevYValue);
            areaRangeSeriesPointsArr.push(prevYValue);
        }
        DATA = [xValues, areaRangeSeriesPointsArr];
        delta = Math.max(Math.abs(min), Math.abs(max)) / 300;
    };

    const appendData = () => {
        chart.setData(DATA);
    };

    const updateChart = (_frame) => {
        chart.setScale('y', { min: chart.scales.y.min - delta, max: chart.scales.y.max + delta });
        return seriesNum * DATA[0].length;
    };

    const deleteChart = () => {
        chart?.destroy();
        const chartDiv = document.getElementById('chart-root');
        chartDiv.innerHTML = '';
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
    let chart;
    let yAxis;
    let series;
    const appendCount = incrementPoints;
    let points = 0;
    let prevYValue = 0;
    let DATA = [[], []];

    const createChart = async () => {
        let opts = {
            width: 800,
            height: 600,
            padding: [10, 10, 10, 10],
            cursor: {
                show: false,
            },
            legend: {
                show: false,
            },
            scales: {
                x: {
                    time: false,
                },
                y: { auto: true, min: -100, max: 100 },
            },
            series: [
                {},
                {
                    stroke: 'red',
                },
            ],
        };

        chart = new uPlot(opts, [], document.getElementById('chart-root'));
    };

    const generateDataInner = (pointsNum$, startIndex) => {
        for (let i = 0; i < pointsNum$; i++) {
            const curYValue = Math.random() * 10 - 5;
            // const curYValue = Math.random() * 10 - 5;
            // xValuesArr.push(startIndex + i);
            DATA[0].push(startIndex + i);
            prevYValue += curYValue;
            // yValuesArr.push(prevYValue);
            DATA[1].push(prevYValue);
        }
        points += pointsNum$;
        return DATA;
    };

    const generateData = () => {
        DATA = generateDataInner(pointsNum, 0);
    };

    const appendData = () => {
        chart.setData(DATA);
    };

    const updateChart = () => {
        generateDataInner(appendCount, points);
        chart.setData(DATA);
        return DATA[0].length;
    };

    const deleteChart = () => {
        chart?.destroy();
        const chartDiv = document.getElementById('chart-root');
        chartDiv.innerHTML = '';
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
    let DATA = [[], []];
    const appendCount = incrementPoints;
    let points = 0;
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
        }

        // Set chart root to use absolute positioning
        chartRootDiv.style.position = 'relative';

        // Create each chart
        try {
            for (let c = 0; c < chartsNum; c++) {
                let opts = {
                    width: chartRootDiv.offsetWidth * (chartWidth / 100),
                    height: chartRootDiv.offsetHeight * (chartHeight / 100),
                    padding: [10, 10, 10, 10],
                    cursor: {
                        show: false,
                    },
                    legend: {
                        show: false,
                    },
                    scales: {
                        x: {
                            time: false,
                        },
                        y: { auto: true, min: -100, max: 100 },
                    },
                    series: [
                        {},
                        {
                            stroke: 'red',
                        },
                    ],
                };

                const chart = new uPlot(opts, [], document.getElementById(`chart-${c}`));
                charts.push(chart);
            }
        } catch (error) {
            console.error('Failed to create charts:', error);
            charts.forEach(chart => chart?.destroy());
            charts = [];
            return false;
        }
    };

    const generateDataInner = (pointsNum$, startIndex) => {
        const xArr = [];
        const yArr = [];
        
        for (let i = 0; i < pointsNum$; i++) {
            const curYValue = fastRandom() * 10 - 5;
            xArr.push(startIndex + i);
            prevYValue += curYValue;
            yArr.push(prevYValue);
        }
        points += pointsNum$;
        return [xArr, yArr];
    };

    const generateData = () => {
        DATA = generateDataInner(pointsNum, 0);
    };

    const appendData = () => {
        // Add data to each chart
        for (let c = 0; c < chartsNum; c++) {
            charts[c].setData(DATA);
        }
    };

    const updateChart = () => {
        const newData = generateDataInner(appendCount, points);
        
        // Update all charts with the same data
        for (let c = 0; c < chartsNum; c++) {
            DATA[0] = DATA[0].concat(newData[0]);
            DATA[1] = DATA[1].concat(newData[1]);
            charts[c].setData(DATA);
        }
        
        return DATA[0].length;
    };

    const deleteChart = () => {
        charts.forEach(chart => chart?.destroy());
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

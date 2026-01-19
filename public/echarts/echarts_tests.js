'use strict';

function eLibName() {
    return 'Apache ECharts';
}

function eLibVersion() {
    return echarts.version;
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
    let currentYRange;

    const createChart = async () => {
        const chartRoot = document.getElementById('chart-root');
        chartRoot.style.width = '100%';
        chartRoot.style.height = '100%';
        
        CHART = echarts.init(chartRoot, null, {
            renderer: 'canvas',
            useDirtyRect: true
        });

        const option = {
            animation: false,
            grid: {
                left: 50,
                right: 50,
                top: 20,
                bottom: 50
            },
            xAxis: {
                type: 'value',
                min: 0,
                max: pointsNum,
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            yAxis: {
                type: 'value',
                min: -300,
                max: 300,
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            series: []
        };

        CHART.setOption(option);
        currentYRange = { min: -300, max: 300 };
    };

    const generateData = () => {
        const seriesData = [];
        
        for (let i = 0; i < seriesNum; i++) {
            const data = [];
            let prevYValue = 0;
            
            for (let j = 0; j < pointsNum; j++) {
                const curYValue = Math.random() * 10 - 5;
                prevYValue += curYValue;
                data.push([j, prevYValue]);
            }
            
            seriesData.push({
                type: 'line',
                data: data,
                symbol: 'none',
                lineStyle: {
                    width: 2,
                    color: `hsl(${(i * 360 / seriesNum) % 360}, 70%, 50%)`
                },
                large: true,
                largeThreshold: 100
            });
        }
        
        DATA = seriesData;
    };

    const appendData = () => {
        CHART.setOption({
            series: DATA
        });
        
        const maxVal = Math.max(Math.abs(currentYRange.min), Math.abs(currentYRange.max));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        currentYRange.min -= delta;
        currentYRange.max += delta;
        
        CHART.setOption({
            yAxis: {
                min: currentYRange.min,
                max: currentYRange.max
            }
        });
        
        return seriesNum * pointsNum;
    };

    const deleteChart = () => {
        if (CHART) {
            CHART.dispose();
            CHART = null;
        }
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
    let DATA;
    let CHART;
    const X_MAX = 100;
    const Y_MAX = 50;
    const EXTRA = 10;

    const createChart = async () => {
        const chartRoot = document.getElementById('chart-root');
        chartRoot.style.width = '100%';
        chartRoot.style.height = '100%';
        
        CHART = echarts.init(chartRoot, null, {
            renderer: 'canvas',
            useDirtyRect: true
        });

        const option = {
            animation: false,
            grid: {
                left: 50,
                right: 50,
                top: 20,
                bottom: 50
            },
            xAxis: {
                type: 'value',
                min: -EXTRA,
                max: X_MAX + EXTRA,
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            yAxis: {
                type: 'value',
                min: -EXTRA,
                max: Y_MAX + EXTRA,
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            series: []
        };

        CHART.setOption(option);
    };

    let newXValuesArr = [];
    let newYValuesArr = [];
    const generateNextPointsInner = (pointsNum$, xValuesArr, yValuesArr) => {
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
        const data = [];
        
        for (let i = 0; i < xValuesArr.length; i++) {
            data.push([xValuesArr[i], yValuesArr[i]]);
        }

        CHART.setOption({
            series: [{
                type: 'scatter',
                data: data,
                symbolSize: 5,
                itemStyle: {
                    color: '#00FF00'
                },
                large: true,
                largeThreshold: 100
            }]
        });
    };

    const updateChart = (_frame) => {
        DATA = generateNextPointsInner(pointsNum, DATA.xValuesArr, DATA.yValuesArr);
        const { xValuesArr, yValuesArr } = DATA;
        const data = [];
        
        for (let i = 0; i < xValuesArr.length; i++) {
            data.push([xValuesArr[i], yValuesArr[i]]);
        }

        CHART.setOption({
            series: [{
                data: data
            }]
        });
        
        return xValuesArr.length;
    };

    const deleteChart = () => {
        if (CHART) {
            CHART.dispose();
            CHART = null;
        }
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
    let DATA;
    let CHART;
    const X_MAX = 100;
    const Y_MAX = 50;
    const EXTRA = 10;

    const createChart = async () => {
        const chartRoot = document.getElementById('chart-root');
        chartRoot.style.width = '100%';
        chartRoot.style.height = '100%';
        
        CHART = echarts.init(chartRoot, null, {
            renderer: 'canvas',
            useDirtyRect: true
        });

        const option = {
            animation: false,
            grid: {
                left: 50,
                right: 50,
                top: 20,
                bottom: 50
            },
            xAxis: {
                type: 'value',
                min: -EXTRA,
                max: X_MAX + EXTRA,
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            yAxis: {
                type: 'value',
                min: -EXTRA,
                max: Y_MAX + EXTRA,
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            series: []
        };

        CHART.setOption(option);
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
        const data = [];
        
        for (let i = 0; i < xValuesArr.length; i++) {
            data.push([xValuesArr[i], yValuesArr[i]]);
        }

        CHART.setOption({
            series: [{
                type: 'line',
                data: data,
                symbol: 'none',
                lineStyle: {
                    width: 2,
                    color: '#00FF00'
                },
                large: true,
                largeThreshold: 100
            }]
        });
    };

    const updateChart = (_frame) => {
        DATA = generateNextPointsInner(pointsNum, DATA.xValuesArr, DATA.yValuesArr);
        const { xValuesArr, yValuesArr } = DATA;
        const data = [];
        
        for (let i = 0; i < xValuesArr.length; i++) {
            data.push([xValuesArr[i], yValuesArr[i]]);
        }

        CHART.setOption({
            series: [{
                data: data
            }]
        });
        
        return xValuesArr.length;
    };

    const deleteChart = () => {
        if (CHART) {
            CHART.dispose();
            CHART = null;
        }
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
    let DATA;
    let CHART;
    const Y_MAX = 50;
    const EXTRA = 10;

    const createChart = async () => {
        const chartRoot = document.getElementById('chart-root');
        chartRoot.style.width = '100%';
        chartRoot.style.height = '100%';
        
        CHART = echarts.init(chartRoot, null, {
            renderer: 'canvas',
            useDirtyRect: true
        });

        const option = {
            animation: false,
            grid: {
                left: 50,
                right: 50,
                top: 20,
                bottom: 50
            },
            xAxis: {
                type: 'value',
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            yAxis: {
                type: 'value',
                min: -EXTRA,
                max: Y_MAX + EXTRA,
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            series: []
        };

        CHART.setOption(option);
    };

    let newXYValuesArr = [];
    const generateNextPoints = (pointsNum$, xyValuesArr) => {
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
        const data = xyValuesArr.map(point => [point.x, point.y]);
        
        CHART.setOption({
            series: [{
                type: 'line',
                data: data,
                symbol: 'circle',
                symbolSize: 10,
                itemStyle: {
                    color: 'white',
                    borderColor: '#00FF00',
                    borderWidth: 1
                },
                lineStyle: {
                    color: '#00FF00',
                    width: 2
                },
                large: true,
                largeThreshold: 100
            }]
        });
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA);
        const xyValuesArr = DATA;
        const data = xyValuesArr.map(point => [point.x, point.y]);
        
        CHART.setOption({
            series: [{
                data: data
            }]
        });
        
        return data.length;
    };

    const deleteChart = () => {
        if (CHART) {
            CHART.dispose();
            CHART = null;
        }
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
    let DATA;
    let CHART;
    let delta;
    let currentYRange;

    const createChart = async () => {
        const chartRoot = document.getElementById('chart-root');
        chartRoot.style.width = '100%';
        chartRoot.style.height = '100%';
        
        CHART = echarts.init(chartRoot, null, {
            renderer: 'canvas',
            useDirtyRect: true
        });

        const option = {
            animation: false,
            grid: {
                left: 50,
                right: 50,
                top: 20,
                bottom: 50
            },
            xAxis: {
                type: 'category',
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            series: []
        };

        CHART.setOption(option);
    };

    const generateData = () => {
        const xValuesArr = [];
        const yValuesArrArr = [];
        
        for (let i = 0; i < seriesNum; i++) {
            yValuesArrArr.push([]);

            let prevYValue = 0;
            for (let j = 0; j < pointsNum; j++) {
                if (i === 0) xValuesArr.push(j.toString());
                const curYValue = Math.random() * 10 - 5;
                yValuesArrArr[i].push(prevYValue + curYValue);
                prevYValue += curYValue;
            }
        }
        
        DATA = { xValuesArr, yValuesArrArr };
    };

    const appendData = () => {
        const { xValuesArr, yValuesArrArr } = DATA;
        const series = [];
        
        yValuesArrArr.forEach((yValuesArr, index) => {
            series.push({
                type: 'bar',
                data: yValuesArr,
                large: true,
                largeThreshold: 100
            });
        });

        CHART.setOption({
            xAxis: {
                data: xValuesArr
            },
            series: series
        });

        // Get current Y range for delta calculation
        const option = CHART.getOption();
        const yAxisOption = option.yAxis[0];
        currentYRange = {
            min: yAxisOption.min || Math.min(...yValuesArrArr.flat()),
            max: yAxisOption.max || Math.max(...yValuesArrArr.flat())
        };
        
        const maxVal = Math.max(Math.abs(currentYRange.min), Math.abs(currentYRange.max));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        currentYRange.min -= delta;
        currentYRange.max += delta;
        
        CHART.setOption({
            yAxis: {
                min: currentYRange.min,
                max: currentYRange.max
            }
        });
        
        return seriesNum * pointsNum;
    };

    const deleteChart = () => {
        if (CHART) {
            CHART.dispose();
            CHART = null;
        }
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
    let DATA;
    let CHART;
    let delta;
    let currentYRange;

    const createChart = async () => {
        const chartRoot = document.getElementById('chart-root');
        chartRoot.style.width = '100%';
        chartRoot.style.height = '100%';
        
        CHART = echarts.init(chartRoot, null, {
            renderer: 'canvas',
            useDirtyRect: true
        });

        const option = {
            animation: false,
            grid: {
                left: 50,
                right: 50,
                top: 20,
                bottom: 50
            },
            xAxis: {
                type: 'category',
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { show: false },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { show: false },
                splitLine: { show: false }
            },
            series: []
        };

        CHART.setOption(option);
    };

    const generateData = () => {
        const xValuesArr = [];
        const candlestickData = [];

        for (let i = 0; i < pointsNum; i++) {
            const open = Math.random();
            const close = Math.random();
            const val1 = Math.random();
            const val2 = Math.random();
            const high = Math.max(val1, val2, open, close);
            const low = Math.min(val1, val2, open, close);
            
            xValuesArr.push(i.toString());
            candlestickData.push([open, close, low, high]);
        }

        DATA = { xValuesArr, candlestickData };
    };

    const appendData = () => {
        const { xValuesArr, candlestickData } = DATA;

        CHART.setOption({
            xAxis: {
                data: xValuesArr
            },
            series: [{
                type: 'candlestick',
                data: candlestickData,
                itemStyle: {
                    color: '#17BECF',
                    color0: '#7F7F7F',
                    borderColor: '#17BECF',
                    borderColor0: '#7F7F7F'
                },
                large: true,
                largeThreshold: 100
            }]
        });

        // Get current Y range for delta calculation efficiently without spread operator
        let min = Number.MAX_VALUE;
        let max = Number.MIN_VALUE;
        for (let i = 0; i < candlestickData.length; i++) {
            const candle = candlestickData[i];
            for (let j = 0; j < candle.length; j++) {
                const value = candle[j];
                if (value < min) min = value;
                if (value > max) max = value;
            }
        }
        currentYRange = { min, max };
        
        const maxVal = Math.max(Math.abs(currentYRange.min), Math.abs(currentYRange.max));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        currentYRange.min -= delta;
        currentYRange.max += delta;
        
        CHART.setOption({
            yAxis: {
                min: currentYRange.min,
                max: currentYRange.max
            }
        });
        
        return seriesNum * pointsNum;
    };

    const deleteChart = () => {
        if (CHART) {
            CHART.dispose();
            CHART = null;
        }
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
    let DATA;
    let CHART;
    let size = 0;

    const createChart = async () => {
        const chartRoot = document.getElementById('chart-root');
        chartRoot.style.width = '100%';
        chartRoot.style.height = '100%';
        
        CHART = echarts.init(chartRoot, null, {
            renderer: 'canvas',
            useDirtyRect: true
        });

        const option = {
            animation: false,
            grid: {
                left: 50,
                right: 50,
                top: 20,
                bottom: 50
            },
            xAxis: {
                type: 'value',
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            series: []
        };

        CHART.setOption(option);
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
        const { xArr, yArrArr } = DATA;
        const series = [];
        
        for (let i = 0; i < seriesNum; i++) {
            const data = [];
            for (let j = 0; j < xArr.length; j++) {
                data.push([xArr[j], yArrArr[i][j]]);
            }
            
            series.push({
                type: 'line',
                data: data,
                symbol: 'none',
                lineStyle: {
                    width: 2,
                    color: `hsl(${(i * 360 / seriesNum) % 360}, 70%, 50%)`
                },
                large: true,
                largeThreshold: 100
            });
        }

        CHART.setOption({
            series: series
        });
        
        size += pointsNum;
    };

    const updateChart = (_frame) => {
        const { xArr, yArrArr } = generateDataInner(seriesNum, incrementPoints, size);
        
        // Get current series data and extend it
        const option = CHART.getOption();
        const currentSeries = option.series;
        
        for (let i = 0; i < seriesNum; i++) {
            const newData = [];
            for (let j = 0; j < xArr.length; j++) {
                newData.push([xArr[j], yArrArr[i][j]]);
            }
            
            // Implement FIFO behaviour
            let updatedData = currentSeries[i].data.concat(newData);
            
            // If we exceed pointsNum, remove old points from the beginning
            if (updatedData.length > pointsNum) {
                const pointsToRemove = updatedData.length - pointsNum;
                updatedData = updatedData.slice(pointsToRemove);
            }
            
            currentSeries[i].data = updatedData;
        }
        
        size += incrementPoints;
        
        // Calculate the actual data size (limited by pointsNum)
        const actualDataSize = Math.min(size, pointsNum);
        const xMin = size - actualDataSize;
        const xMax = size;
        
        CHART.setOption({
            xAxis: {
                min: xMin,
                max: xMax
            },
            series: currentSeries
        });
        
        return seriesNum * size;
    };

    const deleteChart = () => {
        if (CHART) {
            CHART.dispose();
            CHART = null;
        }
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
    let DATA;
    let CHART;
    let delta;
    let currentYRange;

    const createChart = async () => {
        const chartRoot = document.getElementById('chart-root');
        chartRoot.style.width = '100%';
        chartRoot.style.height = '100%';
        
        CHART = echarts.init(chartRoot, null, {
            renderer: 'canvas',
            useDirtyRect: true
        });

        const option = {
            animation: false,
            grid: {
                left: 50,
                right: 50,
                top: 20,
                bottom: 50
            },
            xAxis: {
                type: 'value',
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            series: []
        };

        CHART.setOption(option);
    };

    const generateData = () => {
        const xValuesArr = [];
        const yValuesArrArr = [];
        for (let i = 0; i < seriesNum; i++) {
            yValuesArrArr.push([]);

            let prevYValue = 0;
            for (let j = 0; j < pointsNum; j++) {
                if (i === 0) xValuesArr.push(j);
                const curYValue = Math.random() * 10 - 5;
                yValuesArrArr[i].push(prevYValue + curYValue);
                prevYValue += curYValue;
            }
        }
        DATA = { xValuesArr, yValuesArrArr };
    };

    const appendData = () => {
        const { xValuesArr, yValuesArrArr } = DATA;
        const series = [];
        
        yValuesArrArr.forEach((yValuesArr, index) => {
            const data = [];
            for (let i = 0; i < xValuesArr.length; i++) {
                data.push([xValuesArr[i], yValuesArr[i]]);
            }
            
            series.push({
                type: 'line',
                data: data,
                symbol: 'none',
                areaStyle: {
                    color: `hsla(${(index * 360 / seriesNum) % 360}, 70%, 50%, 0.3)`
                },
                lineStyle: {
                    width: 2,
                    color: `hsl(${(index * 360 / seriesNum) % 360}, 70%, 50%)`
                },
                large: true,
                largeThreshold: 100
            });
        });

        CHART.setOption({
            series: series
        });

        // Get current Y range for delta calculation
        const allValues = yValuesArrArr.flat();
        currentYRange = {
            min: Math.min(...allValues),
            max: Math.max(...allValues)
        };
        
        const maxVal = Math.max(Math.abs(currentYRange.min), Math.abs(currentYRange.max));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        currentYRange.min -= delta;
        currentYRange.max += delta;
        
        CHART.setOption({
            yAxis: {
                min: currentYRange.min,
                max: currentYRange.max
            }
        });
        
        return seriesNum * pointsNum;
    };

    const deleteChart = () => {
        if (CHART) {
            CHART.dispose();
            CHART = null;
        }
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
    let allData = [];

    const createChart = async () => {
        const chartRoot = document.getElementById('chart-root');
        chartRoot.style.width = '100%';
        chartRoot.style.height = '100%';
        
        CHART = echarts.init(chartRoot, null, {
            renderer: 'canvas',
            useDirtyRect: true
        });

        const option = {
            animation: false,
            grid: {
                left: 50,
                right: 50,
                top: 20,
                bottom: 50
            },
            xAxis: {
                type: 'value',
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true }
            },
            series: []
        };

        CHART.setOption(option);
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
        const data = [];
        
        for (let i = 0; i < xArr.length; i++) {
            data.push([xArr[i], yArr[i]]);
        }
        
        allData = data;

        CHART.setOption({
            series: [{
                type: 'line',
                data: data,
                symbol: 'none',
                lineStyle: {
                    width: 2,
                    color: '#00FF00'
                },
                large: true,
                largeThreshold: 100
            }]
        });
        
        size += pointsNum;
    };

    const updateChart = (_frame) => {
        const { xArr, yArr } = generateDataInner(incrementPoints, size);
        const newData = [];
        
        for (let i = 0; i < xArr.length; i++) {
            newData.push([xArr[i], yArr[i]]);
        }
        
        allData = allData.concat(newData);
        size += incrementPoints;
        
        CHART.setOption({
            series: [{
                data: allData
            }]
        });
        
        return allData.length;
    };

    const deleteChart = () => {
        if (CHART) {
            CHART.dispose();
            CHART = null;
        }
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
    let size = 0;
    let prevYValue = 0;
    let allDataArrays = [];
    const chartRootDiv = document.getElementById('chart-root');

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
        fastRandomSeed = 1;

        chartRootDiv.innerHTML = '';

        const { cols, rows } = getGridDimensions(chartsNum);
        const chartWidth = 100 / cols;
        const chartHeight = 100 / rows;

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

        chartRootDiv.style.position = 'relative';

        try {
            for (let c = 0; c < chartsNum; c++) {
                const chart = echarts.init(document.getElementById(`chart-${c}`), null, {
                    renderer: 'canvas',
                    useDirtyRect: true
                });

                const option = {
                    animation: false,
                    grid: {
                        left: 10,
                        right: 10,
                        top: 10,
                        bottom: 10
                    },
                    xAxis: {
                        type: 'value',
                        show: chartsNum < 16,
                        axisLine: { show: chartsNum < 16 },
                        axisTick: { show: chartsNum < 16 },
                        axisLabel: { show: chartsNum < 16 },
                        splitLine: { show: chartsNum < 16 }
                    },
                    yAxis: {
                        type: 'value',
                        show: chartsNum < 16,
                        axisLine: { show: chartsNum < 16 },
                        axisTick: { show: chartsNum < 16 },
                        axisLabel: { show: chartsNum < 16 },
                        splitLine: { show: chartsNum < 16 }
                    },
                    series: []
                };

                chart.setOption(option);
                charts.push(chart);
                allDataArrays.push([]);
            }
        } catch (error) {
            console.error('Failed to create charts:', error);
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
        const data = [];
        
        for (let i = 0; i < xArr.length; i++) {
            data.push([xArr[i], yArr[i]]);
        }
        
        for (let c = 0; c < chartsNum; c++) {
            allDataArrays[c] = [...data];
            
            charts[c].setOption({
                series: [{
                    type: 'line',
                    data: data,
                    symbol: 'none',
                    lineStyle: {
                        width: 2,
                        color: '#00FF00'
                    },
                    large: true,
                    largeThreshold: 100
                }]
            });
        }
        
        size += pointsNum;
    };

    const updateChart = (_frame) => {
        const { xArr, yArr } = generateDataInner(incrementPoints, size);
        const newData = [];
        
        for (let i = 0; i < xArr.length; i++) {
            newData.push([xArr[i], yArr[i]]);
        }
        
        for (let c = 0; c < chartsNum; c++) {
            allDataArrays[c] = allDataArrays[c].concat(newData);
            
            charts[c].setOption({
                series: [{
                    data: allDataArrays[c]
                }]
            });
        }
        
        size += incrementPoints;
        return allDataArrays[0].length;
    };

    const deleteChart = () => {
        charts.forEach(chart => {
            if (chart) {
                chart.dispose();
            }
        });
        charts = [];
        allDataArrays = [];
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
    let CHART;
    let DATA;
    const heatmapSize = pointsNum;

    const createChart = async () => {
        const chartRoot = document.getElementById('chart-root');
        chartRoot.style.width = '100%';
        chartRoot.style.height = '100%';
        
        CHART = echarts.init(chartRoot, null, {
            renderer: 'canvas',
            useDirtyRect: true
        });

        // Setup x,y axis categories
        const xData = [];
        const yData = [];
        for (let i = 0; i < heatmapSize; i++) {
            xData.push(i.toString());
            yData.push(i.toString());
        }

        const option = {
            animation: false,
            tooltip: {},
            grid: {
                left: 50,
                right: 50,
                top: 20,
                bottom: 50
            },
            xAxis: {
                type: 'category',
                data: xData,
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true },
                min: 0,
                max: heatmapSize - 1
            },
            yAxis: {
                type: 'category',
                data: yData,
                axisLine: { show: true },
                axisTick: { show: true },
                axisLabel: { show: true },
                splitLine: { show: true },
                min: 0,
                max: heatmapSize - 1
            },
            visualMap: {
                min: 0,
                max: 1,
                calculable: true,
                realtime: false,
                inRange: {
                    color: [
                        '#313695',
                        '#4575b4',
                        '#74add1',
                        '#abd9e9',
                        '#e0f3f8',
                        '#ffffbf',
                        '#fee090',
                        '#fdae61',
                        '#f46d43',
                        '#d73027',
                        '#a50026'
                    ]
                }
            },
            series: []
        };

        CHART.setOption(option);
    };

    const generateData = () => {
        // Preallocate arrays for better performance
        const totalDataPoints = heatmapSize * heatmapSize;
        const data = new Array(totalDataPoints);

        // Generate heatmap data
        for (let y = 0; y < heatmapSize; y++) {
            for (let x = 0; x < heatmapSize; x++) {
                data.push([x, y, Math.random()]);
            }
        }
        
        DATA = data;
    };

    const appendData = () => {
        CHART.setOption({
            series: [{
                name: 'Heatmap',
                type: 'heatmap',
                data: DATA,
                coordinateSystem: 'cartesian2d',
                // tells echarts to stretch each cell to fill the grid
                emphasis: { focus: 'none' },
                progressive: 0,
                animation: false
            }]
        });
    };

    const updateChart = (_frame) => {
        // Preallocate array for better performance
        const totalDataPoints = heatmapSize * heatmapSize;
        const newData = new Array(totalDataPoints);
        
        let dataIndex = 0;
        for (let y = 0; y < heatmapSize; y++) {
            for (let x = 0; x < heatmapSize; x++) {
                newData[dataIndex] = [x, y, Math.random()];
                dataIndex++;
            }
        }
        
        CHART.setOption({
            series: [{
                data: newData
            }]
        });
        
        return heatmapSize * heatmapSize;
    };

    const deleteChart = () => {
        if (CHART) {
            CHART.dispose();
            CHART = null;
        }
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

    const createChart = async () => {
        const chartRoot = document.getElementById('chart-root');
        chartRoot.style.width = '100%';
        chartRoot.style.height = '100%';
        
        CHART = echarts.init(chartRoot, null, {
            renderer: 'canvas',
            useDirtyRect: true
        });

        const option = {
            animation: false,
            grid3D: {
                boxWidth: 100,
                boxHeight: 100,
                boxDepth: 100,
                viewControl: {
                    projection: 'perspective',
                    autoRotate: false,
                    distance: 200,
                    alpha: 20,
                    beta: 40
                },
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                },
                axisPointer: {
                    lineStyle: {
                        color: '#ffbd67'
                    }
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                }
            },
            xAxis3D: {
                type: 'value',
                min: -100,
                max: 100,
                name: 'X',
                show: true,
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                },
                axisLabel: {
                    show: true,
                    color: '#333',
                    fontSize: 12,
                    margin: 8
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                },
                nameTextStyle: {
                    color: '#333',
                    fontSize: 14
                }
            },
            yAxis3D: {
                type: 'value',
                min: -100,
                max: 100,
                name: 'Y',
                show: true,
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                },
                axisLabel: {
                    show: true,
                    color: '#333',
                    fontSize: 12,
                    margin: 8
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                },
                nameTextStyle: {
                    color: '#333',
                    fontSize: 14
                }
            },
            zAxis3D: {
                type: 'value',
                min: -100,
                max: 100,
                name: 'Z',
                show: true,
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                },
                axisLabel: {
                    show: true,
                    color: '#333',
                    fontSize: 12,
                    margin: 8
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                },
                nameTextStyle: {
                    color: '#333',
                    fontSize: 14
                }
            },
            series: []
        };

        CHART.setOption(option);
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
            xValues: Array.from(newXValuesArr.slice(0, pointsNum$)),
            yValues: Array.from(newYValuesArr.slice(0, pointsNum$)),
            zValues: Array.from(newZValuesArr.slice(0, pointsNum$))
        };
    };

    const generateData = () => {
        DATA = generateNextPoints(pointCloudSize, undefined, undefined, undefined);
    };

    const appendData = () => {
        const { xValues, yValues, zValues } = DATA;
        const data = [];
        
        for (let i = 0; i < xValues.length; i++) {
            data.push([xValues[i], yValues[i], zValues[i]]);
        }
        
        CHART.setOption({
            series: [{
                type: 'scatter3D',
                data: data,
                symbolSize: 1,
                itemStyle: {
                    color: '#006400',
                    opacity: 1.0,
                    borderWidth: 0
                },
                emphasis: {
                    itemStyle: {
                        color: '#fff'
                    }
                }
            }]
        });
    };

    const updateChart = (_frame) => {
        // Generate new Brownian motion 3D points for dynamic updating
        DATA = generateNextPoints(pointCloudSize, DATA.xValues, DATA.yValues, DATA.zValues);
        const { xValues, yValues, zValues } = DATA;
        const data = [];
        
        for (let i = 0; i < xValues.length; i++) {
            data.push([xValues[i], yValues[i], zValues[i]]);
        }
        
        CHART.setOption({
            series: [{
                data: data
            }]
        }, false); // Don't merge, replace the data

        return pointCloudSize;
    };

    const deleteChart = () => {
        if (CHART) {
            CHART.dispose();
            CHART = null;
        }
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

    const createChart = async () => {
        const chartRoot = document.getElementById('chart-root');
        chartRoot.style.width = '100%';
        chartRoot.style.height = '100%';
        
        CHART = echarts.init(chartRoot, null, {
            renderer: 'canvas',
            useDirtyRect: true
        });

        const option = {
            animation: false,
            backgroundColor: '#fff',
            tooltip: {},
            visualMap: {
                show: false,
                dimension: 2,
                min: -0.5,
                max: 0.5,
                inRange: {
                    color: [
                        '#313695',
                        '#4575b4',
                        '#74add1',
                        '#abd9e9',
                        '#e0f3f8',
                        '#ffffbf',
                        '#fee090',
                        '#fdae61',
                        '#f46d43',
                        '#d73027',
                        '#a50026'
                    ]
                }
            },
            xAxis3D: {
                type: 'value',
                name: 'X',
                min: 0,
                max: surfaceSize - 1,
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                },
                axisLabel: {
                    show: true,
                    color: '#333'
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                }
            },
            yAxis3D: {
                type: 'value',
                name: 'Y',
                min: 0,
                max: surfaceSize - 1,
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                },
                axisLabel: {
                    show: true,
                    color: '#333'
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                }
            },
            zAxis3D: {
                type: 'value',
                name: 'Z',
                min: -0.5,
                max: 0.5,
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                },
                axisLabel: {
                    show: true,
                    color: '#333'
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                }
            },
            grid3D: {
                boxWidth: 100,
                boxHeight: 100,
                boxDepth: 100,
                viewControl: {
                    projection: 'perspective',
                    autoRotate: false,
                    distance: 200,
                    alpha: 20,
                    beta: 40
                },
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#333'
                    }
                }
            },
            series: []
        };

        CHART.setOption(option);
    };

    let animationFrame = 0;

    const generateData = () => {
        // No need to pre-generate data for equation-based surface
        // The equation will generate data dynamically
        DATA = { frame: 0 };
    };

    const appendData = () => {
        // Calculate step size based on surfaceSize to match Plotly's grid resolution
        const stepSize = (surfaceSize - 1) / (surfaceSize - 1);

        CHART.setOption({
            series: [{
                type: 'surface',
                wireframe: {
                    show: false
                },
                equation: {
                    x: {
                        step: stepSize,
                        min: 0,
                        max: surfaceSize - 1
                    },
                    y: {
                        step: stepSize,
                        min: 0,
                        max: surfaceSize - 1
                    },
                    z: function (x, y) {
                        // Convert x,y coordinates to match Plotly's indexing
                        const xVal = x - surfaceSize / 2;
                        const yVal = y - surfaceSize / 2;
                        // Generate the same wave pattern as Plotly implementation
                        const f = animationFrame / 10;
                        return (Math.cos(xVal * 0.2 + f) + Math.cos(yVal * 0.2 + f)) / 5;
                    }
                },
                shading: 'color',
                itemStyle: {
                    opacity: 0.8
                }
            }]
        });
    };

    const updateChart = (_frameNumber) => {
        // Update animation frame to match Plotly's animation
        animationFrame++;
        
        // Calculate step size based on surfaceSize to match Plotly's grid resolution
        const stepSize = (surfaceSize - 1) / (surfaceSize - 1);

        CHART.setOption({
            series: [{
                equation: {
                    x: {
                        step: stepSize,
                        min: 0,
                        max: surfaceSize - 1
                    },
                    y: {
                        step: stepSize,
                        min: 0,
                        max: surfaceSize - 1
                    },
                    z: function (x, y) {
                        // Convert x,y coordinates to match Plotly's indexing
                        const xVal = x - surfaceSize / 2;
                        const yVal = y - surfaceSize / 2;
                        // Generate the same wave pattern as Plotly implementation
                        const f = animationFrame / 10;
                        return (Math.cos(xVal * 0.2 + f) + Math.cos(yVal * 0.2 + f)) / 5;
                    }
                }
            }]
        }, false);

        return surfaceSize * surfaceSize;
    };

    const deleteChart = () => {
        if (CHART) {
            CHART.dispose();
            CHART = null;
        }
    };

    return {
        createChart,
        generateData,
        appendData,
        updateChart,
        deleteChart,
    };
}

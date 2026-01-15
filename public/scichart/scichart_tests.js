'use strict';

const lightAxisOptions = { 
    drawMinorGridLines: false, 
    drawMinorTicks: false, 
    drawMajorTicks: false, 
    drawMajorBands: false,
    allowFastMath: true
};

function eLibName() {
    return 'SciChart.js';
}

function eLibVersion() {
    return SciChart.libraryVersion;
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
    const {
        SciChartSurface,
        NumericAxis,
        XyDataSeries,
        NumberRange,
        EAutoRange,
        FastLineRenderableSeries,
        convertRgbToHexColor,
        SciChartDefaults
    } = SciChart;

    let DATA;
    let sciChartSurface;
    let wasmContext;
    let delta;
    let xAxis;
    let yAxis;

    const createChart = async () => {
        SciChartSurface.configure({
            wasmUrl: '/scichart/lib/scichart2d.wasm',
            noSimdUrl: '/scichart/lib/scichart2d.no-simd.wasm',
        });
        SciChartDefaults.useNativeText = true;

        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;

        xAxis = new NumericAxis(wasmContext, {
            visibleRange: new NumberRange(0, pointsNum),
            autoRange: EAutoRange.Never,
            ...lightAxisOptions,
        });
        sciChartSurface.xAxes.add(xAxis);

        yAxis = new NumericAxis(wasmContext, {
            visibleRange: new NumberRange(-300, 300),
            autoRange: EAutoRange.Never,
            ...lightAxisOptions,
        });
        sciChartSurface.yAxes.add(yAxis);
    };

    const generateData = () => {
        const xValuesArrArr = [];
        const yValuesArrArr = [];
        const strokeArr = [];
        for (let i = 0; i < seriesNum; i++) {
            xValuesArrArr.push([]);
            yValuesArrArr.push([]);

            // Generate stroke
            const r = Math.random();
            const g = Math.random();
            const b = Math.random();
            strokeArr.push(convertRgbToHexColor(r, g, b));

            // Generate points
            let prevYValue = 0;
            for (let j = 0; j < pointsNum; j++) {
                const curYValue = Math.random() * 10 - 5;
                xValuesArrArr[i].push(j);
                yValuesArrArr[i].push(prevYValue + curYValue);
                prevYValue += curYValue;
            }
        }
        DATA = { xValuesArrArr, yValuesArrArr, strokeArr };
    };

    const appendData = () => {
        const { xValuesArrArr, yValuesArrArr, strokeArr } = DATA;

        for (let i = 0; i < seriesNum; i++) {
            const dataSeries = new XyDataSeries(wasmContext, {
                dataIsSortedInX: true,
                dataEvenlySpacedInX: true,
                containsNaN: false,
            });
            dataSeries.appendRange(xValuesArrArr[i], yValuesArrArr[i]);

            const rendSeries = new FastLineRenderableSeries(wasmContext, {
                dataSeries,
                strokeThickness: 2,
                stroke: strokeArr[i],
            });
            sciChartSurface.renderableSeries.add(rendSeries);
        }
        const maxVal = Math.max(Math.abs(yAxis.visibleRange.min), Math.abs(yAxis.visibleRange.max));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        yAxis.visibleRange = new NumberRange(yAxis.visibleRange.min - delta, yAxis.visibleRange.max + delta);
        return seriesNum * sciChartSurface.renderableSeries.get(0).dataSeries.count();
    };

    const deleteChart = () => {
        sciChartSurface?.delete();
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
    const {
        SciChartSurface,
        NumericAxis,
        XyDataSeries,
        NumberRange,
        EAutoRange,
        XyScatterRenderableSeries,
        EllipsePointMarker,
        SciChartDefaults
    } = SciChart;

    let DATA;
    let wasmContext;
    let sciChartSurface;
    let dataSeries;
    const X_MAX = 100;
    const Y_MAX = 50;

    const createChart = async () => {
        const EXTRA = 10;

        SciChartSurface.configure({
            wasmUrl: '/scichart/lib/scichart2d.wasm',
            noSimdUrl: '/scichart/lib/scichart2d.no-simd.wasm',
        });
        SciChartDefaults.useNativeText = true;

        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;

        const xAxis = new NumericAxis(wasmContext, {
            visibleRange: new NumberRange(0 - EXTRA, X_MAX + EXTRA),
            autoRange: EAutoRange.Never,
            ...lightAxisOptions,
        });
        sciChartSurface.xAxes.add(xAxis);

        const yAxis = new NumericAxis(wasmContext, {
            visibleRange: new NumberRange(0 - EXTRA, Y_MAX + EXTRA),
            autoRange: EAutoRange.Never,
            ...lightAxisOptions,
        });
        sciChartSurface.yAxes.add(yAxis);
    };

    let newXValuesArr = [];
    let newYValuesArr = [];
    const generateNextPoints = (pointsNum$, xValuesArr, yValuesArr) => {
        // Every frame we call generateNextPoints. Re-use the same array if possible to avoid GC
        newXValuesArr = pointsNum$ > newXValuesArr.length ? new Array(pointsNum$) : newXValuesArr;
        newYValuesArr = pointsNum$ > newYValuesArr.length ? new Array(pointsNum$) : newYValuesArr;

        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = xValuesArr ? xValuesArr[i] : Math.round(Math.random() * X_MAX);
            const x = prevXValue + (Math.random() - 0.5);
            newXValuesArr[i] = x;
            const prevYValue = yValuesArr ? yValuesArr[i] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newYValuesArr[i] = y
        }

        return { xValuesArr: newXValuesArr, yValuesArr: newYValuesArr };
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined, undefined);
    };

    const appendData = () => {
        dataSeries = new XyDataSeries(wasmContext, {
            dataIsSortedInX: false,
            containsNaN: false,
        });
        const scatterSeries = new XyScatterRenderableSeries(wasmContext, {
            pointMarker: new EllipsePointMarker(wasmContext, {
                width: 5,
                height: 5,
                strokeThickness: 0,
                fill: '#00FF00',
                stroke: 'LightSteelBlue',
            }),
            dataSeries,
        });
        const { xValuesArr, yValuesArr } = DATA;
        dataSeries.appendRange(xValuesArr, yValuesArr);
        sciChartSurface.renderableSeries.add(scatterSeries);
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA.xValuesArr, DATA.yValuesArr);
        const { xValuesArr, yValuesArr } = DATA;
        dataSeries.clear();
        dataSeries.appendRange(xValuesArr, yValuesArr);
        return dataSeries.count();
    };

    const deleteChart = () => {
        sciChartSurface?.delete();
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
    const {
        SciChartSurface,
        NumericAxis,
        XyDataSeries,
        NumberRange,
        EAutoRange,
        FastLineRenderableSeries,
        SciChartDefaults
    } = SciChart;

    let DATA;
    let sciChartSurface;
    let wasmContext;
    let dataSeries;

    const X_MAX = 100;
    const Y_MAX = 50;

    const createChart = async () => {
        const EXTRA = 10;
        SciChartSurface.configure({
            wasmUrl: '/scichart/lib/scichart2d.wasm',
            noSimdUrl: '/scichart/lib/scichart2d.no-simd.wasm',
        });
        SciChartDefaults.useNativeText = true;

        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;

        const xAxis = new NumericAxis(wasmContext, {
            visibleRange: new NumberRange(0 - EXTRA, X_MAX + EXTRA),
            autoRange: EAutoRange.Never,
            isVisible: true,
            ...lightAxisOptions,
        });
        sciChartSurface.xAxes.add(xAxis);

        const yAxis = new NumericAxis(wasmContext, {
            visibleRange: new NumberRange(0 - EXTRA, Y_MAX + EXTRA),
            autoRange: EAutoRange.Never,
            isVisible: true,
            ...lightAxisOptions,
        });
        sciChartSurface.yAxes.add(yAxis);
    };

    let newXValuesArr = [];
    let newYValuesArr = [];
    const generateNextPoints = (pointsNum$, xValuesArr, yValuesArr) => {
        // Every frame we call generateNextPoints. Re-use the same array if possible to avoid GC
        newXValuesArr = pointsNum$ > newXValuesArr.length ? new Array(pointsNum$) : newXValuesArr;
        newYValuesArr = pointsNum$ > newYValuesArr.length ? new Array(pointsNum$) : newYValuesArr;

        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = xValuesArr ? xValuesArr[i] : Math.round(Math.random() * X_MAX);
            const x = prevXValue + (Math.random() - 0.5);
            newXValuesArr[i] = x;
            const prevYValue = yValuesArr ? yValuesArr[i] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newYValuesArr[i] = y;
        }

        return { xValuesArr: newXValuesArr, yValuesArr: newYValuesArr };
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined, undefined);
    };

    const appendData = () => {
        dataSeries = new XyDataSeries(wasmContext, {
            dataIsSortedInX: false,
            containsNaN: false,
        });
        const lineSeries = new FastLineRenderableSeries(wasmContext, {
            dataSeries,
            strokeThickness: 2,
            stroke: '#00FF00',
            // resamplingMode: EResamplingMode.None,
        });
        sciChartSurface.renderableSeries.add(lineSeries);

        const { xValuesArr, yValuesArr } = DATA;
        dataSeries.appendRange(xValuesArr, yValuesArr);
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA.xValuesArr, DATA.yValuesArr);
        const { xValuesArr, yValuesArr } = DATA;
        dataSeries.clear();
        dataSeries.appendRange(xValuesArr, yValuesArr);
        return dataSeries.count();
    };

    const deleteChart = () => {
        sciChartSurface?.delete();
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
    const {
        SciChartSurface,
        NumericAxis,
        XyDataSeries,
        NumberRange,
        EAutoRange,
        FastLineRenderableSeries,
        EllipsePointMarker,
        SciChartDefaults
    } = SciChart;

    let DATA;
    let sciChartSurface;
    let wasmContext;
    let dataSeries;

    const Y_MAX = 50;

    const createChart = async () => {
        const EXTRA = 10;
        SciChartSurface.configure({
            wasmUrl: '/scichart/lib/scichart2d.wasm',
            noSimdUrl: '/scichart/lib/scichart2d.no-simd.wasm',
        });
        SciChartDefaults.useNativeText = true;

        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;

        sciChartSurface.xAxes.add(new NumericAxis(wasmContext, {
            autoRange: EAutoRange.Once,
            isVisible: true,
            ...lightAxisOptions,
        }));

        sciChartSurface.yAxes.add(new NumericAxis(wasmContext, {
            visibleRange: new NumberRange(0 - EXTRA, Y_MAX + EXTRA),
            autoRange: EAutoRange.Never,
            isVisible: true,
            ...lightAxisOptions,
        }));
    };

    let newXValuesArr = [];
    let newYValuesArr = [];
    const generateNextPoints = (pointsNum$, xValuesArr, yValuesArr) => {
        // Every frame we call generateNextPoints. Re-use the same array if possible to avoid GC
        newXValuesArr = pointsNum$ > newXValuesArr.length ? new Array(pointsNum$) : newXValuesArr;
        newYValuesArr = pointsNum$ > newYValuesArr.length ? new Array(pointsNum$) : newYValuesArr;

        for (let i = 0; i < pointsNum$; i++) {
            newXValuesArr[i] = i;
            const prevYValue = yValuesArr ? yValuesArr[i] : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newYValuesArr[i] = y;
        }

        return { xValuesArr: newXValuesArr, yValuesArr: newYValuesArr };
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined, undefined);
    };

    const appendData = () => {
        dataSeries = new XyDataSeries(wasmContext, {
            dataIsSortedInX: true,
            dataIsEvenlySpaced: true,
            containsNaN: false,
        });
        const lineSeries = new FastLineRenderableSeries(wasmContext, {
            dataSeries,
            strokeThickness: 2,
            stroke: '#00FF00',
            pointMarker: new EllipsePointMarker(wasmContext, { width: 10, height: 10, fill: "White", stroke: "#00FF00", strokeThickness: 1})
        });
        sciChartSurface.renderableSeries.add(lineSeries);

        const { xValuesArr, yValuesArr } = DATA;
        dataSeries.appendRange(xValuesArr, yValuesArr);
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA.xValuesArr, DATA.yValuesArr);
        const { xValuesArr, yValuesArr } = DATA;
        dataSeries.clear();
        dataSeries.appendRange(xValuesArr, yValuesArr);
        return dataSeries.count();
    };

    const deleteChart = () => {
        sciChartSurface?.delete();
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
    const {
        SciChartSurface,
        NumericAxis,
        XyDataSeries,
        EAutoRange,
        FastColumnRenderableSeries,
        NumberRange,
        SciChartDefaults
    } = SciChart;

    let DATA;
    let sciChartSurface;
    let yAxis;
    let wasmContext;
    let delta;

    const createChart = async () => {
        SciChartSurface.configure({
            wasmUrl: '/scichart/lib/scichart2d.wasm',
            noSimdUrl: '/scichart/lib/scichart2d.no-simd.wasm',
        });
        SciChartDefaults.useNativeText = true;

        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;

        const xAxis = new NumericAxis(wasmContext, { ...lightAxisOptions });
        sciChartSurface.xAxes.add(xAxis);

        yAxis = new NumericAxis(wasmContext, { autoRange: EAutoRange.Once, ...lightAxisOptions });
        sciChartSurface.yAxes.add(yAxis);
    };

    const generateData = () => {
        const xValuesArr = [];
        const yValuesArr = [];

        let prevYValue = 0;
        for (let i = 0; i < pointsNum; i++) {
            const curYValue = Math.random() * 10 - 5;
            xValuesArr.push(i);
            prevYValue += curYValue;
            yValuesArr.push(prevYValue);
        }

        DATA = { xValuesArr, yValuesArr };
    };

    const appendData = () => {
        const { xValuesArr, yValuesArr } = DATA;
        const dataSeries = new XyDataSeries(wasmContext, {
            dataIsSortedInX: true,
            dataEvenlySpacedInX: true,
            containsNaN: false,
        });
        const series = new FastColumnRenderableSeries(wasmContext, {
            dataSeries,
        });
        sciChartSurface.renderableSeries.add(series);
        dataSeries.appendRange(DATA.xValuesArr, DATA.yValuesArr);
        const maxVal = Math.max(Math.abs(yAxis.visibleRange.min), Math.abs(yAxis.visibleRange.max));
        delta = maxVal / 300;
    };

    const updateChart = () => {
        yAxis.visibleRange = new NumberRange(yAxis.visibleRange.min - delta, yAxis.visibleRange.max + delta);
        return seriesNum * sciChartSurface.renderableSeries.get(0).dataSeries.count();
    };

    const deleteChart = () => {
        sciChartSurface?.delete();
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
    const {
        SciChartSurface,
        NumericAxis,
        OhlcDataSeries,
        FastCandlestickRenderableSeries,
        NumberRange,
        SciChartDefaults,
        EAutoRange
    } = SciChart;

    let DATA;
    let sciChartSurface;
    let yAxis;
    let wasmContext;
    let delta;

    const createChart = async () => {
        SciChartSurface.configure({
            wasmUrl: '/scichart/lib/scichart2d.wasm',
            noSimdUrl: '/scichart/lib/scichart2d.no-simd.wasm',
        });
        SciChartDefaults.useNativeText = true;

        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;

        const xAxis = new NumericAxis(wasmContext, { ...lightAxisOptions });
        sciChartSurface.xAxes.add(xAxis);

        yAxis = new NumericAxis(wasmContext, { autoRange: EAutoRange.Once, ...lightAxisOptions });
        sciChartSurface.yAxes.add(yAxis);
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

        DATA = { xValuesArr, openValuesArr, highValuesArr, lowValuesArr, closeValuesArr };
    };

    const appendData = () => {
        const dataSeries = new OhlcDataSeries(wasmContext, {
            dataIsSortedInX: true,
            dataEvenlySpacedInX: true,
            containsNaN: false,
        });
        const series = new FastCandlestickRenderableSeries(wasmContext, {
            dataSeries,
        });
        sciChartSurface.renderableSeries.add(series);

        dataSeries.appendRange(
            DATA.xValuesArr,
            DATA.openValuesArr,
            DATA.highValuesArr,
            DATA.lowValuesArr,
            DATA.closeValuesArr
        );
        const maxVal = Math.abs(yAxis.visibleRange.max);
        delta = maxVal / 300;
    };

    const updateChart = () => {
        yAxis.visibleRange = new NumberRange(0, yAxis.visibleRange.max + delta);
        return seriesNum * sciChartSurface.renderableSeries.get(0).dataSeries.count();
    };

    const deleteChart = () => {
        sciChartSurface?.delete();
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
    const {
        SciChartSurface,
        NumericAxis,
        XyDataSeries,
        FastLineRenderableSeries,
        EXyDirection,
        convertRgbToHexColor,
        NumberRange,
        SciChartDefaults,
        EAutoRange
    } = SciChart;

    let wasmContext;
    let sciChartSurface;
    let xAxis;
    let dataSeries;
    let DATA;
    const appendCount = incrementPoints;

    const createChart = async () => {
        SciChartSurface.configure({
            wasmUrl: '/scichart/lib/scichart2d.wasm',
            noSimdUrl: '/scichart/lib/scichart2d.no-simd.wasm',
        });
        SciChartDefaults.useNativeText = true;

        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;

        xAxis = new NumericAxis(wasmContext, { autoRange: EAutoRange.Always, ...lightAxisOptions });
        sciChartSurface.xAxes.add(xAxis);

        const yAxis = new NumericAxis(wasmContext, { autoRange: EAutoRange.Always, ...lightAxisOptions });
        sciChartSurface.yAxes.add(yAxis);
    };

    const generateDataInner = (seriesNum$, pointsNum$, startIndex = 0) => {
        // Create new arrays each time
        const xArr = new Float64Array(pointsNum$);
        const yArrArr = [];
        
        // Create yArrays for each series
        for (let i = 0; i < seriesNum$; i++) {
            yArrArr[i] = new Float64Array(pointsNum$);
        }
        
        // Generate data into new arrays
        for (let i = 0; i < seriesNum$; i++) {
            const yOffset = i * 2;
            for (let j = 0; j < pointsNum$; j++) {
                // we use the same X vector for every series
                if (i === 0) xArr[j] = startIndex + j;
                const val = Math.random() + yOffset;
                yArrArr[i][j] = val;
            }
        }
        
        return { xArr, yArrArr };
    };

    const generateData = () => {
        DATA = generateDataInner(seriesNum, pointsNum);
    };

    const appendData = () => {
        const { xArr, yArrArr } = DATA;
        for (let i = 0; i < seriesNum; i++) {
            // Generate stroke
            const stroke = convertRgbToHexColor(Math.random(), Math.random(), Math.random());
            dataSeries = new XyDataSeries(wasmContext, {
                xValues: xArr,
                yValues: yArrArr[i],
                dataIsSortedInX: true,
                dataEvenlySpacedInX: true,
                containsNaN: false,
                fifoCapacity: xArr.length,
            });
            const series = new FastLineRenderableSeries(wasmContext, { dataSeries, stroke });
            sciChartSurface.renderableSeries.add(series);
        }
        sciChartSurface.yAxes.get(0).visibleRange = new NumberRange(0, 9);
    };

    const updateChart = (_frame) => {
        const lastX = dataSeries.getNativeXValues().get( dataSeries.xValues.size() - 1);
        const { xArr, yArrArr } = generateDataInner(seriesNum, appendCount, lastX + 1);
        sciChartSurface.renderableSeries.asArray().forEach((rs, index) => {
            rs.dataSeries.appendRange(xArr, yArrArr[index]);
            // console.log(`appending ${xArr.length}, removing ${appendCount} before ${count} after ${rs.dataSeries.count()} isSorted: ${rs.dataSeries.dataDistributionCalculator.isSortedAscending}`);
            // console.log(`xArr: ${xArr}`);
        });
        return seriesNum * (pointsNum + (lastX + 1));
    };

    const deleteChart = () => {
        sciChartSurface?.delete();
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
    const {
        SciChartSurface,
        NumericAxis,
        XyDataSeries,
        FastMountainRenderableSeries,
        NumberRange,
        SciChartDefaults,
        EAutoRange
    } = SciChart;

    let wasmContext;
    let sciChartSurface;
    let yAxis;
    let delta;
    let DATA;

    const createChart = async () => {
        SciChartSurface.configure({
            wasmUrl: '/scichart/lib/scichart2d.wasm',
            noSimdUrl: '/scichart/lib/scichart2d.no-simd.wasm',
        });
        SciChartDefaults.useNativeText = true;

        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface =res.sciChartSurface;

        const xAxis = new NumericAxis(wasmContext, { ...lightAxisOptions });
        sciChartSurface.xAxes.add(xAxis);

        yAxis = new NumericAxis(wasmContext, { autoRange: EAutoRange.Once, ...lightAxisOptions });
        sciChartSurface.yAxes.add(yAxis);
    };

    const generateData = () => {
        const xValuesArr = [];
        const yValuesArr = [];

        let prevYValue = 0;
        for (let i = 0; i < pointsNum; i++) {
            const curYValue = Math.random() * 10 - 5;
            xValuesArr.push(i);
            prevYValue += curYValue;
            yValuesArr.push(prevYValue);
        }

        DATA = { xValuesArr, yValuesArr };
    };

    const appendData = () => {
        const { xValuesArr, yValuesArr } = DATA;
        const dataSeries = new XyDataSeries(wasmContext, {
            dataIsSortedInX: true,
            dataEvenlySpacedInX: true,
            containsNaN: false,
        });
        const series = new FastMountainRenderableSeries(wasmContext, {
            dataSeries,
        });
        sciChartSurface.renderableSeries.add(series);
        dataSeries.appendRange(xValuesArr, yValuesArr);
        delta = Math.max(Math.abs(yAxis.visibleRange.min), Math.abs(yAxis.visibleRange.max)) / 300;
    };

    const updateChart = (_frame) => {
        yAxis.visibleRange = new NumberRange(yAxis.visibleRange.min - delta, yAxis.visibleRange.max + delta);
        return seriesNum * sciChartSurface.renderableSeries.get(0).dataSeries.count();
    };

    const deleteChart = () => {
        sciChartSurface?.delete();
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
    const {
        SciChartSurface,
        NumericAxis,
        XyDataSeries,
        FastLineRenderableSeries,
        SciChartDefaults,
        EAutoRange
    } = SciChart;

    let wasmContext;
    let sciChartSurface;
    let dataSeries;
    const appendCount = incrementPoints;
    let prevYValue = 0;
    let DATA;

    const createChart = async () => {
        // Initialise random seed for fair comparison
        fastRandomSeed = 1;

        SciChartSurface.configure({
            wasmUrl: '/scichart/lib/scichart2d.wasm',
            noSimdUrl: '/scichart/lib/scichart2d.no-simd.wasm',
        });
        SciChartDefaults.useNativeText = true;

        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;

        const xAxis = new NumericAxis(wasmContext, { autoRange: EAutoRange.Always, ...lightAxisOptions });
        
        // Format x-labels with commas for easier reading
        xAxis.labelProvider.formatLabel = (dataValue) => dataValue.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        sciChartSurface.xAxes.add(xAxis);

        const yAxis = new NumericAxis(wasmContext, { autoRange: EAutoRange.Always, ...lightAxisOptions });
        sciChartSurface.yAxes.add(yAxis);
    };

    const generateDataInner = (pointsNum$, startIndex) => {
        // Create new arrays each time
        const xValuesArr = new Float64Array(pointsNum$);
        const yValuesArr = new Float64Array(pointsNum$);

        // Generate data into new arrays
        for (let i = 0; i < pointsNum$; i++) {
            const curYValue = fastRandom() * 10 - 5;
            xValuesArr[i] = startIndex + i;
            prevYValue += curYValue;
            yValuesArr[i] = prevYValue;
        }

        return { xValuesArr, yValuesArr };
    };

    const generateData = () => {
        DATA = generateDataInner(pointsNum, 0);
    };

    const appendData = () => {
        const { xValuesArr, yValuesArr } = DATA;
        dataSeries = new XyDataSeries(wasmContext, {
            dataIsSortedInX: true,
            dataEvenlySpaced: true,
            containsNaN: false,
        });
        const series = new FastLineRenderableSeries(wasmContext, {
            strokeThickness: 2,
            stroke: '#00FF00',
            dataSeries,
        });
        sciChartSurface.renderableSeries.add(series);
        dataSeries.capacity = Math.min(pointsNum * 10, 100000000);
        dataSeries.appendRange(xValuesArr, yValuesArr);
    };

    const updateChart = (_frame) => {
        const { xValuesArr, yValuesArr } = generateDataInner(appendCount, dataSeries.count());
        dataSeries.appendRange(xValuesArr, yValuesArr);
        return dataSeries.count();
    };

    const deleteChart = () => {
        sciChartSurface?.delete();
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
    const {
        SciChartSurface,
        NumericAxis,
        XyDataSeries,
        FastLineRenderableSeries,
        SciChartDefaults,
        EAutoRange
    } = SciChart;

    let wasmContext;
    let sciChartSurfaces = [];
    let dataSeries = [];
    const appendCount = incrementPoints;
    let prevYValue = 0;
    let DATA;
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

        SciChartSurface.configure({
            wasmUrl: '/scichart/lib/scichart2d.wasm',
            noSimdUrl: '/scichart/lib/scichart2d.no-simd.wasm',
        });
        SciChartDefaults.useNativeText = true;

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
        for (let c = 0; c < chartsNum; c++) {
            const res = await SciChartSurface.create(`chart-${c}`, { loader: false });
            wasmContext = res.wasmContext;
            const sciChartSurface = res.sciChartSurface;
            sciChartSurfaces.push(sciChartSurface);

            const xAxis = new NumericAxis(wasmContext, { 
                autoRange: EAutoRange.Always, 
                labelPrecision: 0,
                ...lightAxisOptions 
            });
            
            sciChartSurface.xAxes.add(xAxis);

            const yAxis = new NumericAxis(wasmContext, { 
                autoRange: EAutoRange.Always,
                labelPrecision: 0,
                ...lightAxisOptions 
            });
            sciChartSurface.yAxes.add(yAxis);

            if (chartsNum >= 16) {
                xAxis.drawLabels = false;
                yAxis.drawLabels = false;
            }
        }
    };

    const generateDataInner = (pointsNum$, startIndex) => {
        // Create new arrays each time
        const xValuesArr = new Float64Array(pointsNum$);
        const yValuesArr = new Float64Array(pointsNum$);

        // Generate data into new arrays
        for (let i = 0; i < pointsNum$; i++) {
            const curYValue = fastRandom() * 10 - 5;
            xValuesArr[i] = startIndex + i;
            prevYValue += curYValue;
            yValuesArr[i] = prevYValue;
        }

        return { xValuesArr, yValuesArr };
    };

    const generateData = () => {
        DATA = generateDataInner(pointsNum, 0);
    };

    const appendData = () => {
        const { xValuesArr, yValuesArr } = DATA;
        
        // Add data series to each chart
        for (let c = 0; c < chartsNum; c++) {
            const ds = new XyDataSeries(wasmContext, {
                dataIsSortedInX: true,
                dataEvenlySpaced: true,
                containsNaN: false,
            });
            const series = new FastLineRenderableSeries(wasmContext, {
                strokeThickness: 2,
                stroke: '#00FF00',
                dataSeries: ds,
            });
            sciChartSurfaces[c].renderableSeries.add(series);
            ds.capacity = Math.min(pointsNum * 10, 100000000);
            ds.appendRange(xValuesArr, yValuesArr);
            dataSeries.push(ds);
        }
    };

    const updateChart = (_frame) => {
        const { xValuesArr, yValuesArr } = generateDataInner(appendCount, dataSeries[0].count());
        
        // Update all charts with the same data
        for (let c = 0; c < chartsNum; c++) {
            dataSeries[c].appendRange(xValuesArr, yValuesArr);
        }
        
        // Return total datapoints across all charts: seriesNum * pointsPerChart * chartsNum
        return seriesNum * dataSeries[0].count() * chartsNum;
    };

    const deleteChart = () => {
        // Delete all charts
        for (let c = 0; c < chartsNum; c++) {
            sciChartSurfaces[c]?.delete();
        }
        sciChartSurfaces = [];
        dataSeries = [];
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
    const {
        SciChart3DSurface,
        NumericAxis3D,
        XyzDataSeries3D,
        ScatterRenderableSeries3D,
        PixelPointMarker3D,
        CameraController,
        MouseWheelZoomModifier3D,
        OrbitModifier3D,
        Vector3,
        SciChartDefaults
    } = SciChart;

    let wasmContext;
    let sciChart3DSurface;
    let dataSeries;
    let DATA;
    const pointCloudSize = pointsNum; // Total number of points in the 3D point cloud

    const createChart = async () => {
        SciChart3DSurface.configure({
            wasmUrl: '/scichart/lib/scichart3d.wasm',
            noSimdUrl: '/scichart/lib/scichart3d.no-simd.wasm',
        });

        const res = await SciChart3DSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChart3DSurface = res.sciChart3DSurface;

        // Set world dimensions for the 3D scene
        sciChart3DSurface.worldDimensions = new Vector3(200, 200, 200);

        // Create and attach a camera to the 3D Viewport
        sciChart3DSurface.camera = new CameraController(wasmContext, {
            position: new Vector3(200, 300, 200),
            target: new Vector3(0, 50, 0),
        });

        // Add X, Y, Z axes to the viewport
        sciChart3DSurface.xAxis = new NumericAxis3D(wasmContext, {
            axisTitle: 'X Axis',
            ...lightAxisOptions,
        });
        sciChart3DSurface.yAxis = new NumericAxis3D(wasmContext, {
            axisTitle: 'Y Axis',
            ...lightAxisOptions,
        });
        sciChart3DSurface.zAxis = new NumericAxis3D(wasmContext, {
            axisTitle: 'Z Axis',
            ...lightAxisOptions,
        });

        // Add interactivity modifiers for orbiting and zooming
        sciChart3DSurface.chartModifiers.add(new MouseWheelZoomModifier3D());
        sciChart3DSurface.chartModifiers.add(new OrbitModifier3D());
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

        return { xValues: newXValuesArr, yValues: newYValuesArr, zValues: newZValuesArr };
    };

    const generateData = () => {
        DATA = generateNextPoints(pointCloudSize, undefined, undefined, undefined);
    };

    const appendData = () => {
        const { xValues, yValues, zValues } = DATA;

        // Create XyzDataSeries3D for the point cloud
        dataSeries = new XyzDataSeries3D(wasmContext, {
            xValues: xValues,
            yValues: yValues,
            zValues: zValues,
        });

        // Create ScatterRenderableSeries3D with PixelPointMarker3D
        const scatterSeries = new ScatterRenderableSeries3D(wasmContext, {
            pointMarker: new PixelPointMarker3D(wasmContext, {
                size: 2,
                fill: '#00FF00',
            }),
            dataSeries: dataSeries,
            opacity: 0.8,
        });

        sciChart3DSurface.renderableSeries.add(scatterSeries);
    };

    const updateChart = (_frame) => {
        // Generate new Brownian motion 3D points for dynamic updating
        DATA = generateNextPoints(pointCloudSize, DATA.xValues, DATA.yValues, DATA.zValues);
        const { xValues, yValues, zValues } = DATA;
        
        // Clear and update the data series
        dataSeries.clear();
        dataSeries.appendRange(xValues, yValues, zValues);

        return pointCloudSize;
    };

    const deleteChart = () => {
        sciChart3DSurface?.delete();
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
    const {
        SciChart3DSurface,
        NumericAxis3D,
        UniformGridDataSeries3D,
        SurfaceMeshRenderableSeries3D,
        GradientColorPalette,
        CameraController,
        MouseWheelZoomModifier3D,
        OrbitModifier3D,
        Vector3,
        NumberRange,
        EDrawMeshAs,
        zeroArray2D
    } = SciChart;

    let wasmContext;
    let sciChart3DSurface;
    let dataSeries;
    let heightmapArray;
    let DATA;
    const surfaceSize = pointsNum; // pointsNum represents the side length of the surface (e.g., 100 = 100x100)

    const createChart = async () => {
        SciChart3DSurface.configure({
            wasmUrl: '/scichart/lib/scichart3d.wasm',
            noSimdUrl: '/scichart/lib/scichart3d.no-simd.wasm',
        });

        const res = await SciChart3DSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChart3DSurface = res.sciChart3DSurface;

        // Create and position the camera in the 3D world
        sciChart3DSurface.camera = new CameraController(wasmContext, {
            position: new Vector3(-150, 200, 150),
            target: new Vector3(0, 50, 0),
        });

        // Set the world dimensions, which defines the Axis cube size
        sciChart3DSurface.worldDimensions = new Vector3(200, 100, 200);

        // Add X, Y, Z axes to the viewport
        sciChart3DSurface.xAxis = new NumericAxis3D(wasmContext, {
            axisTitle: 'X Axis',
            ...lightAxisOptions,
        });
        sciChart3DSurface.yAxis = new NumericAxis3D(wasmContext, {
            axisTitle: 'Y Axis',
            visibleRange: new NumberRange(-0.3, 0.3),
            ...lightAxisOptions,
        });
        sciChart3DSurface.zAxis = new NumericAxis3D(wasmContext, {
            axisTitle: 'Z Axis',
            ...lightAxisOptions,
        });

        // Add interactivity modifiers for orbiting and zooming
        sciChart3DSurface.chartModifiers.add(new MouseWheelZoomModifier3D());
        sciChart3DSurface.chartModifiers.add(new OrbitModifier3D());
    };

    const generateData = () => {
        // Create a 2D array using the helper function zeroArray2D
        heightmapArray = zeroArray2D([surfaceSize, surfaceSize]);
        
        // Fill with initial data
        for (let z = 0; z < surfaceSize; z++) {
            for (let x = 0; x < surfaceSize; x++) {
                heightmapArray[z][x] = Math.random() * 0.6 - 0.3; // Random values between -0.3 and 0.3
            }
        }

        DATA = { heightmapArray };
    };

    const appendData = () => {
        const { heightmapArray } = DATA;

        // Create a UniformGridDataSeries3D
        dataSeries = new UniformGridDataSeries3D(wasmContext, {
            yValues: heightmapArray,
            xStep: 1,
            zStep: 1,
            dataSeriesName: 'Uniform Surface Mesh',
        });

        // Create the color map
        const colorMap = new GradientColorPalette(wasmContext, {
            gradientStops: [
                { offset: 1, color: '#FF1493' },      // VividPink
                { offset: 0.9, color: '#FF8C00' },    // VividOrange
                { offset: 0.7, color: '#DC143C' },    // MutedRed
                { offset: 0.5, color: '#32CD32' },    // VividGreen
                { offset: 0.3, color: '#87CEEB' },    // VividSkyBlue
                { offset: 0.15, color: '#4B0082' },   // Indigo
                { offset: 0, color: '#191970' },      // DarkIndigo
            ],
        });

        // Create a SurfaceMeshRenderableSeries3D and add to the chart
        const series = new SurfaceMeshRenderableSeries3D(wasmContext, {
            dataSeries,
            minimum: -0.3,
            maximum: 0.3,
            opacity: 0.9,
            cellHardnessFactor: 1.0,
            shininess: 0,
            lightingFactor: 0.0,
            highlight: 1.0,
            stroke: '#1E90FF',
            strokeThickness: 1.0,
            drawSkirt: false,
            drawMeshAs: EDrawMeshAs.SOLID_WIREFRAME,
            meshColorPalette: colorMap,
            isVisible: true,
        });

        sciChart3DSurface.renderableSeries.add(series);
    };

    let frame = 0;
    const updateChart = (_frameNumber) => {
        // Generate new surface data with animated wave pattern
        const f = frame / 10;
        
        for (let z = 0; z < surfaceSize; z++) {
            const zVal = z - surfaceSize / 2;
            for (let x = 0; x < surfaceSize; x++) {
                const xVal = x - surfaceSize / 2;
                // Create animated wave pattern similar to the example
                const y = (Math.cos(xVal * 0.2 + f) + Math.cos(zVal * 0.2 + f)) / 5;
                heightmapArray[z][x] = y;
            }
        }

        // Update the data series with new values
        dataSeries.setYValues(heightmapArray);
        frame++;

        return surfaceSize * surfaceSize;
    };

    const deleteChart = () => {
        sciChart3DSurface?.delete();
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
    const {
        SciChartSurface,
        NumericAxis,
        UniformHeatmapDataSeries,
        UniformHeatmapRenderableSeries,
        HeatmapColorMap,
        EColorMapMode,
        SciChartDefaults,
        EAutoRange,
        zeroArray2D
    } = SciChart;

    let wasmContext;
    let sciChartSurface;
    let heatmapDataSeries;
    let zValues;
    const heatmapSize = pointsNum; // pointsNum represents the side length of the heatmap (e.g., 100 = 100x100)

    const createChart = async () => {
        SciChartSurface.configure({
            wasmUrl: '/scichart/lib/scichart2d.wasm',
            noSimdUrl: '/scichart/lib/scichart2d.no-simd.wasm',
        });
        SciChartDefaults.useNativeText = true;

        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;

        const xAxis = new NumericAxis(wasmContext, {
            autoRange: EAutoRange.Once,
            ...lightAxisOptions,
        });
        sciChartSurface.xAxes.add(xAxis);

        const yAxis = new NumericAxis(wasmContext, {
            autoRange: EAutoRange.Once,
            ...lightAxisOptions,
        });
        sciChartSurface.yAxes.add(yAxis);
    };

    const generateData = () => {
        // Create zValues 2D array with random data
        zValues = zeroArray2D([heatmapSize, heatmapSize]);
        for (let y = 0; y < heatmapSize; y++) {
            for (let x = 0; x < heatmapSize; x++) {
                zValues[y][x] = Math.random();
            }
        }
    };

    const appendData = () => {
        // Create UniformHeatmapDataSeries with xStart, xStep, yStart, yStep
        heatmapDataSeries = new UniformHeatmapDataSeries(wasmContext, {
            xStart: 0,
            xStep: 1,
            yStart: 0,
            yStep: 1,
            zValues: zValues,
            width: heatmapSize,
            height: heatmapSize,
        });

        // Create the heatmap renderable series
        const heatmapSeries = new UniformHeatmapRenderableSeries(wasmContext, {
            dataSeries: heatmapDataSeries,
            colorMap: new HeatmapColorMap({
                minimum: 0,
                maximum: 1,
                colorMapMode: EColorMapMode.Linear,
            }),
        });

        sciChartSurface.renderableSeries.add(heatmapSeries);
    };

    const updateChart = (_frame) => {
        // Generate new random values and fill the zValues array
        for (let y = 0; y < heatmapSize; y++) {
            for (let x = 0; x < heatmapSize; x++) {
                zValues[y][x] = Math.random();
            }
        }

        // Update the heatmap with new z values
        heatmapDataSeries.setZValues(zValues);

        return heatmapSize * heatmapSize;
    };

    const deleteChart = () => {
        sciChartSurface?.delete();
    };

    return {
        createChart,
        generateData,
        appendData,
        updateChart,
        deleteChart,
    };
}

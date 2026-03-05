'use strict';

function eLibName() {
    return 'LCJS v4';
}

function eLibVersion() {
    return '4.2.2';
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
    const { lightningChart, SolidLine, SolidFill, ColorRGBA, emptyFill, disableThemeEffects, Themes } = lcjs;

    let chart;
    let delta;
    let DATA;
    let yAxis;

    const createChart = async () => {
        chart = lightningChart()
            .ChartXY({
              container: document.getElementById('chart-root'),
              disableAnimations: true,
              theme: disableThemeEffects(Themes.darkGold)
            })
            .setTitleFillStyle(emptyFill)
            .setPadding({ top: 10, bottom: 10, left: 10, right: 10 });
        const xAxis = chart.getDefaultAxisX().setAnimationScroll(undefined);
        yAxis = chart.getDefaultAxisY().setAnimationScroll(undefined);
    };

    const generateData = () => {
        const xyValuesArrArr = [];
        const colorValuesArr = [];
        for (let i = 0; i < seriesNum; i++) {
            xyValuesArrArr.push([]);
            const r = Math.random() * 255;
            const g = Math.random() * 255;
            const b = Math.random() * 255;
            colorValuesArr.push(new ColorRGBA(r, g, b));

            // Generate points
            let prevYValue = 0;
            for (let j = 0; j < pointsNum; j++) {
                const curYValue = Math.random() * 10 - 5;
                const x = j;
                const y = prevYValue + curYValue;
                xyValuesArrArr[i].push({ x, y });
                prevYValue += curYValue;
            }
        }

        DATA = { xyValuesArrArr, colorValuesArr };
    };

    const appendData = () => {
        const { xyValuesArrArr, colorValuesArr } = DATA;

        for (let i = 0; i < seriesNum; i++) {
            chart
                .addLineSeries({
                    dataPattern: {
                        pattern: 'ProgressiveX',
                        regularProgressiveStep: true,
                    },
                })
                .setCursorEnabled(false)
                .setStrokeStyle(
                    new SolidLine({
                        thickness: 2,
                        fillStyle: new SolidFill({ color: colorValuesArr[i] }),
                    })
                )
                .add(xyValuesArrArr[i]);
        }

        yAxis.fit();
        const min = yAxis.getInterval().start;
        const max = yAxis.getInterval().end;
        const maxVal = Math.max(Math.abs(min), Math.abs(max));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        const currentInterval = yAxis.getInterval();
        yAxis.setInterval({ start: currentInterval.start - delta, end: currentInterval.end + delta });
        return seriesNum * DATA.xyValuesArrArr[0].length;
    };

    const deleteChart = () => {
        chart?.dispose();
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
function eScatterPerformanceTest(seriesNum, pointsNum, divId = 'chart-root') {
    const { lightningChart, emptyFill, PointShape, SolidFill, ColorRGBA, disableThemeEffects, Themes } = lcjs;

    let DATA;
    let chart;
    let yAxis;
    let scatterSeries;

    const X_MAX = 100;
    const Y_MAX = 50;

    const createChart = async () => {
        const EXTRA = 10;
        chart = lightningChart()
            .ChartXY({
              container: document.getElementById(divId),
              disableAnimations: true,
              theme: disableThemeEffects(Themes.darkGold)
            })
            .setPadding({ top: 10, bottom: 10, left: 10, right: 10 })
            .setTitleFillStyle(emptyFill);
        const xAxis = chart.getDefaultAxisX().setAnimationScroll(undefined);
        xAxis.setInterval({ start: 0 - EXTRA, end: X_MAX + EXTRA });
        yAxis = chart.getDefaultAxisY().setAnimationScroll(undefined);
        yAxis.setInterval({ start: 0 - EXTRA, end: Y_MAX + EXTRA });
    };

    let newXYValuesArr = [];
    const generateNextPoints = (pointsNum$, xyValuesArr) => {
        // Every frame we call generateNextPoints. Re-use the same array if possible to avoid GC
        newXYValuesArr = pointsNum$ > newXYValuesArr.length ? new Array(pointsNum$) : newXYValuesArr;

        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = xyValuesArr ? xyValuesArr[i].x : Math.round(Math.random() * X_MAX);
            const x = prevXValue + (Math.random() - 0.5);
            const prevYValue = xyValuesArr ? xyValuesArr[i].y : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newXYValuesArr[i] = { x, y };
        }

        return newXYValuesArr;
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined);
    };

    const appendData = () => {
        const newXYValuesArr = DATA;
        scatterSeries = chart
            .addPointSeries({ pointShape: PointShape.Circle })
            .setName('Scatter data')
            .setCursorEnabled(false)
            .setPointSize(5)
            .setPointFillStyle(
                new SolidFill({
                    color: ColorRGBA(0, 255, 0),
                })
            )
            .add(newXYValuesArr);
    };

    const updateChart = () => {
        DATA = generateNextPoints(pointsNum, DATA);
        const xyValuesArr = DATA;
        scatterSeries.clear();
        scatterSeries.add(xyValuesArr);
        return scatterSeries.getPointAmount();
    };

    const deleteChart = () => {
        chart?.dispose();
        const chartDiv = document.getElementById(divId);
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
    const { lightningChart, SolidLine, SolidFill, emptyFill, ColorHEX, disableThemeEffects, Themes } = lcjs;

    let DATA;
    let chart;
    let series;

    const X_MAX = 100;
    const Y_MAX = 50;

    const createChart = async () => {
        const EXTRA = 10;

        chart = lightningChart()
          .ChartXY({
              container: document.getElementById('chart-root'),
              disableAnimations: true,
              theme: disableThemeEffects(Themes.darkGold)
          })
          .setPadding({top: 10, bottom: 10, left: 10, right: 10})
          .setTitleFillStyle(emptyFill);
        const xAxis = chart.getDefaultAxisX().setAnimationScroll(undefined).setChartInteractions(false);
        xAxis.setInterval({start: 0 - EXTRA, end: X_MAX + EXTRA});

        const yAxis = chart.getDefaultAxisY().setAnimationScroll(undefined);
        yAxis.setInterval({start: 0 - EXTRA, end: Y_MAX +EXTRA});
    };

    let newXYValuesArr = [];
    const generateNextPoints = (pointsNum$, xyValuesArr) => {
        // Every frame we call generateNextPoints. Re-use the array if it's the same size to avoid GC
        newXYValuesArr = pointsNum$ > newXYValuesArr.length ? new Array(pointsNum$) : newXYValuesArr;

        for (let i = 0; i < pointsNum$; i++) {
            const prevXValue = xyValuesArr ? xyValuesArr[i].x : Math.round(Math.random() * X_MAX);
            const x = prevXValue + (Math.random() - 0.5);
            const prevYValue = xyValuesArr ? xyValuesArr[i].y : Math.round(Math.random() * Y_MAX);
            const y = prevYValue + (Math.random() - 0.5);
            newXYValuesArr[i] = { x, y };
        }

        return newXYValuesArr;
    };

    const generateData = () => {
        DATA = generateNextPoints(pointsNum, undefined);
    };

    const appendData = () => {
        const newXYValuesArr = DATA;
        series = chart
            .addLineSeries()
            .setCursorEnabled(false)
            .setStrokeStyle(new SolidLine({ thickness: 2, fillStyle: new SolidFill({ color: ColorHEX('#00FF00') }) }));
        series.add(newXYValuesArr);
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA);
        const xyValuesArr = DATA;
        series.clear();
        series.add(xyValuesArr);
        return series.getPointAmount();
    };

    const deleteChart = () => {
        chart?.dispose();
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
    const { lightningChart, SolidLine, SolidFill, emptyFill, ColorHEX, ColorRGBA, disableThemeEffects, Themes, PointShape } = lcjs;

    let DATA;
    let chart;
    let series;

    const Y_MAX = 50;

    const createChart = async () => {
        const EXTRA = 10;

        chart = lightningChart()
          .ChartXY({
              container: document.getElementById('chart-root'),
              disableAnimations: true,
              theme: disableThemeEffects(Themes.darkGold)
          })
          .setPadding({top: 10, bottom: 10, left: 10, right: 10})
          .setTitleFillStyle(emptyFill);
        const xAxis = chart.getDefaultAxisX().setAnimationScroll(undefined).setChartInteractions(false);

        const yAxis = chart.getDefaultAxisY().setAnimationScroll(undefined);
        yAxis.setInterval({start: 0 - EXTRA, end: Y_MAX + EXTRA});
    };

    let newXYValuesArr = [];
    const generateNextPoints = (pointsNum$, xyValuesArr) => {
        // Every frame we call generateNextPoints. Re-use the array if it's the same size to avoid GC
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
        const newXYValuesArr = DATA;
        series = chart
          .addPointLineSeries( { pointShape: PointShape.Circle })
          .setPointSize(10)
          .setCursorEnabled(false)
          .setStrokeStyle(new SolidLine({ thickness: 2, fillStyle: new SolidFill({ color: ColorHEX('#00FF00') }) }))
          .setPointFillStyle(
          new SolidFill({
              color: ColorRGBA(255, 255, 255),
          })
        )
        series.add(newXYValuesArr);
    };

    const updateChart = (_frame) => {
        DATA = generateNextPoints(pointsNum, DATA);
        const xyValuesArr = DATA;
        series.clear();
        series.add(xyValuesArr);
        return series.getPointAmount();
    };

    const deleteChart = () => {
        chart?.dispose();
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
function eColumnPerformanceTest(seriesNum, pointsNum, divId = 'chart-root') {
    const { lightningChart, emptyFill, disableThemeEffects, Themes } = lcjs;

    let DATA;
    let chart;
    let yAxis;
    let delta;

    const createChart = async () => {
        chart = lightningChart()
            .ChartXY({
              container: document.getElementById(divId),
              disableAnimations: true,
              theme: disableThemeEffects(Themes.darkGold)
            })
            .setPadding({ top: 10, bottom: 10, left: 10, right: 10 })
            .setTitleFillStyle(emptyFill);
        const xAxis = chart.getDefaultAxisX().setAnimationScroll(undefined);
        yAxis = chart.getDefaultAxisY().setAnimationScroll(undefined);
    };

    const generateData = () => {
        const rectArr = [];

        let x = 0;
        const figureThickness = 10;
        const figureGap = figureThickness * 0.5;

        let prevYValue = 0;
        for (let i = 0; i < pointsNum; i++) {
            const curYValue = Math.random() * 10 - 5;
            prevYValue += curYValue;

            const rectDimensions = {
                x: x - figureThickness / 2,
                y: 0,
                width: figureThickness,
                height: prevYValue,
            };

            rectArr.push(rectDimensions);
            x += figureThickness + figureGap;
        }

        DATA = rectArr;
    };

    const appendData = () => {
        const rectangles = chart.addRectangleSeries()
            .setCursorEnabled(false);
        DATA.forEach((rectDimension) => rectangles.add(rectDimension));
        yAxis.fit();
        const min = yAxis.getInterval().start;
        const max = yAxis.getInterval().end;
        const maxVal = Math.max(Math.abs(min), Math.abs(max));
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        const yAxis = chart.getDefaultAxisY();
        yAxis.setInterval({ start: yAxis.getInterval().start - delta, end: yAxis.getInterval().end + delta });
        return seriesNum * DATA.length;
    };

    const deleteChart = () => {
        chart?.dispose();
        const chartDiv = document.getElementById(divId);
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
    const { lightningChart, emptyFill, OHLCFigures, disableThemeEffects, Themes } = lcjs;

    let chart;
    let yAxis;
    let delta;
    let DATA;

    const createChart = async () => {
        chart = lightningChart()
            .ChartXY({
                container: document.getElementById('chart-root'),
                disableAnimations: true,
                theme: disableThemeEffects(Themes.darkGold)
            })
            .setPadding({ top: 10, bottom: 10, left: 10, right: 10 })
            .setTitleFillStyle(emptyFill);
        const xAxis = chart.getDefaultAxisX().setAnimationScroll(undefined);
        yAxis = chart.getDefaultAxisY().setAnimationScroll(undefined);
    };

    const generateData = () => {
        const ohlcDataArr = [];

        for (let x = 0; x < pointsNum; x++) {
            const open = Math.random();
            const close = Math.random();
            const val1 = Math.random();
            const val2 = Math.random();
            const high = Math.max(val1, val2, open, close);
            const low = Math.min(val1, val2, open, close);
            ohlcDataArr.push([x, open, high, low, close]);
        }
        DATA = ohlcDataArr;
    };

    const appendData = () => {
        const ohlcDataArr = DATA;
        const series = chart
            .addOHLCSeries({ positiveFigure: OHLCFigures.Candlestick  })
            .setCursorEnabled(false)
            .setFigureAutoFitting(false);
        series.add(ohlcDataArr);
        yAxis.fit();
        const min = yAxis.getInterval().start;
        const max = yAxis.getInterval().end;
        const maxVal = Math.abs(max);
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        yAxis.setInterval({ start: 0, end: yAxis.getInterval().end + delta });
        return seriesNum * DATA.length;
    };

    const deleteChart = () => {
        chart?.dispose();
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
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}} */
function eFifoEcgPerformanceTest(seriesNum, pointsNum, incrementPoints) {
    const { lightningChart, SolidLine, SolidFill, ColorHSV, emptyFill, AxisScrollStrategies, disableThemeEffects, Themes } = lcjs;

    let chart;
    const appendCount = incrementPoints;
    const seriesArr = [];
    let index = 0;
    let DATA;

    const createChart = async () => {
        chart = lightningChart()
            .ChartXY({
              container: document.getElementById('chart-root'),
              disableAnimations: true,
              theme: disableThemeEffects(Themes.darkGold)
            })
            .setTitleFillStyle(emptyFill)
            .setPadding({ top: 10, bottom: 10, left: 10, right: 10 });
        const xAxis = chart.getDefaultAxisX().setAnimationScroll(undefined);
        const yAxis = chart.getDefaultAxisY().setAnimationScroll(undefined);
        xAxis.setScrollStrategy(AxisScrollStrategies.progressive).setInterval({ start: 0, end: pointsNum, stopAxisAfter: false });
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
            const series = chart
                .addLineSeries({ dataPattern: { pattern: 'ProgressiveX', regularProgressiveStep: true } })
                .setCursorEnabled(false)
                .setStrokeStyle(new SolidLine({ fillStyle: new SolidFill({ color: ColorHSV((360 * i) / seriesNum) }) }))
                .addArraysXY(xArr, yArrArr[i]);
            seriesArr.push(series);
        }
        index += pointsNum;
    };

    const updateChart = (_frame) => {
        const { xArr, yArrArr } = generateDataInner(seriesNum, appendCount, index);
        seriesArr.forEach((s, i) => {
            s.addArraysXY(xArr, yArrArr[i]);
        });
        index += appendCount;
        return seriesNum * (pointsNum + index - appendCount);
    };

    const deleteChart = () => {
        chart?.dispose();
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
function eMountainPerformanceTest(seriesNum, pointsNum, divId = 'chart-root') {
    const { lightningChart, emptyFill, AreaSeriesTypes, disableThemeEffects, Themes } = lcjs;

    let chart;
    let yAxis;
    let delta;
    let DATA;

    const createChart = async () => {
        chart = lightningChart()
            .ChartXY({
              container: document.getElementById(divId),
              disableAnimations: true,
              theme: disableThemeEffects(Themes.darkGold)
            })
            .setPadding({ top: 10, bottom: 10, left: 10, right: 10 })
            .setTitleFillStyle(emptyFill);
        chart.getDefaultAxisX().setAnimationScroll(undefined);
        yAxis = chart.getDefaultAxisY().setAnimationScroll(undefined);
    };

    const generateData = () => {
        const areaRangeSeriesPointsArr = [];

        let prevYValue = 0;
        for (let i = 0; i < pointsNum; i++) {
            const curYValue = Math.random() * 10 - 5;
            prevYValue += curYValue;
            areaRangeSeriesPointsArr.push({ x: i, y: prevYValue });
        }
        DATA = areaRangeSeriesPointsArr;
    };

    const appendData = () => {
        const areaRangeSeriesPointsArr = DATA;
        const series = chart.addAreaSeries({ type: AreaSeriesTypes.Bipolar }).setCursorEnabled(false);
        series.add(areaRangeSeriesPointsArr);
        yAxis = chart.getDefaultAxisY();
        yAxis.fit();
        const min = Math.abs(yAxis.getInterval().start);
        const max = Math.abs(yAxis.getInterval().end);
        const maxVal = Math.max(min, max);
        delta = maxVal / 300;
    };

    const updateChart = (_frame) => {
        yAxis.setInterval({ start: yAxis.getInterval().start - delta, end: yAxis.getInterval().end + delta });
        return seriesNum * DATA.length;
    };

    const deleteChart = () => {
        chart?.dispose();
        const chartDiv = document.getElementById(divId);
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
function eSeriesCompressionPerformanceTest(seriesNum, pointsNum, incrementPoints, divId = 'chart-root') {
    const {lightningChart, emptyFill, SolidLine, SolidFill, ColorHEX, disableThemeEffects, Themes} = lcjs;

    let chart;
    let yAxis;
    let series;
    const appendCount = incrementPoints;
    let points = 0;
    let prevYValue = 0;
    let DATA;

    const createChart = async () => {
        // Initialise random seed for fair comparison
        fastRandomSeed = 1;

        chart = lightningChart()
          .ChartXY({
              container: document.getElementById(divId),
              disableAnimations: true,
              theme: disableThemeEffects(Themes.darkGold)
          })
          .setPadding({top: 10, bottom: 10, left: 10, right: 10})
          .setTitleFillStyle(emptyFill);
        chart.getDefaultAxisX().setAnimationScroll(undefined);
        yAxis = chart.getDefaultAxisY().setAnimationScroll(undefined);
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
        points += pointsNum$;
        return {xValuesArr, yValuesArr};
    };

    const generateData = () => {
        DATA = generateDataInner(pointsNum, 0);
    };

    const appendData = () => {
        const {xValuesArr, yValuesArr} = DATA;
        series = chart
          .addLineSeries({dataPattern: {pattern: 'ProgressiveX', regularProgressiveStep: true}})
          .setCursorEnabled(false)
          .setStrokeStyle(new SolidLine({thickness: 2, fillStyle: new SolidFill({color: ColorHEX('#00FF00')})}));
        series.addArraysXY(xValuesArr, yValuesArr);
        yAxis.setInterval({start: 0, end: 9});
    };

    const updateChart = () => {
        const {xValuesArr, yValuesArr} = generateDataInner(appendCount, points);
        series.addArraysXY(xValuesArr, yValuesArr);
        yAxis.fit();
        return series.getPointAmount();
    };

    const deleteChart = () => {
        chart?.dispose();
        const chartDiv = document.getElementById(divId);
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
    const chartRootDiv = document.getElementById('chart-root');
    let handlers = [];

    const CHART_TYPES = ['line', 'scatter', 'column', 'mountain'];
    const getChartTypeForSlot = (idx, total) => {
        if (total === 1) return 'line';
        if (total === 2) return idx === 0 ? 'line' : 'scatter';
        return CHART_TYPES[idx % 4];
    };

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
        if (chartsNum > 16) {
            console.warn('LCJS supports a maximum of 16 WebGL Charts* this issue is fixed in the latest version but for the purpose of this test, we will skip > 16 charts');
            return false;
        }

        fastRandomSeed = 1;

        chartRootDiv.innerHTML = '';
        chartRootDiv.style.position = 'relative';

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

        handlers = [];
        for (let c = 0; c < chartsNum; c++) {
            const type = getChartTypeForSlot(c, chartsNum);
            const slotDivId = `chart-${c}`;
            let h;
            switch (type) {
                case 'line':     h = eSeriesCompressionPerformanceTest(seriesNum, pointsNum, incrementPoints, slotDivId); break;
                case 'scatter':  h = eScatterPerformanceTest(seriesNum, pointsNum, slotDivId); break;
                case 'column':   h = eColumnPerformanceTest(seriesNum, pointsNum, slotDivId); break;
                case 'mountain': h = eMountainPerformanceTest(seriesNum, pointsNum, slotDivId); break;
            }
            handlers.push(h);
            await h.createChart();
        }
    };

    const generateData = () => handlers.forEach(h => h.generateData());
    const appendData = () => handlers.forEach(h => h.appendData());

    const updateChart = (_frame) => {
        let total = 0;
        handlers.forEach(h => { total += (h.updateChart(_frame) || 0); });
        return total;
    };

    const deleteChart = () => {
        handlers.forEach(h => h.deleteChart());
        handlers = [];
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
    const { lightningChart, PointSeriesTypes3D, disableThemeEffects, Themes } = lcjs;

    let chart3D;
    let pointSeries3D;
    let DATA;
    const pointCloudSize = pointsNum; // Total number of points in the 3D point cloud

    const createChart = async () => {
        chart3D = lightningChart()
            .Chart3D({
                container: document.getElementById('chart-root'),
                disableAnimations: true,
                theme: disableThemeEffects(Themes.darkGold),
                legend: { visible: false },
            });

        // Set Axis titles
        chart3D.getDefaultAxisX().setTitle('X Axis');
        chart3D.getDefaultAxisY().setTitle('Y Axis');
        chart3D.getDefaultAxisZ().setTitle('Z Axis');

        // Set static Axis intervals for consistent view
        chart3D.forEachAxis((axis) => axis.setInterval({ start: -100, end: 100 }));
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

        // Convert to array of objects for LCJS
        const points = [];
        for (let i = 0; i < pointsNum$; i++) {
            points.push({
                x: newXValuesArr[i],
                y: newYValuesArr[i],
                z: newZValuesArr[i]
            });
        }

        return {
            xValues: newXValuesArr,
            yValues: newYValuesArr,
            zValues: newZValuesArr,
            points: points
        };
    };

    const generateData = () => {
        DATA = generateNextPoints(pointCloudSize, undefined, undefined, undefined);
    };

    const appendData = () => {
        // Create Point Cloud Series (variant optimized for rendering minimal detail geometry)
        pointSeries3D = chart3D
            .addPointSeries({ type: PointSeriesTypes3D.Pixelated })
            .setPointStyle((style) => style.setSize(1));

        // Add initial data
        pointSeries3D.add(DATA.points);
    };

    const updateChart = (_frame) => {
        // Generate new Brownian motion 3D points for dynamic updating
        DATA = generateNextPoints(pointCloudSize, DATA.xValues, DATA.yValues, DATA.zValues);

        // Clear and update the point series
        pointSeries3D.clear().add(DATA.points);

        return pointCloudSize;
    };

    const deleteChart = () => {
        chart3D?.dispose();
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
 * 3D_SURFACE_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function e3dSurfacePerformanceTest(seriesNum, pointsNum) {
    const { lightningChart, disableThemeEffects, Themes, PalettedFill, LUT, ColorCSS } = lcjs;

    let chart3D;
    let surfaceSeries;
    let surfaceData;
    let DATA;
    const surfaceSize = pointsNum; // pointsNum represents the side length of the surface (e.g., 100 = 100x100)

    const createChart = async () => {
        chart3D = lightningChart()
            .Chart3D({
                container: document.getElementById('chart-root'),
                disableAnimations: true,
                theme: disableThemeEffects(Themes.darkGold),
                legend: { visible: false },
            });

        // Set Axis titles
        chart3D.getDefaultAxisX().setTitle('X Axis');
        chart3D.getDefaultAxisY().setTitle('Y Axis');
        chart3D.getDefaultAxisZ().setTitle('Z Axis');

        // Set static Axis intervals for consistent view
        chart3D.getDefaultAxisX().setInterval({ start: 0, end: surfaceSize });
        chart3D.getDefaultAxisY().setInterval({ start: -0.5, end: 0.5 });
        chart3D.getDefaultAxisZ().setInterval({ start: 0, end: surfaceSize });
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

        // Create surface series
        surfaceSeries = chart3D
            .addSurfaceGridSeries({
                columns: surfaceSize,
                rows: surfaceSize,
                start: { x: 0, z: 0 },
                end: { x: surfaceSize, z: surfaceSize },
            });
        surfaceSeries.setFillStyle(new PalettedFill({
            lookUpProperty: 'y',
            lut: new LUT({
                interpolate: true,
                percentageValues: true,
                steps: [
                    { value: -1, color: ColorCSS('red') },
                    { value: 1, color: ColorCSS('green') },
                ]
            })
        }));
        let tempLineSeries = chart3D.addLineSeries();
        const defaultStrokeStyle = tempLineSeries.getStrokeStyle();

        surfaceSeries.setWireframeStyle(defaultStrokeStyle.setThickness(1));
        tempLineSeries.dispose()
        tempLineSeries = undefined
        // Set initial surface data
        surfaceSeries.invalidateHeightMap(surfaceData);
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
        surfaceSeries.invalidateHeightMap(surfaceData);
        frame++;

        return surfaceSize * surfaceSize;
    };

    const deleteChart = () => {
        chart3D?.dispose();
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
 * HEATMAP_PERFORMANCE_TEST
 * @param seriesNum
 * @param pointsNum
 * @returns {{appendData: ()=>void, deleteChart: ()=>void, updateChart: ()=>void, createChart: () => Promise<any>, generateData: () => void}}
 */
function eHeatmapPerformanceTest(seriesNum, pointsNum) {
    const { lightningChart, emptyFill, emptyLine, PalettedFill, LUT, ColorRGBA, disableThemeEffects, Themes } = lcjs;

    let chart;
    let heatmap;
    let zValues;
    const heatmapSize = pointsNum;

    const palette = new LUT({
        units: "intensity",
        steps: [
            { value: 0, color: ColorRGBA(255, 0, 0) },
            { value: 1, color: ColorRGBA(0, 255, 0) },
        ],
        interpolate: true,
    });

    const zeroArray2D = (dimensions /*: number[]*/)/*: number[][]*/ => {
        if (!dimensions) {
            return undefined;
        }
        const array = [];

        for (let i = 0; i < dimensions[0]; ++i) {
            array.push(dimensions.length === 1 ? 0 : zeroArray2D(dimensions.slice(1)));
        }

        return array;
    };

    const createChart = async () => {
        chart = lightningChart()
            .ChartXY({
                container: document.getElementById('chart-root'),
                disableAnimations: true,
                theme: disableThemeEffects(Themes.darkGold)
            })
            .setTitleFillStyle(emptyFill)
            .setPadding({ top: 10, bottom: 10, left: 10, right: 10 });

        chart.getDefaultAxisX().setAnimationScroll(undefined);
        chart.getDefaultAxisY().setAnimationScroll(undefined);
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
        heatmap = chart
            .addHeatmapGridSeries({
                dataOrder: 'columns',
                columns: heatmapSize,
                rows: heatmapSize,
            })
            .setFillStyle(new PalettedFill({ lut: palette }))
            .setWireframeStyle(emptyLine)
            .setMouseInteractions(false)
            .setCursorEnabled(false);

        heatmap.invalidateIntensityValues(zValues);
    };

    const updateChart = (_frame) => {
        // Generate new random values and fill the zValues array
        for (let y = 0; y < heatmapSize; y++) {
            for (let x = 0; x < heatmapSize; x++) {
                zValues[y][x] = Math.random();
            }
        }
        heatmap.invalidateIntensityValues(zValues);

        return heatmapSize * heatmapSize;
    };

    const deleteChart = () => {
        chart?.dispose();
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

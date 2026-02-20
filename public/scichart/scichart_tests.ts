import * as SciChart from 'scichart';

const {
    SciChartSurface,
    SciChart3DSurface,
    SciChartDefaults,
} = SciChart;

// Configure WASM URLs once at module load time
SciChartSurface.configure({
    wasmUrl: '/scichart/scichart2d.wasm',
    wasmNoSimdUrl: '/scichart/scichart2d-nosimd.wasm',
});

SciChart3DSurface.configure({
    wasmUrl: '/scichart/scichart3d.wasm',
    wasmNoSimdUrl: '/scichart/scichart3d-nosimd.wasm',
});

SciChartDefaults.useNativeText = true;

// Fast pseudorandom seeded number generator using XorShift32 algorithm
let fastRandomSeed = 1;
const FAST_RANDOM_MULTIPLIER = 1 / 4294967296;
function fastRandom() {
    fastRandomSeed ^= fastRandomSeed << 13;
    fastRandomSeed ^= fastRandomSeed >>> 17;
    fastRandomSeed ^= fastRandomSeed << 5;
    fastRandomSeed = fastRandomSeed >>> 0;
    return fastRandomSeed * FAST_RANDOM_MULTIPLIER;
}

const lightAxisOptions = {
    drawMinorGridLines: false,
    drawMinorTicks: false,
    drawMinorTickLines: false,
    drawMajorTicks: false,
    drawMajorTickLines: false,
    drawMajorBands: false,
    allowFastMath: true
};

function eLibName() {
    return 'SciChart.js';
}

function eLibVersion() {
    return (SciChart as any).libraryVersion;
}

function eLinePerformanceTest(seriesNum: number, pointsNum: number) {
    const {
        NumericAxis,
        XyDataSeries,
        NumberRange,
        EAutoRange,
        FastLineRenderableSeries,
        convertRgbToHexColor,
        EResamplingMode
    } = SciChart;

    let DATA: any;
    let sciChartSurface: any;
    let wasmContext: any;
    let delta: number;
    let yAxis: any;

    const createChart = async () => {
        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;

        const xAxis = new NumericAxis(wasmContext, {
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
        const xValuesArrArr: number[][] = [];
        const yValuesArrArr: number[][] = [];
        const strokeArr: string[] = [];
        for (let i = 0; i < seriesNum; i++) {
            xValuesArrArr.push([]);
            yValuesArrArr.push([]);
            const r = Math.random();
            const g = Math.random();
            const b = Math.random();
            strokeArr.push(convertRgbToHexColor(r, g, b));
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
                resamplingMode: EResamplingMode.None
            });
            sciChartSurface.renderableSeries.add(rendSeries);
        }
        const maxVal = Math.max(Math.abs(yAxis.visibleRange.min), Math.abs(yAxis.visibleRange.max));
        delta = maxVal / 300;
    };

    const updateChart = (_frame: number) => {
        yAxis.visibleRange = new NumberRange(yAxis.visibleRange.min - delta, yAxis.visibleRange.max + delta);
        return seriesNum * sciChartSurface.renderableSeries.get(0).dataSeries.count();
    };

    const deleteChart = () => { sciChartSurface?.delete(); };

    return { createChart, generateData, appendData, updateChart, deleteChart };
}

function eScatterPerformanceTest(seriesNum: number, pointsNum: number) {
    const {
        NumericAxis,
        XyDataSeries,
        NumberRange,
        EAutoRange,
        XyScatterRenderableSeries,
        EllipsePointMarker,
    } = SciChart;

    let DATA: any;
    let wasmContext: any;
    let sciChartSurface: any;
    let dataSeries: any;
    const X_MAX = 100;
    const Y_MAX = 50;

    const createChart = async () => {
        const EXTRA = 10;
        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;
        sciChartSurface.xAxes.add(new NumericAxis(wasmContext, { visibleRange: new NumberRange(0 - EXTRA, X_MAX + EXTRA), autoRange: EAutoRange.Never, ...lightAxisOptions }));
        sciChartSurface.yAxes.add(new NumericAxis(wasmContext, { visibleRange: new NumberRange(0 - EXTRA, Y_MAX + EXTRA), autoRange: EAutoRange.Never, ...lightAxisOptions }));
    };

    let newXValuesArr: number[] = [];
    let newYValuesArr: number[] = [];
    const generateNextPoints = (n: number, xArr: any, yArr: any) => {
        newXValuesArr = n > newXValuesArr.length ? new Array(n) : newXValuesArr;
        newYValuesArr = n > newYValuesArr.length ? new Array(n) : newYValuesArr;
        for (let i = 0; i < n; i++) {
            newXValuesArr[i] = (xArr ? xArr[i] : Math.round(Math.random() * X_MAX)) + (Math.random() - 0.5);
            newYValuesArr[i] = (yArr ? yArr[i] : Math.round(Math.random() * Y_MAX)) + (Math.random() - 0.5);
        }
        return { xValuesArr: newXValuesArr, yValuesArr: newYValuesArr };
    };

    const generateData = () => { DATA = generateNextPoints(pointsNum, undefined, undefined); };

    const appendData = () => {
        dataSeries = new XyDataSeries(wasmContext, { dataIsSortedInX: false, containsNaN: false });
        sciChartSurface.renderableSeries.add(new XyScatterRenderableSeries(wasmContext, {
            pointMarker: new EllipsePointMarker(wasmContext, { width: 5, height: 5, strokeThickness: 0, fill: '#00FF00', stroke: 'LightSteelBlue' }),
            dataSeries,
        }));
        dataSeries.appendRange(DATA.xValuesArr, DATA.yValuesArr);
    };

    const updateChart = (_frame: number) => {
        DATA = generateNextPoints(pointsNum, DATA.xValuesArr, DATA.yValuesArr);
        dataSeries.clear();
        dataSeries.appendRange(DATA.xValuesArr, DATA.yValuesArr);
        return dataSeries.count();
    };

    const deleteChart = () => { sciChartSurface?.delete(); };
    return { createChart, generateData, appendData, updateChart, deleteChart };
}

function eXYLinePerformanceTest(seriesNum: number, pointsNum: number) {
    return eScatterPerformanceTest(seriesNum, pointsNum);
}

function ePointLinePerformanceTest(seriesNum: number, pointsNum: number) {
    const { NumericAxis, XyDataSeries, NumberRange, EAutoRange, FastLineRenderableSeries, EllipsePointMarker } = SciChart;
    let DATA: any;
    let sciChartSurface: any;
    let wasmContext: any;
    let dataSeries: any;
    const Y_MAX = 50;

    const createChart = async () => {
        const EXTRA = 10;
        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;
        sciChartSurface.xAxes.add(new NumericAxis(wasmContext, { autoRange: EAutoRange.Once, ...lightAxisOptions }));
        sciChartSurface.yAxes.add(new NumericAxis(wasmContext, { visibleRange: new NumberRange(0 - EXTRA, Y_MAX + EXTRA), autoRange: EAutoRange.Never, ...lightAxisOptions }));
    };

    let newXValuesArr: number[] = [];
    let newYValuesArr: number[] = [];
    const generateNextPoints = (n: number, xArr: any, yArr: any) => {
        newXValuesArr = n > newXValuesArr.length ? new Array(n) : newXValuesArr;
        newYValuesArr = n > newYValuesArr.length ? new Array(n) : newYValuesArr;
        for (let i = 0; i < n; i++) {
            newXValuesArr[i] = i;
            newYValuesArr[i] = (yArr ? yArr[i] : Math.round(Math.random() * Y_MAX)) + (Math.random() - 0.5);
        }
        return { xValuesArr: newXValuesArr, yValuesArr: newYValuesArr };
    };

    const generateData = () => { DATA = generateNextPoints(pointsNum, undefined, undefined); };

    const appendData = () => {
        dataSeries = new XyDataSeries(wasmContext, { dataIsSortedInX: true, containsNaN: false });
        sciChartSurface.renderableSeries.add(new FastLineRenderableSeries(wasmContext, {
            dataSeries, strokeThickness: 2, stroke: '#00FF00',
            pointMarker: new EllipsePointMarker(wasmContext, { width: 10, height: 10, fill: 'White', stroke: '#00FF00', strokeThickness: 1 })
        }));
        dataSeries.appendRange(DATA.xValuesArr, DATA.yValuesArr);
    };

    const updateChart = (_frame: number) => {
        DATA = generateNextPoints(pointsNum, DATA.xValuesArr, DATA.yValuesArr);
        dataSeries.clear();
        dataSeries.appendRange(DATA.xValuesArr, DATA.yValuesArr);
        return dataSeries.count();
    };

    const deleteChart = () => { sciChartSurface?.delete(); };
    return { createChart, generateData, appendData, updateChart, deleteChart };
}

function eColumnPerformanceTest(seriesNum: number, pointsNum: number) {
    const { NumericAxis, XyDataSeries, EAutoRange, FastColumnRenderableSeries, NumberRange } = SciChart;
    let DATA: any;
    let sciChartSurface: any;
    let yAxis: any;
    let wasmContext: any;
    let delta: number;

    const createChart = async () => {
        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;
        sciChartSurface.xAxes.add(new NumericAxis(wasmContext, { ...lightAxisOptions }));
        yAxis = new NumericAxis(wasmContext, { autoRange: EAutoRange.Once, ...lightAxisOptions });
        sciChartSurface.yAxes.add(yAxis);
    };

    const generateData = () => {
        const xValuesArr: number[] = [], yValuesArr: number[] = [];
        let prevYValue = 0;
        for (let i = 0; i < pointsNum; i++) { prevYValue += Math.random() * 10 - 5; xValuesArr.push(i); yValuesArr.push(prevYValue); }
        DATA = { xValuesArr, yValuesArr };
    };

    const appendData = () => {
        const dataSeries = new XyDataSeries(wasmContext, { dataIsSortedInX: true, dataEvenlySpacedInX: true, containsNaN: false });
        sciChartSurface.renderableSeries.add(new FastColumnRenderableSeries(wasmContext, { dataSeries }));
        dataSeries.appendRange(DATA.xValuesArr, DATA.yValuesArr);
        delta = Math.max(Math.abs(yAxis.visibleRange.min), Math.abs(yAxis.visibleRange.max)) / 300;
    };

    const updateChart = () => {
        yAxis.visibleRange = new NumberRange(yAxis.visibleRange.min - delta, yAxis.visibleRange.max + delta);
        return seriesNum * sciChartSurface.renderableSeries.get(0).dataSeries.count();
    };

    const deleteChart = () => { sciChartSurface?.delete(); };
    return { createChart, generateData, appendData, updateChart, deleteChart };
}

function eCandlestickPerformanceTest(seriesNum: number, pointsNum: number) {
    const { NumericAxis, OhlcDataSeries, FastCandlestickRenderableSeries, NumberRange, EAutoRange } = SciChart;
    let DATA: any;
    let sciChartSurface: any;
    let yAxis: any;
    let wasmContext: any;
    let delta: number;

    const createChart = async () => {
        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;
        sciChartSurface.xAxes.add(new NumericAxis(wasmContext, { ...lightAxisOptions }));
        yAxis = new NumericAxis(wasmContext, { autoRange: EAutoRange.Once, ...lightAxisOptions });
        sciChartSurface.yAxes.add(yAxis);
    };

    const generateData = () => {
        const xValuesArr: number[] = [], openValuesArr: number[] = [], highValuesArr: number[] = [], lowValuesArr: number[] = [], closeValuesArr: number[] = [];
        for (let i = 0; i < pointsNum; i++) {
            const open = Math.random(), close = Math.random(), v1 = Math.random(), v2 = Math.random();
            xValuesArr.push(i); openValuesArr.push(open); closeValuesArr.push(close);
            highValuesArr.push(Math.max(v1, v2, open, close)); lowValuesArr.push(Math.min(v1, v2, open, close));
        }
        DATA = { xValuesArr, openValuesArr, highValuesArr, lowValuesArr, closeValuesArr };
    };

    const appendData = () => {
        const dataSeries = new OhlcDataSeries(wasmContext, { dataIsSortedInX: true, dataEvenlySpacedInX: true, containsNaN: false });
        sciChartSurface.renderableSeries.add(new FastCandlestickRenderableSeries(wasmContext, { dataSeries }));
        dataSeries.appendRange(DATA.xValuesArr, DATA.openValuesArr, DATA.highValuesArr, DATA.lowValuesArr, DATA.closeValuesArr);
        delta = Math.abs(yAxis.visibleRange.max) / 300;
    };

    const updateChart = () => {
        yAxis.visibleRange = new NumberRange(0, yAxis.visibleRange.max + delta);
        return seriesNum * sciChartSurface.renderableSeries.get(0).dataSeries.count();
    };

    const deleteChart = () => { sciChartSurface?.delete(); };
    return { createChart, generateData, appendData, updateChart, deleteChart };
}

function eFifoEcgPerformanceTest(seriesNum: number, pointsNum: number, incrementPoints: number) {
    const { NumericAxis, XyDataSeries, FastLineRenderableSeries, convertRgbToHexColor, NumberRange, EAutoRange } = SciChart;
    let wasmContext: any;
    let sciChartSurface: any;
    let dataSeries: any;
    let DATA: any;
    const appendCount = incrementPoints;

    const createChart = async () => {
        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;
        sciChartSurface.xAxes.add(new NumericAxis(wasmContext, { autoRange: EAutoRange.Always, ...lightAxisOptions }));
        sciChartSurface.yAxes.add(new NumericAxis(wasmContext, { autoRange: EAutoRange.Always, ...lightAxisOptions }));
    };

    const generateDataInner = (sNum: number, pNum: number, startIndex = 0) => {
        const xArr = new Float64Array(pNum);
        const yArrArr: Float64Array[] = [];
        for (let i = 0; i < sNum; i++) yArrArr[i] = new Float64Array(pNum);
        for (let i = 0; i < sNum; i++) {
            const yOffset = i * 2;
            for (let j = 0; j < pNum; j++) {
                if (i === 0) xArr[j] = startIndex + j;
                yArrArr[i][j] = Math.random() + yOffset;
            }
        }
        return { xArr, yArrArr };
    };

    const generateData = () => { DATA = generateDataInner(seriesNum, pointsNum); };

    const appendData = () => {
        const { xArr, yArrArr } = DATA;
        for (let i = 0; i < seriesNum; i++) {
            const stroke = convertRgbToHexColor(Math.random(), Math.random(), Math.random());
            dataSeries = new XyDataSeries(wasmContext, { xValues: xArr, yValues: yArrArr[i], dataIsSortedInX: true, dataEvenlySpacedInX: true, containsNaN: false, fifoCapacity: xArr.length });
            sciChartSurface.renderableSeries.add(new FastLineRenderableSeries(wasmContext, { dataSeries, stroke }));
        }
        sciChartSurface.yAxes.get(0).visibleRange = new NumberRange(0, 9);
    };

    const updateChart = (_frame: number) => {
        const lastX = dataSeries.getNativeXValues().get(dataSeries.xValues.size() - 1);
        const { xArr, yArrArr } = generateDataInner(seriesNum, appendCount, lastX + 1);
        sciChartSurface.renderableSeries.asArray().forEach((rs: any, index: number) => { rs.dataSeries.appendRange(xArr, yArrArr[index]); });
        return seriesNum * (pointsNum + (lastX + 1));
    };

    const deleteChart = () => { sciChartSurface?.delete(); };
    return { createChart, generateData, appendData, updateChart, deleteChart };
}

function eMountainPerformanceTest(seriesNum: number, pointsNum: number) {
    const { NumericAxis, XyDataSeries, FastMountainRenderableSeries, NumberRange, EAutoRange } = SciChart;
    let wasmContext: any;
    let sciChartSurface: any;
    let yAxis: any;
    let delta: number;
    let DATA: any;

    const createChart = async () => {
        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;
        sciChartSurface.xAxes.add(new NumericAxis(wasmContext, { ...lightAxisOptions }));
        yAxis = new NumericAxis(wasmContext, { autoRange: EAutoRange.Once, ...lightAxisOptions });
        sciChartSurface.yAxes.add(yAxis);
    };

    const generateData = () => {
        const xValuesArr: number[] = [], yValuesArr: number[] = [];
        let prev = 0;
        for (let i = 0; i < pointsNum; i++) { prev += Math.random() * 10 - 5; xValuesArr.push(i); yValuesArr.push(prev); }
        DATA = { xValuesArr, yValuesArr };
    };

    const appendData = () => {
        const dataSeries = new XyDataSeries(wasmContext, { dataIsSortedInX: true, dataEvenlySpacedInX: true, containsNaN: false });
        sciChartSurface.renderableSeries.add(new FastMountainRenderableSeries(wasmContext, { dataSeries }));
        dataSeries.appendRange(DATA.xValuesArr, DATA.yValuesArr);
        delta = Math.max(Math.abs(yAxis.visibleRange.min), Math.abs(yAxis.visibleRange.max)) / 300;
    };

    const updateChart = (_frame: number) => {
        yAxis.visibleRange = new NumberRange(yAxis.visibleRange.min - delta, yAxis.visibleRange.max + delta);
        return seriesNum * sciChartSurface.renderableSeries.get(0).dataSeries.count();
    };

    const deleteChart = () => { sciChartSurface?.delete(); };
    return { createChart, generateData, appendData, updateChart, deleteChart };
}

function eSeriesCompressionPerformanceTest(seriesNum: number, pointsNum: number, incrementPoints: number) {
    const { NumericAxis, XyDataSeries, FastLineRenderableSeries, EAutoRange } = SciChart;
    let wasmContext: any;
    let sciChartSurface: any;
    let dataSeries: any;
    const appendCount = incrementPoints;
    let prevYValue = 0;
    let DATA: any;

    const createChart = async () => {
        fastRandomSeed = 1;
        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;
        const xAxis = new NumericAxis(wasmContext, { autoRange: EAutoRange.Always, ...lightAxisOptions });
        xAxis.labelProvider.formatLabel = (v: number) => v.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 });
        sciChartSurface.xAxes.add(xAxis);
        sciChartSurface.yAxes.add(new NumericAxis(wasmContext, { autoRange: EAutoRange.Always, ...lightAxisOptions }));
    };

    const generateDataInner = (n: number, startIndex: number) => {
        const xValuesArr = new Float64Array(n), yValuesArr = new Float64Array(n);
        for (let i = 0; i < n; i++) { prevYValue += fastRandom() * 10 - 5; xValuesArr[i] = startIndex + i; yValuesArr[i] = prevYValue; }
        return { xValuesArr, yValuesArr };
    };

    const generateData = () => { DATA = generateDataInner(pointsNum, 0); };

    const appendData = () => {
        dataSeries = new XyDataSeries(wasmContext, { dataIsSortedInX: true, containsNaN: false });
        sciChartSurface.renderableSeries.add(new FastLineRenderableSeries(wasmContext, { strokeThickness: 2, stroke: '#00FF00', dataSeries }));
        dataSeries.capacity = Math.min(pointsNum * 10, 100000000);
        dataSeries.appendRange(DATA.xValuesArr, DATA.yValuesArr);
    };

    const updateChart = (_frame: number) => {
        const { xValuesArr, yValuesArr } = generateDataInner(appendCount, dataSeries.count());
        dataSeries.appendRange(xValuesArr, yValuesArr);
        return dataSeries.count();
    };

    const deleteChart = () => { sciChartSurface?.delete(); };
    return { createChart, generateData, appendData, updateChart, deleteChart };
}

function eMultiChartPerformanceTest(seriesNum: number, pointsNum: number, incrementPoints: number, chartsNum: number) {
    const { NumericAxis, XyDataSeries, FastLineRenderableSeries, EAutoRange } = SciChart;
    let wasmContext: any;
    let sciChartSurfaces: any[] = [];
    let dataSeries: any[] = [];
    const appendCount = incrementPoints;
    let prevYValue = 0;
    let DATA: any;
    const chartRootDiv = document.getElementById('chart-root')!;

    const getGridDimensions = (n: number) => {
        if (n <= 1) return { cols: 1, rows: 1 };
        if (n === 2) return { cols: 2, rows: 1 };
        if (n === 4) return { cols: 2, rows: 2 };
        if (n === 8) return { cols: 4, rows: 2 };
        if (n === 16) return { cols: 4, rows: 4 };
        if (n === 32) return { cols: 8, rows: 4 };
        if (n === 64) return { cols: 8, rows: 8 };
        if (n === 128) return { cols: 16, rows: 8 };
        const cols = Math.ceil(Math.sqrt(n));
        return { cols, rows: Math.ceil(n / cols) };
    };

    const createChart = async () => {
        fastRandomSeed = 1;
        chartRootDiv.innerHTML = '';
        const { cols, rows } = getGridDimensions(chartsNum);
        for (let c = 0; c < chartsNum; c++) {
            const d = document.createElement('div');
            d.id = `chart-${c}`;
            d.style.cssText = `width:${100/cols}%;height:${100/rows}%;position:absolute;left:${(c%cols)*(100/cols)}%;top:${Math.floor(c/cols)*(100/rows)}%`;
            chartRootDiv.appendChild(d);
        }
        chartRootDiv.style.position = 'relative';
        for (let c = 0; c < chartsNum; c++) {
            const res = await SciChartSurface.create(`chart-${c}`, { loader: false });
            wasmContext = res.wasmContext;
            sciChartSurfaces.push(res.sciChartSurface);
            const xAxis = new NumericAxis(wasmContext, { autoRange: EAutoRange.Always, labelPrecision: 0, ...lightAxisOptions });
            const yAxis = new NumericAxis(wasmContext, { autoRange: EAutoRange.Always, labelPrecision: 0, ...lightAxisOptions });
            if (chartsNum >= 16) { (xAxis as any).drawLabels = false; (yAxis as any).drawLabels = false; }
            sciChartSurfaces[c].xAxes.add(xAxis);
            sciChartSurfaces[c].yAxes.add(yAxis);
        }
    };

    const generateDataInner = (n: number, startIndex: number) => {
        const xValuesArr = new Float64Array(n), yValuesArr = new Float64Array(n);
        for (let i = 0; i < n; i++) { prevYValue += fastRandom() * 10 - 5; xValuesArr[i] = startIndex + i; yValuesArr[i] = prevYValue; }
        return { xValuesArr, yValuesArr };
    };

    const generateData = () => { DATA = generateDataInner(pointsNum, 0); };

    const appendData = () => {
        for (let c = 0; c < chartsNum; c++) {
            const ds = new XyDataSeries(wasmContext, { dataIsSortedInX: true, containsNaN: false });
            sciChartSurfaces[c].renderableSeries.add(new FastLineRenderableSeries(wasmContext, { strokeThickness: 2, stroke: '#00FF00', dataSeries: ds }));
            ds.capacity = Math.min(pointsNum * 10, 100000000);
            ds.appendRange(DATA.xValuesArr, DATA.yValuesArr);
            dataSeries.push(ds);
        }
    };

    const updateChart = (_frame: number) => {
        const { xValuesArr, yValuesArr } = generateDataInner(appendCount, dataSeries[0].count());
        for (let c = 0; c < chartsNum; c++) dataSeries[c].appendRange(xValuesArr, yValuesArr);
        return seriesNum * dataSeries[0].count() * chartsNum;
    };

    const deleteChart = () => { sciChartSurfaces.forEach(s => s?.delete()); sciChartSurfaces = []; dataSeries = []; };
    return { createChart, generateData, appendData, updateChart, deleteChart };
}

function eHeatmapPerformanceTest(seriesNum: number, pointsNum: number) {
    const { NumericAxis, UniformHeatmapDataSeries, UniformHeatmapRenderableSeries, HeatmapColorMap, EAutoRange, zeroArray2D } = SciChart;
    let wasmContext: any;
    let sciChartSurface: any;
    let heatmapDataSeries: any;
    let zValues: any;
    const heatmapSize = pointsNum;

    const createChart = async () => {
        const res = await SciChartSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChartSurface = res.sciChartSurface;
        sciChartSurface.xAxes.add(new NumericAxis(wasmContext, { autoRange: EAutoRange.Once, ...lightAxisOptions }));
        sciChartSurface.yAxes.add(new NumericAxis(wasmContext, { autoRange: EAutoRange.Once, ...lightAxisOptions }));
    };

    const generateData = () => {
        zValues = zeroArray2D([heatmapSize, heatmapSize]);
        for (let y = 0; y < heatmapSize; y++) for (let x = 0; x < heatmapSize; x++) zValues[y][x] = Math.random();
    };

    const appendData = () => {
        heatmapDataSeries = new UniformHeatmapDataSeries(wasmContext, { xStart: 0, xStep: 1, yStart: 0, yStep: 1, zValues });
        sciChartSurface.renderableSeries.add(new UniformHeatmapRenderableSeries(wasmContext, { dataSeries: heatmapDataSeries, colorMap: new HeatmapColorMap({ minimum: 0, maximum: 1 }) }));
    };

    const updateChart = (_frame: number) => {
        for (let y = 0; y < heatmapSize; y++) for (let x = 0; x < heatmapSize; x++) zValues[y][x] = Math.random();
        heatmapDataSeries.setZValues(zValues);
        return heatmapSize * heatmapSize;
    };

    const deleteChart = () => { sciChartSurface?.delete(); };
    return { createChart, generateData, appendData, updateChart, deleteChart };
}

function e3dPointCloudPerformanceTest(seriesNum: number, pointsNum: number) {
    const { NumericAxis3D, XyzDataSeries3D, ScatterRenderableSeries3D, PixelPointMarker3D, CameraController, MouseWheelZoomModifier3D, OrbitModifier3D, Vector3 } = SciChart;
    let wasmContext: any;
    let sciChart3DSurface: any;
    let dataSeries: any;
    let DATA: any;

    const createChart = async () => {
        const res = await SciChart3DSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChart3DSurface = res.sciChart3DSurface;
        sciChart3DSurface.worldDimensions = new Vector3(200, 200, 200);
        sciChart3DSurface.camera = new CameraController(wasmContext, { position: new Vector3(200, 300, 200), target: new Vector3(0, 50, 0) });
        sciChart3DSurface.xAxis = new NumericAxis3D(wasmContext, { axisTitle: 'X Axis', ...lightAxisOptions });
        sciChart3DSurface.yAxis = new NumericAxis3D(wasmContext, { axisTitle: 'Y Axis', ...lightAxisOptions });
        sciChart3DSurface.zAxis = new NumericAxis3D(wasmContext, { axisTitle: 'Z Axis', ...lightAxisOptions });
        sciChart3DSurface.chartModifiers.add(new MouseWheelZoomModifier3D());
        sciChart3DSurface.chartModifiers.add(new OrbitModifier3D());
    };

    let nx = new Float64Array(0), ny = new Float64Array(0), nz = new Float64Array(0);
    const genPoints = (n: number, x: any, y: any, z: any) => {
        nx = n > nx.length ? new Float64Array(n) : nx; ny = n > ny.length ? new Float64Array(n) : ny; nz = n > nz.length ? new Float64Array(n) : nz;
        for (let i = 0; i < n; i++) {
            nx[i] = (x ? x[i] : Math.random() * 200 - 100) + (Math.random() - 0.5) * 2;
            ny[i] = (y ? y[i] : Math.random() * 200 - 100) + (Math.random() - 0.5) * 2;
            nz[i] = (z ? z[i] : Math.random() * 200 - 100) + (Math.random() - 0.5) * 2;
        }
        return { xValues: nx, yValues: ny, zValues: nz };
    };

    const generateData = () => { DATA = genPoints(pointsNum, undefined, undefined, undefined); };
    const appendData = () => {
        dataSeries = new XyzDataSeries3D(wasmContext, DATA);
        sciChart3DSurface.renderableSeries.add(new ScatterRenderableSeries3D(wasmContext, { pointMarker: new PixelPointMarker3D(wasmContext, { size: 2, fill: '#00FF00' }), dataSeries, opacity: 0.8 }));
    };
    const updateChart = (_frame: number) => { DATA = genPoints(pointsNum, DATA.xValues, DATA.yValues, DATA.zValues); dataSeries.clear(); dataSeries.appendRange(DATA.xValues, DATA.yValues, DATA.zValues); return pointsNum; };
    const deleteChart = () => { sciChart3DSurface?.delete(); };
    return { createChart, generateData, appendData, updateChart, deleteChart };
}

function e3dSurfacePerformanceTest(seriesNum: number, pointsNum: number) {
    const { NumericAxis3D, UniformGridDataSeries3D, SurfaceMeshRenderableSeries3D, GradientColorPalette, CameraController, MouseWheelZoomModifier3D, OrbitModifier3D, Vector3, NumberRange, EDrawMeshAs, zeroArray2D } = SciChart;
    let wasmContext: any;
    let sciChart3DSurface: any;
    let dataSeries: any;
    let heightmapArray: any;
    const surfaceSize = pointsNum;

    const createChart = async () => {
        const res = await SciChart3DSurface.createSingle('chart-root', { loader: false });
        wasmContext = res.wasmContext;
        sciChart3DSurface = res.sciChart3DSurface;
        sciChart3DSurface.camera = new CameraController(wasmContext, { position: new Vector3(-150, 200, 150), target: new Vector3(0, 50, 0) });
        sciChart3DSurface.worldDimensions = new Vector3(200, 100, 200);
        sciChart3DSurface.xAxis = new NumericAxis3D(wasmContext, { axisTitle: 'X Axis', ...lightAxisOptions });
        sciChart3DSurface.yAxis = new NumericAxis3D(wasmContext, { axisTitle: 'Y Axis', visibleRange: new NumberRange(-0.3, 0.3), ...lightAxisOptions });
        sciChart3DSurface.zAxis = new NumericAxis3D(wasmContext, { axisTitle: 'Z Axis', ...lightAxisOptions });
        sciChart3DSurface.chartModifiers.add(new MouseWheelZoomModifier3D());
        sciChart3DSurface.chartModifiers.add(new OrbitModifier3D());
    };

    const generateData = () => {
        heightmapArray = zeroArray2D([surfaceSize, surfaceSize]);
        for (let z = 0; z < surfaceSize; z++) for (let x = 0; x < surfaceSize; x++) heightmapArray[z][x] = Math.random() * 0.6 - 0.3;
    };

    const appendData = () => {
        dataSeries = new UniformGridDataSeries3D(wasmContext, { yValues: heightmapArray, xStep: 1, zStep: 1, dataSeriesName: 'Uniform Surface Mesh' });
        sciChart3DSurface.renderableSeries.add(new SurfaceMeshRenderableSeries3D(wasmContext, {
            dataSeries, minimum: -0.3, maximum: 0.3, opacity: 0.9, cellHardnessFactor: 1.0, shininess: 0, lightingFactor: 0.0, highlight: 1.0,
            stroke: '#1E90FF', strokeThickness: 1.0, drawSkirt: false, drawMeshAs: EDrawMeshAs.SOLID_WIREFRAME,
            meshColorPalette: new GradientColorPalette(wasmContext, { gradientStops: [{ offset: 1, color: '#FF1493' }, { offset: 0.9, color: '#FF8C00' }, { offset: 0.7, color: '#DC143C' }, { offset: 0.5, color: '#32CD32' }, { offset: 0.3, color: '#87CEEB' }, { offset: 0.15, color: '#4B0082' }, { offset: 0, color: '#191970' }] }),
            isVisible: true,
        }));
    };

    let frame = 0;
    const updateChart = (_frameNumber: number) => {
        const f = frame / 10;
        for (let z = 0; z < surfaceSize; z++) for (let x = 0; x < surfaceSize; x++) heightmapArray[z][x] = (Math.cos((x - surfaceSize/2) * 0.2 + f) + Math.cos((z - surfaceSize/2) * 0.2 + f)) / 5;
        dataSeries.setYValues(heightmapArray);
        frame++;
        return surfaceSize * surfaceSize;
    };

    const deleteChart = () => { sciChart3DSurface?.delete(); };
    return { createChart, generateData, appendData, updateChart, deleteChart };
}

// Expose all test functions on window for test-runner.ts to access
const w = window as any;
w.eLibName = eLibName;
w.eLibVersion = eLibVersion;
w.eLinePerformanceTest = eLinePerformanceTest;
w.eScatterPerformanceTest = eScatterPerformanceTest;
w.eXYLinePerformanceTest = eXYLinePerformanceTest;
w.ePointLinePerformanceTest = ePointLinePerformanceTest;
w.eColumnPerformanceTest = eColumnPerformanceTest;
w.eCandlestickPerformanceTest = eCandlestickPerformanceTest;
w.eFifoEcgPerformanceTest = eFifoEcgPerformanceTest;
w.eMountainPerformanceTest = eMountainPerformanceTest;
w.eSeriesCompressionPerformanceTest = eSeriesCompressionPerformanceTest;
w.eMultiChartPerformanceTest = eMultiChartPerformanceTest;
w.eHeatmapPerformanceTest = eHeatmapPerformanceTest;
w.e3dPointCloudPerformanceTest = e3dPointCloudPerformanceTest;
w.e3dSurfacePerformanceTest = e3dSurfacePerformanceTest;

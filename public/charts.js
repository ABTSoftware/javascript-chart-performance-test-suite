// charts.js — Visualize benchmark results as SciChart.js line charts

const LIBRARY_COLORS = {
    'SciChart.js': '#4083E8',
    Highcharts: '#2B2D42',
    'Chart.js': '#FF8CFF',
    'Plotly.js': '#806EFA',
    'Apache ECharts': '#FF3946',
    uPlot: '#2A9D8F',
    ChartGPU: '#F4A261',
};

// Dash patterns for distinguishing result sets
const DASH_PATTERNS = [
    [], // solid
    [10, 5], // dashed
    [2, 4], // dotted
    [10, 5, 2, 5], // dash-dot
];

// Test group definitions — used to build category labels when no results exist yet
const TEST_GROUP_CONFIGS = {
    'N line series M points': [
        { series: 100, points: 100 },
        { series: 200, points: 200 },
        { series: 500, points: 500 },
        { series: 1000, points: 1000 },
        { series: 2000, points: 2000 },
        { series: 4000, points: 4000 },
        { series: 8000, points: 8000 },
    ],
    'Brownian Motion Scatter Series': [
        { series: 1, points: 1000 },
        { series: 1, points: 10000 },
        { series: 1, points: 50000 },
        { series: 1, points: 100000 },
        { series: 1, points: 200000 },
        { series: 1, points: 500000 },
        { series: 1, points: 1000000 },
        { series: 1, points: 5000000 },
        { series: 1, points: 10000000 },
    ],
    'Line series which is unsorted in x': [
        { series: 1, points: 1000 },
        { series: 1, points: 10000 },
        { series: 1, points: 50000 },
        { series: 1, points: 100000 },
        { series: 1, points: 200000 },
        { series: 1, points: 500000 },
        { series: 1, points: 1000000 },
        { series: 1, points: 5000000 },
        { series: 1, points: 10000000 },
    ],
    'Point series, sorted, updating y-values': [
        { series: 1, points: 1000 },
        { series: 1, points: 10000 },
        { series: 1, points: 50000 },
        { series: 1, points: 100000 },
        { series: 1, points: 200000 },
        { series: 1, points: 500000 },
        { series: 1, points: 1000000 },
        { series: 1, points: 5000000 },
        { series: 1, points: 10000000 },
    ],
    'Column chart with data ascending in X': [
        { series: 1, points: 1000 },
        { series: 1, points: 10000 },
        { series: 1, points: 50000 },
        { series: 1, points: 100000 },
        { series: 1, points: 200000 },
        { series: 1, points: 500000 },
        { series: 1, points: 1000000 },
        { series: 1, points: 5000000 },
        { series: 1, points: 10000000 },
    ],
    'Candlestick series test': [
        { series: 1, points: 1000 },
        { series: 1, points: 10000 },
        { series: 1, points: 50000 },
        { series: 1, points: 100000 },
        { series: 1, points: 200000 },
        { series: 1, points: 500000 },
        { series: 1, points: 1000000 },
        { series: 1, points: 5000000 },
        { series: 1, points: 10000000 },
    ],
    'FIFO / ECG Chart Performance Test': [
        { series: 5, points: 100 },
        { series: 5, points: 10000 },
        { series: 5, points: 100000 },
        { series: 5, points: 1000000 },
        { series: 5, points: 5000000 },
        { series: 5, points: 10000000 },
    ],
    'Mountain Chart Performance Test': [
        { series: 1, points: 1000 },
        { series: 1, points: 10000 },
        { series: 1, points: 50000 },
        { series: 1, points: 100000 },
        { series: 1, points: 200000 },
        { series: 1, points: 500000 },
        { series: 1, points: 1000000 },
        { series: 1, points: 5000000 },
        { series: 1, points: 10000000 },
    ],
    'Series Compression Test': [
        { series: 1, points: 1000 },
        { series: 1, points: 10000 },
        { series: 1, points: 100000 },
        { series: 1, points: 1000000 },
        { series: 1, points: 10000000 },
    ],
    'Multi Chart Performance Test': [
        { series: 1, points: 10000, charts: 1 },
        { series: 1, points: 10000, charts: 2 },
        { series: 1, points: 10000, charts: 4 },
        { series: 1, points: 10000, charts: 8 },
        { series: 1, points: 10000, charts: 16 },
        { series: 1, points: 10000, charts: 32 },
        { series: 1, points: 10000, charts: 64 },
        { series: 1, points: 10000, charts: 128 },
    ],
    'Uniform Heatmap Performance Test': [
        { series: 1, points: 100 },
        { series: 1, points: 200 },
        { series: 1, points: 500 },
        { series: 1, points: 1000 },
        { series: 1, points: 2000 },
        { series: 1, points: 4000 },
        { series: 1, points: 8000 },
        { series: 1, points: 16000 },
    ],
    '3D Point Cloud Performance Test': [
        { series: 1, points: 100 },
        { series: 1, points: 1000 },
        { series: 1, points: 10000 },
        { series: 1, points: 100000 },
        { series: 1, points: 1000000 },
        { series: 1, points: 2000000 },
        { series: 1, points: 4000000 },
    ],
    '3D Surface Performance Test': [
        { series: 1, points: 100 },
        { series: 1, points: 200 },
        { series: 1, points: 500 },
        { series: 1, points: 1000 },
        { series: 1, points: 2000 },
        { series: 1, points: 4000 },
        { series: 1, points: 8000 },
    ],
};

function formatNumber(n) {
    if (n >= 1000000) return n / 1000000 + 'M';
    if (n >= 1000) return n / 1000 + 'K';
    return String(n);
}

function configToLabel(cfg) {
    if (cfg.charts) {
        return cfg.charts + ' charts';
    }
    if (cfg.series > 1) {
        return cfg.series + ' x ' + formatNumber(cfg.points) + ' pts';
    }
    return formatNumber(cfg.points) + ' pts';
}

function configKey(cfg) {
    return `${cfg.series}|${cfg.points}|${cfg.charts || 0}`;
}

function getColorForLibrary(libName) {
    for (const [key, color] of Object.entries(LIBRARY_COLORS)) {
        if (libName.startsWith(key)) return color;
    }
    return '#888888';
}

function getShortLibName(libName) {
    for (const key of Object.keys(LIBRARY_COLORS)) {
        if (libName.startsWith(key)) return key;
    }
    return libName;
}

// ──────────────────────────────────────────────
// Global state
// ──────────────────────────────────────────────

// Map<testKey, { surface, wasmContext, categoryKeys, categoryLabels }>
const surfaceMap = new Map();
// Map<testKey, { surface, wasmContext }> for benchmark charts
const benchmarkSurfaceMap = new Map();
// All loaded data
let allResultsData = [];
let allResultSetsData = [];
// Ordered list of result set IDs found in data
let resultSetIds = [];
// Current filter state
let checkedResultSets = new Set();
let checkedLibraries = new Set();
// Chart type: 'line' or 'column'
let chartType = 'line';

// SciChart imports (set in DOMContentLoaded)
let SC = {};

document.addEventListener('DOMContentLoaded', async function () {
    SC = {
        SciChartSurface: SciChart.SciChartSurface,
        NumericAxis: SciChart.NumericAxis,
        TextLabelProvider: SciChart.TextLabelProvider,
        XyDataSeries: SciChart.XyDataSeries,
        FastLineRenderableSeries: SciChart.FastLineRenderableSeries,
        FastColumnRenderableSeries: SciChart.FastColumnRenderableSeries,
        EllipsePointMarker: SciChart.EllipsePointMarker,
        SquarePointMarker: SciChart.SquarePointMarker,
        TrianglePointMarker: SciChart.TrianglePointMarker,
        CrossPointMarker: SciChart.CrossPointMarker,
        XPointMarker: SciChart.XPointMarker,
        SciChartJSLightTheme: SciChart.SciChartJSLightTheme,
        EAutoRange: SciChart.EAutoRange,
        LegendModifier: SciChart.LegendModifier,
        RolloverModifier: SciChart.RolloverModifier,
        CursorModifier: SciChart.CursorModifier,
        ELegendPlacement: SciChart.ELegendPlacement,
        ELegendOrientation: SciChart.ELegendOrientation,
        NumberRange: SciChart.NumberRange,
        StackedColumnRenderableSeries: SciChart.StackedColumnRenderableSeries,
        StackedColumnCollection: SciChart.StackedColumnCollection,
    };

    SC.SciChartSurface.configure({
        wasmUrl: '/scichart/lib/scichart2d.wasm',
        wasmNoSimdUrl: '/scichart/lib/scichart2d-nosimd.wasm',
    });

    await initIndexedDB();
    await autoImportStorageState();
    allResultsData = await getAllTestResults();
    allResultSetsData = await getAllResultSets();

    const loadingEl = document.getElementById('loading');
    const container = document.getElementById('charts-container');

    if (allResultsData.length === 0) {
        loadingEl.textContent = 'No results found. Run some tests from the index page first.';
        return;
    }

    loadingEl.style.display = 'none';

    // Determine result sets and libraries present in data
    const rsIdSet = new Set();
    const libSet = new Set();
    allResultsData.forEach((r) => {
        rsIdSet.add(r.resultSetId || RESERVED_RESULT_SET_LOCAL);
        libSet.add(getShortLibName(r.chartLibrary));
    });
    resultSetIds = Array.from(rsIdSet);

    // Build result set label lookup
    const rsLabelMap = {};
    allResultSetsData.forEach((rs) => {
        rsLabelMap[rs.id] = rs.label;
    });

    // Initialize filter checkboxes — all checked by default
    checkedResultSets = new Set(resultSetIds);
    checkedLibraries = new Set(libSet);

    buildFilterPanel(rsLabelMap, libSet);

    // Create all surfaces once
    await createAllSurfaces(container);

    // Populate series
    updateAllChartSeries();
});

// ──────────────────────────────────────────────
// Filter panel
// ──────────────────────────────────────────────

function buildFilterPanel(rsLabelMap, libSet) {
    const rsContainer = document.getElementById('resultSetFilters');
    const libContainer = document.getElementById('libraryFilters');

    // Chart type radio buttons
    document.querySelectorAll('input[name="chartType"]').forEach((radio) => {
        radio.addEventListener('change', onChartTypeChange);
    });

    // Result set checkboxes
    resultSetIds.forEach((rsId) => {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = true;
        cb.dataset.rsId = rsId;
        cb.addEventListener('change', onFilterChange);
        label.appendChild(cb);
        label.appendChild(document.createTextNode(rsLabelMap[rsId] || rsId));
        rsContainer.appendChild(label);
    });

    // Library checkboxes
    // Sort libraries by LIBRARY_COLORS order
    const orderedLibs = Object.keys(LIBRARY_COLORS).filter((k) => libSet.has(k));
    // Add any not in LIBRARY_COLORS
    libSet.forEach((l) => {
        if (!orderedLibs.includes(l)) orderedLibs.push(l);
    });

    orderedLibs.forEach((lib) => {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = true;
        cb.dataset.lib = lib;
        cb.addEventListener('change', onFilterChange);
        label.appendChild(cb);
        label.appendChild(document.createTextNode(lib));
        libContainer.appendChild(label);
    });
}

function onFilterChange() {
    // Rebuild checked sets from checkboxes
    checkedResultSets = new Set();
    document.querySelectorAll('#resultSetFilters input[type="checkbox"]').forEach((cb) => {
        if (cb.checked) checkedResultSets.add(cb.dataset.rsId);
    });

    checkedLibraries = new Set();
    document.querySelectorAll('#libraryFilters input[type="checkbox"]').forEach((cb) => {
        if (cb.checked) checkedLibraries.add(cb.dataset.lib);
    });

    updateAllChartSeries();
}

function onChartTypeChange(e) {
    chartType = e.target.value;
    // Full rebuild needed — column mode uses StackedColumnCollection
    clearAllSeries();
    updateAllChartSeries();
}

function clearAllSeries() {
    for (const [, info] of surfaceMap) {
        const { surface } = info;
        surface.renderableSeries.clear();
    }
    // Also clear benchmark charts
    for (const [, info] of benchmarkSurfaceMap) {
        const { surface } = info;
        surface.renderableSeries.clear();
    }
}

// ──────────────────────────────────────────────
// Surface creation (once)
// ──────────────────────────────────────────────

async function createAllSurfaces(container) {
    for (const testKey of Object.keys(E_TEST_NAME)) {
        const testName = E_TEST_NAME[testKey];

        const section = document.createElement('div');
        section.className = 'chart-section';

        const heading = document.createElement('h3');
        heading.textContent = testName;
        section.appendChild(heading);

        // Build category labels from defaults
        const configMap = new Map();
        const defaultConfigs = TEST_GROUP_CONFIGS[testName] || [];
        defaultConfigs.forEach((cfg) => {
            const key = configKey(cfg);
            if (!configMap.has(key)) {
                configMap.set(key, { cfg, label: configToLabel(cfg) });
            }
        });

        // Also add from actual results
        allResultsData.forEach((record) => {
            if (record.testCase !== testName) return;
            if (!Array.isArray(record.results)) return;
            record.results.forEach((r) => {
                if (!r.config) return;
                const key = configKey(r.config);
                if (!configMap.has(key)) {
                    configMap.set(key, { cfg: r.config, label: configToLabel(r.config) });
                }
            });
        });

        const sortedEntries = Array.from(configMap.entries()).sort((a, b) => {
            const volA = a[1].cfg.series * a[1].cfg.points * (a[1].cfg.charts || 1);
            const volB = b[1].cfg.series * b[1].cfg.points * (b[1].cfg.charts || 1);
            return volA - volB;
        });

        const categoryLabels = sortedEntries.map((e) => e[1].label);
        const categoryKeys = sortedEntries.map((e) => e[0]);

        const divId = 'chart-' + testKey;
        const legendDivId = 'legend-' + testKey;

        const chartDiv = document.createElement('div');
        chartDiv.id = divId;
        chartDiv.className = 'chart-div';
        section.appendChild(chartDiv);

        // Create legend container below the chart
        const legendDiv = document.createElement('div');
        legendDiv.id = legendDivId;
        legendDiv.className = 'legend-div';
        section.appendChild(legendDiv);

        container.appendChild(section);

        const { sciChartSurface, wasmContext } = await SC.SciChartSurface.create(divId, {
            theme: new SC.SciChartJSLightTheme(),
            title: testName,
            titleStyle: {
                fontSize: 16,
                color: "#333",
                fontWeight: "bold",
                useNativeText: false,
            },
        });

        const labelProvider = new SC.TextLabelProvider({
            labels: categoryLabels,
        });

        const xAxis = new SC.NumericAxis(wasmContext, {
            labelProvider,
            axisTitle: 'Test Configuration',
            axisTitleStyle: { fontSize: 12 },
            labelStyle: { fontSize: 10 },
        });
        sciChartSurface.xAxes.add(xAxis);

        const yAxis = new SC.NumericAxis(wasmContext, {
            autoRange: SC.EAutoRange.Always,
            axisTitle: 'Average FPS',
            axisTitleStyle: { fontSize: 12 },
            labelStyle: { fontSize: 10 },
            growBy: new SC.NumberRange(0, 0.1),
        });
        yAxis.visibleRangeChanged.subscribe((data) => {
            yAxis.visibleRangeProperty = new SC.NumberRange(0, data.visibleRange.max);
        });
        sciChartSurface.yAxes.add(yAxis);

        // Create legend modifier with custom markers
        const legendModifier = new SC.LegendModifier({
            placementDivId: legendDivId,
            orientation: SC.ELegendOrientation.Horizontal,
            showSeriesMarkers: true,
            showCheckboxes: false,
        });

        // Override getLegendItemHTML to create custom markers matching the series
        legendModifier.sciChartLegend.getLegendItemHTML = (orientation, showCheckboxes, showSeriesMarkers, item) => {
            const display = orientation === SC.ELegendOrientation.Vertical ? "flex" : "inline-flex";
            let str = `<span class="scichart__legend-item" style="display: ${display}; align-items: center; margin-right: 8px; padding: 0 4px; white-space: nowrap; gap: 5px; font-size: 12px; font-weight: bold;">`;

            if (showCheckboxes) {
                const checked = item.checked ? "checked" : "";
                str += `<input ${checked} type="checkbox" id="${item.id}">`;
            }

            if (showSeriesMarkers) {
                // Find the series to get its marker type
                let markerType = 'ellipse'; // default
                for (let i = 0; i < sciChartSurface.renderableSeries.size(); i++) {
                    const series = sciChartSurface.renderableSeries.get(i);
                    if (series.id === item.id && series.markerType) {
                        markerType = series.markerType;
                        break;
                    }
                }

                const markerSVG = getMarkerSVG(markerType, item.color);
                str += `<svg xmlns="http://www.w3.org/2000/svg" for="${item.id}" style="width: 12px; height: 12px;" viewBox="0 0 24 24">
                    ${markerSVG}
                </svg>`;
            }

            str += `<label for="${item.id}" style="font-size: 12px; font-weight: bold;">${item.name}</label></span>`;
            return str;
        };

        sciChartSurface.chartModifiers.add(legendModifier);

        sciChartSurface.chartModifiers.add(
            new SC.CursorModifier({
                showTooltip: true,
                snapToDataPoint: true,
                hitTestRadius: 10
            })
        );

        surfaceMap.set(testKey, {
            surface: sciChartSurface,
            wasmContext,
            categoryKeys,
            categoryLabels,
        });

        // ──────────────────────────────────────────────
        // Create Benchmark Chart (below FPS chart)
        // ──────────────────────────────────────────────

        const benchmarkDivId = 'benchmark-chart-' + testKey;
        const benchmarkLegendDivId = 'benchmark-legend-' + testKey;

        const benchmarkChartDiv = document.createElement('div');
        benchmarkChartDiv.id = benchmarkDivId;
        benchmarkChartDiv.className = 'benchmark-chart-div';
        benchmarkChartDiv.style.height = '200px';
        benchmarkChartDiv.style.marginTop = '20px';
        section.appendChild(benchmarkChartDiv);

        // Create legend container for benchmark chart
        const benchmarkLegendDiv = document.createElement('div');
        benchmarkLegendDiv.id = benchmarkLegendDivId;
        benchmarkLegendDiv.className = 'legend-div';
        section.appendChild(benchmarkLegendDiv);

        container.appendChild(section);

        const { sciChartSurface: benchmarkSurface, wasmContext: benchmarkWasmContext } =
            await SC.SciChartSurface.create(benchmarkDivId, {
                theme: new SC.SciChartJSLightTheme(),
                title: `Benchmark Score: ${testName}`,
                titleStyle: {
                    fontSize: 14,
                    color: "#333",
                    fontWeight: "bold",
                    useNativeText: false,
                },
                isRotatedChart: true, // Rotate 90 degrees for horizontal bars
            });

        // With isRotatedChart: true, axes are transposed
        // X-axis will show library names (categories) - appears on left after rotation
        const benchmarkXAxis = new SC.NumericAxis(benchmarkWasmContext, {
            axisTitle: 'Library',
            axisTitleStyle: { fontSize: 12 },
            labelStyle: { fontSize: 10 },
            drawMinorGridLines: false,
        });
        benchmarkSurface.xAxes.add(benchmarkXAxis);

        // Y-axis will show benchmark scores - appears on bottom after rotation
        const benchmarkYAxis = new SC.NumericAxis(benchmarkWasmContext, {
            autoRange: SC.EAutoRange.Always,
            axisTitle: 'Benchmark Score',
            axisTitleStyle: { fontSize: 12 },
            labelStyle: { fontSize: 10 },
            growBy: new SC.NumberRange(0, 0.1),
            drawMinorGridLines: false,
        });
        benchmarkYAxis.visibleRangeChanged.subscribe((data) => {
            benchmarkYAxis.visibleRangeProperty = new SC.NumberRange(0, data.visibleRange.max);
        });
        benchmarkSurface.yAxes.add(benchmarkYAxis);

        // Create legend modifier for benchmark chart
        const benchmarkLegendModifier = new SC.LegendModifier({
            placementDivId: benchmarkLegendDivId,
            orientation: SC.ELegendOrientation.Horizontal,
            showSeriesMarkers: true,
            showCheckboxes: false,
        });

        // Override getLegendItemHTML for benchmark legend
        benchmarkLegendModifier.sciChartLegend.getLegendItemHTML = (orientation, showCheckboxes, showSeriesMarkers, item) => {
            const display = orientation === SC.ELegendOrientation.Vertical ? "flex" : "inline-flex";
            let str = `<span class="scichart__legend-item" style="display: ${display}; align-items: center; margin-right: 8px; padding: 0 4px; white-space: nowrap; gap: 5px; font-size: 12px; font-weight: bold;">`;

            if (showCheckboxes) {
                const checked = item.checked ? "checked" : "";
                str += `<input ${checked} type="checkbox" id="${item.id}">`;
            }

            if (showSeriesMarkers) {
                // Simple colored square for benchmark legend
                str += `<svg xmlns="http://www.w3.org/2000/svg" for="${item.id}" style="width: 12px; height: 12px;" viewBox="0 0 24 24">
                    <rect x="5" y="5" width="14" height="14" fill="${item.color}" stroke="${item.color}" stroke-width="1" rx="2" />
                </svg>`;
            }

            str += `<label for="${item.id}" style="font-size: 12px; font-weight: bold;">${item.name}</label></span>`;
            return str;
        };

        benchmarkSurface.chartModifiers.add(benchmarkLegendModifier);

        benchmarkSurface.chartModifiers.add(
            new SC.CursorModifier({
                showTooltip: true,
                snapToDataPoint: true,
                hitTestRadius: 10
            })
        );

        benchmarkSurfaceMap.set(testKey, {
            surface: benchmarkSurface,
            wasmContext: benchmarkWasmContext,
        });
    }
}

// ──────────────────────────────────────────────
// Point Marker Helpers
// ──────────────────────────────────────────────

// Consistent library to marker mapping
const LIBRARY_MARKER_MAP = {
    'SciChart.js': 'ellipse',
    'Highcharts': 'square',
    'Chart.js': 'triangle',
    'Plotly.js': 'cross',
    'Apache ECharts': 'x',
    'uPlot': 'ellipse',
    'ChartGPU': 'square',
};

function getPointMarkerForLibrary(libName) {
    return LIBRARY_MARKER_MAP[libName] || 'ellipse';
}

function createPointMarker(wasmContext, markerType, color) {
    const baseOptions = {
        width: 8,
        height: 8,
        fill: color,
        stroke: color,
    };

    // Use higher stroke thickness for Cross and X to make them more visible
    const strokeThickness = (markerType === 'cross' || markerType === 'x') ? 2 : 1;
    const options = { ...baseOptions, strokeThickness };

    switch (markerType) {
        case 'ellipse':
            return new SC.EllipsePointMarker(wasmContext, options);
        case 'square':
            return new SC.SquarePointMarker(wasmContext, options);
        case 'triangle':
            return new SC.TrianglePointMarker(wasmContext, options);
        case 'cross':
            return new SC.CrossPointMarker(wasmContext, options);
        case 'x':
            return new SC.XPointMarker(wasmContext, options);
        default:
            return new SC.EllipsePointMarker(wasmContext, options);
    }
}

function getMarkerSVG(markerType, color) {
    switch (markerType) {
        case 'ellipse':
            return `<circle cx="12" cy="12" r="8" fill="${color}" stroke="${color}" stroke-width="1" />`;
        case 'square':
            return `<rect x="5" y="5" width="14" height="14" fill="${color}" stroke="${color}" stroke-width="1" />`;
        case 'triangle':
            return `<polygon points="12,5 20,19 4,19" fill="${color}" stroke="${color}" stroke-width="1" />`;
        case 'cross':
            return `<line x1="12" y1="4" x2="12" y2="20" stroke="${color}" stroke-width="3" />
                    <line x1="4" y1="12" x2="20" y2="12" stroke="${color}" stroke-width="3" />`;
        case 'x':
            return `<line x1="6" y1="6" x2="18" y2="18" stroke="${color}" stroke-width="3" />
                    <line x1="18" y1="6" x2="6" y2="18" stroke="${color}" stroke-width="3" />`;
        default:
            return `<circle cx="12" cy="12" r="8" fill="${color}" stroke="${color}" stroke-width="1" />`;
    }
}

// ──────────────────────────────────────────────
// Reactive series update
// ──────────────────────────────────────────────

function buildSeriesDataMap(testName, grouped, categoryKeys) {
    const rsLabelMap = {};
    allResultSetsData.forEach((rs) => {
        rsLabelMap[rs.id] = rs.label;
    });
    const multipleResultSets = checkedResultSets.size > 1 || resultSetIds.length > 1;

    const seriesDataMap = new Map(); // seriesId -> { xValues, yValues, color, dashArray, name, markerType }
    const testData = grouped[testName] || {};

    const rsIndexMap = {};
    resultSetIds.forEach((rsId, idx) => {
        rsIndexMap[rsId] = idx;
    });

    Object.entries(testData).forEach(([rsId, libResults]) => {
        if (!checkedResultSets.has(rsId)) return;
        const rsIndex = rsIndexMap[rsId] || 0;
        const dashArray = DASH_PATTERNS[rsIndex % DASH_PATTERNS.length];

        Object.entries(libResults).forEach(([libName, results]) => {
            const shortName = getShortLibName(libName);
            if (!checkedLibraries.has(shortName)) return;
            if (!Array.isArray(results)) return;

            const seriesId = `${rsId}_${shortName}`;
            const color = getColorForLibrary(libName);
            const markerType = getPointMarkerForLibrary(shortName);
            const xValues = [];
            const yValues = [];

            results.forEach((r) => {
                if (!r.config || !r.averageFPS || r.isErrored) return;
                const key = configKey(r.config);
                const idx = categoryKeys.indexOf(key);
                if (idx >= 0) {
                    xValues.push(idx);
                    yValues.push(r.averageFPS);
                }
            });

            if (xValues.length === 0) return;

            const rsLabel = rsLabelMap[rsId] || rsId;
            const name = multipleResultSets ? `${shortName} [${rsLabel}]` : shortName;

            seriesDataMap.set(seriesId, { xValues, yValues, color, dashArray, name, markerType });
        });
    });

    return seriesDataMap;
}

function updateAllChartSeries() {
    const grouped = groupResultsByTestCaseAndResultSet(allResultsData);

    for (const [testKey, info] of surfaceMap) {
        const testName = E_TEST_NAME[testKey];
        const { surface, wasmContext, categoryKeys } = info;
        const seriesDataMap = buildSeriesDataMap(testName, grouped, categoryKeys);

        if (chartType === 'column') {
            updateColumnSeries(surface, wasmContext, seriesDataMap);
        } else {
            updateLineSeries(surface, wasmContext, seriesDataMap);
        }
    }

    // Update benchmark charts
    for (const [testKey, info] of benchmarkSurfaceMap) {
        const testName = E_TEST_NAME[testKey];
        const { surface, wasmContext } = info;
        updateBenchmarkChart(testName, grouped, surface, wasmContext);
    }
}

function updateLineSeries(surface, wasmContext, seriesDataMap) {
    const desiredSeriesIds = new Set(seriesDataMap.keys());

    // Remove series that should no longer exist
    const toRemove = [];
    for (let i = 0; i < surface.renderableSeries.size(); i++) {
        const rs = surface.renderableSeries.get(i);
        if (rs.id && !desiredSeriesIds.has(rs.id)) {
            toRemove.push(rs);
        }
    }
    toRemove.forEach((rs) => {
        surface.renderableSeries.remove(rs);
        rs.delete();
    });

    // Add or update series
    for (const [seriesId, data] of seriesDataMap) {
        let existing = null;
        for (let i = 0; i < surface.renderableSeries.size(); i++) {
            const rs = surface.renderableSeries.get(i);
            if (rs.id === seriesId) {
                existing = rs;
                break;
            }
        }

        if (existing) {
            const ds = existing.dataSeries;
            ds.clear();
            ds.appendRange(data.xValues, data.yValues);
            if (ds.dataSeriesName !== data.name) {
                ds.dataSeriesName = data.name;
            }
        } else {
            const dataSeries = new SC.XyDataSeries(wasmContext, {
                xValues: data.xValues,
                yValues: data.yValues,
                dataSeriesName: data.name,
            });

            const lineSeries = new SC.FastLineRenderableSeries(wasmContext, {
                id: seriesId,
                dataSeries,
                stroke: data.color,
                strokeThickness: 2,
                strokeDashArray: data.dashArray,
                pointMarker: createPointMarker(wasmContext, data.markerType, data.color),
            });

            // Store marker type on the series for legend access
            lineSeries.markerType = data.markerType;

            surface.renderableSeries.add(lineSeries);
        }
    }
}

function updateColumnSeries(surface, wasmContext, seriesDataMap) {
    // Column mode: clear everything, rebuild with StackedColumnCollection
    // Each series gets a unique stackedGroupId for side-by-side (grouped) display
    surface.renderableSeries.clear();

    if (seriesDataMap.size === 0) return;

    // StackedColumnCollection requires all series to have identical X values.
    // Compute the union of all X values, then pad each series with NaN where missing.
    const allXSet = new Set();
    for (const [, data] of seriesDataMap) {
        data.xValues.forEach((x) => allXSet.add(x));
    }
    const allX = Array.from(allXSet).sort((a, b) => a - b);

    const collection = new SC.StackedColumnCollection(wasmContext, {
        isOneHundredPercent: false,
    });
    collection.dataPointWidth = 0.7;

    for (const [seriesId, data] of seriesDataMap) {
        // Build a lookup from x -> y for this series
        const xyMap = new Map();
        for (let i = 0; i < data.xValues.length; i++) {
            xyMap.set(data.xValues[i], data.yValues[i]);
        }

        // Pad to the full X set, using NaN for missing values
        const paddedY = allX.map((x) => (xyMap.has(x) ? xyMap.get(x) : NaN));

        const dataSeries = new SC.XyDataSeries(wasmContext, {
            xValues: allX,
            yValues: paddedY,
            dataSeriesName: data.name,
            containsNaN: true,
        });

        const columnSeries = new SC.StackedColumnRenderableSeries(wasmContext, {
            id: seriesId,
            dataSeries,
            fill: data.color,
            stroke: data.color,
            strokeThickness: 1,
            opacity: 0.85,
            stackedGroupId: seriesId, // unique per series = side-by-side
        });

        collection.add(columnSeries);
    }

    surface.renderableSeries.add(collection);
}

// ──────────────────────────────────────────────
// Benchmark chart update
// ──────────────────────────────────────────────

function updateBenchmarkChart(testName, grouped, surface, wasmContext) {
    surface.renderableSeries.clear();

    const testData = grouped[testName] || {};

    // Build result set label map
    const rsLabelMap = {};
    allResultSetsData.forEach((rs) => {
        rsLabelMap[rs.id] = rs.label;
    });
    const multipleResultSets = checkedResultSets.size > 1 || resultSetIds.length > 1;

    // Collect all parameter combinations from this test case
    const allParamCombos = [];
    const paramSet = new Set();

    Object.values(testData).forEach((libResults) => {
        Object.values(libResults).forEach((results) => {
            if (results && Array.isArray(results)) {
                results.forEach((result) => {
                    if (result.config) {
                        const paramKey = JSON.stringify({
                            points: result.config.points || 0,
                            series: result.config.series || 1,
                            charts: result.config.charts || 1,
                        });
                        paramSet.add(paramKey);
                    }
                });
            }
        });
    });

    paramSet.forEach((paramKey) => {
        allParamCombos.push(JSON.parse(paramKey));
    });

    // Calculate benchmark scores for each (resultSet, library) combination
    const benchmarkScores = [];

    Object.entries(testData).forEach(([rsId, libResults]) => {
        if (!checkedResultSets.has(rsId)) return;

        Object.entries(libResults).forEach(([libName, results]) => {
            const shortName = getShortLibName(libName);
            if (!checkedLibraries.has(shortName)) return;

            // Calculate benchmark score for this library
            const score = calculateBenchmarkScore({ test: results }, allParamCombos);

            if (score > 0) {
                const rsLabel = rsLabelMap[rsId] || rsId;
                const name = multipleResultSets ? `${shortName} [${rsLabel}]` : shortName;
                const color = getColorForLibrary(libName);

                benchmarkScores.push({
                    rsId,
                    rsLabel,
                    libName,
                    shortName,
                    name,
                    score,
                    color,
                });
            }
        });
    });

    if (benchmarkScores.length === 0) return;

    // Sort by score descending
    benchmarkScores.sort((a, b) => b.score - a.score);

    // Update X-axis labels to show library names (X-axis appears on left after rotation)
    const xAxis = surface.xAxes.get(0);
    const libraryNames = benchmarkScores.map(s => s.name);
    xAxis.labelProvider = new SC.TextLabelProvider({
        labels: libraryNames,
    });

    // Create a SINGLE column series with all data points
    // With isRotatedChart: true, X becomes vertical (categories) and Y becomes horizontal (values)
    const xValues = benchmarkScores.map((_, index) => index); // [0, 1, 2, 3, ...]
    const yValues = benchmarkScores.map(entry => entry.score);

    const dataSeries = new SC.XyDataSeries(wasmContext, {
        xValues,
        yValues,
        dataSeriesName: 'Benchmark Scores',
    });

    // Convert hex colors to ARGB integers
    const colorIntegers = benchmarkScores.map(entry => SciChart.parseColorToUIntArgb(entry.color));

    const columnSeries = new SC.FastColumnRenderableSeries(wasmContext, {
        dataSeries,
        fill: '#4083E8', // Default fill (will be overridden by palette provider)
        stroke: '#4083E8', // Default stroke (will be overridden by palette provider)
        strokeThickness: 1,
        opacity: 0.85,
        cornerRadius: 5, // Rounded corners
        dataPointWidth: 0.7,
        paletteProvider: new BenchmarkPaletteProvider(colorIntegers),
    });

    surface.renderableSeries.add(columnSeries);
}

// ──────────────────────────────────────────────
// Custom PaletteProvider for per-column coloring
// ──────────────────────────────────────────────

class BenchmarkPaletteProvider {
    constructor(colorIntegers) {
        this.colorIntegers = colorIntegers;
    }

    onAttached(parentSeries) {
        this.parentSeries = parentSeries;
    }

    onDetached() {
        this.parentSeries = undefined;
    }

    overrideFillArgb(xValue, yValue, index, opacity, metadata) {
        if (index >= 0 && index < this.colorIntegers.length) {
            return this.colorIntegers[index];
        }
        return undefined; // Use default
    }

    overrideStrokeArgb(xValue, yValue, index, opacity, metadata) {
        if (index >= 0 && index < this.colorIntegers.length) {
            return this.colorIntegers[index];
        }
        return undefined; // Use default
    }
}

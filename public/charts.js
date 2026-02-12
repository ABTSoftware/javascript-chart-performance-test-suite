// charts.js — Visualize benchmark results as SciChart.js line charts

const LIBRARY_COLORS = {
    'SciChart.js': '#4083E8',
    Highcharts: '#2B2D42',
    'Chart.js': '#FF6384',
    'Plotly.js': '#636EFA',
    'Apache ECharts': '#E63946',
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
        EllipsePointMarker: SciChart.EllipsePointMarker,
        SciChartJSLightTheme: SciChart.SciChartJSLightTheme,
        EAutoRange: SciChart.EAutoRange,
        LegendModifier: SciChart.LegendModifier,
        RolloverModifier: SciChart.RolloverModifier,
        CursorModifier: SciChart.CursorModifier,
        ELegendPlacement: SciChart.ELegendPlacement,
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
        rsIdSet.add(r.resultSetId || RESERVED_RESULT_SET_DEFAULT);
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
        const chartDiv = document.createElement('div');
        chartDiv.id = divId;
        chartDiv.className = 'chart-div';
        section.appendChild(chartDiv);
        container.appendChild(section);

        const { sciChartSurface, wasmContext } = await SC.SciChartSurface.create(divId, {
            theme: new SC.SciChartJSLightTheme(),
            title: testName,
            titleStyle: { fontSize: 16 },
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

        // sciChartSurface.chartModifiers.add(
        //     new SC.LegendModifier({
        //         placement: SC.ELegendPlacement.TopRight,
        //         showCheckboxes: true,
        //         showSeriesMarkers: true,
        //     })
        // );

        sciChartSurface.chartModifiers.add(
            new SC.CursorModifier({
                showTooltip: true,
                snapToDataPoint: true,
            })
        );

        surfaceMap.set(testKey, {
            surface: sciChartSurface,
            wasmContext,
            categoryKeys,
            categoryLabels,
        });
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

    const seriesDataMap = new Map(); // seriesId -> { xValues, yValues, color, dashArray, name }
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

            seriesDataMap.set(seriesId, { xValues, yValues, color, dashArray, name });
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
                pointMarker: new SC.EllipsePointMarker(wasmContext, {
                    width: 8,
                    height: 8,
                    fill: data.color,
                    stroke: data.color,
                    strokeThickness: 1,
                }),
            });

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

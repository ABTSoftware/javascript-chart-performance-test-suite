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
    // Use CHARTS from shared.js (same logic as shared.js getShortLibName)
    const chart = CHARTS.find((c) => libName.startsWith(c.name));
    if (chart) return chart.name;
    // Legacy "Lcjs" prefix (pre-rename records in static JSON / old IDB) → "LCJS v4"
    if (libName.startsWith('Lcjs')) return 'LCJS v4';
    // Fallback to LIBRARY_COLORS keys for any remaining libraries
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
// Metric selection state
let selectedMetric = 'fps'; // 'fps', 'memory', 'initialization', 'frames'

// SciChart imports (set in DOMContentLoaded)
let SC = {};

// ──────────────────────────────────────────────
// Metric helper functions
// ──────────────────────────────────────────────

function getMetricLabel() {
    switch (selectedMetric) {
        case 'fps': return 'Average FPS';
        case 'memory': return 'Memory (MB)';
        case 'initialization': return 'Init Time (ms)';
        case 'frames': return 'Total Frames';
        case 'ingestion': return 'Ingestion Rate (pts/sec)';
        default: return 'Average FPS';
    }
}

function getMetricValue(result, testName) {
    if (!result || result.isErrored) return null;
    switch (selectedMetric) {
        case 'fps': return result.averageFPS;
        case 'memory': return result.memory;
        case 'initialization': return result.benchmarkTimeFirstFrame;
        case 'frames': return result.numberOfFrames;
        case 'ingestion':
            // Use pre-calculated value if available, otherwise calculate on-the-fly
            if (result.dataIngestionRate !== undefined && result.dataIngestionRate !== null) {
                return result.dataIngestionRate;
            }
            return calculateDataIngestionRate(result, testName);
        default: return result.averageFPS;
    }
}

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

    // Initialize filter state — first result set selected by default
    checkedResultSets = new Set(resultSetIds.length > 0 ? [resultSetIds[0]] : []);
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
    const metricContainer = document.getElementById('metricSelector');

    // Chart type radio buttons
    document.querySelectorAll('input[name="chartType"]').forEach((radio) => {
        radio.addEventListener('change', onChartTypeChange);
    });

    // Metric selector
    if (metricContainer) {
        metricContainer.innerHTML = `
            <strong>Metric:</strong>
            <label><input type="radio" name="metric" value="fps" ${selectedMetric === 'fps' ? 'checked' : ''}> Average FPS</label>
            <label><input type="radio" name="metric" value="memory" ${selectedMetric === 'memory' ? 'checked' : ''}> Memory (MB)</label>
            <label><input type="radio" name="metric" value="initialization" ${selectedMetric === 'initialization' ? 'checked' : ''}> Init Time (ms)</label>
            <label><input type="radio" name="metric" value="frames" ${selectedMetric === 'frames' ? 'checked' : ''}> Total Frames</label>
            <label><input type="radio" name="metric" value="ingestion" ${selectedMetric === 'ingestion' ? 'checked' : ''}> Ingestion Rate (pts/sec)</label>
        `;

        // Add event listeners for metric selection
        document.querySelectorAll('input[name="metric"]').forEach((radio) => {
            radio.addEventListener('change', onMetricChange);
        });
    }

    // Result set radio buttons
    resultSetIds.forEach((rsId, i) => {
        const label = document.createElement('label');
        const rb = document.createElement('input');
        rb.type = 'radio';
        rb.name = 'resultSet';
        rb.checked = i === 0;
        rb.dataset.rsId = rsId;
        rb.addEventListener('change', onFilterChange);
        label.appendChild(rb);
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
    checkedResultSets = new Set();
    const checkedRs = document.querySelector('#resultSetFilters input[type="radio"]:checked');
    if (checkedRs) checkedResultSets.add(checkedRs.dataset.rsId);

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

function onMetricChange(e) {
    selectedMetric = e.target.value;
    const metricLabel = getMetricLabel();
    // Update Y-axis titles and chart titles for all charts
    for (const [testKey, info] of surfaceMap) {
        const { surface } = info;
        const yAxis = surface.yAxes.get(0);
        yAxis.axisTitle = metricLabel;
        const testName = E_TEST_NAME[testKey];
        surface.title = `${testName} — ${metricLabel}`;
    }
    // Update chart series with new metric
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
    for (const testKey of TEST_DISPLAY_ORDER.filter(k => E_TEST_NAME[k])) {
        const testName = E_TEST_NAME[testKey];

        const section = document.createElement('div');
        section.className = 'chart-section';

        const heading = document.createElement('h3');
        heading.style.cssText = 'display:flex;align-items:center;gap:12px;margin-top:0;margin-bottom:8px;';

        const titleSpan = document.createElement('span');
        titleSpan.textContent = testName;
        heading.appendChild(titleSpan);

        const copyAllBtn = document.createElement('button');
        copyAllBtn.textContent = '📋 Copy Image';
        copyAllBtn.style.cssText = [
            'display:inline-flex', 'align-items:center', 'gap:4px',
            'padding:3px 8px', 'font-size:11px', 'cursor:pointer',
            'border:1px solid #ccc', 'border-radius:3px',
            'background:#f8f8f8', 'color:#555', 'flex-shrink:0',
            'font-weight:normal', 'line-height:1.4',
        ].join(';');
        copyAllBtn.addEventListener('click', async () => {
            const origText = copyAllBtn.textContent;
            copyAllBtn.textContent = 'Copying…';
            copyAllBtn.disabled = true;
            try {
                const blob = await domtoimage.toBlob(chartsWrapper, {
                    width: chartsWrapper.scrollWidth,
                    height: chartsWrapper.scrollHeight,
                    bgcolor: '#ffffff',
                });
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                copyAllBtn.textContent = '✓ Copied!';
                copyAllBtn.style.color = '#28a745';
                copyAllBtn.style.borderColor = '#28a745';
            } catch (err) {
                console.error('Copy section failed:', err);
                copyAllBtn.textContent = 'Failed';
                copyAllBtn.style.color = '#cc0000';
                copyAllBtn.style.borderColor = '#cc0000';
            } finally {
                setTimeout(() => {
                    copyAllBtn.textContent = origText;
                    copyAllBtn.disabled = false;
                    copyAllBtn.style.color = '#555';
                    copyAllBtn.style.borderColor = '#ccc';
                }, 2000);
            }
        });
        heading.appendChild(copyAllBtn);

        section.appendChild(heading);

        // Wrapper for the charts only — used as the capture target for "Copy Image"
        // so the heading (which duplicates the chart title) is excluded from the snapshot.
        const chartsWrapper = document.createElement('div');
        section.appendChild(chartsWrapper);

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
        chartsWrapper.appendChild(chartDiv);

        // Create legend container below the chart
        const legendDiv = document.createElement('div');
        legendDiv.id = legendDivId;
        legendDiv.className = 'legend-div';
        legendDiv.style.marginBottom = '20px';
        chartsWrapper.appendChild(legendDiv);

        container.appendChild(section);

        const { sciChartSurface, wasmContext } = await SC.SciChartSurface.create(divId, {
            theme: new SC.SciChartJSLightTheme(),
            title: `${testName} — ${getMetricLabel()}`,
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
            axisTitle: getMetricLabel(),
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

        addChartCopyOverlay(chartDiv, legendDiv);

        // ──────────────────────────────────────────────
        // Create Benchmark Chart (below FPS chart)
        // ──────────────────────────────────────────────

        const benchmarkDivId = 'benchmark-chart-' + testKey;
        const benchmarkLegendDivId = 'benchmark-legend-' + testKey;

        const benchmarkChartDiv = document.createElement('div');
        benchmarkChartDiv.id = benchmarkDivId;
        benchmarkChartDiv.className = 'benchmark-chart-div';
        benchmarkChartDiv.style.height = '200px';
        chartsWrapper.appendChild(benchmarkChartDiv);

        // Create legend container for benchmark chart
        const benchmarkLegendDiv = document.createElement('div');
        benchmarkLegendDiv.id = benchmarkLegendDivId;
        benchmarkLegendDiv.className = 'legend-div';
        chartsWrapper.appendChild(benchmarkLegendDiv);

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
            maxAutoTicks: 5,
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
                hitTestRadius: 0
            })
        );

        benchmarkSurfaceMap.set(testKey, {
            surface: benchmarkSurface,
            wasmContext: benchmarkWasmContext,
        });

        addChartCopyOverlay(benchmarkChartDiv, benchmarkLegendDiv);
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
    const seriesDataMap = new Map(); // seriesId -> { xValues, yValues, color, name, markerType }
    const testData = grouped[testName] || {};

    Object.entries(testData).forEach(([rsId, libResults]) => {
        if (!checkedResultSets.has(rsId)) return;
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
                if (!r.config || r.isErrored) return;
                const metricValue = getMetricValue(r, testName);
                if (metricValue === null || metricValue === undefined) return;
                const key = configKey(r.config);
                const idx = categoryKeys.indexOf(key);
                if (idx >= 0) {
                    xValues.push(idx);
                    yValues.push(metricValue);
                }
            });

            if (xValues.length === 0) return;

            seriesDataMap.set(seriesId, { xValues, yValues, color, name: shortName, markerType });
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
                strokeDashArray: undefined,
                pointMarker: createPointMarker(wasmContext, data.markerType, data.color),
            });

            // Store marker type on the series for legend access
            lineSeries.markerType = data.markerType;

            surface.renderableSeries.add(lineSeries);
        }
    }

    // Restore auto-range on X in case column mode had set an explicit visibleRange.
    surface.xAxes.get(0).autoRange = SC.EAutoRange.Always;
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

    // Set explicit visible range so the first/last column groups aren't clipped.
    // Auto-range only covers the data extent (0..N-1); the column half-width (0.35)
    // would be cut off without padding. The benchmark chart uses the same pattern.
    if (allX.length > 0) {
        surface.xAxes.get(0).visibleRange = new SC.NumberRange(allX[0] - 0.5, allX[allX.length - 1] + 0.5);
    }
}

// ──────────────────────────────────────────────
// Benchmark chart update
// ──────────────────────────────────────────────

function updateBenchmarkChart(testName, grouped, surface, wasmContext) {
    surface.renderableSeries.clear();

    const testData = grouped[testName] || {};

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
    // Include ALL checked libraries, even those with no results (score = 0)
    const benchmarkScores = [];

    // Iterate over all checked result sets and libraries
    checkedResultSets.forEach(rsId => {
        checkedLibraries.forEach(shortName => {
            const color = getColorForLibrary(shortName);

            // Check if results exist for this combination
            const libResults = testData[rsId];
            let score = 0;

            if (libResults) {
                // Find the full library name (might have version suffix)
                const libName = Object.keys(libResults).find(key => getShortLibName(key) === shortName);

                if (libName && libResults[libName]) {
                    const results = libResults[libName];
                    // Calculate benchmark score for this library
                    score = calculateBenchmarkScore({ test: results }, allParamCombos);
                }
            }

            // Include all scores, even 0 (for tests that haven't run, are unsupported, or crashed)
            benchmarkScores.push({
                rsId,
                libName: shortName,
                shortName,
                name: shortName,
                score,
                color,
            });
        });
    });

    if (benchmarkScores.length === 0) return;

    // Sort by score descending
    benchmarkScores.sort((a, b) => b.score - a.score);

    // Update X-axis labels and range to exactly fit the current bar count
    const xAxis = surface.xAxes.get(0);
    const libraryNames = benchmarkScores.map(s => s.name);
    xAxis.labelProvider = new SC.TextLabelProvider({
        labels: libraryNames,
    });
    xAxis.visibleRange = new SC.NumberRange(-0.5, libraryNames.length - 0.5);

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

// ──────────────────────────────────────────────
// Per-chart copy overlay
// ──────────────────────────────────────────────

function addChartCopyOverlay(chartDivEl, legendDivEl) {
    chartDivEl.style.position = 'relative';

    const btn = document.createElement('button');
    btn.textContent = '📋';
    btn.title = 'Copy chart to clipboard';
    btn.style.cssText = [
        'position:absolute', 'top:6px', 'right:6px', 'z-index:100',
        'padding:3px 7px', 'font-size:13px', 'cursor:pointer',
        'border:1px solid rgba(0,0,0,0.18)', 'border-radius:4px',
        'background:rgba(255,255,255,0.82)', 'color:#333',
        'line-height:1', 'opacity:0', 'transition:opacity 0.15s',
    ].join(';');

    // Show button only on hover so it doesn't clutter the chart
    chartDivEl.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
    chartDivEl.addEventListener('mouseleave', () => { btn.style.opacity = '0'; });

    btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const origText = btn.textContent;
        btn.textContent = '…';
        btn.disabled = true;

        try {
            let blob;
            if (legendDivEl) {
                // Capture chart and legend separately then stitch vertically
                const [chartBlob, legendBlob] = await Promise.all([
                    domtoimage.toBlob(chartDivEl, { filter: (node) => node !== btn }),
                    domtoimage.toBlob(legendDivEl),
                ]);
                const loadImg = (b) => new Promise((resolve) => {
                    const img = new Image();
                    const url = URL.createObjectURL(b);
                    img.onload = () => { resolve(img); URL.revokeObjectURL(url); };
                    img.src = url;
                });
                const [chartImg, legendImg] = await Promise.all([
                    loadImg(chartBlob),
                    loadImg(legendBlob),
                ]);
                const offscreen = document.createElement('canvas');
                offscreen.width = Math.max(chartImg.width, legendImg.width);
                offscreen.height = chartImg.height + legendImg.height;
                const ctx = offscreen.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, offscreen.width, offscreen.height);
                ctx.drawImage(chartImg, 0, 0);
                ctx.drawImage(legendImg, 0, chartImg.height);
                blob = await new Promise((resolve) => offscreen.toBlob(resolve, 'image/png'));
            } else {
                blob = await domtoimage.toBlob(chartDivEl, { filter: (node) => node !== btn });
            }
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            btn.textContent = '✓';
            btn.style.color = '#28a745';
        } catch (err) {
            console.error('Copy chart failed:', err);
            btn.textContent = '✗';
            btn.style.color = '#cc0000';
        } finally {
            setTimeout(() => {
                btn.textContent = origText;
                btn.disabled = false;
                btn.style.color = '#333';
                btn.style.opacity = '1';
            }, 1800);
        }
    });

    chartDivEl.appendChild(btn);
}

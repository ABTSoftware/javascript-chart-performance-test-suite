const E_TEST_NAME = {
    N_X_M: "N line series M points",
    SCATTER: "Brownian Motion Scatter Series",
    LINE: "Line series which is unsorted in x",
    POINT_LINE: "Point series, sorted, updating y-values",
    COLUMN: "Column chart with data ascending in X",
    CANDLESTICK: "Candlestick series test",
    FIFO: "FIFO / ECG Chart Performance Test",
    MOUNTAIN: "Mountain Chart Performance Test",
    SERIES_COMPRESSION: "Series Compression Test",
    MULTI_CHART: "Multi Chart Performance Test",
    HEATMAP: "Uniform Heatmap Performance Test",
    POINTCLOUD_3D: "3D Point Cloud Performance Test",
    SURFACE_3D: "3D Surface Performance Test"
};
const CHARTS = generateCharts();
const TESTS = generateTests();

document.addEventListener('DOMContentLoaded', async function () { // Аналог $(document).ready(function(){
    await buildTestsTable();
});

function generateCharts () {
    const charts = [];
    charts.push({
        name: 'SciChart.js',
        path: 'scichart/scichart.html'
    });
    charts.push({
        name: 'Highcharts',
        path: 'highcharts/highcharts.html',
        custom: [
            {
                path: 'highcharts/highcharts_stock_charts.html',
                test: E_TEST_NAME.CANDLESTICK
            }
        ]
    });
    charts.push({
        name: 'Chart.js',
        path: 'chartjs/chartjs.html',
        custom: [
            {
                path: 'chartjs/chartjs_candlestick.html',
                test: E_TEST_NAME.CANDLESTICK
            }
        ]
    });
    charts.push({
        name: 'Plotly.js', path: 'plotly/plotly.html'
    });
    charts.push({
        name: 'Apache ECharts', path: 'echarts/echarts.html'
    });
    charts.push({
        name: 'uPlot',
        path: 'uPlot/uPlot.html',
    });
    return charts;
}

function generateTests () {
    const tests = [];
    tests.push("");
    for (key in E_TEST_NAME) {
        tests.push(E_TEST_NAME[key]);
    }
    return tests;
}

const buildTestsTable = async () => {
    const tableContainer = document.getElementById("testsTableContainer");
    if (tableContainer && CHARTS && CHARTS.length > 0) {
        const table = document.createElement("table");
        
        // Load test support data for all charts first
        const supportPromises = CHARTS.map(chart => loadTestSupport(chart.name));
        await Promise.all(supportPromises);
        
        TESTS.forEach((testName, indexRow) => {
            buildRow(table, testName, indexRow);
        });
        tableContainer.appendChild(table);
    }
}

const buildRow = (table, testName, indexRow) => {
    const tr = table.insertRow();
    const tdTest = tr.insertCell();
    tdTest.innerHTML = testName || '';
    CHARTS.forEach(chart => {
        const td = tr.insertCell();
        let href = chart.path || '';

        if (chart.custom && chart.custom.length > 0) {
            const customTest = chart.custom.find((customItem) => customItem.test === testName);
            if (customTest) {
                href = customTest.path
            }
        }

        let html;
        if (indexRow === 0) {
            html = chart.name;
        } else {
            // Check if this test is supported by this chart library using cached data
            const supportedTests = testSupportCache.get(chart.name) || Object.values(E_TEST_NAME);
            const isSupported = supportedTests.includes(testName);
            
            if (isSupported) {
                html = `<a href="${href}?test_group_id=${indexRow}">RUN</a>`;
            } else {
                html = '<span style="color: #888; font-style: italic;">unsupported</span>';
            }
        }
        td.innerHTML = html;
    });
}

// Cache for loaded test support data
const testSupportCache = new Map();

async function loadTestSupport(chartName) {
    if (testSupportCache.has(chartName)) {
        return testSupportCache.get(chartName);
    }

    // Map chart names to their test script paths
    const scriptPaths = {
        'SciChart.js': 'scichart/scichart_tests.js',
        'Chart.js': 'chartjs/chartjs_tests.js',
        'Highcharts': 'highcharts/highcharts_tests.js',
        'Plotly.js': 'plotly/plotly_tests.js',
        'Apache ECharts': 'echarts/echarts_tests.js',
        'uPlot': 'uPlot/uPlot_tests.js'
    };

    const scriptPath = scriptPaths[chartName];
    if (!scriptPath) {
        // Unknown chart, assume all tests supported
        const allTests = Object.values(E_TEST_NAME);
        testSupportCache.set(chartName, allTests);
        return allTests;
    }

    try {
        // Create a temporary script element to load the test file
        const script = document.createElement('script');
        script.src = scriptPath;
        
        // Wait for script to load
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        // Try to get supported tests from the loaded script
        let supportedTests;
        if (typeof window.getSupportedTests === 'function') {
            supportedTests = window.getSupportedTests();
        } else {
            // Fallback: assume all tests supported if function not found
            supportedTests = Object.values(E_TEST_NAME);
        }

        // Clean up the script element
        document.head.removeChild(script);
        
        // Cache the result
        testSupportCache.set(chartName, supportedTests);
        return supportedTests;

    } catch (error) {
        console.warn(`Failed to load test support for ${chartName}:`, error);
        // Fallback: assume all tests supported
        const allTests = Object.values(E_TEST_NAME);
        testSupportCache.set(chartName, allTests);
        return allTests;
    }
}

function checkTestSupport(chartName, testName) {
    // For now, return true and let the async loading happen in buildTestsTable
    // This is a synchronous function but we need async loading
    return true;
}

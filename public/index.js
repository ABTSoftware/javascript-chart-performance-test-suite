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


document.addEventListener('DOMContentLoaded', async function () {
    await initIndexedDB();
    await buildResultsSection();
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
    charts.push({
        name: 'ChartGPU',
        path: 'chartgpu/chartgpu.html',
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


// Cache for loaded test support data
const testSupportCache = new Map();

// IndexedDB setup for results display
let db = null;
const DB_NAME = 'ChartPerformanceResults';
const DB_VERSION = 1;
const STORE_NAME = 'testResults';

async function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('chartLibrary', 'chartLibrary', { unique: false });
                store.createIndex('testCase', 'testCase', { unique: false });
            }
        };
    });
}

async function getAllTestResults() {
    console.log('=== getAllTestResults CALLED ===');
    
    if (!db) {
        console.error('Database not initialized for getAllTestResults');
        return [];
    }
    
    console.log('Database available for retrieval:', !!db);
    
    try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            
            request.onsuccess = (event) => {
                const results = event.target.result || [];
                console.log('=== RETRIEVAL SUCCESS ===');
                console.log('Retrieved from IndexedDB:', results.length, 'records');
                
                results.forEach((result, index) => {
                    console.log(`Record ${index + 1}:`, {
                        id: result.id,
                        chartLibrary: result.chartLibrary,
                        testCase: result.testCase,
                        resultsCount: result.results?.length,
                        timestamp: result.timestamp,
                        fullRecord: result
                    });
                });
                
                resolve(results);
            };
            
            request.onerror = (event) => {
                console.error('=== RETRIEVAL ERROR ===');
                console.error('IndexedDB retrieval error:', event.target.error);
                reject(event.target.error);
            };
        });
        
    } catch (error) {
        console.error('=== getAllTestResults EXCEPTION ===');
        console.error('Exception in getAllTestResults:', error);
        console.error('Exception stack:', error.stack);
        return [];
    }
}

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
        'uPlot': 'uPlot/uPlot_tests.js',
        'ChartGPU': 'chartgpu/chartgpu_tests.js'
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

async function buildResultsSection() {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) {
        // Create results container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'resultsContainer';
        container.style.marginTop = '40px';
        document.body.appendChild(container);
        return buildResultsSection();
    }
    
    // Clear existing content
    resultsContainer.innerHTML = '<h2>Test Cases / Results</h2>';
    
    try {
        const allResults = await getAllTestResults();
        
        // Group results by test case
        const resultsByTestCase = {};
        allResults.forEach(result => {
            console.log('Processing result:', result);
            if (!resultsByTestCase[result.testCase]) {
                resultsByTestCase[result.testCase] = {};
            }
            resultsByTestCase[result.testCase][result.chartLibrary] = result.results;
        });
        
        console.log('Results grouped by test case:', resultsByTestCase);
        
        // Load test support data for all charts first
        const supportPromises = CHARTS.map(chart => loadTestSupport(chart.name));
        await Promise.all(supportPromises);
        
        // Create tables for each test case
        Object.keys(E_TEST_NAME).forEach(testKey => {
            const testName = E_TEST_NAME[testKey];
            const testResults = resultsByTestCase[testName] || {};
            
            const section = document.createElement('div');
            section.style.marginBottom = '30px';
            
            const heading = document.createElement('h3');
            heading.style.display = 'flex';
            heading.style.alignItems = 'center';
            heading.style.gap = '20px';
            heading.style.marginBottom = '10px';
            
            const titleSpan = document.createElement('span');
            titleSpan.textContent = testName;
            heading.appendChild(titleSpan);
            
            // Add RUN buttons for each chart library
            const runButtonsContainer = document.createElement('div');
            runButtonsContainer.style.display = 'flex';
            runButtonsContainer.style.gap = '10px';
            runButtonsContainer.style.flexWrap = 'wrap';
            
            // Find the test group ID for this test name
            const testGroupId = Object.keys(E_TEST_NAME).find(key => E_TEST_NAME[key] === testName);
            const testGroupIndex = testGroupId ? Object.keys(E_TEST_NAME).indexOf(testGroupId) + 1 : null;
            
            CHARTS.forEach(chart => {
                // Check if this test is supported by this chart library
                const supportedTests = testSupportCache.get(chart.name) || Object.values(E_TEST_NAME);
                const isSupported = supportedTests.includes(testName);
                
                if (isSupported && testGroupIndex) {
                    let href = chart.path || '';
                    
                    // Check for custom test paths
                    if (chart.custom && chart.custom.length > 0) {
                        const customTest = chart.custom.find((customItem) => customItem.test === testName);
                        if (customTest) {
                            href = customTest.path;
                        }
                    }

                    const runLink = document.createElement('a');
                    runLink.textContent = `RUN ${chart.name}`;
                    runLink.className = 'run-test-link';
                    runLink.href = `${href}?test_group_id=${testGroupIndex}`;
                    runLink.target = '_blank';
                    runLink.rel = 'noopener noreferrer';
                    runLink.style.padding = '5px 10px';
                    runLink.style.fontSize = '12px';
                    runLink.style.backgroundColor = '#007bff';
                    runLink.style.color = 'white';
                    runLink.style.border = 'none';
                    runLink.style.borderRadius = '3px';
                    runLink.style.cursor = 'pointer';
                    runLink.style.textDecoration = 'none';
                    runLink.style.display = 'inline-block';

                    runLink.addEventListener('mouseenter', () => {
                        runLink.style.backgroundColor = '#0056b3';
                    });

                    runLink.addEventListener('mouseleave', () => {
                        runLink.style.backgroundColor = '#007bff';
                    });

                    runButtonsContainer.appendChild(runLink);
                }
            });
            
            heading.appendChild(runButtonsContainer);
            section.appendChild(heading);
            
            const table = createResultsTable(testName, testResults);
            table.classList.add('results-ready')
            section.appendChild(table);
            
            resultsContainer.appendChild(section);
        });
        
    } catch (error) {
        console.error('Failed to build results section:', error);
        resultsContainer.innerHTML = '<h2>Test Cases / Results</h2><p>Error loading results from database.</p>';
    }
}

function createResultsTable(testName, testResults) {
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.marginBottom = '20px';
    
    // Create header row
    const headerRow = table.insertRow();
    headerRow.style.backgroundColor = '#f0f0f0';
    headerRow.style.fontWeight = 'bold';
    
    // Add parameter columns
    const paramsHeader = headerRow.insertCell();
    paramsHeader.textContent = 'Parameters';
    paramsHeader.style.border = '1px solid #ccc';
    paramsHeader.style.padding = '8px';
    paramsHeader.style.textAlign = 'left';
    
    // Add chart library columns
    CHARTS.forEach(chart => {
        const cell = headerRow.insertCell();
        cell.textContent = `${chart.name} (Avg FPS)`;
        cell.style.border = '1px solid #ccc';
        cell.style.padding = '8px';
        cell.style.textAlign = 'center';
        console.log(`Added header for chart: ${chart.name}`);
    });
    
    // Get all possible parameter combinations from test configurations
    const paramCombinations = new Set();
    
    // Add parameter combinations from existing results
    Object.values(testResults).forEach(results => {
        if (results && Array.isArray(results)) {
            results.forEach(result => {
                if (result.config) {
                    const params = `${result.config.points || 0} points, ${result.config.series || 0} series${result.config.charts ? `, ${result.config.charts} charts` : ''}`;
                    paramCombinations.add(params);
                }
            });
        }
    });
    
    // Add all possible parameter combinations from test group configurations
    // This ensures we show all test cases even if no results exist yet
    const testGroups = {
        1: { name: 'N line series M points', tests: [
            { series: 100, points: 100 }, { series: 500, points: 500 }, { series: 1000, points: 1000 },
            { series: 2000, points: 2000 }, { series: 4000, points: 4000 }, { series: 8000, points: 8000 }
        ]},
        2: { name: 'Brownian Motion Scatter Series', tests: [
            { series: 1, points: 1000 }, { series: 1, points: 10000 }, { series: 1, points: 50000 },
            { series: 1, points: 100000 }, { series: 1, points: 200000 }, { series: 1, points: 500000 },
            { series: 1, points: 1000000 }, { series: 1, points: 5000000 }, { series: 1, points: 10000000 }
        ]},
        3: { name: 'Line series which is unsorted in x', tests: [
            { series: 1, points: 1000 }, { series: 1, points: 10000 }, { series: 1, points: 50000 },
            { series: 1, points: 100000 }, { series: 1, points: 200000 }, { series: 1, points: 500000 },
            { series: 1, points: 1000000 }, { series: 1, points: 5000000 }, { series: 1, points: 10000000 }
        ]},
        4: { name: 'Point series, sorted, updating y-values', tests: [
            { series: 1, points: 1000 }, { series: 1, points: 10000 }, { series: 1, points: 50000 },
            { series: 1, points: 100000 }, { series: 1, points: 200000 }, { series: 1, points: 500000 },
            { series: 1, points: 1000000 }, { series: 1, points: 5000000 }, { series: 1, points: 10000000 }
        ]},
        5: { name: 'Column chart with data ascending in X', tests: [
            { series: 1, points: 1000 }, { series: 1, points: 10000 }, { series: 1, points: 50000 },
            { series: 1, points: 100000 }, { series: 1, points: 200000 }, { series: 1, points: 500000 },
            { series: 1, points: 1000000 }, { series: 1, points: 5000000 }, { series: 1, points: 10000000 }
        ]},
        6: { name: 'Candlestick series test', tests: [
            { series: 1, points: 1000 }, { series: 1, points: 10000 }, { series: 1, points: 50000 },
            { series: 1, points: 100000 }, { series: 1, points: 200000 }, { series: 1, points: 500000 },
            { series: 1, points: 1000000 }, { series: 1, points: 5000000 }, { series: 1, points: 10000000 }
        ]},
        7: { name: 'FIFO / ECG Chart Performance Test', tests: [
            { series: 5, points: 100 }, { series: 5, points: 10000 }, { series: 5, points: 100000 },
            { series: 5, points: 1000000 }, { series: 5, points: 5000000 }, { series: 5, points: 10000000 }
        ]},
        8: { name: 'Mountain Chart Performance Test', tests: [
            { series: 1, points: 1000 }, { series: 1, points: 10000 }, { series: 1, points: 50000 },
            { series: 1, points: 100000 }, { series: 1, points: 200000 }, { series: 1, points: 500000 },
            { series: 1, points: 1000000 }, { series: 1, points: 5000000 }, { series: 1, points: 10000000 }
        ]},
        9: { name: 'Series Compression Test', tests: [
            { series: 1, points: 1000 }, { series: 1, points: 10000 }, { series: 1, points: 100000 },
            { series: 1, points: 1000000 }, { series: 1, points: 10000000 }
        ]},
        10: { name: 'Multi Chart Performance Test', tests: [
            { series: 1, points: 10000, charts: 1 }, { series: 1, points: 10000, charts: 2 },
            { series: 1, points: 10000, charts: 4 }, { series: 1, points: 10000, charts: 8 },
            { series: 1, points: 10000, charts: 16 }, { series: 1, points: 10000, charts: 32 },
            { series: 1, points: 10000, charts: 64 }, { series: 1, points: 10000, charts: 128 }
        ]},
        11: { name: 'Uniform Heatmap Performance Test', tests: [
            { series: 1, points: 100 }, { series: 1, points: 200 }, { series: 1, points: 500 },
            { series: 1, points: 1000 }, { series: 1, points: 2000 }, { series: 1, points: 4000 },
            { series: 1, points: 8000 }, { series: 1, points: 16000 }
        ]},
        12: { name: '3D Point Cloud Performance Test', tests: [
            { series: 1, points: 100 }, { series: 1, points: 1000 }, { series: 1, points: 10000 },
            { series: 1, points: 100000 }, { series: 1, points: 1000000 }, { series: 1, points: 2000000 },
            { series: 1, points: 4000000 }
        ]},
        13: { name: '3D Surface Performance Test', tests: [
            { series: 1, points: 100 }, { series: 1, points: 200 }, { series: 1, points: 500 },
            { series: 1, points: 1000 }, { series: 1, points: 2000 }, { series: 1, points: 4000 },
            { series: 1, points: 8000 }
        ]}
    };
    
    // Find the matching test group and add all its parameter combinations
    Object.values(testGroups).forEach(group => {
        if (group.name === testName) {
            group.tests.forEach(test => {
                const params = `${test.points || 0} points, ${test.series || 0} series${test.charts ? `, ${test.charts} charts` : ''}`;
                paramCombinations.add(params);
            });
        }
    });
    
    // Convert to sorted array
    const sortedParams = Array.from(paramCombinations).sort((a, b) => {
        // Extract point count for sorting
        const aPoints = parseInt(a.match(/(\d+) points/)?.[1] || '0');
        const bPoints = parseInt(b.match(/(\d+) points/)?.[1] || '0');
        return aPoints - bPoints;
    });
    
    // Collect all FPS values for heatmap calculation
    const allFpsValues = [];
    Object.values(testResults).forEach(results => {
        if (results && Array.isArray(results)) {
            results.forEach(result => {
                if (result.averageFPS && result.averageFPS > 0) {
                    allFpsValues.push(result.averageFPS);
                }
            });
        }
    });
    
    const minFps = allFpsValues.length > 0 ? Math.min(...allFpsValues) : 0;
    const maxFps = allFpsValues.length > 0 ? Math.max(...allFpsValues) : 100;
    
    // Create data rows
    sortedParams.forEach(paramStr => {
        const row = table.insertRow();
        
        // Parameters cell
        const paramCell = row.insertCell();
        paramCell.textContent = paramStr;
        paramCell.style.border = '1px solid #ccc';
        paramCell.style.padding = '8px';
        paramCell.style.fontWeight = 'bold';
        
        // Chart library cells
        CHARTS.forEach(chart => {
            const cell = row.insertCell();
            cell.style.border = '1px solid #ccc';
            cell.style.padding = '8px';
            cell.style.textAlign = 'center';
            
            // Find matching result for this chart and parameters
            // Try both exact chart name and chart name with version
            let chartResults = testResults[chart.name];
            if (!chartResults) {
                // Try to find by partial match (chart name might include version)
                const chartKey = Object.keys(testResults).find(key => key.startsWith(chart.name));
                if (chartKey) {
                    chartResults = testResults[chartKey];
                    console.log(`Found results using partial match: ${chartKey} for ${chart.name}`);
                }
            }
            let fps = null;
            
            console.log(`Looking for results for ${chart.name}, paramStr: ${paramStr}`);
            console.log('Chart results:', chartResults);
            
            if (chartResults && Array.isArray(chartResults)) {
                console.log(`Found ${chartResults.length} results for ${chart.name}`);
                const matchingResult = chartResults.find(result => {
                    if (!result.config) {
                        console.log('Result has no config:', result);
                        return false;
                    }
                    const resultParams = `${result.config.points || 0} points, ${result.config.series || 0} series${result.config.charts ? `, ${result.config.charts} charts` : ''}`;
                    console.log(`Comparing "${resultParams}" with "${paramStr}"`);
                    return resultParams === paramStr;
                });
                
                console.log('Matching result:', matchingResult);
                if (matchingResult) {
                    // Check if the result has an error condition
                    if (matchingResult.isErrored && matchingResult.errorReason) {
                        cell.textContent = matchingResult.errorReason;
                        cell.style.backgroundColor = '#ffcccc'; // Red background for errors
                        cell.style.color = '#cc0000'; // Dark red text
                        cell.style.fontWeight = 'bold';
                    } else if (matchingResult.averageFPS) {
                        fps = matchingResult.averageFPS;
                        console.log(`Found FPS: ${fps}`);
                    }
                }
            } else {
                console.log(`No chart results found for ${chart.name} or not an array`);
            }
            
            if (fps !== null) {
                cell.textContent = fps.toFixed(2);
                // Apply heatmap colouring
                cell.style.backgroundColor = getFpsHeatmapColor(fps, minFps, maxFps);
            } else if (!cell.textContent) { // Only set default if no error message was set
                cell.textContent = '-';
                cell.style.backgroundColor = '#f9f9f9';
                cell.style.color = '#999';
            }
        });
    });
    
    return table;
}

function getFpsHeatmapColor(fps, minFps, maxFps) {
    if (fps === null || fps === undefined) return 'transparent';
    
    // Use 60 FPS as the maximum for green colouring
    const targetMaxFps = 60;
    
    // Normalise FPS to 0-1 range, capping at 60 FPS
    const normalised = Math.min(fps / targetMaxFps, 1);
    
    // Create gradient: red (0 FPS) -> orange (30 FPS) -> green (60+ FPS)
    let red, green, blue;
    
    if (normalised < 0.5) {
        // Red to Orange (0 to 30 FPS)
        const t = normalised * 2; // 0 to 1
        red = 255;
        green = Math.round(165 * t); // 0 to 165 (orange)
        blue = 0;
    } else {
        // Orange to Green (30 to 60+ FPS)
        const t = (normalised - 0.5) * 2; // 0 to 1
        red = Math.round(255 * (1 - t)); // 255 to 0
        green = Math.round(165 + (90 * t)); // 165 to 255
        blue = 0;
    }
    
    // Add alpha for readability
    return `rgba(${red}, ${green}, ${blue}, 0.6)`;
}

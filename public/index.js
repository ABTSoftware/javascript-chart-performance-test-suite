const TESTS = generateTests();

document.addEventListener('DOMContentLoaded', async function () {
    await initIndexedDB();
    await autoImportStorageState();
    await populateResultSetSelector();
    await buildResultsSection();
    setupImportExport();
});

function generateTests() {
    const tests = [];
    tests.push('');
    for (key in E_TEST_NAME) {
        tests.push(E_TEST_NAME[key]);
    }
    return tests;
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
        Highcharts: 'highcharts/highcharts_tests.js',
        'Plotly.js': 'plotly/plotly_tests.js',
        'Apache ECharts': 'echarts/echarts_tests.js',
        uPlot: 'uPlot/uPlot_tests.js',
        ChartGPU: 'chartgpu/chartgpu_tests.js',
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

// ──────────────────────────────────────────────
// Result set selector
// ──────────────────────────────────────────────

async function populateResultSetSelector() {
    const selector = document.getElementById('resultSetSelector');
    if (!selector) return;

    const resultSets = await getAllResultSets();

    selector.innerHTML = '';

    // "All Result Sets" option
    const allOption = document.createElement('option');
    allOption.value = '__all__';
    allOption.textContent = 'All Result Sets';
    selector.appendChild(allOption);

    // Individual result sets
    resultSets.forEach((rs) => {
        const opt = document.createElement('option');
        opt.value = rs.id;
        opt.textContent = rs.label;
        selector.appendChild(opt);
    });

    // Re-render on change
    selector.addEventListener('change', () => buildResultsSection());
}

function getSelectedResultSetId() {
    const selector = document.getElementById('resultSetSelector');
    return selector ? selector.value : '__all__';
}

// ──────────────────────────────────────────────
// Import / Export setup
// ──────────────────────────────────────────────

function setupImportExport() {
    const importBtn = document.getElementById('importBtn');
    const importFileInput = document.getElementById('importFileInput');
    const exportBtn = document.getElementById('exportBtn');
    const exportAllBtn = document.getElementById('exportAllBtn');
    const deleteBtn = document.getElementById('deleteResultSetBtn');

    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', handleImport);
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const rsId = getSelectedResultSetId();
            if (rsId === '__all__') {
                exportResults('__all__');
            } else {
                exportResults(rsId);
            }
        });
    }

    if (exportAllBtn) {
        exportAllBtn.addEventListener('click', () => exportResults('__all__'));
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteResultSet);
    }
}

async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        let records;
        let source;

        // Auto-detect format
        const parsed = JSON.parse(text);
        if (parsed.origins) {
            // Playwright storage-state.json format
            records = parseStorageState(text);
            source = 'playwright';
        } else {
            // Simple JSON format
            records = parseSimpleJson(text);
            source = 'json';
        }

        if (records.length === 0) {
            alert('No test results found in the imported file.');
            event.target.value = '';
            return;
        }

        // Prompt for label
        const label = prompt(
            `Found ${records.length} test result(s). Enter a label for this result set:`,
            file.name.replace(/\.json$/i, '')
        );
        if (!label) {
            event.target.value = '';
            return;
        }

        const resultSetId = generateResultSetId(label);

        // Check for ID collision
        const existing = await getAllResultSets();
        if (existing.some((rs) => rs.id === resultSetId)) {
            if (!confirm(`A result set with ID "${resultSetId}" already exists. Overwrite it?`)) {
                event.target.value = '';
                return;
            }
        }

        await importResults(records, resultSetId, label, source);

        alert(`Imported ${records.length} result(s) as "${label}".`);

        // Refresh UI
        await populateResultSetSelector();
        // Select the newly imported set
        const selector = document.getElementById('resultSetSelector');
        if (selector) selector.value = resultSetId;
        await buildResultsSection();
    } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed: ' + error.message);
    }

    event.target.value = '';
}

async function handleDeleteResultSet() {
    const rsId = getSelectedResultSetId();
    if (rsId === '__all__') {
        alert('Please select a specific result set to delete.');
        return;
    }
    if (rsId === RESERVED_RESULT_SET_LATEST) {
        alert('Cannot delete the "Latest Run" result set.');
        return;
    }

    const selector = document.getElementById('resultSetSelector');
    const label = selector?.options[selector.selectedIndex]?.textContent || rsId;

    if (!confirm(`Delete result set "${label}" and all its test results? This cannot be undone.`)) {
        return;
    }

    try {
        await deleteResultSet(rsId);
        await populateResultSetSelector();
        await buildResultsSection();
    } catch (error) {
        console.error('Delete failed:', error);
        alert('Delete failed: ' + error.message);
    }
}

// ──────────────────────────────────────────────
// Results section
// ──────────────────────────────────────────────

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
        const selectedRsId = getSelectedResultSetId();
        let allResults;
        if (selectedRsId === '__all__') {
            allResults = await getAllTestResults();
        } else {
            allResults = await getResultsByResultSet(selectedRsId);
        }

        const showAllMode = selectedRsId === '__all__';

        // Build result set label map for "All" mode column headers
        let resultSetMap = {};
        if (showAllMode) {
            const resultSets = await getAllResultSets();
            resultSets.forEach((rs) => {
                resultSetMap[rs.id] = rs.label;
            });
        }

        // Group results: in "All" mode, group by testCase+resultSet+library
        // In single mode, group by testCase+library (same as before)
        let resultsByTestCase;
        if (showAllMode) {
            resultsByTestCase = groupResultsByTestCaseAndResultSet(allResults);
        } else {
            resultsByTestCase = groupResultsByTestCase(allResults);
        }

        console.log('Results grouped by test case:', resultsByTestCase);

        // Load test support data for all charts first
        const supportPromises = CHARTS.map((chart) => loadTestSupport(chart.name));
        await Promise.all(supportPromises);

        // Create tables for each test case
        Object.keys(E_TEST_NAME).forEach((testKey) => {
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
            const testGroupId = Object.keys(E_TEST_NAME).find((key) => E_TEST_NAME[key] === testName);
            const testGroupIndex = testGroupId ? Object.keys(E_TEST_NAME).indexOf(testGroupId) + 1 : null;

            CHARTS.forEach((chart) => {
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

            let table;
            if (showAllMode) {
                table = createResultsTableAllMode(testName, testResults, resultSetMap);
            } else {
                table = createResultsTable(testName, testResults);
            }
            table.classList.add('results-ready');
            section.appendChild(table);

            resultsContainer.appendChild(section);
        });
    } catch (error) {
        console.error('Failed to build results section:', error);
        resultsContainer.innerHTML = '<h2>Test Cases / Results</h2><p>Error loading results from database.</p>';
    }
}

// Single result set mode: same as original
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
    CHARTS.forEach((chart) => {
        const cell = headerRow.insertCell();
        cell.textContent = `${chart.name} (Avg FPS)`;
        cell.style.border = '1px solid #ccc';
        cell.style.padding = '8px';
        cell.style.textAlign = 'center';
    });

    // Get all possible parameter combinations from test configurations
    const paramCombinations = new Set();

    // Add parameter combinations from existing results
    Object.values(testResults).forEach((results) => {
        if (results && Array.isArray(results)) {
            results.forEach((result) => {
                if (result.config) {
                    const params = `${result.config.points || 0} points, ${result.config.series || 0} series${
                        result.config.charts ? `, ${result.config.charts} charts` : ''
                    }`;
                    paramCombinations.add(params);
                }
            });
        }
    });

    // Add all possible parameter combinations from test group configurations
    const testGroups = {
        1: {
            name: 'N line series M points',
            tests: [
                { series: 100, points: 100 },
                { series: 500, points: 500 },
                { series: 1000, points: 1000 },
                { series: 2000, points: 2000 },
                { series: 4000, points: 4000 },
                { series: 8000, points: 8000 },
            ],
        },
        2: {
            name: 'Brownian Motion Scatter Series',
            tests: [
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
        },
        3: {
            name: 'Line series which is unsorted in x',
            tests: [
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
        },
        4: {
            name: 'Point series, sorted, updating y-values',
            tests: [
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
        },
        5: {
            name: 'Column chart with data ascending in X',
            tests: [
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
        },
        6: {
            name: 'Candlestick series test',
            tests: [
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
        },
        7: {
            name: 'FIFO / ECG Chart Performance Test',
            tests: [
                { series: 5, points: 100 },
                { series: 5, points: 10000 },
                { series: 5, points: 100000 },
                { series: 5, points: 1000000 },
                { series: 5, points: 5000000 },
                { series: 5, points: 10000000 },
            ],
        },
        8: {
            name: 'Mountain Chart Performance Test',
            tests: [
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
        },
        9: {
            name: 'Series Compression Test',
            tests: [
                { series: 1, points: 1000 },
                { series: 1, points: 10000 },
                { series: 1, points: 100000 },
                { series: 1, points: 1000000 },
                { series: 1, points: 10000000 },
            ],
        },
        10: {
            name: 'Multi Chart Performance Test',
            tests: [
                { series: 1, points: 10000, charts: 1 },
                { series: 1, points: 10000, charts: 2 },
                { series: 1, points: 10000, charts: 4 },
                { series: 1, points: 10000, charts: 8 },
                { series: 1, points: 10000, charts: 16 },
                { series: 1, points: 10000, charts: 32 },
                { series: 1, points: 10000, charts: 64 },
                { series: 1, points: 10000, charts: 128 },
            ],
        },
        11: {
            name: 'Uniform Heatmap Performance Test',
            tests: [
                { series: 1, points: 100 },
                { series: 1, points: 200 },
                { series: 1, points: 500 },
                { series: 1, points: 1000 },
                { series: 1, points: 2000 },
                { series: 1, points: 4000 },
                { series: 1, points: 8000 },
                { series: 1, points: 16000 },
            ],
        },
        12: {
            name: '3D Point Cloud Performance Test',
            tests: [
                { series: 1, points: 100 },
                { series: 1, points: 1000 },
                { series: 1, points: 10000 },
                { series: 1, points: 100000 },
                { series: 1, points: 1000000 },
                { series: 1, points: 2000000 },
                { series: 1, points: 4000000 },
            ],
        },
        13: {
            name: '3D Surface Performance Test',
            tests: [
                { series: 1, points: 100 },
                { series: 1, points: 200 },
                { series: 1, points: 500 },
                { series: 1, points: 1000 },
                { series: 1, points: 2000 },
                { series: 1, points: 4000 },
                { series: 1, points: 8000 },
            ],
        },
    };

    // Find the matching test group and add all its parameter combinations
    Object.values(testGroups).forEach((group) => {
        if (group.name === testName) {
            group.tests.forEach((test) => {
                const params = `${test.points || 0} points, ${test.series || 0} series${
                    test.charts ? `, ${test.charts} charts` : ''
                }`;
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
    Object.values(testResults).forEach((results) => {
        if (results && Array.isArray(results)) {
            results.forEach((result) => {
                if (result.averageFPS && result.averageFPS > 0) {
                    allFpsValues.push(result.averageFPS);
                }
            });
        }
    });

    const minFps = allFpsValues.length > 0 ? Math.min(...allFpsValues) : 0;
    const maxFps = allFpsValues.length > 0 ? Math.max(...allFpsValues) : 100;

    // Create data rows
    sortedParams.forEach((paramStr) => {
        const row = table.insertRow();

        // Parameters cell
        const paramCell = row.insertCell();
        paramCell.textContent = paramStr;
        paramCell.style.border = '1px solid #ccc';
        paramCell.style.padding = '8px';
        paramCell.style.fontWeight = 'bold';

        // Chart library cells
        CHARTS.forEach((chart) => {
            const cell = row.insertCell();
            cell.style.border = '1px solid #ccc';
            cell.style.padding = '8px';
            cell.style.textAlign = 'center';

            // Find matching result for this chart and parameters
            // Try both exact chart name and chart name with version
            let chartResults = testResults[chart.name];
            if (!chartResults) {
                // Try to find by partial match (chart name might include version)
                const chartKey = Object.keys(testResults).find((key) => key.startsWith(chart.name));
                if (chartKey) {
                    chartResults = testResults[chartKey];
                }
            }
            let fps = null;

            if (chartResults && Array.isArray(chartResults)) {
                const matchingResult = chartResults.find((result) => {
                    if (!result.config) return false;
                    const resultParams = `${result.config.points || 0} points, ${result.config.series || 0} series${
                        result.config.charts ? `, ${result.config.charts} charts` : ''
                    }`;
                    return resultParams === paramStr;
                });

                if (matchingResult) {
                    // Check if the result has an error condition
                    if (matchingResult.isErrored && matchingResult.errorReason) {
                        cell.textContent = matchingResult.errorReason;
                        cell.style.backgroundColor = '#ffcccc'; // Red background for errors
                        cell.style.color = '#cc0000'; // Dark red text
                        cell.style.fontWeight = 'bold';
                    } else if (matchingResult.averageFPS) {
                        fps = matchingResult.averageFPS;
                    }
                }
            }

            if (fps !== null) {
                cell.textContent = fps.toFixed(2);
                // Apply heatmap colouring
                cell.style.backgroundColor = getFpsHeatmapColor(fps, minFps, maxFps);
            } else if (!cell.textContent) {
                // Only set default if no error message was set
                cell.textContent = '-';
                cell.style.backgroundColor = '#f9f9f9';
                cell.style.color = '#999';
            }
        });
    });

    return table;
}

// "All Result Sets" mode: columns are "{library} [{resultSetLabel}]"
function createResultsTableAllMode(testName, testResultsByRs, resultSetMap) {
    // testResultsByRs = { [resultSetId]: { [chartLibrary]: results[] } }
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.marginBottom = '20px';

    // Build column definitions: one per (resultSet, library) pair that has data
    const columns = []; // { rsId, rsLabel, libName, shortName }
    Object.entries(testResultsByRs).forEach(([rsId, libResults]) => {
        Object.keys(libResults).forEach((libName) => {
            const rsLabel = resultSetMap[rsId] || rsId;
            const shortName = getShortLibName(libName);
            columns.push({ rsId, rsLabel, libName, shortName });
        });
    });

    // Sort columns by library name, then result set
    columns.sort((a, b) => {
        const libCmp = a.shortName.localeCompare(b.shortName);
        if (libCmp !== 0) return libCmp;
        return a.rsLabel.localeCompare(b.rsLabel);
    });

    if (columns.length === 0) {
        const noDataRow = table.insertRow();
        const cell = noDataRow.insertCell();
        cell.textContent = 'No results available';
        cell.style.padding = '8px';
        cell.style.color = '#999';
        return table;
    }

    // Header row
    const headerRow = table.insertRow();
    headerRow.style.backgroundColor = '#f0f0f0';
    headerRow.style.fontWeight = 'bold';

    const paramsHeader = headerRow.insertCell();
    paramsHeader.textContent = 'Parameters';
    paramsHeader.style.border = '1px solid #ccc';
    paramsHeader.style.padding = '8px';
    paramsHeader.style.textAlign = 'left';

    // Check if there's only one result set — if so, omit the bracket suffix
    const uniqueRsIds = new Set(columns.map((c) => c.rsId));
    const singleResultSet = uniqueRsIds.size === 1;

    columns.forEach((col) => {
        const cell = headerRow.insertCell();
        cell.textContent = singleResultSet ? `${col.shortName} (Avg FPS)` : `${col.shortName} [${col.rsLabel}]`;
        cell.style.border = '1px solid #ccc';
        cell.style.padding = '8px';
        cell.style.textAlign = 'center';
        cell.style.fontSize = '12px';
    });

    // Collect parameter combinations from all columns
    const paramCombinations = new Set();
    columns.forEach((col) => {
        const results = testResultsByRs[col.rsId]?.[col.libName];
        if (results && Array.isArray(results)) {
            results.forEach((r) => {
                if (r.config) {
                    const params = `${r.config.points || 0} points, ${r.config.series || 0} series${
                        r.config.charts ? `, ${r.config.charts} charts` : ''
                    }`;
                    paramCombinations.add(params);
                }
            });
        }
    });

    const sortedParams = Array.from(paramCombinations).sort((a, b) => {
        const aPoints = parseInt(a.match(/(\d+) points/)?.[1] || '0');
        const bPoints = parseInt(b.match(/(\d+) points/)?.[1] || '0');
        return aPoints - bPoints;
    });

    // Collect FPS values for heatmap
    const allFpsValues = [];
    columns.forEach((col) => {
        const results = testResultsByRs[col.rsId]?.[col.libName];
        if (results && Array.isArray(results)) {
            results.forEach((r) => {
                if (r.averageFPS && r.averageFPS > 0) allFpsValues.push(r.averageFPS);
            });
        }
    });
    const minFps = allFpsValues.length > 0 ? Math.min(...allFpsValues) : 0;
    const maxFps = allFpsValues.length > 0 ? Math.max(...allFpsValues) : 100;

    // Data rows
    sortedParams.forEach((paramStr) => {
        const row = table.insertRow();

        const paramCell = row.insertCell();
        paramCell.textContent = paramStr;
        paramCell.style.border = '1px solid #ccc';
        paramCell.style.padding = '8px';
        paramCell.style.fontWeight = 'bold';

        columns.forEach((col) => {
            const cell = row.insertCell();
            cell.style.border = '1px solid #ccc';
            cell.style.padding = '8px';
            cell.style.textAlign = 'center';

            const results = testResultsByRs[col.rsId]?.[col.libName];
            let fps = null;

            if (results && Array.isArray(results)) {
                const match = results.find((r) => {
                    if (!r.config) return false;
                    const rp = `${r.config.points || 0} points, ${r.config.series || 0} series${
                        r.config.charts ? `, ${r.config.charts} charts` : ''
                    }`;
                    return rp === paramStr;
                });

                if (match) {
                    if (match.isErrored && match.errorReason) {
                        cell.textContent = match.errorReason;
                        cell.style.backgroundColor = '#ffcccc';
                        cell.style.color = '#cc0000';
                        cell.style.fontWeight = 'bold';
                    } else if (match.averageFPS) {
                        fps = match.averageFPS;
                    }
                }
            }

            if (fps !== null) {
                cell.textContent = fps.toFixed(2);
                cell.style.backgroundColor = getFpsHeatmapColor(fps, minFps, maxFps);
            } else if (!cell.textContent) {
                cell.textContent = '-';
                cell.style.backgroundColor = '#f9f9f9';
                cell.style.color = '#999';
            }
        });
    });

    return table;
}

function getShortLibName(libName) {
    for (const chart of CHARTS) {
        if (libName.startsWith(chart.name)) return chart.name;
    }
    return libName;
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
        green = Math.round(165 + 90 * t); // 165 to 255
        blue = 0;
    }

    // Add alpha for readability
    return `rgba(${red}, ${green}, ${blue}, 0.6)`;
}

function addDownloadButton() {
    const buttonContainer = document.getElementById('downloadButtonContainer');
    if (!buttonContainer) return;

    // Create download button
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download Results JSON';
    downloadButton.style.padding = '10px 20px';
    downloadButton.style.fontSize = '14px';
    downloadButton.style.backgroundColor = '#28a745';
    downloadButton.style.color = 'white';
    downloadButton.style.border = 'none';
    downloadButton.style.borderRadius = '4px';
    downloadButton.style.cursor = 'pointer';
    downloadButton.style.fontWeight = 'bold';

    downloadButton.addEventListener('mouseenter', () => {
        downloadButton.style.backgroundColor = '#218838';
    });

    downloadButton.addEventListener('mouseleave', () => {
        downloadButton.style.backgroundColor = '#28a745';
    });

    downloadButton.addEventListener('click', async () => {
        try {
            const allResults = await getAllTestResults();

            if (allResults.length === 0) {
                alert('No results available to download.');
                return;
            }

            // Create JSON blob
            const jsonData = JSON.stringify(allResults, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `chart-performance-results-${timestamp}.json`;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download results:', error);
            alert('Failed to download results. Check console for details.');
        }
    });

    buttonContainer.appendChild(downloadButton);
}

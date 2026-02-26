const TESTS = generateTests();

// Global filter state
let allResultsData = [];
let allResultSetsData = [];
let checkedResultSets = new Set();
let checkedLibraries = new Set();
// Metric selection state
let selectedMetric = 'fps'; // 'fps', 'memory', 'initialization', 'frames'

// ──────────────────────────────────────────────
// Metric helper functions
// ──────────────────────────────────────────────

function getMetricLabel() {
    switch (selectedMetric) {
        case 'fps': return 'Avg FPS';
        case 'memory': return 'Memory (MB)';
        case 'initialization': return 'Init Time (ms)';
        case 'frames': return 'Total Frames';
        case 'ingestion': return 'Ingestion Rate (pts/sec)';
        default: return 'Avg FPS';
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

function isMetricHigherBetter() {
    // FPS, frames, and ingestion: higher is better
    // Memory and initialization: lower is better
    return selectedMetric === 'fps' || selectedMetric === 'frames' || selectedMetric === 'ingestion';
}

function formatMetricValue(value) {
    if (value === null || value === undefined) return null;
    switch (selectedMetric) {
        case 'fps': return value.toFixed(2);
        case 'memory': return value.toFixed(0);
        case 'initialization': return value.toFixed(2);
        case 'frames': return Math.round(value).toString();
        case 'ingestion':
            // Format with K, M, B suffixes for readability
            if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
            if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
            if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
            return value.toFixed(0);
        default: return value.toFixed(2);
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    await initIndexedDB();
    await autoImportStorageState();
    await loadDataAndBuildUI();
    setupImportExport();
    startLiveRefreshPolling();
});

// ──────────────────────────────────────────────
// Live refresh polling
// ──────────────────────────────────────────────

let _liveRefreshActive = false;

async function liveRefresh() {
    if (_liveRefreshActive) return; // skip if a refresh is already in flight
    _liveRefreshActive = true;
    try {
        // Preserve current user filter state across the reload
        const prevCheckedResultSets = new Set(checkedResultSets);
        const prevCheckedLibraries = new Set(checkedLibraries);

        allResultsData = await getAllTestResults();
        allResultSetsData = await getAllResultSets();

        const rsIdSet = new Set();
        const libSet = new Set();
        CHARTS.forEach((c) => libSet.add(c.name));
        allResultsData.forEach((r) => rsIdSet.add(r.resultSetId || RESERVED_RESULT_SET_LOCAL));

        // Restore previous selections; keep newly appeared result sets selected only if
        // the user already had something selected (otherwise fall back to local)
        checkedResultSets = new Set();
        for (const rsId of rsIdSet) {
            if (prevCheckedResultSets.has(rsId)) checkedResultSets.add(rsId);
        }
        if (checkedResultSets.size === 0 && rsIdSet.has(RESERVED_RESULT_SET_LOCAL)) {
            checkedResultSets.add(RESERVED_RESULT_SET_LOCAL);
        }
        checkedLibraries = prevCheckedLibraries.size > 0 ? prevCheckedLibraries : new Set(libSet);

        buildFilterPanel(rsIdSet, libSet);
        await buildResultsSection();
    } finally {
        _liveRefreshActive = false;
    }
}

function startLiveRefreshPolling() {
    setInterval(liveRefresh, 1000);
}

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
       'Lcjs': 'lcjsv4/lcjs_tests.js'
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

// ──────────────────────────────────────────────
// Data loading and filter panel
// ──────────────────────────────────────────────

async function loadDataAndBuildUI() {
    allResultsData = await getAllTestResults();
    allResultSetsData = await getAllResultSets();

    const rsIdSet = new Set();
    const libSet = new Set();

    // Always include all chart libraries from CHARTS
    CHARTS.forEach((c) => libSet.add(c.name));

    // Add any result set IDs from data
    allResultsData.forEach((r) => {
        rsIdSet.add(r.resultSetId || RESERVED_RESULT_SET_LOCAL);
    });

    // Only check "Local" by default; imported sets start unchecked
    checkedResultSets = new Set();
    if (rsIdSet.has(RESERVED_RESULT_SET_LOCAL)) {
        checkedResultSets.add(RESERVED_RESULT_SET_LOCAL);
    } else if (rsIdSet.size > 0) {
        // Fallback: check first available set
        checkedResultSets.add(rsIdSet.values().next().value);
    }
    checkedLibraries = new Set(libSet);

    buildFilterPanel(rsIdSet, libSet);
    await buildResultsSection();
}

function buildFilterPanel(rsIdSet, libSet) {
    const rsContainer = document.getElementById('resultSetFilters');
    const libContainer = document.getElementById('libraryFilters');
    const metricContainer = document.getElementById('metricSelector');
    if (!rsContainer || !libContainer) return;

    // Clear previous content
    rsContainer.innerHTML = '<strong>Result Sets:</strong>';
    libContainer.innerHTML = '<strong>Libraries:</strong>';

    // Build metric selector if container exists
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

    const rsLabelMap = {};
    allResultSetsData.forEach((rs) => {
        rsLabelMap[rs.id] = rs.label;
    });

    // Result set radio buttons
    for (const rsId of rsIdSet) {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'radio';
        cb.name = 'resultSet';
        cb.checked = checkedResultSets.has(rsId);
        cb.dataset.rsId = rsId;
        cb.addEventListener('change', onFilterChange);
        label.appendChild(cb);
        label.appendChild(document.createTextNode(rsLabelMap[rsId] || rsId));

        const delBtn = document.createElement('button');
        delBtn.textContent = '\u00d7';
        delBtn.className = 'delete-rs-btn';
        if (rsId === RESERVED_RESULT_SET_LOCAL) {
            delBtn.title = 'Clear all local results';
            delBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleClearLocalResults();
            });
        } else {
            delBtn.title = `Delete "${rsLabelMap[rsId] || rsId}"`;
            delBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleDeleteResultSet(rsId, rsLabelMap[rsId] || rsId);
            });
        }
        label.appendChild(delBtn);

        rsContainer.appendChild(label);
    }

    // Library checkboxes — ordered by CHARTS definition
    const orderedLibs = CHARTS.map((c) => c.name).filter((name) => libSet.has(name));
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

    buildResultsSection();
}

function onMetricChange(e) {
    selectedMetric = e.target.value;
    buildResultsSection();
}

// ──────────────────────────────────────────────
// Import / Export setup
// ──────────────────────────────────────────────

function setupImportExport() {
    const importBtn = document.getElementById('importBtn');
    const importFileInput = document.getElementById('importFileInput');
    const exportSelectedBtn = document.getElementById('exportSelectedBtn');

    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', handleImport);
    }

    if (exportSelectedBtn) {
        exportSelectedBtn.addEventListener('click', () => {
            if (checkedResultSets.size === 0) {
                alert('No result sets selected to export.');
                return;
            }
            // Export each checked result set (or all if all are checked)
            const allRsIds = new Set(allResultSetsData.map((rs) => rs.id));
            if (checkedResultSets.size === allRsIds.size) {
                exportResults('__all__');
            } else {
                checkedResultSets.forEach((rsId) => exportResults(rsId));
            }
        });
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

        // Never allow importing into the reserved local result set
        if (resultSetId === RESERVED_RESULT_SET_LOCAL) {
            alert('"local" is reserved for locally-run tests. Please choose a different label.');
            event.target.value = '';
            return;
        }

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
        await loadDataAndBuildUI();
    } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed: ' + error.message);
    }

    event.target.value = '';
}

async function handleDeleteResultSet(rsId, label) {
    if (rsId === RESERVED_RESULT_SET_LOCAL) {
        alert('Cannot delete the "Local" result set.');
        return;
    }

    if (!confirm(`Delete result set "${label}" and all its test results? This cannot be undone.`)) {
        return;
    }

    try {
        await deleteResultSet(rsId);
        await loadDataAndBuildUI();
    } catch (error) {
        console.error('Delete failed:', error);
        alert('Delete failed: ' + error.message);
    }
}

async function handleClearLocalResults() {
    if (!confirm('Clear all local test results? This cannot be undone.')) return;
    try {
        await clearLocalResults();
        await loadDataAndBuildUI();
    } catch (error) {
        console.error('Clear local results failed:', error);
        alert('Failed to clear local results: ' + error.message);
    }
}

// ──────────────────────────────────────────────
// Benchmark Score Calculation (moved to shared.js)
// ──────────────────────────────────────────────

function createChartBenchTable(testName, testResults, showAllMode, resultSetMap) {
    const benchScores = [];

    // Collect ALL parameter combinations from this test case
    const allParamCombos = [];
    const paramSet = new Set();

    if (showAllMode) {
        Object.values(testResults).forEach((libResults) => {
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
    } else {
        Object.values(testResults).forEach((results) => {
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
    }

    // Convert to array
    paramSet.forEach((paramKey) => {
        allParamCombos.push(JSON.parse(paramKey));
    });

    if (showAllMode) {
        // Multiple result sets: calculate score for each (resultSet, library) combination
        // Include ALL checked libraries, even those with no results (score = 0)
        checkedResultSets.forEach(rsId => {
            checkedLibraries.forEach(shortLib => {
                let score = 0;
                let fullLibName = shortLib;

                const libResults = testResults[rsId];
                if (libResults) {
                    // Find the full library name (might have version suffix)
                    const libName = Object.keys(libResults).find(key => getShortLibName(key) === shortLib);

                    if (libName && libResults[libName]) {
                        const results = libResults[libName];
                        score = calculateBenchmarkScore({ test: results }, allParamCombos);
                        fullLibName = libName;
                    }
                }

                benchScores.push({
                    rsId,
                    rsLabel: resultSetMap[rsId] || rsId,
                    libName: fullLibName, // Use full library name including version
                    score,
                });
            });
        });
    } else {
        // Single result set: one score per library
        // Include ALL checked libraries, even those with no results (score = 0)
        checkedLibraries.forEach(shortLib => {
            let score = 0;
            let fullLibName = shortLib;

            // Find the full library name in testResults
            const libName = Object.keys(testResults).find(key => getShortLibName(key) === shortLib);

            if (libName && testResults[libName]) {
                const results = testResults[libName];
                score = calculateBenchmarkScore({ test: results }, allParamCombos);
                fullLibName = libName;
            }

            benchScores.push({
                libName: fullLibName, // Use full library name including version
                score,
            });
        });
    }

    // If no scores at all, return null
    if (benchScores.length === 0) return null;

    // Sort by score descending (0 scores will appear at bottom)
    benchScores.sort((a, b) => b.score - a.score);

    // Create benchmark section
    const benchSection = document.createElement('div');
    benchSection.style.marginTop = '15px';
    benchSection.style.marginBottom = '10px';

    const benchHeading = document.createElement('h4');
    benchHeading.style.display = 'inline-flex';
    benchHeading.style.alignItems = 'center';
    benchHeading.style.gap = '8px';
    benchHeading.style.marginBottom = '8px';
    benchHeading.style.fontSize = '16px';
    benchHeading.textContent = `Chart Bench: ${testName}`;

    // Add tooltip icon
    const tooltipIcon = document.createElement('span');
    tooltipIcon.textContent = 'ⓘ';
    tooltipIcon.style.cursor = 'help';
    tooltipIcon.style.fontSize = '14px';
    tooltipIcon.style.color = '#007bff';
    tooltipIcon.title =
        'Benchmark Score Calculation:\n\n' +
        'Score = Σ(composite × weight) / Σ(weight)\n\n' +
        'Composite = (FPS×65% + InitTime×20% + Frames×10% + Memory×5%) × 100\n\n' +
        'Metrics use power transformation to amplify performance differences:\n' +
        '  • FPS^1.5: Exponentially rewards higher FPS\n' +
        '    (42 vs 4.77 FPS → 272 vs 10.4 = 26x scoring difference)\n' +
        '  • Frames^1.5: Higher frame counts exponentially better\n' +
        '  • Init Time: Linear scale (lower is better)\n' +
        '  • Memory: Linear scale (lower is better)\n\n' +
        'Weight = [log₁₀(points × series × charts)]^3.5\n\n' +
        'Aggressive polynomial weighting ensures complex tests contribute\n' +
        'exponentially more (16M points >> 1K points).\n' +
        'Failed/skipped tests receive 0 score but full weight penalty.';

    benchHeading.appendChild(tooltipIcon);
    benchSection.appendChild(benchHeading);

    // Create benchmark table
    const benchTable = document.createElement('table');
    benchTable.style.borderCollapse = 'collapse';
    benchTable.style.width = 'auto';
    benchTable.style.maxWidth = '500px';
    benchTable.style.fontSize = '14px';

    // Header
    const benchHeaderRow = benchTable.insertRow();
    benchHeaderRow.style.backgroundColor = '#f0f0f0';
    benchHeaderRow.style.fontWeight = 'bold';

    const rankHeader = benchHeaderRow.insertCell();
    rankHeader.textContent = 'Rank';
    rankHeader.style.border = '1px solid #ccc';
    rankHeader.style.padding = '6px 10px';
    rankHeader.style.textAlign = 'center';

    const libHeader = benchHeaderRow.insertCell();
    libHeader.textContent = 'Library';
    libHeader.style.border = '1px solid #ccc';
    libHeader.style.padding = '6px 10px';
    libHeader.style.textAlign = 'left';

    if (showAllMode && benchScores.some((e) => e.rsLabel)) {
        const rsHeader = benchHeaderRow.insertCell();
        rsHeader.textContent = 'Result Set';
        rsHeader.style.border = '1px solid #ccc';
        rsHeader.style.padding = '6px 10px';
        rsHeader.style.textAlign = 'left';
    }

    const scoreHeader = benchHeaderRow.insertCell();
    scoreHeader.textContent = 'Score';
    scoreHeader.style.border = '1px solid #ccc';
    scoreHeader.style.padding = '6px 10px';
    scoreHeader.style.textAlign = 'center';

    // Data rows
    const maxScore = benchScores.length > 0 ? benchScores[0].score : 0;

    benchScores.forEach((entry, index) => {
        const row = benchTable.insertRow();

        // Rank
        const rankCell = row.insertCell();
        rankCell.textContent = index + 1;
        rankCell.style.border = '1px solid #ccc';
        rankCell.style.padding = '6px 10px';
        rankCell.style.textAlign = 'center';
        rankCell.style.fontWeight = 'bold';

        // Library name
        const libCell = row.insertCell();
        libCell.textContent = entry.libName;
        libCell.style.border = '1px solid #ccc';
        libCell.style.padding = '6px 10px';
        libCell.style.fontWeight = 'bold';

        // Result Set (if multiple)
        if (showAllMode && benchScores.some((e) => e.rsLabel)) {
            const rsCell = row.insertCell();
            rsCell.textContent = entry.rsLabel || '';
            rsCell.style.border = '1px solid #ccc';
            rsCell.style.padding = '6px 10px';
        }

        // Score
        const scoreCell = row.insertCell();
        scoreCell.textContent = Math.round(entry.score);
        scoreCell.style.border = '1px solid #ccc';
        scoreCell.style.padding = '6px 10px';
        scoreCell.style.textAlign = 'center';
        scoreCell.style.fontWeight = 'bold';

        // Color coding based on score (handle maxScore = 0 case)
        if (maxScore > 0) {
            const scoreRatio = entry.score / maxScore;
            if (scoreRatio >= 0.9) {
                scoreCell.style.backgroundColor = '#d4edda';
                scoreCell.style.color = '#155724';
            } else if (scoreRatio >= 0.7) {
                scoreCell.style.backgroundColor = '#fff3cd';
                scoreCell.style.color = '#856404';
            } else {
                scoreCell.style.backgroundColor = '#f8d7da';
                scoreCell.style.color = '#721c24';
            }
        } else {
            // All scores are 0 - use neutral color
            scoreCell.style.backgroundColor = '#f8d7da';
            scoreCell.style.color = '#721c24';
        }
    });

    benchSection.appendChild(benchTable);
    return benchSection;
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
        // Filter results by checked result sets and libraries
        const filteredResults = allResultsData.filter((r) => {
            const rsId = r.resultSetId || RESERVED_RESULT_SET_LOCAL;
            const lib = getShortLibName(r.chartLibrary);
            return checkedResultSets.has(rsId) && checkedLibraries.has(lib);
        });

        const showAllMode = checkedResultSets.size > 1;

        // Build result set label map for "All" mode column headers
        let resultSetMap = {};
        if (showAllMode) {
            allResultSetsData.forEach((rs) => {
                resultSetMap[rs.id] = rs.label;
            });
        }

        // Group results
        let resultsByTestCase;
        if (showAllMode) {
            resultsByTestCase = groupResultsByTestCaseAndResultSet(filteredResults);
        } else {
            resultsByTestCase = groupResultsByTestCase(filteredResults);
        }

        // Load test support data for all charts first
        const supportPromises = CHARTS.map((chart) => loadTestSupport(chart.name));
        await Promise.all(supportPromises);

        // Only show columns/buttons for checked libraries
        const visibleCharts = CHARTS.filter((c) => checkedLibraries.has(c.name));

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

            // Add RUN buttons for visible chart libraries
            const runButtonsContainer = document.createElement('div');
            runButtonsContainer.style.display = 'flex';
            runButtonsContainer.style.gap = '10px';
            runButtonsContainer.style.flexWrap = 'wrap';

            // Find the test group index for this test name
            const testGroupId = Object.keys(E_TEST_NAME).find((key) => E_TEST_NAME[key] === testName);
            const testGroupIndex = testGroupId ? Object.keys(E_TEST_NAME).indexOf(testGroupId) + 1 : null;

            visibleCharts.forEach((chart) => {
                const supportedTests = testSupportCache.get(chart.name) || Object.values(E_TEST_NAME);
                const isSupported = supportedTests.includes(testName);

                if (isSupported && testGroupIndex) {
                    let href = chart.path || '';

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

            // Add Chart Bench for this test case
            const benchSection = createChartBenchTable(testName, testResults, showAllMode, resultSetMap);
            if (benchSection) {
                section.appendChild(benchSection);
            }

            resultsContainer.appendChild(section);
        });
    } catch (error) {
        console.error('Failed to build results section:', error);
        resultsContainer.innerHTML = '<h2>Test Cases / Results</h2><p>Error loading results from database.</p>';
    }
}

// Single result set mode — one column per visible library
function createResultsTable(testName, testResults) {
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.tableLayout = 'fixed';
    table.style.marginBottom = '20px';

    const visibleCharts = CHARTS.filter((c) => checkedLibraries.has(c.name));
    const paramsColWidth = 15;
    const libColWidth = visibleCharts.length > 0 ? (100 - paramsColWidth) / visibleCharts.length : 85;

    // Create header row
    const headerRow = table.insertRow();
    headerRow.style.backgroundColor = '#f0f0f0';
    headerRow.style.fontWeight = 'bold';

    const paramsHeader = headerRow.insertCell();
    paramsHeader.textContent = 'Parameters';
    paramsHeader.style.border = '1px solid #ccc';
    paramsHeader.style.padding = '8px';
    paramsHeader.style.textAlign = 'left';
    paramsHeader.style.width = `${paramsColWidth}%`;

    visibleCharts.forEach((chart) => {
        const cell = headerRow.insertCell();
        cell.textContent = `${chart.name} ${getMetricLabel()}`;
        cell.style.border = '1px solid #ccc';
        cell.style.padding = '8px';
        cell.style.textAlign = 'center';
        cell.style.width = `${libColWidth}%`;
        cell.style.fontSize = '14px';
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
                { series: 1, points: 100000, charts: 1 },
                { series: 1, points: 100000, charts: 2 },
                { series: 1, points: 100000, charts: 4 },
                { series: 1, points: 100000, charts: 8 },
                { series: 1, points: 100000, charts: 16 },
                { series: 1, points: 100000, charts: 32 },
                { series: 1, points: 100000, charts: 64 },
                { series: 1, points: 100000, charts: 128 },
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
        const aPoints = parseInt(a.match(/(\d+) points/)?.[1] || '0');
        const bPoints = parseInt(b.match(/(\d+) points/)?.[1] || '0');
        return aPoints - bPoints;
    });

    // Collect all metric values for heatmap calculation
    const allMetricValues = [];
    Object.values(testResults).forEach((results) => {
        if (results && Array.isArray(results)) {
            results.forEach((result) => {
                const value = getMetricValue(result, testName);
                if (value !== null && value !== undefined && value > 0) {
                    allMetricValues.push(value);
                }
            });
        }
    });

    const minMetric = allMetricValues.length > 0 ? Math.min(...allMetricValues) : 0;
    const maxMetric = allMetricValues.length > 0 ? Math.max(...allMetricValues) : 100;

    // Debug logging for metric calculation
    if (selectedMetric === 'initialization') {
        console.log(`[${testName}] Init Time - Min: ${minMetric.toFixed(2)}, Max: ${maxMetric.toFixed(2)}, Values count: ${allMetricValues.length}`);
    }

    // Create data rows
    sortedParams.forEach((paramStr) => {
        const row = table.insertRow();

        const paramCell = row.insertCell();
        paramCell.textContent = paramStr;
        paramCell.style.border = '1px solid #ccc';
        paramCell.style.padding = '8px';
        paramCell.style.fontWeight = 'bold';

        visibleCharts.forEach((chart) => {
            const cell = row.insertCell();
            cell.style.border = '1px solid #ccc';
            cell.style.padding = '8px';
            cell.style.textAlign = 'center';

            // Find matching result for this chart and parameters
            let chartResults = testResults[chart.name];
            if (!chartResults) {
                const chartKey = Object.keys(testResults).find((key) => key.startsWith(chart.name));
                if (chartKey) {
                    chartResults = testResults[chartKey];
                }
            }
            let metricValue = null;

            if (chartResults && Array.isArray(chartResults)) {
                const matchingResult = chartResults.find((result) => {
                    if (!result.config) return false;
                    const resultParams = `${result.config.points || 0} points, ${result.config.series || 0} series${
                        result.config.charts ? `, ${result.config.charts} charts` : ''
                    }`;
                    return resultParams === paramStr;
                });

                if (matchingResult) {
                    if (matchingResult.isErrored && matchingResult.errorReason) {
                        cell.textContent = matchingResult.errorReason;
                        cell.style.backgroundColor = '#ffcccc';
                        cell.style.color = '#cc0000';
                        cell.style.fontWeight = 'bold';
                    } else {
                        metricValue = getMetricValue(matchingResult, testName);
                    }
                }
            }

            if (metricValue !== null) {
                cell.textContent = formatMetricValue(metricValue);
                cell.style.backgroundColor = getFpsHeatmapColor(metricValue, minMetric, maxMetric);
            } else if (!cell.textContent) {
                cell.textContent = '-';
                cell.style.backgroundColor = '#f9f9f9';
                cell.style.color = '#999';
            }
        });
    });

    return table;
}

// Multiple result sets mode — columns are "{library} [{resultSetLabel}]"
function createResultsTableAllMode(testName, testResultsByRs, resultSetMap) {
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.tableLayout = 'fixed';
    table.style.marginBottom = '20px';

    // Build column definitions: one per (resultSet, library) pair that has data
    const columns = [];
    Object.entries(testResultsByRs).forEach(([rsId, libResults]) => {
        Object.keys(libResults).forEach((libName) => {
            const shortName = getShortLibName(libName);
            // Filter by checked libraries
            if (!checkedLibraries.has(shortName)) return;
            const rsLabel = resultSetMap[rsId] || rsId;
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

    const paramsColWidth = 15;
    const libColWidth = columns.length > 0 ? (100 - paramsColWidth) / columns.length : 85;

    const paramsHeader = headerRow.insertCell();
    paramsHeader.textContent = 'Parameters';
    paramsHeader.style.border = '1px solid #ccc';
    paramsHeader.style.padding = '8px';
    paramsHeader.style.textAlign = 'left';
    paramsHeader.style.width = `${paramsColWidth}%`;

    // Check if there's only one result set — if so, omit the bracket suffix
    const uniqueRsIds = new Set(columns.map((c) => c.rsId));
    const singleResultSet = uniqueRsIds.size === 1;

    columns.forEach((col) => {
        const cell = headerRow.insertCell();
        const metricLabel = getMetricLabel();
        cell.textContent = singleResultSet ? `${col.shortName} ${metricLabel}` : `${col.shortName} [${col.rsLabel}]`;
        cell.style.border = '1px solid #ccc';
        cell.style.padding = '8px';
        cell.style.textAlign = 'center';
        cell.style.fontSize = '14px';
        cell.style.width = `${libColWidth}%`;
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

    // Collect metric values for heatmap
    const allMetricValues = [];
    columns.forEach((col) => {
        const results = testResultsByRs[col.rsId]?.[col.libName];
        if (results && Array.isArray(results)) {
            results.forEach((r) => {
                const value = getMetricValue(r, testName);
                if (value !== null && value !== undefined && value > 0) {
                    allMetricValues.push(value);
                }
            });
        }
    });
    const minMetric = allMetricValues.length > 0 ? Math.min(...allMetricValues) : 0;
    const maxMetric = allMetricValues.length > 0 ? Math.max(...allMetricValues) : 100;

    // Debug logging for metric calculation (AllMode)
    if (selectedMetric === 'initialization') {
        console.log(`[${testName} - AllMode] Init Time - Min: ${minMetric.toFixed(2)}, Max: ${maxMetric.toFixed(2)}, Values count: ${allMetricValues.length}`);
    }

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
            let metricValue = null;

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
                    } else {
                        metricValue = getMetricValue(match, testName);
                    }
                }
            }

            if (metricValue !== null) {
                cell.textContent = formatMetricValue(metricValue);
                cell.style.backgroundColor = getFpsHeatmapColor(metricValue, minMetric, maxMetric);
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

function getFpsHeatmapColor(value, minValue, maxValue) {
    if (value === null || value === undefined) return 'transparent';

    // Debug logging for high init time values
    if (selectedMetric === 'initialization' && value > 3000) {
        console.log(`High init time: ${value}, min: ${minValue}, max: ${maxValue}`);
    }

    // Normalise value to 0-1 range based on metric type
    let normalised;

    if (selectedMetric === 'fps') {
        // FPS: absolute scale 0 (red) to 60 (green)
        normalised = Math.min(Math.max(value / 60, 0), 1);
    } else if (selectedMetric === 'memory' || selectedMetric === 'initialization') {
        // Memory and Init Time: lower is better
        // min in table (0 or lowest) = green (1), max in table = red (0)
        if (maxValue === minValue) {
            normalised = 0.5;
        } else {
            normalised = 1 - ((value - minValue) / (maxValue - minValue));
        }
    } else if (selectedMetric === 'frames' || selectedMetric === 'ingestion') {
        // Total Frames and Ingestion Rate: higher is better
        // min in table (0 or lowest) = red (0), max in table = green (1)
        if (maxValue === minValue) {
            normalised = 0.5;
        } else {
            normalised = (value - minValue) / (maxValue - minValue);
        }
    } else {
        normalised = 0.5; // Default fallback
    }

    // Create gradient: red (bad) -> orange (medium) -> green (good)
    let red, green, blue;

    if (normalised < 0.5) {
        // Red to Orange
        const t = normalised * 2;
        red = 255;
        green = Math.round(165 * t);
        blue = 0;
    } else {
        // Orange to Green
        const t = (normalised - 0.5) * 2;
        red = Math.round(255 * (1 - t));
        green = Math.round(165 + 90 * t);
        blue = 0;
    }

    return `rgba(${red}, ${green}, ${blue}, 0.6)`;
}
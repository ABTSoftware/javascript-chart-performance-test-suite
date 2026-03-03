// shared.js — Constants and IndexedDB functions shared between index.js and charts.js

// ──────────────────────────────────────────────
// Test display order configuration
// Edit the array below to reorder test sections on both the homepage and charts view.
// Keys map to E_TEST_NAME — test_group_id values are NOT affected.
// ──────────────────────────────────────────────
const TEST_DISPLAY_ORDER = [
    'FIFO',              // FIFO / ECG Chart Performance Test
    'LINE',              // Line series which is unsorted in x
    'SCATTER',           // Brownian Motion Scatter Series
    'MOUNTAIN',          // Mountain Chart Performance Test
    'COLUMN',            // Column chart with data ascending in X
    'CANDLESTICK',       // Candlestick series test
    'HEATMAP',           // Uniform Heatmap Performance Test
    'MULTI_CHART',       // Multi Chart Performance Test
    'POINTCLOUD_3D',     // 3D Point Cloud Performance Test
    'SURFACE_3D',        // 3D Surface Performance Test
    'SERIES_COMPRESSION',// Series Compression Test
    'POINT_LINE',        // Point series, sorted, updating y-values
    'N_X_M',             // N line series M points
];

// ──────────────────────────────────────────────
// Static (pre-recorded) result sets
// Add entries here to bundle reference results with the app.
// These are fetched from /public on startup and cannot be deleted by users.
// ──────────────────────────────────────────────
const STATIC_RESULT_SETS = [
    { id: 'arm-snapdragon', label: 'ARM Snapdragon', file: '/arm-snapdragon.json' },
    { id: 'intel-i9-nvidia-4090', label: 'Intel i9 / Nvidia RTX 4090', file: '/intel-i9-nvidia-4090.json' },
];

function isStaticResultSet(id) {
    return STATIC_RESULT_SETS.some((s) => s.id === id);
}

async function autoImportStaticResultSets() {
    for (const { id, label, file } of STATIC_RESULT_SETS) {
        try {
            const response = await fetch(file);
            if (!response.ok) continue;
            const text = await response.text();

            // Skip re-import when file content is unchanged
            const hash = simpleHash(text);
            const hashKey = `staticResultSetHash_${id}`;
            if (localStorage.getItem(hashKey) === hash) continue;

            const records = parseSimpleJson(text);
            if (records.length === 0) continue;

            await importResults(records, id, label, 'static');
            localStorage.setItem(hashKey, hash);
            console.log(`Loaded static result set "${label}" (${records.length} records)`);
        } catch (e) {
            console.warn(`Failed to load static result set "${label}":`, e.message);
        }
    }
}

const E_TEST_NAME = {
    N_X_M: 'N line series M points',
    SCATTER: 'Brownian Motion Scatter Series',
    LINE: 'Line series which is unsorted in x',
    POINT_LINE: 'Point series, sorted, updating y-values',
    COLUMN: 'Column chart with data ascending in X',
    CANDLESTICK: 'Candlestick series test',
    FIFO: 'FIFO / ECG Chart Performance Test',
    MOUNTAIN: 'Mountain Chart Performance Test',
    SERIES_COMPRESSION: 'Series Compression Test',
    MULTI_CHART: 'Multi Chart Performance Test',
    HEATMAP: 'Uniform Heatmap Performance Test',
    POINTCLOUD_3D: '3D Point Cloud Performance Test',
    SURFACE_3D: '3D Surface Performance Test',
};

const CHARTS = generateCharts();

function generateCharts() {
    const charts = [];
    charts.push({
        name: 'SciChart.js',
        path: 'scichart/scichart.html',
    });
    charts.push({
        name: 'Highcharts',
        path: 'highcharts/highcharts.html',
        custom: [
            {
                path: 'highcharts/highcharts_stock_charts.html',
                test: E_TEST_NAME.CANDLESTICK,
            },
        ],
    });
    charts.push({
        name: 'Chart.js',
        path: 'chartjs/chartjs.html',
        custom: [
            {
                path: 'chartjs/chartjs_candlestick.html',
                test: E_TEST_NAME.CANDLESTICK,
            },
        ],
    });
    charts.push({
        name: 'Plotly.js',
        path: 'plotly/plotly.html',
    });
    charts.push({
        name: 'Apache ECharts',
        path: 'echarts/echarts.html',
    });
    charts.push({
        name: 'uPlot',
        path: 'uPlot/uPlot.html',
    });
    charts.push({
        name: 'ChartGPU',
        path: 'chartgpu/chartgpu.html',
    });
    charts.push({
        name: 'Lcjs',
        path: 'lcjsv4/lcjs.html'
    });
    return charts;
}

// IndexedDB constants and helpers
const DB_NAME = 'ChartPerformanceResults';
const DB_VERSION = 3;
const STORE_NAME = 'testResults';
const RESULT_SETS_STORE = 'resultSets';
const RESERVED_RESULT_SET_LOCAL = 'local';
let db = null;

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
            const tx = event.target.transaction;
            const oldVersion = event.oldVersion;

            // --- v0/v1 → v2: create stores and indices ---
            if (oldVersion < 2) {
                if (!database.objectStoreNames.contains(RESULT_SETS_STORE)) {
                    database.createObjectStore(RESULT_SETS_STORE, { keyPath: 'id' });
                }

                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('chartLibrary', 'chartLibrary', { unique: false });
                    store.createIndex('testCase', 'testCase', { unique: false });
                    store.createIndex('resultSetId', 'resultSetId', { unique: false });
                } else {
                    const store = tx.objectStore(STORE_NAME);
                    if (!store.indexNames.contains('resultSetId')) {
                        store.createIndex('resultSetId', 'resultSetId', { unique: false });
                    }
                }
            }

            // --- v0/v1/v2 → v3: consolidate all reserved sets into "local" ---
            if (oldVersion < 3) {
                const store = tx.objectStore(STORE_NAME);
                const rsStore = tx.objectStore(RESULT_SETS_STORE);
                const LEGACY_IDS = ['default', 'playwright', 'latest-run'];

                const cursorReq = store.openCursor();
                const toDelete = [];
                const toAdd = [];

                cursorReq.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        const record = cursor.value;
                        const rsId = record.resultSetId;
                        if (!rsId || LEGACY_IDS.includes(rsId)) {
                            let baseId = record.id;
                            for (const prefix of LEGACY_IDS) {
                                if (baseId.startsWith(prefix + '_')) {
                                    baseId = baseId.substring(prefix.length + 1);
                                    break;
                                }
                            }
                            toDelete.push(record.id);
                            toAdd.push({
                                ...record,
                                id: `${RESERVED_RESULT_SET_LOCAL}_${baseId}`,
                                resultSetId: RESERVED_RESULT_SET_LOCAL,
                            });
                        }
                        cursor.continue();
                    } else {
                        toDelete.forEach((id) => store.delete(id));
                        toAdd.forEach((rec) => store.put(rec));

                        // Remove legacy result set entries
                        LEGACY_IDS.forEach((id) => rsStore.delete(id));

                        // Ensure "Local" result set exists
                        rsStore.put({
                            id: RESERVED_RESULT_SET_LOCAL,
                            label: 'Local',
                            source: 'system',
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                        });
                    }
                };
            }
        };
    });
}

// ──────────────────────────────────────────────
// Query functions
// ──────────────────────────────────────────────

async function getAllTestResults() {
    if (!db) {
        console.error('Database not initialized for getAllTestResults');
        return [];
    }

    try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.getAll();

            request.onsuccess = (event) => {
                const results = event.target.result || [];
                console.log('Retrieved from IndexedDB:', results.length, 'records');
                resolve(results);
            };

            request.onerror = (event) => {
                console.error('IndexedDB retrieval error:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Exception in getAllTestResults:', error);
        return [];
    }
}

async function getAllResultSets() {
    if (!db) return [];
    try {
        const tx = db.transaction([RESULT_SETS_STORE], 'readonly');
        const store = tx.objectStore(RESULT_SETS_STORE);
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    } catch (error) {
        console.error('Exception in getAllResultSets:', error);
        return [];
    }
}

async function getResultsByResultSet(resultSetId) {
    if (!db) return [];
    try {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('resultSetId');
        return new Promise((resolve, reject) => {
            const req = index.getAll(resultSetId);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    } catch (error) {
        console.error('Exception in getResultsByResultSet:', error);
        return [];
    }
}

async function saveResultSet(metadata) {
    if (!db) throw new Error('Database not initialized');
    const tx = db.transaction([RESULT_SETS_STORE], 'readwrite');
    const store = tx.objectStore(RESULT_SETS_STORE);
    return new Promise((resolve, reject) => {
        const req = store.put(metadata);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function deleteResultSet(resultSetId) {
    if (!db) throw new Error('Database not initialized');

    // Prevent deleting the local or any static result set
    if (resultSetId === RESERVED_RESULT_SET_LOCAL) {
        throw new Error('Cannot delete the "Local" result set');
    }
    if (isStaticResultSet(resultSetId)) {
        throw new Error(`Cannot delete the static result set "${resultSetId}"`);
    }

    const tx = db.transaction([STORE_NAME, RESULT_SETS_STORE], 'readwrite');
    const testStore = tx.objectStore(STORE_NAME);
    const rsStore = tx.objectStore(RESULT_SETS_STORE);

    return new Promise((resolve, reject) => {
        // Delete all test results with this resultSetId
        const index = testStore.index('resultSetId');
        const cursorReq = index.openCursor(resultSetId);
        cursorReq.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };

        // Delete the result set metadata
        rsStore.delete(resultSetId);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function clearLocalResults() {
    if (!db) throw new Error('Database not initialized');

    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const index = store.index('resultSetId');
        const cursorReq = index.openCursor(RESERVED_RESULT_SET_LOCAL);
        cursorReq.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

function generateResultSetId(label) {
    return label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 60);
}

// ──────────────────────────────────────────────
// Grouping helpers
// ──────────────────────────────────────────────

function groupResultsByTestCase(allResults) {
    const resultsByTestCase = {};
    allResults.forEach((result) => {
        if (!resultsByTestCase[result.testCase]) {
            resultsByTestCase[result.testCase] = {};
        }
        resultsByTestCase[result.testCase][result.chartLibrary] = result.results;
    });
    return resultsByTestCase;
}

function groupResultsByTestCaseAndResultSet(allResults) {
    // Returns { [testCase]: { [resultSetId]: { [chartLibrary]: results[] } } }
    const grouped = {};
    allResults.forEach((result) => {
        const tc = result.testCase;
        const rs = result.resultSetId || RESERVED_RESULT_SET_LOCAL;
        const lib = result.chartLibrary;
        if (!grouped[tc]) grouped[tc] = {};
        if (!grouped[tc][rs]) grouped[tc][rs] = {};
        grouped[tc][rs][lib] = result.results;
    });
    return grouped;
}

// ──────────────────────────────────────────────
// Playwright storage-state.json parser
// ──────────────────────────────────────────────

function decodePlaywrightValue(encoded) {
    if (encoded === null || encoded === undefined) return encoded;
    if (typeof encoded !== 'object') return encoded; // primitive

    // Sentinel values: { "v": "undefined" }, { "v": "null" }, { "v": "NaN" }
    if ('v' in encoded && Object.keys(encoded).length <= 1) {
        if (encoded.v === 'undefined') return undefined;
        if (encoded.v === 'null') return null;
        if (encoded.v === 'NaN') return NaN;
        return encoded.v;
    }

    // Object: { "o": [ {k, v}, ... ], "id": ... }
    if ('o' in encoded) {
        const obj = {};
        encoded.o.forEach((entry) => {
            obj[entry.k] = decodePlaywrightValue(entry.v);
        });
        return obj;
    }

    // Array: { "a": [...] }
    if ('a' in encoded) {
        return encoded.a.map((item) => decodePlaywrightValue(item));
    }

    return encoded;
}

function parseStorageState(jsonString) {
    const state = JSON.parse(jsonString);
    const records = [];

    if (!state.origins || !Array.isArray(state.origins)) return records;

    for (const origin of state.origins) {
        if (!origin.indexedDB || !Array.isArray(origin.indexedDB)) continue;

        for (const idb of origin.indexedDB) {
            if (idb.name !== DB_NAME) continue;

            for (const store of idb.stores) {
                if (store.name !== STORE_NAME) continue;

                for (const rec of store.records) {
                    const decoded = decodePlaywrightValue(rec.valueEncoded);
                    if (decoded && decoded.id && decoded.chartLibrary && decoded.testCase) {
                        records.push(decoded);
                    }
                }
            }
        }
    }

    return records;
}

// ──────────────────────────────────────────────
// Simple JSON parser (ChartPerformanceResults.json or flat array)
// ──────────────────────────────────────────────

function parseSimpleJson(jsonString) {
    const parsed = JSON.parse(jsonString);

    // Format: { ChartPerformanceResults: { testResults: [...] } }
    if (parsed.ChartPerformanceResults && Array.isArray(parsed.ChartPerformanceResults.testResults)) {
        return parsed.ChartPerformanceResults.testResults;
    }

    // Format: { testResults: [...] }
    if (parsed.testResults && Array.isArray(parsed.testResults)) {
        return parsed.testResults;
    }

    // Format: flat array of records
    if (Array.isArray(parsed)) {
        return parsed;
    }

    throw new Error('Unrecognized JSON format');
}

// ──────────────────────────────────────────────
// Import / Export
// ──────────────────────────────────────────────

async function importResults(records, resultSetId, resultSetLabel, source) {
    if (!db) throw new Error('Database not initialized');

    // Save result set metadata
    await saveResultSet({
        id: resultSetId,
        label: resultSetLabel,
        source: source || 'import',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });

    // Write all records with the new resultSetId prefix
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const record of records) {
        // Strip any existing resultSetId prefix from the id
        const baseId =
            record.id.includes('_') && record.resultSetId
                ? record.id.substring(record.resultSetId.length + 1)
                : record.id;

        const newRecord = {
            ...record,
            id: `${resultSetId}_${baseId}`,
            resultSetId: resultSetId,
        };
        store.put(newRecord);
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function autoImportStorageState() {
    try {
        const response = await fetch('/tests/storage-state.json');
        if (!response.ok) return;

        const text = await response.text();
        const records = parseStorageState(text);
        if (records.length === 0) return;

        // Simple content hash to skip re-import when nothing changed
        const hash = simpleHash(text);
        const existingHash = localStorage.getItem('storageStateHash');
        if (existingHash === hash) {
            console.log('storage-state.json unchanged, skipping auto-import');
            return;
        }

        // Ensure "Local" result set metadata exists
        const existingRs = await getResultSetById(RESERVED_RESULT_SET_LOCAL);
        if (!existingRs) {
            await saveResultSet({
                id: RESERVED_RESULT_SET_LOCAL,
                label: 'Local',
                source: 'system',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        // Upsert records into "local" (preserves any manual test results)
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        for (const record of records) {
            let baseId = record.id;
            // Strip any existing resultSetId prefix
            if (record.resultSetId && baseId.startsWith(record.resultSetId + '_')) {
                baseId = baseId.substring(record.resultSetId.length + 1);
            }
            store.put({
                ...record,
                id: `${RESERVED_RESULT_SET_LOCAL}_${baseId}`,
                resultSetId: RESERVED_RESULT_SET_LOCAL,
            });
        }

        await new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        localStorage.setItem('storageStateHash', hash);
        console.log(`Auto-imported ${records.length} result(s) from storage-state.json into Local`);
    } catch (error) {
        console.warn('Auto-import of storage-state.json skipped:', error.message);
    }
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        hash = ((hash << 5) - hash + ch) | 0;
    }
    return hash.toString(36);
}

async function getResultSetById(resultSetId) {
    if (!db) return null;
    try {
        const tx = db.transaction([RESULT_SETS_STORE], 'readonly');
        const store = tx.objectStore(RESULT_SETS_STORE);
        return new Promise((resolve, reject) => {
            const req = store.get(resultSetId);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    } catch {
        return null;
    }
}

async function exportResults(resultSetId) {
    let results;
    if (resultSetId === '__all__') {
        results = await getAllTestResults();
    } else {
        results = await getResultsByResultSet(resultSetId);
    }

    // Strip resultSetId prefix from ids for portability
    const cleaned = results.map((r) => {
        const { resultSetId: rsId, ...rest } = r;
        // Reconstruct the base id (without resultSetId prefix)
        const prefix = rsId ? rsId + '_' : '';
        const baseId = r.id.startsWith(prefix) ? r.id.substring(prefix.length) : r.id;
        return { ...rest, id: baseId };
    });

    const exportData = {
        ChartPerformanceResults: {
            testResults: cleaned,
            exportedAt: new Date().toISOString(),
            resultSetId: resultSetId === '__all__' ? 'all' : resultSetId,
        },
    };

    // Trigger download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = resultSetId === '__all__' ? 'all-results' : resultSetId;
    a.download = `ChartPerformanceResults-${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ──────────────────────────────────────────────
// Benchmark Score Calculation (Shared)
// ──────────────────────────────────────────────

function calculateBenchmarkScore(testResults, allParamCombos) {
    // If no expected parameter combinations provided, extract from results
    let expectedParams = allParamCombos;
    if (!expectedParams || expectedParams.length === 0) {
        const paramSet = new Set();
        Object.values(testResults).forEach((results) => {
            if (results && Array.isArray(results)) {
                results.forEach((result) => {
                    if (result.config) {
                        const params = {
                            points: result.config.points || 0,
                            series: result.config.series || 1,
                            charts: result.config.charts || 1,
                        };
                        paramSet.add(JSON.stringify(params));
                    }
                });
            }
        });
        expectedParams = Array.from(paramSet).map((s) => JSON.parse(s));
    }

    // First pass: collect all metric values to find min/max for normalization
    const metrics = { fps: [], frames: [], memory: [], init: [] };

    expectedParams.forEach((expectedParam) => {
        Object.values(testResults).forEach((results) => {
            if (results && Array.isArray(results)) {
                const matchingResult = results.find((result) => {
                    if (!result.config) return false;
                    return (
                        (result.config.points || 0) === expectedParam.points &&
                        (result.config.series || 1) === expectedParam.series &&
                        (result.config.charts || 1) === expectedParam.charts
                    );
                });

                if (matchingResult && !matchingResult.isErrored) {
                    if (matchingResult.averageFPS && matchingResult.averageFPS > 0) {
                        metrics.fps.push(matchingResult.averageFPS);
                    }
                    if (matchingResult.numberOfFrames && matchingResult.numberOfFrames > 0) {
                        metrics.frames.push(matchingResult.numberOfFrames);
                    }
                    if (matchingResult.memory && matchingResult.memory > 0) {
                        metrics.memory.push(matchingResult.memory);
                    }
                    if (matchingResult.benchmarkTimeFirstFrame && matchingResult.benchmarkTimeFirstFrame > 0) {
                        metrics.init.push(matchingResult.benchmarkTimeFirstFrame);
                    }
                }
            }
        });
    });

    // Calculate min/max for each metric using power transformation for FPS and frames
    // Power transformation (^1.5) amplifies performance differences exponentially
    // 42 FPS vs 4.77 FPS: 272 vs 10.4 = 26x difference (captures the order of magnitude!)
    const maxPowerFps = metrics.fps.length > 0 ? Math.pow(Math.max(...metrics.fps), 1.5) : 1;
    const maxPowerFrames = metrics.frames.length > 0 ? Math.pow(Math.max(...metrics.frames), 1.5) : 1;
    const minMemory = metrics.memory.length > 0 ? Math.min(...metrics.memory) : 0;
    const maxMemory = metrics.memory.length > 0 ? Math.max(...metrics.memory) : 1;
    const minInit = metrics.init.length > 0 ? Math.min(...metrics.init) : 0;
    const maxInit = metrics.init.length > 0 ? Math.max(...metrics.init) : 1;

    // Second pass: calculate normalized composite scores
    let totalWeightedScore = 0;
    let totalWeight = 0;

    expectedParams.forEach((expectedParam) => {
        let compositeScore = 0; // Default to 0 if test failed, skipped, or errored

        Object.values(testResults).forEach((results) => {
            if (results && Array.isArray(results)) {
                const matchingResult = results.find((result) => {
                    if (!result.config) return false;
                    return (
                        (result.config.points || 0) === expectedParam.points &&
                        (result.config.series || 1) === expectedParam.series &&
                        (result.config.charts || 1) === expectedParam.charts
                    );
                });

                if (matchingResult && !matchingResult.isErrored) {
                    // Normalize each metric to 0-1 range (higher is better)
                    // Use power transformation (^1.5) for FPS and frames to amplify performance differences
                    // This captures exponential performance gains without over-compressing like log scale
                    const fpsNorm = maxPowerFps > 0 && matchingResult.averageFPS
                        ? Math.pow(matchingResult.averageFPS, 1.5) / maxPowerFps
                        : 0;

                    const framesNorm = maxPowerFrames > 0 && matchingResult.numberOfFrames
                        ? Math.pow(matchingResult.numberOfFrames, 1.5) / maxPowerFrames
                        : 0;

                    const memoryNorm = (maxMemory > minMemory && matchingResult.memory)
                        ? 1 - ((matchingResult.memory - minMemory) / (maxMemory - minMemory))
                        : 1;

                    const initNorm = (maxInit > minInit && matchingResult.benchmarkTimeFirstFrame)
                        ? 1 - ((matchingResult.benchmarkTimeFirstFrame - minInit) / (maxInit - minInit))
                        : 1;

                    // Weighted composite score (scale to 0-100)
                    compositeScore = (
                        fpsNorm * 0.65 +      // 65% weight on FPS (primary performance metric)
                        initNorm * 0.20 +     // 20% weight on init time
                        framesNorm * 0.10 +   // 10% weight on total frames
                        memoryNorm * 0.05     // 5% weight on memory efficiency (least critical)
                    ) * 100;
                }
            }
        });

        // Calculate complexity and weight for this parameter combination
        // Use aggressive polynomial weighting to make complex tests count exponentially more
        // This ensures that rendering 16M points (16000x16000 heatmap) counts FAR more than 10K points (100x100)
        const complexity = expectedParam.points * expectedParam.series * expectedParam.charts;
        const logComplexity = Math.log10(complexity + 1);
        const weight = Math.pow(logComplexity, 3.5); // Polynomial: log^3.5 creates exponential differentiation

        totalWeightedScore += compositeScore * weight;
        totalWeight += weight;
    });

    // Return weighted average
    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
}

// ──────────────────────────────────────────────
// Data Ingestion Rate Calculation
// ──────────────────────────────────────────────

function detectTestType(testName) {
    // Static tests: data loaded once at initialization
    if (
        testName === E_TEST_NAME.N_X_M || // Line multi-series
        testName === E_TEST_NAME.COLUMN ||
        testName === E_TEST_NAME.CANDLESTICK ||
        testName === E_TEST_NAME.MOUNTAIN
    ) {
        return 'static';
    }

    // Realtime regenerate: all data regenerated each frame
    if (
        testName === E_TEST_NAME.SCATTER ||
        testName === E_TEST_NAME.LINE ||
        testName === E_TEST_NAME.POINT_LINE ||
        testName === E_TEST_NAME.POINTCLOUD_3D ||
        testName === E_TEST_NAME.SURFACE_3D
    ) {
        return 'realtime-regenerate';
    }

    // Streaming: incremental append each frame
    if (
        testName === E_TEST_NAME.FIFO ||
        testName === E_TEST_NAME.SERIES_COMPRESSION ||
        testName === E_TEST_NAME.MULTI_CHART
    ) {
        return 'streaming';
    }

    // Heatmap: 2D matrix
    if (testName === E_TEST_NAME.HEATMAP) {
        return 'heatmap';
    }

    return 'unknown';
}

function calculateDataIngestionRate(result, testName) {
    if (!result || !result.config) return null;

    const config = result.config;
    const series = config.series || 1;
    const points = config.points || 0;
    const increment = config.increment || 0;
    const charts = config.charts || 1;
    const numberOfFrames = result.numberOfFrames || 0;
    const benchmarkTimeFirstFrame = result.benchmarkTimeFirstFrame || 0;
    const updateFramesTime = result.updateFramesTime || 0;
    const totalDatapointsProcessed = result.totalDatapointsProcessed;

    // Detect test type from test name if provided
    let testType = 'unknown';
    if (testName) {
        testType = detectTestType(testName);
    }

    // Calculate based on test type
    if (testType === 'static') {
        // Static tests: calculate from total initialization time (time to first rendered frame)
        // Formula: (series × points × charts) / benchmarkTimeFirstFrame × 1000
        if (benchmarkTimeFirstFrame > 0) {
            return (series * points * charts) / benchmarkTimeFirstFrame * 1000;
        }
        return null;
    }

    // FIFO test: special handling because updateChart returns cumulative totals
    // We need to calculate actual datapoints: initial + (increment per frame × frames)
    if (testType === 'streaming' && testName === E_TEST_NAME.FIFO) {
        if (updateFramesTime > 0 && numberOfFrames > 0 && increment > 0) {
            // Total datapoints = initial data + incremental data added across all frames
            const initialDatapoints = series * points * charts;
            const incrementalDatapoints = increment * series * numberOfFrames * charts;
            const totalDatapoints = initialDatapoints + incrementalDatapoints;
            return totalDatapoints / updateFramesTime * 1000;
        }
    }

    // Series Compression test: updateChart returns the cumulative dataSeries.count(), not the
    // per-frame delta. Calculate ingestion rate from the final total count divided by test duration.
    if (testType === 'streaming' && testName === E_TEST_NAME.SERIES_COMPRESSION) {
        if (updateFramesTime > 0 && numberOfFrames > 0) {
            const initialDatapoints = series * points;
            const incrementalDatapoints = increment * series * numberOfFrames;
            const finalTotalCount = initialDatapoints + incrementalDatapoints;
            return finalTotalCount / updateFramesTime * 1000;
        }
    }

    // Dynamic tests: use totalDatapointsProcessed if available (the actual tracked datapoints)
    // This is the preferred method for all dynamic tests as it reflects actual data throughput
    if (totalDatapointsProcessed !== undefined && totalDatapointsProcessed !== null &&
        updateFramesTime > 0) {
        return totalDatapointsProcessed / updateFramesTime * 1000;
    }

    // Fallback formulas for dynamic tests if totalDatapointsProcessed is not available
    if (testType === 'realtime-regenerate') {
        // Realtime regenerate: all data regenerated each frame
        // Formula: (series × points × numberOfFrames) / updateFramesTime × 1000
        if (updateFramesTime > 0 && numberOfFrames > 0) {
            return (series * points * numberOfFrames) / updateFramesTime * 1000;
        }
    } else if (testType === 'streaming') {
        // Streaming: incremental append
        // Formula: (increment × series × numberOfFrames × charts) / updateFramesTime × 1000
        if (updateFramesTime > 0 && numberOfFrames > 0 && increment > 0) {
            return (increment * series * numberOfFrames * charts) / updateFramesTime * 1000;
        }
    } else if (testType === 'heatmap') {
        // Heatmap: 2D matrix (points = side length, so total cells = points × points)
        // Formula: (points × points × numberOfFrames) / updateFramesTime × 1000
        if (updateFramesTime > 0 && numberOfFrames > 0) {
            return (points * points * numberOfFrames) / updateFramesTime * 1000;
        }
    }

    return null;
}

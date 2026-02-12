// shared.js — Constants and IndexedDB functions shared between index.js and charts.js

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

    // Prevent deleting the local result set
    if (resultSetId === RESERVED_RESULT_SET_LOCAL) {
        throw new Error('Cannot delete the "Local" result set');
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

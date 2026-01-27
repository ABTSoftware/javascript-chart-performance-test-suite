// IndexedDB setup for persistence
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

async function saveTestResults(chartLibrary, testCase, results) {
    console.log('=== saveTestResults CALLED ===');
    
    if (!db) {
        console.error('Database not initialized in saveTestResults');
        throw new Error('Database not initialized');
    }
    
    console.log('Database is available:', !!db);
    console.log('Database name:', db.name);
    console.log('Database version:', db.version);
    
    try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        console.log('Transaction created successfully');
        
        const store = transaction.objectStore(STORE_NAME);
        console.log('Object store retrieved successfully');
        
        const data = {
            id: `${chartLibrary}_${testCase}`,
            chartLibrary,
            testCase,
            results,
            timestamp: Date.now()
        };
        
        console.log('=== DATA TO SAVE ===');
        console.log('ID:', data.id);
        console.log('Chart Library:', data.chartLibrary);
        console.log('Test Case:', data.testCase);
        console.log('Results type:', typeof data.results);
        console.log('Results is array:', Array.isArray(data.results));
        console.log('Results length:', data.results?.length);
        console.log('Timestamp:', data.timestamp);
        console.log('Full data object:', JSON.stringify(data, null, 2));
        
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            
            request.onsuccess = (event) => {
                console.log('=== IndexedDB SAVE SUCCESS ===');
                console.log('Save successful, result:', event.target.result);
                console.log('Data saved with ID:', data.id);
                resolve();
            };
            
            request.onerror = (event) => {
                console.error('=== IndexedDB SAVE ERROR ===');
                console.error('Save error:', event.target.error);
                console.error('Error code:', event.target.error?.code);
                console.error('Error name:', event.target.error?.name);
                console.error('Error message:', event.target.error?.message);
                reject(event.target.error);
            };
            
            transaction.oncomplete = () => {
                console.log('Transaction completed successfully');
            };
            
            transaction.onerror = (event) => {
                console.error('Transaction error:', event.target.error);
            };
            
            transaction.onabort = (event) => {
                console.error('Transaction aborted:', event.target.error);
            };
        });
        
    } catch (error) {
        console.error('=== saveTestResults EXCEPTION ===');
        console.error('Exception in saveTestResults:', error);
        console.error('Exception stack:', error.stack);
        throw error;
    }
}

(async function main() {
    // Initialize IndexedDB and system info before tests start
    await initIndexedDB();
    displaySystemInfo();
    await initializeStatsChart();
    
    const urlParams = new URLSearchParams(window.location.search);
    const testGroupId = urlParams.get('test_group_id');
    console.log("test_group_id", testGroupId);
    const testGroup = gGetTestGroup(testGroupId);
    if (!testGroup) throw Error("testGroup is undefined, check query string param test_group_id!")
    const testGroupName = testGroup.name;
    const tests = testGroup.tests;
    for (let i = 0; i < tests.length; i++) {
        /** @type {{ series: number, points: number, testDuration: number, debug: boolean }} */
        const testConfig = tests[i];
        gTestStarted(testConfig, i);

        gSetLibInfo(i, eLibName(), eLibVersion());
        const { testDuration, series: seriesNumber, points: pointsNumber, increment: incrementPoints, charts: chartsNumber } = testConfig;

        // Select Test
        /** @type {{appendData: ()=>void, deleteChart: ()=>void, updateChart: (frame: number)=>void, createChart: () => Promise<any>, generateData: () => void}} */
        let perfTest;
        try {
            if (testGroupName === G_TEST_GROUP_NAME.LINE_PERFORMANCE_TEST) {
                perfTest = eLinePerformanceTest(seriesNumber, pointsNumber);
            } else if (testGroupName === G_TEST_GROUP_NAME.SCATTER_PERFORMANCE_TEST) {
                perfTest = eScatterPerformanceTest(seriesNumber, pointsNumber);
            } else if (testGroupName === G_TEST_GROUP_NAME.XY_LINE_PERFORMANCE_TEST) {
                perfTest = eScatterLinePerformanceTest(seriesNumber, pointsNumber);
            } else if (testGroupName === G_TEST_GROUP_NAME.POINT_LINE_PERFORMANCE_TEST) {
                perfTest = ePointLinePerformanceTest(seriesNumber, pointsNumber);
            } else if (testGroupName === G_TEST_GROUP_NAME.COLUMN_PERFORMANCE_TEST) {
                perfTest = eColumnPerformanceTest(seriesNumber, pointsNumber);
            } else if (testGroupName === G_TEST_GROUP_NAME.CANDLESTICK_PERFORMANCE_TEST) {
                perfTest = eCandlestickPerformanceTest(seriesNumber, pointsNumber);
            } else if (testGroupName === G_TEST_GROUP_NAME.FIFO_ECG_PERFORMANCE_TEST) {
                perfTest = eFifoEcgPerformanceTest(seriesNumber, pointsNumber, incrementPoints);
            } else if (testGroupName === G_TEST_GROUP_NAME.MOUNTAIN_PERFORMANCE_TEST) {
                perfTest = eMountainPerformanceTest(seriesNumber, pointsNumber);
            } else if (testGroupName === G_TEST_GROUP_NAME.SERIES_COMPRESSION_PERFORMANCE_TEST) {
                perfTest = eSeriesCompressionPerformanceTest(seriesNumber, pointsNumber, incrementPoints);
            } else if (testGroupName === G_TEST_GROUP_NAME.MULTI_CHART_PERFORMANCE_TEST) {
                perfTest = eMultiChartPerformanceTest(seriesNumber, pointsNumber, incrementPoints, chartsNumber);
            } else if (testGroupName === G_TEST_GROUP_NAME.HEATMAP_PERFORMANCE_TEST) {
                // Check if heatmap test is supported
                if (typeof eHeatmapPerformanceTest === 'undefined') {
                    gTestFinished(i, 0, 0, [], true, 'UNSUPPORTED');
                    continue;
                }
                perfTest = eHeatmapPerformanceTest(seriesNumber, pointsNumber);
            } else if (testGroupName === G_TEST_GROUP_NAME.POINTCLOUD_3D_PERFORMANCE_TEST) {
                // Check if 3D point cloud test is supported
                if (typeof e3dPointCloudPerformanceTest === 'undefined') {
                    gTestFinished(i, 0, 0, [], true, 'UNSUPPORTED');
                    continue;
                }
                perfTest = e3dPointCloudPerformanceTest(seriesNumber, pointsNumber);
            } else if (testGroupName === G_TEST_GROUP_NAME.SURFACE_3D_PERFORMANCE_TEST) {
                // Check if 3D surface test is supported
                if (typeof e3dSurfacePerformanceTest === 'undefined') {
                    gTestFinished(i, 0, 0, [], true, 'UNSUPPORTED');
                    continue;
                }
                perfTest = e3dSurfacePerformanceTest(seriesNumber, pointsNumber);
            } else {
                throw new Error('Not correct testType');
            }
        } catch (e) {
            console.error(e);
            continue;
        }

        const result = await perfTest.createChart();
        if (result === false) {
            gTestFinished(i, 0, 0, [], true, 'SKIPPED');
            break;
        }
        const libLoadTime = gTestLibLoaded(i);

        perfTest.generateData();
        gTestDataGenerated(i);

        try {
            perfTest.appendData();
        } catch (error) {
            console.error('Error during appendData:', error);
            perfTest.deleteChart();
            perfTest = undefined;
            gTestFinished(i, 0, 0, [], true, 'ERROR_APPEND_DATA');
            // Mark remaining tests as skipped
            for (let j = i + 1; j < tests.length; j++) {
                gTestStarted(tests[j], j);
                gSetLibInfo(j, eLibName(), eLibVersion());
                gTestFinished(j, 0, 0, [], true, 'SKIPPED');
            }
            break;
        }

        const startTime = gTestInitialDataAppended(i);
        
        // Wait for multiple frames to ensure data is actually rendered
        await nextFrameRender();
        await nextFrameRender();
        await nextFrameRender();
        gTestFirstFrameRendered(i);
        
        // Check if total setup time (lib load + data append) exceeds test duration - if so, fail with HANGING
        const totalSetupDuration = performance.now() - gGetResultRecord(i).timestampTestStart;
        if (totalSetupDuration > testDuration) {
            console.error(`Total setup time (${totalSetupDuration.toFixed(2)}ms) exceeded test duration (${testDuration}ms) - marking as HANGING`);
            perfTest.deleteChart();
            perfTest = undefined;
            gTestFinished(i, 0, 0, [], true, 'HANGING');
            // Mark remaining tests as skipped
            for (let j = i + 1; j < tests.length; j++) {
                gTestStarted(tests[j], j);
                gSetLibInfo(j, eLibName(), eLibVersion());
                gTestFinished(j, 0, 0, [], true, 'SKIPPED');
            }
            break;
        }
        testStartTime = startTime; // Store for stats chart

        // Clear stats chart for new test
        if (statsDataSeries) {
            statsDataSeries.clear();
        }

        // Update chart
        let frame = 0;
        let mem = 0;
        const frameTimings = [];
        const MAX_REALISTIC_FPS = 240; // Cap at monitor refresh rate
        const MIN_FRAME_TIME = 1000 / MAX_REALISTIC_FPS; // ~4.17ms for 240 FPS

        const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

        const runUpdateChart = async () => {
            const oneFrameTest = false;
            const currentTime = performance.now();
            const currentDuration = currentTime - startTime;
            
            // Check if we should stop the test
            const isFinished = oneFrameTest ? frame === 0 : currentDuration >= testDuration || perfTest === undefined;

            mem = window.performance.memory?.usedJSHeapSize / 1048576;

            if (isFinished) {
                console.log(`Total Frames: ${frame}, Average FPS: ${(1000 / currentDuration * frame).toFixed(2)}, mem: ${mem.toFixed(0)} mb`);
                return 'finished'; // Test completed normally
            }

            const before = performance.now();
            let frameTime;
            let datapointCount;
            
            try {
                datapointCount = perfTest.updateChart(frame);
                
                frame++;
                await nextFrameRender();
                
                const after = performance.now();
                frameTime = after - before;
                
                // Cap unrealistic frame times to minimum realistic value
                frameTime = Math.max(frameTime, MIN_FRAME_TIME);
                
                frameTimings.push(frameTime);
            } catch (error) {
                console.error('Error during updateChart:', error);
                return 'error'; // Return error status
            }

            const instantaneousFPS = 1000 / frameTime;

            // Update stats display
            const currentFpsElement = document.getElementById('current-fps');
            const frameCountElement = document.getElementById('frame-count');
            const currentMemoryElement = document.getElementById('current-memory');
            const datapointCountElement = document.getElementById('datapoint-count');
            if (currentFpsElement) {
                currentFpsElement.textContent = `${instantaneousFPS.toFixed(2)}`;
            }
            if (frameCountElement) {
                frameCountElement.textContent = frame.toString();
            }
            if (currentMemoryElement) {
                currentMemoryElement.textContent = Math.round(mem).toString();
            }
            if (datapointCountElement && datapointCount !== undefined) {
                const isFifoTest = testGroupName === G_TEST_GROUP_NAME.FIFO_ECG_PERFORMANCE_TEST;
                const suffix = isFifoTest ? ' (*total processed)' : '';
                datapointCountElement.textContent = datapointCount.toLocaleString() + suffix;
            }

            // Update stats chart
            updateStatsChart(instantaneousFPS);

            const message = `frame: ${frame}, fps: ${instantaneousFPS.toFixed(2)}, mem: ${mem.toFixed(0)} mb`;
            if (instantaneousFPS < 1) {
                console.error(message);
            }
            else if (instantaneousFPS < 5) {
                console.warn(message);
            }
            else if (frame % 60 === 0) {
                console.log(message);
            }
            
            return 'continue'; // Continue the loop
        };
        
        // Run the test loop
        let hasError = false;
        while (true) {
            const status = await runUpdateChart();
            if (status === 'error') {
                // Error occurred - stop immediately
                hasError = true;
                break;
            } else if (status === 'finished') {
                // Normal completion
                break;
            }
            // status === 'continue' - keep looping
        }

        // Clear stats display after test completion
        const currentFpsElement = document.getElementById('current-fps');
        const frameCountElement = document.getElementById('frame-count');
        const currentMemoryElement = document.getElementById('current-memory');
        const datapointCountElement = document.getElementById('datapoint-count');
        const actualTestDuration = performance.now() - startTime;
        if (currentFpsElement) {
            const averageFPS = (1000 * frame / actualTestDuration).toFixed(2);
            currentFpsElement.textContent = `${averageFPS} (avg)`;
        }
        if (frameCountElement) {
            frameCountElement.textContent = frame.toString();
        }
        if (currentMemoryElement) {
            currentMemoryElement.textContent = Math.round(mem).toString();
        }
        // Keep final datapoint count displayed

        perfTest.deleteChart();
        perfTest = undefined;

        gTestFinished(i, frame, mem, frameTimings, hasError);

        // Only show "chart deleted" message after the last test completes
        const isLastTest = (i === tests.length - 1);
        if (isLastTest) {
            const chartRootDiv = document.getElementById('chart-root');
            if (chartRootDiv) {
                chartRootDiv.style.backgroundColor = '#d3d3d3';
                chartRootDiv.style.display = 'flex';
                chartRootDiv.style.alignItems = 'center';
                chartRootDiv.style.justifyContent = 'center';
                chartRootDiv.style.fontSize = '26pt';
                chartRootDiv.style.fontWeight = 'bold';
                chartRootDiv.style.color = '#333';
                chartRootDiv.innerHTML = 'chart deleted after test completion';
            }
        }

        if (G_RESULT[i].benchmarkFPS < 2) {
            console.warn('Some tests were skipped because of FPS lower than 2');
            // Mark remaining tests as skipped
            for (let j = i + 1; j < tests.length; j++) {
                gTestStarted(tests[j], j);
                gSetLibInfo(j, eLibName(), eLibVersion());
                gTestFinished(j, 0, 0, [], true, 'SKIPPED');
            }
            break;
        }

        // if (window.gc) {
        //     console.warn("Running GC");
        //     await sleep(1000);
        //     window.gc() && window.gc();
        //     window.gc() && window.gc();
        //     await sleep(1000);
        //     console.warn("GC finished");
        // } else {
        //     console.warn('No GC available. Run google chrome with --js-flags="--expose-gc" to ensure tests can run Garbage Collection.');
        // }

        mem = window.performance.memory?.usedJSHeapSize / 1048576;
        console.log(`deleted chart, mem after = ${mem} mb`);
        console.log(`Note: GC runs non-deterministically, so the memory usage may not decrease immediately after the chart is deleted.`)
    }

    const result = G_RESULT;

    console.log('result', result);
    const fileName = `${eLibName()}_${eLibVersion()}.json`;
    downLoadJsonResult(result, fileName);
    const tableElement = createResultTable(result, testGroupName);
    
    // Persist results to IndexedDB
    try {
        const chartLibrary = `${eLibName()} ${eLibVersion()}`;
        console.log('=== PERSISTENCE DEBUG START ===');
        console.log('Chart Library:', chartLibrary);
        console.log('Test Group Name:', testGroupName);
        console.log('Result type:', typeof result);
        console.log('Result is array:', Array.isArray(result));
        console.log('Result length:', result?.length);
        console.log('Result sample (first item):', result?.[0]);
        
        // Create a copy of results without frameTimings for persistence
        const resultsForPersistence = result.map(item => {
            const { frameTimings, ...itemWithoutFrameTimings } = item;
            return itemWithoutFrameTimings;
        });
        
        console.log('Results for persistence (without frameTimings):', resultsForPersistence);
        
        console.log('Calling saveTestResults directly...');
        await saveTestResults(chartLibrary, testGroupName, resultsForPersistence);
        console.log('saveTestResults completed successfully');
        console.log('=== PERSISTENCE DEBUG END ===');
    } catch (error) {
        console.error('=== PERSISTENCE ERROR ===');
        console.error('Error during persistence:', error);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
    }

    tableElement?.classList.add("results-table-ready");
})();

function getGPUInfo() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            return {
                renderer: 'WebGL not supported',
                vendor: 'Unknown',
                angle: 'N/A'
            };
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        let renderer = 'Unknown';
        let vendor = 'Unknown';
        
        if (debugInfo) {
            renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
            vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
        } else {
            renderer = gl.getParameter(gl.RENDERER) || 'Unknown';
            vendor = gl.getParameter(gl.VENDOR) || 'Unknown';
        }

        const isAngle = renderer.toLowerCase().includes('angle') || 
                       vendor.toLowerCase().includes('google') ||
                       renderer.toLowerCase().includes('direct3d');

        canvas.remove();

        return {
            renderer: renderer,
            vendor: vendor,
            angle: isAngle ? 'Yes (ANGLE)' : 'No'
        };
    } catch (error) {
        console.warn('Failed to get GPU info:', error);
        return {
            renderer: 'Detection failed',
            vendor: 'Detection failed',
            angle: 'Detection failed'
        };
    }
}

function displaySystemInfo() {
    const gpuInfo = getGPUInfo();
    
    const systemInfoContainer = document.getElementById('system-info');
    if (!systemInfoContainer) return;
    
    systemInfoContainer.style.cssText = `
        margin: 20px 0;
        padding: 15px;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        line-height: 1.4;
    `;
    
    systemInfoContainer.innerHTML = `
        <h3 style="margin-top: 0; color: #333;">System Information</h3>
        <div><strong>User Agent:</strong> ${navigator.userAgent}</div>
        <div><strong>GPU Vendor:</strong> ${gpuInfo.vendor}</div>
        <div><strong>GPU Renderer:</strong> ${gpuInfo.renderer}</div>
        <div><strong>ANGLE:</strong> ${gpuInfo.angle}</div>
        <div><strong>Platform:</strong> ${navigator.platform}</div>
        <div><strong>Hardware Concurrency:</strong> ${navigator.hardwareConcurrency || 'Unknown'} cores</div>
        <div><strong>Memory:</strong> ${navigator.deviceMemory ?navigator.deviceMemory + ' GB' : 'Unknown'}</div>
        
        <h3 style="margin-top: 20px; margin-bottom: 10px; color: #333;">Stats</h3>
        <div id="stats-container">
            <div><strong>Current FPS:</strong> <span id="current-fps">-</span></div>
            <div><strong>Frame Count:</strong> <span id="frame-count">0</span></div>
            <div><strong>Memory:</strong> <span id="current-memory">-</span> MB</div>
            <div><strong>Datapoints:</strong> <span id="datapoint-count">-</span></div>
            <div id="stats-chart-root" style="width: 100%; height: 200px; margin-top: 10px;"></div>
        </div>
    `;
}

let statsChart = null;
let statsDataSeries = null;
let testStartTime = null;

async function initializeStatsChart() {
    try {
        const { SciChartSurface, NumericAxis, XyDataSeries, FastMountainRenderableSeries, NumberRange, EAutoRange, SciChartJSLightTheme } = SciChart;
        
        SciChartSurface.configure({
            wasmUrl: '/scichart/lib/scichart2d.wasm',
            wasmNoSimdUrl: '/scichart/lib/scichart2d-nosimd.wasm',
        });

        const { sciChartSurface, wasmContext } = await SciChartSurface.create('stats-chart-root', {
            theme: new SciChartJSLightTheme(),
            loader: false
        });
        
        // Configure X-axis (time in seconds)
        const xAxis = new NumericAxis(wasmContext, {
            visibleRange: new NumberRange(0, testDuration / 1000), // Convert testDuration to seconds
            autoRange: EAutoRange.Never,
            axisTitle: 'Time (s)',
            axisTitleStyle: { fontSize: 16, color: '#333' },
            labelStyle: { fontSize: 12 },
            drawMinorGridLines: false,
            drawMajorBands: false,
            drawMajorTicks: false,
            drawMinorTicks: false
        });
        sciChartSurface.xAxes.add(xAxis);
        
        // Configure Y-axis (FPS) with auto-ranging and growth factor
        const yAxis = new NumericAxis(wasmContext, {
            autoRange: EAutoRange.Always,
            growBy: new NumberRange(0, 0.1),
            axisTitle: 'FPS',
            axisTitleStyle: { fontSize: 16, color: '#333' },
            labelStyle: { fontSize: 12 },
            drawMinorGridLines: false,
            drawMajorBands: false,
            drawMajorTicks: false,
            drawMinorTicks: false
        });
        
        sciChartSurface.yAxes.add(yAxis);
        
        // Create data series
        statsDataSeries = new XyDataSeries(wasmContext, {
            dataIsSortedInX: true,
            containsNaN: false,
        });
        statsDataSeries.capacity = 2400;
        
        // Create mountain series
        const mountainSeries = new FastMountainRenderableSeries(wasmContext, {
            dataSeries: statsDataSeries,
            fill: 'rgba(70, 130, 180, 0.3)',
            stroke: 'SteelBlue',
            strokeThickness: 2,
        });
        
        sciChartSurface.renderableSeries.add(mountainSeries);
        
        statsChart = sciChartSurface;
        
    } catch (error) {
        console.warn('Failed to initialize stats chart:', error);
    }
}

function updateStatsChart(instantaneousFPS) {
    if (statsChart && statsDataSeries && testStartTime) {
        const currentTime = (performance.now() - testStartTime) / 1000; // Convert to seconds
        statsDataSeries.append(currentTime, instantaneousFPS);
        
        // X-axis range is fixed to show the entire test duration, no need to update
    }
}


function nextFrameRender() {
    return new Promise((resolve) => requestAnimationFrame(resolve));
}

function downLoadJsonResult(jsonObject, filename) {
    // const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonObject));
    const dlAnchorElem = document.getElementById('download-link');
    dlAnchorElem.style.display = 'block';
    dlAnchorElem.setAttribute('href', "#");
    // dlAnchorElem.setAttribute('download', filename);
    dlAnchorElem.addEventListener('click', () => {
        const table = document.getElementById("table");
        const tableData = [];

        // Loop through table rows excluding header
        for (let i = 1; i < table.rows.length; i++) {
            const row = table.rows[i];
            const rowData = [];

            // Loop through each cell in the row
            for (let j = row.cells.length - 5; j < row.cells.length; j++) {
                rowData.push(row.cells[j].innerText); // Get text of the cell
            }

            // Join each cell data with a tab, representing a column
            tableData.push(rowData.join("\t"));
        }

        // Join each row with a newline character to represent a new row in Excel
        const tableString = tableData.join("\n");

        // Create a temporary textarea element to hold the table string
        const tempTextArea = document.createElement("textarea");
        tempTextArea.value = tableString;

        // Append textarea to the body
        document.body.appendChild(tempTextArea);

        // Select the content of the textarea
        tempTextArea.select();

        // Copy the content to the clipboard
        document.execCommand("copy");

        // Remove the temporary textarea from the DOM
        document.body.removeChild(tempTextArea);
    });
}

function roundToSignificantFigures(num, sigFigs) {
    if (num === 0 || num === null || num === undefined) return num;
    const magnitude = Math.floor(Math.log10(Math.abs(num)));
    const factor = Math.pow(10, sigFigs - 1 - magnitude);
    return Math.round(num * factor) / factor;
}

function getHeatmapColor(value, min, max, higherIsBetter = true) {
    if (value === null || value === undefined || min === max) {
        return 'transparent';
    }
    
    // Normalise value to 0-1 range
    const normalised = (value - min) / (max - min);
    
    // For "higher is better", green = high values, red = low values
    // For "lower is better", green = low values, red = high values
    const greenIntensity = higherIsBetter ? normalised : (1 - normalised);
    
    // Light green (#AAFFAA) to light red (#FFAAAA) gradient
    const red = Math.round(255 - (greenIntensity * 85));   // 255 to 170 (0xFF to 0xAA)
    const green = Math.round(170 + (greenIntensity * 85)); // 170 to 255 (0xAA to 0xFF)
    const blue = Math.round(170);                          // Always 170 (0xAA)
    
    return `rgb(${red}, ${green}, ${blue})`;
}

function getRedHeatmapColor(value, min, max) {
    if (value === null || value === undefined || min === max) {
        return 'transparent';
    }
    
    // Normalise value to 0-1 range
    const normalised = (value - min) / (max - min);
    
    // Red gradient from very pale red to dark crimson with alpha for text readability
    // Higher values = darker red (worse performance for timing)
    const intensity = normalised * 0.7; // Cap at 0.7 to ensure text readability
    const red = 220; // Base red value (crimson)
    const green = Math.round(255 - (intensity * 200)); // 255 to 55
    const blue = Math.round(255 - (intensity * 235));  // 255 to 20
    const alpha = 0.3 + (intensity * 0.5); // 0.3 to 0.8 alpha
    
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function createResultTable(resultArr, testGroupName) {
    const note = `<p><b>Lib Load</b> time includes time spent for deletion of the previous chart.</p>
        <p>For scichart.js <b>First Frame</b> time for the first test is bigger because <b>wasm</b> and <b>data</b> files are downloaded from CDN.</p>
        <p>After a test case with FPS less than 2, subsequent are skipped.</p>`;
    
    // Calculate min/max values for heatmap scaling
    const fpsValues = [];
    const memoryValues = [];
    const frameValues = [];
    const dataAppendValues = [];
    const firstFrameValues = [];
    
    resultArr.forEach(row => {
        if (row.minFPS !== null && row.minFPS !== undefined) fpsValues.push(row.minFPS);
        if (row.maxFPS !== null && row.maxFPS !== undefined) fpsValues.push(row.maxFPS);
        if (row.averageFPS !== null && row.averageFPS !== undefined) fpsValues.push(row.averageFPS);
        if (row.memory !== null && row.memory !== undefined) memoryValues.push(row.memory);
        if (row.numberOfFrames !== null && row.numberOfFrames !== undefined) frameValues.push(row.numberOfFrames);
        if (row.benchmarkTimeInitialDataAppend !== null && row.benchmarkTimeInitialDataAppend !== undefined) dataAppendValues.push(row.benchmarkTimeInitialDataAppend);
        if (row.benchmarkTimeFirstFrame !== null && row.benchmarkTimeFirstFrame !== undefined) firstFrameValues.push(row.benchmarkTimeFirstFrame);
    });
    
    const fpsMin = Math.min(...fpsValues, 0);
    const fpsMax = Math.max(...fpsValues);
    const memoryMin = Math.min(...memoryValues);
    const memoryMax = Math.max(...memoryValues);
    const framesMin = Math.min(...frameValues);
    const framesMax = Math.max(...frameValues);
    const dataAppendMin = Math.min(...dataAppendValues);
    const dataAppendMax = Math.max(...dataAppendValues);
    const firstFrameMin = Math.min(...firstFrameValues);
    const firstFrameMax = Math.max(...firstFrameValues);
    
    let resStr = `<table id="table">`;
    const tableHeader = `<tr>
        <th>Lib</th>
        <th>Test Type</th>
        <th>Points</th>
        <th>Series</th>
        <th>Charts</th>
        <th title="The time from test start for the library to load and create the chart surface, measured from timestampTestStart to timestampLibLoaded">Lib Load (ms)</th>
        <th title="The total time from test start until the first frame with data is rendered, measured from timestampTestStart to timestampFirstFrameWithDataRendered. Includes library loading, data generation, data append, and first render time">First Frame (ms)</th>
        <th title="The time to append initial data to the chart, measured from timestampDataGenerated to timestampInitialDataAppended">Data Append (ms)</th>
        <th title="Memory measured using window.performance.memory.usedJSHeapSize at test completion. Note: Due to non-deterministic garbage collection timings, memory usage may fluctuate and not immediately reflect chart deletion">Memory (MByte)</th>
        <th title="Minimum frames per second during the test, calculated from individual frame timings and capped at 240 FPS for realistic values">Min FPS</th>
        <th title="Maximum frames per second during the test, calculated from individual frame timings and capped at 240 FPS for realistic values">Max FPS</th>
        <th title="Average frames per second during the test, calculated as (1000 * totalFrames) / actualTestDuration">Avg FPS</th>
        <th title="Total number of frames rendered during the test duration">Total Frames</th>
        <th title="Test completion status: OK (successful), HANGING (exceeded time limit), ERROR_APPEND_DATA (data append failed), UNSUPPORTED (test not implemented), or SKIPPED (skipped due to previous failures)">Status</th>
    </tr>`;
    resStr += tableHeader;
    
    resultArr.forEach((row) => {
        let rowStr = `<tr>`;
        rowStr += `<td>${row.configLibName} ${row.configLibVersion}</td>`;
        rowStr += `<td>${testGroupName}</td>`;
        rowStr += `<td style='text-align: right'>${row.config?.points}</td>`;
        rowStr += `<td style='text-align: right'>${row.config?.series}</td>`;
        rowStr += `<td style='text-align: right'>${row.config?.charts || '-'}</td>`;
        rowStr += `<td style='text-align: right'>${roundToSignificantFigures(row.benchmarkTimeLibLoad, 2)}</td>`;
        
        // First Frame column with red heatmap (higher is worse)
        const firstFrameBg = getRedHeatmapColor(row.benchmarkTimeFirstFrame, firstFrameMin, firstFrameMax);
        rowStr += `<td style='text-align: right; background-color: ${firstFrameBg}'>${roundToSignificantFigures(row.benchmarkTimeFirstFrame, 2)}</td>`;
        
        // Data Append column with red heatmap (higher is worse)
        const dataAppendBg = getRedHeatmapColor(row.benchmarkTimeInitialDataAppend, dataAppendMin, dataAppendMax);
        rowStr += `<td style='text-align: right; background-color: ${dataAppendBg}'>${roundToSignificantFigures(row.benchmarkTimeInitialDataAppend, 2)}</td>`;
        
        // Memory column with heatmap (lower is better)
        const memoryBg = getHeatmapColor(row.memory, memoryMin, memoryMax, false);
        rowStr += `<td style='text-align: right; background-color: ${memoryBg}'>${row.memory?.toFixed(0)}</td>`;
        
        // FPS columns with heatmap (higher is better)
        const minFpsBg = getHeatmapColor(row.minFPS, fpsMin, fpsMax, true);
        const maxFpsBg = getHeatmapColor(row.maxFPS, fpsMin, fpsMax, true);
        const avgFpsBg = getHeatmapColor(row.averageFPS, fpsMin, fpsMax, true);
        rowStr += `<td style='text-align: right; background-color: ${minFpsBg}'>${row.minFPS?.toFixed(2)}</td>`;
        rowStr += `<td style='text-align: right; background-color: ${maxFpsBg}'>${row.maxFPS?.toFixed(2)}</td>`;
        rowStr += `<td style='text-align: right; background-color: ${avgFpsBg}'>${row.averageFPS?.toFixed(2)}</td>`;
        
        // Total Frames column with heatmap (higher is better)
        const framesBg = getHeatmapColor(row.numberOfFrames, framesMin, framesMax, true);
        rowStr += `<td style='text-align: right; background-color: ${framesBg}'>${row.numberOfFrames}</td>`;
        
        // Status column
        let statusText = 'OK';
        let statusBg = '#CCFFCC';
        if (row.isErrored) {
            if (row.errorReason === 'UNSUPPORTED') {
                statusText = '<unsupported>';
                statusBg = '#FFFFCC';
            } else {
                statusText = row.errorReason || 'Errored';
                statusBg = '#FFCCCC';
            }
        }
        rowStr += `<td style='text-align: center; background-color: ${statusBg}'>${statusText}</td>`;
        rowStr += `</tr>`;
        resStr += rowStr;
    });
    resStr += `</table>`;

    const tableElement = document.getElementById('result-table');
    tableElement.innerHTML = resStr + note;

    return tableElement
}

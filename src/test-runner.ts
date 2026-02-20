/**
 * Test runner entry point
 * Main orchestration for test execution in separate tabs
 * Migrated from after.js
 */

import { initIndexedDB } from './services/indexeddb/database';
import { saveTestResult } from './services/indexeddb/testResults';
import { calculateDataIngestionRate } from './services/calculations/dataIngestionRate';
import {
  G_RESULT,
  gGetTestGroup,
  gTestStarted,
  gSetLibInfo,
  gTestLibLoaded,
  gTestDataGenerated,
  gTestInitialDataAppended,
  gTestFirstFrameRendered,
  gTestFinished,
  gGetResultRecord,
  gSetTotalDatapointsProcessed,
} from './test-execution/testGroups';
import { G_TEST_GROUP_NAME } from './constants/testNames';
import { RESERVED_RESULT_SET_LOCAL } from './types/database';
import type { TestFunctionReturn } from './types/testConfig';

/**
 * Wait for next animation frame
 */
function nextFrameRender(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Sleep for specified milliseconds
 */
function sleep(delay: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Display system information
 */
function displaySystemInfo(): void {
  const systemInfo = document.getElementById('system-info');
  if (!systemInfo) return;

  const info = [
    `User Agent: ${navigator.userAgent}`,
    `Platform: ${navigator.platform}`,
    `Cores: ${navigator.hardwareConcurrency || 'Unknown'}`,
    `Memory: ${(navigator as any).deviceMemory || 'Unknown'} GB`,
    `Screen: ${screen.width}x${screen.height}`,
  ];

  systemInfo.innerHTML = '<h3>System Information</h3>' + info.map((i) => `<div>${i}</div>`).join('');
}

/**
 * Main test execution function
 */
(async function main() {
  try {
    // Initialize IndexedDB and display system info
    await initIndexedDB();
    displaySystemInfo();

    // Get test group ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const testGroupIdStr = urlParams.get('test_group_id');
    if (!testGroupIdStr) {
      throw new Error('Missing test_group_id in query string');
    }

    const testGroupId = parseInt(testGroupIdStr, 10);
    const testGroup = gGetTestGroup(testGroupId);

    if (!testGroup) {
      throw new Error(`Invalid test_group_id: ${testGroupId}`);
    }

    const testGroupName = testGroup.name;
    const tests = testGroup.tests;

    console.log(`Running test group: ${testGroupName} (${tests.length} tests)`);

    // Get library test functions from global scope
    const w = window as any;

    // Run each test in the group
    for (let i = 0; i < tests.length; i++) {
      const testConfig = tests[i];
      gTestStarted(testConfig, i);

      // Get library info
      const libName = w.eLibName ? w.eLibName() : 'Unknown';
      const libVersion = w.eLibVersion ? w.eLibVersion() : 'Unknown';
      gSetLibInfo(i, libName, libVersion);

      const { testDuration, series, points, increment, charts } = testConfig;

      // Select appropriate test function based on test group name
      let perfTest: TestFunctionReturn | undefined;

      try {
        if (testGroupName === G_TEST_GROUP_NAME.LINE_PERFORMANCE_TEST) {
          perfTest = w.eLinePerformanceTest?.(series, points);
        } else if (testGroupName === G_TEST_GROUP_NAME.SCATTER_PERFORMANCE_TEST) {
          perfTest = w.eScatterPerformanceTest?.(series, points);
        } else if (testGroupName === G_TEST_GROUP_NAME.XY_LINE_PERFORMANCE_TEST) {
          perfTest = w.eXYLinePerformanceTest?.(series, points);
        } else if (testGroupName === G_TEST_GROUP_NAME.POINT_LINE_PERFORMANCE_TEST) {
          perfTest = w.ePointLinePerformanceTest?.(series, points);
        } else if (testGroupName === G_TEST_GROUP_NAME.COLUMN_PERFORMANCE_TEST) {
          perfTest = w.eColumnPerformanceTest?.(series, points);
        } else if (testGroupName === G_TEST_GROUP_NAME.CANDLESTICK_PERFORMANCE_TEST) {
          perfTest = w.eCandlestickPerformanceTest?.(series, points);
        } else if (testGroupName === G_TEST_GROUP_NAME.FIFO_ECG_PERFORMANCE_TEST) {
          perfTest = w.eFifoEcgPerformanceTest?.(series, points, increment);
        } else if (testGroupName === G_TEST_GROUP_NAME.MOUNTAIN_PERFORMANCE_TEST) {
          perfTest = w.eMountainPerformanceTest?.(series, points);
        } else if (testGroupName === G_TEST_GROUP_NAME.SERIES_COMPRESSION_PERFORMANCE_TEST) {
          perfTest = w.eSeriesCompressionPerformanceTest?.(series, points, increment);
        } else if (testGroupName === G_TEST_GROUP_NAME.MULTI_CHART_PERFORMANCE_TEST) {
          perfTest = w.eMultiChartPerformanceTest?.(series, points, increment, charts);
        } else if (testGroupName === G_TEST_GROUP_NAME.HEATMAP_PERFORMANCE_TEST) {
          if (!w.eHeatmapPerformanceTest) {
            gTestFinished(i, 0, 0, [], true, 'UNSUPPORTED');
            continue;
          }
          perfTest = w.eHeatmapPerformanceTest(series, points);
        } else if (testGroupName === G_TEST_GROUP_NAME.POINTCLOUD_3D_PERFORMANCE_TEST) {
          if (!w.e3dPointCloudPerformanceTest) {
            gTestFinished(i, 0, 0, [], true, 'UNSUPPORTED');
            continue;
          }
          perfTest = w.e3dPointCloudPerformanceTest(series, points);
        } else if (testGroupName === G_TEST_GROUP_NAME.SURFACE_3D_PERFORMANCE_TEST) {
          if (!w.e3dSurfacePerformanceTest) {
            gTestFinished(i, 0, 0, [], true, 'UNSUPPORTED');
            continue;
          }
          perfTest = w.e3dSurfacePerformanceTest(series, points);
        } else {
          throw new Error(`Unknown test type: ${testGroupName}`);
        }

        if (!perfTest) {
          gTestFinished(i, 0, 0, [], true, 'UNSUPPORTED');
          continue;
        }
      } catch (e) {
        console.error('Error selecting test:', e);
        gTestFinished(i, 0, 0, [], true, 'ERROR_APPEND_DATA');
        continue;
      }

      // Create chart
      const result = await perfTest.createChart();
      if (result === false) {
        gTestFinished(i, 0, 0, [], true, 'SKIPPED');
        break;
      }
      gTestLibLoaded(i);

      // Generate data
      perfTest.generateData();
      gTestDataGenerated(i);

      // Append data
      try {
        perfTest.appendData();
      } catch (error) {
        console.error('Error during appendData:', error);
        perfTest.deleteChart();
        gTestFinished(i, 0, 0, [], true, 'ERROR_APPEND_DATA');
        // Mark remaining tests as skipped
        for (let j = i + 1; j < tests.length; j++) {
          gTestStarted(tests[j], j);
          gSetLibInfo(j, libName, libVersion);
          gTestFinished(j, 0, 0, [], true, 'SKIPPED');
        }
        break;
      }

      gTestInitialDataAppended(i);

      // Wait for frames to render
      await nextFrameRender();
      await nextFrameRender();
      await nextFrameRender();
      gTestFirstFrameRendered(i);

      // Check if setup exceeded test duration
      const totalSetupTime = performance.now() - gGetResultRecord(i).timestampTestStart;
      if (totalSetupTime > testDuration) {
        console.error(`Setup time ${totalSetupTime}ms exceeded duration ${testDuration}ms`);
        perfTest.deleteChart();
        gTestFinished(i, 0, 0, [], true, 'HANGING');
        // Mark remaining tests as skipped
        for (let j = i + 1; j < tests.length; j++) {
          gTestStarted(tests[j], j);
          gSetLibInfo(j, libName, libVersion);
          gTestFinished(j, 0, 0, [], true, 'SKIPPED');
        }
        break;
      }

      // Run test loop
      let frame = 0;
      let totalDatapointsProcessed = 0;
      const frameTimings: number[] = [];
      const MIN_FRAME_TIME = 1;

      const testStartTime = performance.now();
      while (performance.now() - testStartTime < testDuration) {
        const frameBefore = performance.now();

        try {
          const datapointCount = perfTest.updateChart(frame);
          if (datapointCount !== undefined && datapointCount !== null) {
            totalDatapointsProcessed += datapointCount;
          }
          frame++;

          await nextFrameRender();

          const frameAfter = performance.now();
          const frameTime = Math.max(frameAfter - frameBefore, MIN_FRAME_TIME);
          frameTimings.push(frameTime);
        } catch (error) {
          console.error('Error during updateChart:', error);
          break;
        }
      }

      // Get memory
      const memory = (window.performance as any).memory?.usedJSHeapSize / 1048576 || 0;

      // Set total datapoints processed
      if (totalDatapointsProcessed > 0) {
        gSetTotalDatapointsProcessed(i, totalDatapointsProcessed);
      }

      // Finish test
      gTestFinished(i, frame, memory, frameTimings);

      // Clean up
      perfTest.deleteChart();

      console.log(`Test ${i + 1}/${tests.length} complete: ${frame} frames, ${memory.toFixed(2)} MB`);
    }

    // Get library info from first result
    const libName = G_RESULT[0]?.configLibName || 'Unknown';
    const libVersion = G_RESULT[0]?.configLibVersion || 'Unknown';
    const chartLibrary = `${libName} ${libVersion}`;

    // Calculate data ingestion rates (keep frameTimings for now, will be stripped for persistence)
    const resultsForPersistence = G_RESULT.map((item) => {
      const dataIngestionRate = calculateDataIngestionRate(item, testGroupName);
      return {
        ...item,
        dataIngestionRate: dataIngestionRate || 0,
      };
    });
    const testResult = {
      id: `${RESERVED_RESULT_SET_LOCAL}_${chartLibrary}_${testGroupName}`,
      chartLibrary,
      testCase: testGroupName,
      results: resultsForPersistence,
      resultSetId: RESERVED_RESULT_SET_LOCAL,
      timestamp: Date.now(),
    };

    await saveTestResult(testResult);

    console.log('All tests complete! Results saved to IndexedDB.');

    // Display results table
    displayResultsTable(resultsForPersistence, testGroupName);
  } catch (error) {
    console.error('Fatal error:', error);
    document.body.innerHTML += `<div style="color: red; padding: 20px;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
  }
})();

/**
 * Display results in a simple table
 */
function displayResultsTable(results: any[], testName: string): void {
  const container = document.getElementById('result-table');
  if (!container) return;

  let html = `<h3>Results: ${testName}</h3><table border="1" cellpadding="5"><tr>`;
  html += '<th>Config</th><th>Avg FPS</th><th>Memory (MB)</th><th>Frames</th><th>Status</th></tr>';

  results.forEach((r) => {
    const config = `${r.config.series}x${r.config.points}`;
    const status = r.isErrored ? (r.errorReason || 'ERROR') : 'OK';
    html += `<tr>
      <td>${config}</td>
      <td>${r.averageFPS.toFixed(2)}</td>
      <td>${r.memory.toFixed(0)}</td>
      <td>${r.numberOfFrames}</td>
      <td>${status}</td>
    </tr>`;
  });

  html += '</table>';
  container.innerHTML = html;

  // Add class for Playwright test detection
  container.classList.add('results-table-ready');
}

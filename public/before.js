// Fast pseudorandom seeded number generator using XorShift32 algorithm
// This is significantly faster than Math.random() and provides better distribution than LCG
let fastRandomSeed = 1;
const FAST_RANDOM_MULTIPLIER = 1 / 4294967296; // Pre-calculated constant for 0-1 range conversion (1/2^32)
function fastRandom() {
    // XorShift32 algorithm - very fast with good statistical properties
    fastRandomSeed ^= fastRandomSeed << 13;
    fastRandomSeed ^= fastRandomSeed >>> 17;
    fastRandomSeed ^= fastRandomSeed << 5;
    fastRandomSeed = fastRandomSeed >>> 0; // Ensure 32-bit unsigned integer
    return fastRandomSeed * FAST_RANDOM_MULTIPLIER; // Convert to 0-1 range using pre-calculated multiplier
}

// Configuration
const G_TEST_GROUP_NAME = {
    LINE_PERFORMANCE_TEST: 'N line series M points',
    SCATTER_PERFORMANCE_TEST: 'Brownian Motion Scatter Series',
    XY_LINE_PERFORMANCE_TEST: 'Line series which is unsorted in x',
    POINT_LINE_PERFORMANCE_TEST: 'Point series, sorted, updating y-values',
    COLUMN_PERFORMANCE_TEST: 'Column chart with data ascending in X',
    CANDLESTICK_PERFORMANCE_TEST: 'Candlestick series test',
    FIFO_ECG_PERFORMANCE_TEST: 'FIFO / ECG Chart Performance Test',
    MOUNTAIN_PERFORMANCE_TEST: 'Mountain Chart Performance Test',
    SERIES_COMPRESSION_PERFORMANCE_TEST: 'Series Compression Test',
    MULTI_CHART_PERFORMANCE_TEST: 'Multi Chart Performance Test',
    HEATMAP_PERFORMANCE_TEST: 'Uniform Heatmap Performance Test',
    POINTCLOUD_3D_PERFORMANCE_TEST: '3D Point Cloud Performance Test',
    SURFACE_3D_PERFORMANCE_TEST: '3D Surface Performance Test',
};

const testDuration = 5000; // 5 seconds

// If you want to run one test type set "testTypeToRun: G_TEST_TYPE.MOUNTAIN_PERFORMANCE_TEST"
const G_TEST_GROUPS = {
    1: {
        name: G_TEST_GROUP_NAME.LINE_PERFORMANCE_TEST,
        tests: [
            {
                series: 100,
                points: 100,
                testDuration,
            },
            {
                series: 200,
                points: 200,
                testDuration,
            },
            {
                series: 500,
                points: 500,
                testDuration,
            },
            {
                series: 1000,
                points: 1000,
                testDuration,
            },
            {
                series: 2000,
                points: 2000,
                testDuration,
            },
            {
                series: 4000,
                points: 4000,
                testDuration,
            },
            {
                series: 8000,
                points: 8000,
                testDuration,
            },
        ],
    },
    2: {
        name: G_TEST_GROUP_NAME.SCATTER_PERFORMANCE_TEST,
        tests: [
            {
                series: 1,
                points: 1000,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                testDuration,
            },
            {
                series: 1,
                points: 50000,
                testDuration,
            },
            {
                series: 1,
                points: 100000,
                testDuration,
            },
            {
                series: 1,
                points: 200000,
                testDuration,
            },
            {
                series: 1,
                points: 500000,
                testDuration,
            },
            {
                series: 1,
                points: 1000000,
                testDuration,
            },
            {
                series: 1,
                points: 5000000,
                testDuration,
            },
            {
                series: 1,
                points: 10000000,
                testDuration,
            },
        ],
    },
    3: {
        name: G_TEST_GROUP_NAME.XY_LINE_PERFORMANCE_TEST,
        tests: [
            {
                series: 1,
                points: 1000,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                testDuration,
            },
            {
                series: 1,
                points: 50000,
                testDuration,
            },
            {
                series: 1,
                points: 100000,
                testDuration,
            },
            {
                series: 1,
                points: 200000,
                testDuration,
            },
            {
                series: 1,
                points: 500000,
                testDuration,
            },
            {
                series: 1,
                points: 1000000,
                testDuration,
            },
            {
                series: 1,
                points: 5000000,
                testDuration,
            },
            {
                series: 1,
                points: 10000000,
                testDuration,
            },
        ],
    },
    4: {
        name: G_TEST_GROUP_NAME.POINT_LINE_PERFORMANCE_TEST,
        tests: [
            {
                series: 1,
                points: 1000,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                testDuration,
            },
            {
                series: 1,
                points: 50000,
                testDuration,
            },
            {
                series: 1,
                points: 100000,
                testDuration,
            },
            {
                series: 1,
                points: 200000,
                testDuration,
            },
            {
                series: 1,
                points: 500000,
                testDuration,
            },
            {
                series: 1,
                points: 1000000,
                testDuration,
            },
            {
                series: 1,
                points: 5000000,
                testDuration,
            },
            {
                series: 1,
                points: 10000000,
                testDuration,
            },
        ],
    },
    5: {
        name: G_TEST_GROUP_NAME.COLUMN_PERFORMANCE_TEST,
        tests: [
            {
                series: 1,
                points: 1000,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                testDuration,
            },
            {
                series: 1,
                points: 50000,
                testDuration,
            },
            {
                series: 1,
                points: 100000,
                testDuration,
            },
            {
                series: 1,
                points: 200000,
                testDuration,
            },
            {
                series: 1,
                points: 500000,
                testDuration,
            },
            {
                series: 1,
                points: 1000000,
                testDuration,
            },
            {
                series: 1,
                points: 5000000,
                testDuration,
            },
            {
                series: 1,
                points: 10000000,
                testDuration,
            },
        ],
    },
    6: {
        name: G_TEST_GROUP_NAME.CANDLESTICK_PERFORMANCE_TEST,
        tests: [
            {
                series: 1,
                points: 1000,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                testDuration,
            },
            {
                series: 1,
                points: 50000,
                testDuration,
            },
            {
                series: 1,
                points: 100000,
                testDuration,
            },
            {
                series: 1,
                points: 200000,
                testDuration,
            },
            {
                series: 1,
                points: 500000,
                testDuration,
            },
            {
                series: 1,
                points: 1000000,
                testDuration,
            },
            {
                series: 1,
                points: 5000000,
                testDuration,
            },
            {
                series: 1,
                points: 10000000,
                testDuration,
            },
        ],
    },
    7: {
        name: G_TEST_GROUP_NAME.FIFO_ECG_PERFORMANCE_TEST,
        tests: [
            {
                series: 5,
                points: 100,
                increment: 100,
                testDuration,
            },
            {
                series: 5,
                points: 10000,
                increment: 1000,
                testDuration,
            },
            {
                series: 5,
                points: 100000,
                increment: 10000,
                testDuration,
            },
            {
                series: 5,
                points: 1000000,
                increment: 100000,
                testDuration,
            },
            {
                series: 5,
                points: 5000000,
                increment: 250000,
                testDuration,
            },
            {
                series: 5,
                points: 10000000,
                increment: 250000,
                testDuration,
            },
        ],
    },
    8: {
        name: G_TEST_GROUP_NAME.MOUNTAIN_PERFORMANCE_TEST,
        tests: [
            {
                series: 1,
                points: 1000,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                testDuration,
            },
            {
                series: 1,
                points: 50000,
                testDuration,
            },
            {
                series: 1,
                points: 100000,
                testDuration,
            },
            {
                series: 1,
                points: 200000,
                testDuration,
            },
            {
                series: 1,
                points: 500000,
                testDuration,
            },
            {
                series: 1,
                points: 1000000,
                testDuration,
            },
            {
                series: 1,
                points: 5000000,
                testDuration,
            },
            {
                series: 1,
                points: 10000000,
                testDuration,
            },
        ],
    },
    9: {
        name: G_TEST_GROUP_NAME.SERIES_COMPRESSION_PERFORMANCE_TEST,
        tests: [
            {
                series: 1,
                points: 1000,
                increment: 100,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                increment: 1000,
                testDuration,
            },
            {
                series: 1,
                points: 100000,
                increment: 10000,
                testDuration,
            },
            {
                series: 1,
                points: 1000000,
                increment: 100000,
                testDuration,
            },
            {
                series: 1,
                points: 10000000,
                increment: 1000000,
                testDuration,
            },
        ],
    },
    10: {
        name: G_TEST_GROUP_NAME.MULTI_CHART_PERFORMANCE_TEST,
        tests: [
            {
                series: 1,
                points: 10000,
                increment: 1000,
                charts: 1,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                increment: 1000,
                charts: 2,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                increment: 1000,
                charts: 4,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                increment: 1000,
                charts: 8,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                increment: 1000,
                charts: 16,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                increment: 1000,
                charts: 32,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                increment: 1000,
                charts: 64,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                increment: 1000,
                charts: 128,
                testDuration,
            },
        ],
    },
    11: {
        name: G_TEST_GROUP_NAME.HEATMAP_PERFORMANCE_TEST,
        tests: [
            {
                series: 1,
                points: 100,
                testDuration,
            },
            {
                series: 1,
                points: 200,
                testDuration,
            },
            {
                series: 1,
                points: 500,
                testDuration,
            },
            {
                series: 1,
                points: 1000,
                testDuration,
            },
            {
                series: 1,
                points: 2000,
                testDuration,
            },
            {
                series: 1,
                points: 4000,
                testDuration,
            },
            {
                series: 1,
                points: 8000,
                testDuration,
            },
            {
                series: 1,
                points: 16000,
                testDuration,
            },
        ],
    },
    12: {
        name: G_TEST_GROUP_NAME.POINTCLOUD_3D_PERFORMANCE_TEST,
        tests: [
            {
                series: 1,
                points: 100,
                testDuration,
            },
            {
                series: 1,
                points: 1000,
                testDuration,
            },
            {
                series: 1,
                points: 10000,
                testDuration,
            },
            {
                series: 1,
                points: 100000,
                testDuration,
            },
            {
                series: 1,
                points: 1000000,
                testDuration,
            },
            {
                series: 1,
                points: 2000000,
                testDuration,
            },
            {
                series: 1,
                points: 4000000,
                testDuration,
            },
        ],
    },
    13: {
        name: G_TEST_GROUP_NAME.SURFACE_3D_PERFORMANCE_TEST,
        tests: [
            {
                series: 1,
                points: 100,
                testDuration,
            },
            {
                series: 1,
                points: 200,
                testDuration,
            },
            {
                series: 1,
                points: 500,
                testDuration,
            },
            {
                series: 1,
                points: 1000,
                testDuration,
            },
            {
                series: 1,
                points: 2000,
                testDuration,
            },
            {
                series: 1,
                points: 4000,
                testDuration,
            },
            {
                series: 1,
                points: 8000,
                testDuration,
            },
        ],
    },
};

const resultRecord = {
    config: undefined,
    timestampTestStart: undefined,
    timestampLibLoaded: undefined,
    timestampFirstFrameWithoutDataRendered: undefined,
    timestampDataGenerated: undefined,
    timestampInitialDataAppended: undefined,
    timestampTestFinish: undefined,
    //
    heapSizeTestStart: undefined,
    heapSizeTestFinish: undefined,
    //
    benchmarkTimeLibLoad: undefined,
    benchmarkTimeFirstFrame: undefined,
    dataGenerationTime: undefined,
    benchmarkTimeInitialDataAppend: undefined,
    updateFramesTime: undefined,
    numberOfFrames: undefined,
    benchmarkFPS: undefined,
    averageFPS: undefined,
    minFPS: undefined,
    maxFPS: undefined,
    frameTimings: undefined,
    isErrored: false,
    errorReason: null,
};
const G_RESULT = [];

function gGetTestGroup(testGroupId) {
    return G_TEST_GROUPS[testGroupId];
}
// Methods to update RESULT
function gGetResultRecord(index) {
    if (!G_RESULT[index]) {
        G_RESULT.push({ ...resultRecord });
    }
    return G_RESULT[index];
}
function gSetLibInfo(index, libName, libVersion) {
    const result = gGetResultRecord(index);
    result.configLibName = libName;
    result.configLibVersion = libVersion;
}
// STEPS
function gTestStarted(testConfig, index) {
    const result = gGetResultRecord(index);
    result.config = testConfig;
    result.timestampTestStart = performance.now();
    return result.timestampTestStart;
}
function gTestLibLoaded(index) {
    const result = gGetResultRecord(index);
    result.timestampLibLoaded = performance.now();
    result.benchmarkTimeLibLoad = result.timestampLibLoaded - result.timestampTestStart;
    return result.timestampLibLoaded;
}
function gTestFirstFrameRendered(index) {
    const result = gGetResultRecord(index);
    result.timestampFirstFrameWithDataRendered = performance.now();
    result.benchmarkTimeFirstFrame = result.timestampFirstFrameWithDataRendered - result.timestampTestStart;
    return result.timestampFirstFrameWithDataRendered;
}
function gTestDataGenerated(index) {
    const result = gGetResultRecord(index);
    result.timestampDataGenerated = performance.now();
    result.dataGenerationTime = result.timestampDataGenerated - result.timestampFirstFrameWithoutDataRendered;
    return result.timestampDataGenerated;
}
function gTestInitialDataAppended(index) {
    const result = gGetResultRecord(index);
    result.timestampInitialDataAppended = performance.now();
    result.benchmarkTimeInitialDataAppend = result.timestampInitialDataAppended - result.timestampDataGenerated;
    return result.timestampInitialDataAppended;
}
function gTestFinished(index, frames, memory, frameTimings, isErrored = false, errorReason = null) {
    const result = gGetResultRecord(index);
    result.numberOfFrames = frames;
    result.timestampTestFinish = performance.now();
    result.updateFramesTime = result.timestampTestFinish - result.timestampInitialDataAppended;
    result.frameTimings = frameTimings;
    result.isErrored = isErrored;
    result.errorReason = errorReason;
    
    // Calculate average FPS using actual test time (not expected testDuration)
    result.averageFPS = (1000 * frames) / result.updateFramesTime;
    result.benchmarkFPS = result.averageFPS; // Keep for backwards compatibility
    
    // Calculate min/max FPS from individual frame timings
    if (frameTimings && frameTimings.length > 0) {
        const MAX_REALISTIC_FPS = 240; // Cap at realistic monitor refresh rate
        const fpsValues = frameTimings.map(timing => {
            const fps = 1000 / timing;
            // Cap FPS at realistic maximum to avoid skewing statistics with cached/empty frames
            return Math.min(fps, MAX_REALISTIC_FPS);
        });
        
        result.minFPS = Math.min(...fpsValues);
        result.maxFPS = Math.max(...fpsValues);
    } else {
        // Fallback if no frame timings available
        result.minFPS = result.averageFPS;
        result.maxFPS = result.averageFPS;
    }
    
    result.memory = memory;
}

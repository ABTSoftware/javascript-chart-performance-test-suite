/**
 * Benchmark score calculation for comparing chart library performance
 */

import type { TestResultRecord } from '../../types/testResults';

/**
 * Parameter combination for benchmark scoring
 */
interface ParamCombo {
  points: number;
  series: number;
  charts: number;
}

/**
 * Test results grouped by test type
 */
interface TestResults {
  [key: string]: TestResultRecord[] | undefined;
}

/**
 * Calculate weighted benchmark score for a library's test results
 *
 * The benchmark score combines multiple metrics (FPS, initialization time, frames, memory)
 * with exponential weighting based on test complexity. This ensures that performance on
 * complex tests (e.g., 16M points) counts far more than simple tests (e.g., 10K points).
 *
 * @param testResults - Test results grouped by test type
 * @param allParamCombos - Expected parameter combinations (optional, will be extracted if not provided)
 * @returns Benchmark score (0-100 scale)
 */
export function calculateBenchmarkScore(
  testResults: TestResults,
  allParamCombos?: ParamCombo[]
): number {
  // Extract parameter combinations from results if not provided
  let expectedParams = allParamCombos;
  if (!expectedParams || expectedParams.length === 0) {
    const paramSet = new Set<string>();

    Object.values(testResults).forEach((results) => {
      if (results && Array.isArray(results)) {
        results.forEach((result) => {
          if (result.config) {
            const params: ParamCombo = {
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

  // ─── First pass: collect all metric values for normalization ───
  const metrics = {
    fps: [] as number[],
    frames: [] as number[],
    memory: [] as number[],
    init: [] as number[],
  };

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

  // ─── Calculate min/max for normalization ───
  // Power transformation (^1.5) amplifies performance differences exponentially
  // 42 FPS vs 4.77 FPS: 272 vs 10.4 = 26x difference (captures order of magnitude!)
  const maxPowerFps = metrics.fps.length > 0 ? Math.pow(Math.max(...metrics.fps), 1.5) : 1;
  const maxPowerFrames = metrics.frames.length > 0 ? Math.pow(Math.max(...metrics.frames), 1.5) : 1;
  const minMemory = metrics.memory.length > 0 ? Math.min(...metrics.memory) : 0;
  const maxMemory = metrics.memory.length > 0 ? Math.max(...metrics.memory) : 1;
  const minInit = metrics.init.length > 0 ? Math.min(...metrics.init) : 0;
  const maxInit = metrics.init.length > 0 ? Math.max(...metrics.init) : 1;

  // ─── Second pass: calculate normalized composite scores ───
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
          // Use power transformation (^1.5) for FPS and frames to amplify differences
          const fpsNorm =
            maxPowerFps > 0 && matchingResult.averageFPS
              ? Math.pow(matchingResult.averageFPS, 1.5) / maxPowerFps
              : 0;

          const framesNorm =
            maxPowerFrames > 0 && matchingResult.numberOfFrames
              ? Math.pow(matchingResult.numberOfFrames, 1.5) / maxPowerFrames
              : 0;

          const memoryNorm =
            maxMemory > minMemory && matchingResult.memory
              ? 1 - (matchingResult.memory - minMemory) / (maxMemory - minMemory)
              : 1;

          const initNorm =
            maxInit > minInit && matchingResult.benchmarkTimeFirstFrame
              ? 1 - (matchingResult.benchmarkTimeFirstFrame - minInit) / (maxInit - minInit)
              : 1;

          // Weighted composite score (scale to 0-100)
          compositeScore =
            (fpsNorm * 0.65 + // 65% weight on FPS (primary performance metric)
              initNorm * 0.2 + // 20% weight on init time
              framesNorm * 0.1 + // 10% weight on total frames
              memoryNorm * 0.05) * // 5% weight on memory efficiency
            100;
        }
      }
    });

    // ─── Calculate complexity-based weight ───
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

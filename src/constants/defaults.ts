/**
 * Default configuration values
 */

/** Default test duration in milliseconds */
export const DEFAULT_TEST_DURATION = 5000;

/** Minimum realistic frame time in milliseconds (1ms) */
export const MIN_FRAME_TIME = 1;

/** Maximum FPS cap for display */
export const MAX_FPS_CAP = 240;

/** Milliseconds to wait for test hanging detection */
export const HANGING_TIMEOUT = 60000;

/** Default metric to display */
export const DEFAULT_METRIC = 'fps' as const;

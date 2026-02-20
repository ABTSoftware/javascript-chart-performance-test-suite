/**
 * Metric selector component - radio buttons for selecting which metric to display
 */

import React from 'react';
import { useFilters } from '../../contexts/FiltersContext';
import type { Metric } from '../../types/charts';

const METRICS: Array<{ value: Metric; label: string }> = [
  { value: 'fps', label: 'Average FPS' },
  { value: 'memory', label: 'Memory (MB)' },
  { value: 'initialization', label: 'Init Time (ms)' },
  { value: 'frames', label: 'Total Frames' },
  { value: 'ingestion', label: 'Ingestion Rate (pts/sec)' },
];

export function MetricSelector() {
  const { selectedMetric, setMetric } = useFilters();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMetric(e.target.value as Metric);
  };

  return (
    <div id="filter-panel-metrics">
      <div id="metricSelector">
        <strong>Metric:</strong>
        {METRICS.map((metric) => (
          <label key={metric.value}>
            <input
              type="radio"
              name="metric"
              value={metric.value}
              checked={selectedMetric === metric.value}
              onChange={handleChange}
            />
            {' '}
            {metric.label}
          </label>
        ))}
      </div>
    </div>
  );
}

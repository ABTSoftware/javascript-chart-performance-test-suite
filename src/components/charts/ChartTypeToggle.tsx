/**
 * Chart type toggle - switch between line and column charts
 */

import React from 'react';

export type ChartType = 'line' | 'column';

interface ChartTypeToggleProps {
  chartType: ChartType;
  onChange: (type: ChartType) => void;
}

export function ChartTypeToggle({ chartType, onChange }: ChartTypeToggleProps) {
  return (
    <div id="chartTypeToggle">
      <strong>Chart Type:</strong>
      <label>
        <input
          type="radio"
          name="chartType"
          value="line"
          checked={chartType === 'line'}
          onChange={(e) => onChange(e.target.value as ChartType)}
        />
        {' '}
        Line
      </label>
      <label>
        <input
          type="radio"
          name="chartType"
          value="column"
          checked={chartType === 'column'}
          onChange={(e) => onChange(e.target.value as ChartType)}
        />
        {' '}
        Grouped Column
      </label>
    </div>
  );
}

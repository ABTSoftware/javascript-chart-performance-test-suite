/**
 * Result set filter checkboxes
 */

import React from 'react';
import { useFilters } from '../../contexts/FiltersContext';
import { useResultSets } from '../../hooks/useResultSets';
import { RESERVED_RESULT_SET_LOCAL } from '../../types/database';

interface ResultSetFiltersProps {
  /** Available result set IDs from data */
  availableResultSetIds: Set<string>;
}

export function ResultSetFilters({ availableResultSetIds }: ResultSetFiltersProps) {
  const { isResultSetChecked, toggleResultSet } = useFilters();
  const { resultSets, remove } = useResultSets();

  const handleDelete = async (rsId: string, label: string) => {
    if (!confirm(`Delete result set "${label}"? This will remove all associated test results.`)) {
      return;
    }

    try {
      await remove(rsId);
      alert('Result set deleted successfully.');
    } catch (error) {
      alert(`Failed to delete result set: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Create label map
  const labelMap = new Map<string, string>();
  resultSets.forEach((rs) => {
    labelMap.set(rs.id, rs.label);
  });

  // Convert Set to Array for mapping
  const resultSetIds = Array.from(availableResultSetIds);

  return (
    <div id="resultSetFilters">
      <strong>Result Sets:</strong>
      {resultSetIds.map((rsId) => {
        const label = labelMap.get(rsId) || rsId;
        const isLocal = rsId === RESERVED_RESULT_SET_LOCAL;

        return (
          <label key={rsId}>
            <input
              type="checkbox"
              checked={isResultSetChecked(rsId)}
              onChange={() => toggleResultSet(rsId)}
              data-rs-id={rsId}
            />
            {' '}
            {label}
            {!isLocal && (
              <button
                className="delete-rs-btn"
                title={`Delete "${label}"`}
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(rsId, label);
                }}
              >
                ×
              </button>
            )}
          </label>
        );
      })}
    </div>
  );
}

/**
 * Library filter checkboxes
 */

import React from 'react';
import { useFilters } from '../../contexts/FiltersContext';
import { CHARTS } from '../../utils/chartLibraries';

interface LibraryFiltersProps {
  /** Available library names from data */
  availableLibraries: Set<string>;
}

export function LibraryFilters({ availableLibraries }: LibraryFiltersProps) {
  const { isLibraryChecked, toggleLibrary } = useFilters();

  // Order libraries by CHARTS definition, then add any extras
  const orderedLibs = CHARTS.map((c) => c.name).filter((name) => availableLibraries.has(name));

  // Add any libraries from data that aren't in CHARTS
  availableLibraries.forEach((lib) => {
    if (!orderedLibs.includes(lib)) {
      orderedLibs.push(lib);
    }
  });

  return (
    <div id="libraryFilters">
      <strong>Libraries:</strong>
      {orderedLibs.map((lib) => (
        <label key={lib}>
          <input
            type="checkbox"
            checked={isLibraryChecked(lib)}
            onChange={() => toggleLibrary(lib)}
            data-lib={lib}
          />
          {' '}
          {lib}
        </label>
      ))}
    </div>
  );
}

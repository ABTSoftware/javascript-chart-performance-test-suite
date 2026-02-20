/**
 * Import and Export buttons component
 */

import React, { useRef } from 'react';
import { useFilters } from '../../contexts/FiltersContext';
import { useResultSets } from '../../hooks/useResultSets';
import { useTestResults } from '../../hooks/useTestResults';
import { detectAndParseImportFile, importResults } from '../../services/import-export/importer';
import { exportResults } from '../../services/import-export/exporter';
import { generateResultSetId, resultSetExists } from '../../services/indexeddb/resultSets';

export function ImportExportButtons() {
  const { checkedResultSets } = useFilters();
  const { resultSets, refetch: refetchResultSets } = useResultSets();
  const { refetch: refetchTestResults } = useTestResults();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();

      // Auto-detect format and parse
      const { records, source } = detectAndParseImportFile(text);

      if (records.length === 0) {
        alert('No test results found in the imported file.');
        event.target.value = '';
        return;
      }

      // Prompt for label
      const label = prompt(
        `Found ${records.length} test result(s). Enter a label for this result set:`,
        file.name.replace(/\.json$/i, '')
      );

      if (!label) {
        event.target.value = '';
        return;
      }

      const resultSetId = generateResultSetId(label);

      // Check for ID collision
      const exists = await resultSetExists(resultSetId);
      if (exists) {
        if (!confirm(`A result set with ID "${resultSetId}" already exists. Overwrite it?`)) {
          event.target.value = '';
          return;
        }
      }

      await importResults(records, resultSetId, label, source);
      alert(`Imported ${records.length} result(s) as "${label}".`);

      // Refresh data
      await refetchResultSets();
      await refetchTestResults();

      event.target.value = '';
    } catch (error) {
      console.error('Import error:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      event.target.value = '';
    }
  };

  const handleExport = async () => {
    if (checkedResultSets.size === 0) {
      alert('No result sets selected to export.');
      return;
    }

    try {
      // Export all if all result sets are checked
      const allResultSetIds = new Set(resultSets.map((rs) => rs.id));
      if (checkedResultSets.size === allResultSetIds.size) {
        await exportResults('__all__');
      } else {
        // Export each checked result set
        for (const rsId of checkedResultSets) {
          await exportResults(rsId);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div id="toolbar">
      <button id="importBtn" onClick={handleImportClick}>
        Import Results...
      </button>
      <input
        ref={fileInputRef}
        type="file"
        id="importFileInput"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
      <button id="exportSelectedBtn" onClick={handleExport}>
        Export Selected
      </button>
    </div>
  );
}

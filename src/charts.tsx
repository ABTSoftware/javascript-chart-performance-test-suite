/**
 * Main entry point for Charts page
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { IndexedDBProvider } from './contexts/IndexedDBContext';
import { FiltersProvider } from './contexts/FiltersContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ChartsPage } from './pages/ChartsPage';

// Import global styles
import '../public/style.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <IndexedDBProvider>
        <FiltersProvider>
          <ChartsPage />
        </FiltersProvider>
      </IndexedDBProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

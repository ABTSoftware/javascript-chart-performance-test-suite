/**
 * Main entry point for Index page
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { IndexedDBProvider } from './contexts/IndexedDBContext';
import { FiltersProvider } from './contexts/FiltersContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { IndexPage } from './pages/IndexPage';

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
          <IndexPage />
        </FiltersProvider>
      </IndexedDBProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

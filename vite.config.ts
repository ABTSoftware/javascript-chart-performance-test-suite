import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-storage-state',
      configureServer(server) {
        server.middlewares.use('/tests/storage-state.json', (req, res) => {
          const filePath = path.resolve(__dirname, 'tests', 'storage-state.json');
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/json');
            res.end(fs.readFileSync(filePath, 'utf-8'));
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'storage-state.json not found' }));
          }
        });
      },
    },
  ],
  root: path.resolve(__dirname),
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // React pages (at project root)
        index: path.resolve(__dirname, 'index-react.html'),
        charts: path.resolve(__dirname, 'charts-react.html'),

        // Test execution pages (TypeScript test runner)
        'scichart-ts': path.resolve(__dirname, 'public/scichart/scichart-ts.html'),

        // Original test pages (keep for comparison)
        scichart: path.resolve(__dirname, 'public/scichart/scichart.html'),
        echarts: path.resolve(__dirname, 'public/echarts/echarts.html'),
        highcharts: path.resolve(__dirname, 'public/highcharts/highcharts.html'),
        chartjs: path.resolve(__dirname, 'public/chartjs/chartjs.html'),
        plotly: path.resolve(__dirname, 'public/plotly/plotly.html'),
        uplot: path.resolve(__dirname, 'public/uPlot/uPlot.html'),
        chartgpu: path.resolve(__dirname, 'public/chartgpu/chartgpu.html'),
        lcjs: path.resolve(__dirname, 'public/lcjsv4/lcjs.html'),
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
    },
  },
});

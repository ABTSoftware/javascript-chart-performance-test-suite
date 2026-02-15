import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: 'public',
    server: {
        host: '0.0.0.0',
    },
    plugins: [
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
});

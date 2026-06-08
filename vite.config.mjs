import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: [
            { find: '@/api', replacement: resolve(__dirname, 'src/shared/api') },
            { find: '@/types', replacement: resolve(__dirname, 'src/shared/types') },
            { find: '@/components', replacement: resolve(__dirname, 'src/shared/components') },
            { find: '@', replacement: resolve(__dirname, 'src') }
        ]
    },
    server: {
        port: 5173,
        middlewareMode: false,
        proxy: {
            '/api': {
                target: 'https://api.muapi.ai',
                changeOrigin: true,
                secure: false
            }
        }
    }
});

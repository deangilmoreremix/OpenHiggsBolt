import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Dev-only middleware that mocks the Netlify functions the shared API client
 * (`src/shared/api/muapi.ts`) calls. In production, real Netlify functions
 * deployed via `netlify deploy` handle these paths; in dev we forward to the
 * real muapi.ai backend using the user's `VITE_MUAPI_KEY` from `.env`.
 */
function devApiProxyPlugin(mode) {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiKey = env.VITE_MUAPI_KEY;

  return {
    name: 'dev-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/.netlify/functions/')) return next();

        if (!apiKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({
            error: 'VITE_MUAPI_KEY not set. Add it to .env (see .env.example).',
          }));
          return;
        }

        // /.netlify/functions/muapi/video, /image, /audio, /text, /video/:id, /models/:cat
        const muapiMatch = url.match(/^\/\.netlify\/functions\/muapi\/(video|image|audio|text|models)\/?([^/]*)\/?$/);
        if (muapiMatch) {
          const [, category, maybeId] = muapiMatch;
          let target;
          if (category === 'models') {
            target = `https://api.muapi.ai/api/v1/models/${maybeId}`;
          } else if (category === 'video' && maybeId) {
            target = `https://api.muapi.ai/api/v1/predictions/${maybeId}/result`;
          } else {
            target = `https://api.muapi.ai/api/v1/${category}`;
          }
          return proxyRequest(req, res, target, apiKey);
        }

        // /.netlify/functions/enhance-prompt  (used by src/shared/api/openai.ts)
        if (url.startsWith('/.netlify/functions/enhance-prompt')) {
          return proxyRequest(
            req,
            res,
            'https://api.openai.com/v1/chat/completions',
            apiKey,
            { openai: true }
          );
        }

        return next();
      });
    },
  };
}

async function proxyRequest(req, res, target, apiKey, opts = {}) {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  await new Promise((r) => req.on('end', r));
  const body = chunks.length ? Buffer.concat(chunks).toString('utf8') : undefined;

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  };
  if (opts.openai) {
    delete headers['x-api-key'];
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const upstream = await fetch(target, {
      method: req.method || 'POST',
      headers,
      body: body && req.method !== 'GET' ? body : undefined,
    });
    const text = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.end(text);
  } catch (err) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: `Dev proxy error: ${err instanceof Error ? err.message : String(err)}` }));
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), devApiProxyPlugin(mode)],
  resolve: {
    alias: [
      { find: '@/api', replacement: resolve(__dirname, 'src/shared/api') },
      { find: '@/types', replacement: resolve(__dirname, 'src/shared/types') },
      { find: '@/components', replacement: resolve(__dirname, 'src/shared/components') },
      { find: '@/stores', replacement: resolve(__dirname, 'src/stores') },
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
}));

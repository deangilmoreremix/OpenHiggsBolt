import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Dev-only middleware that mocks the Netlify functions the shared API clients
 * call. In production, real Netlify functions deployed via `netlify deploy`
 * handle these paths; in dev we forward to the real backends using the user's
 * `.env` keys.
 *
 * Supported prefixes:
 *   /.netlify/functions/muapi/*  -> https://api.muapi.ai/api/v1/*
 *   /.netlify/functions/openai/* -> https://api.openai.com/v1/*
 *   /.netlify/functions/enhance-prompt -> OpenAI chat completions (legacy)
 */
function devApiProxyPlugin(mode) {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const muapiKey = env.VITE_MUAPI_KEY;
  const openaiKey = env.VITE_OPENAI_API_KEY || env.VITE_MUAPI_KEY;

  return {
    name: 'dev-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        if (!url.startsWith('/.netlify/functions/')) return next();

        const body = await readBody(req);

        // Generic muapi.ai proxy
        if (url.startsWith('/.netlify/functions/muapi/')) {
          if (!muapiKey) {
            return jsonError(res, 500, 'VITE_MUAPI_KEY not set. Add it to .env (see .env.example).');
          }
          const rest = url.replace('/.netlify/functions/muapi/', '');
          const target = `https://api.muapi.ai/api/v1/${rest}`;
          return proxyRequest(req, res, target, { 'x-api-key': muapiKey }, body);
        }

        // Generic OpenAI proxy
        if (url.startsWith('/.netlify/functions/openai/')) {
          if (!openaiKey) {
            return jsonError(res, 500, 'VITE_OPENAI_API_KEY (or VITE_MUAPI_KEY) not set.');
          }
          const rest = url.replace('/.netlify/functions/openai/', '');
          const target = `https://api.openai.com/v1/${rest}`;
          return proxyRequest(req, res, target, { Authorization: `Bearer ${openaiKey}` }, body);
        }

        // Legacy enhance-prompt endpoint
        if (url.startsWith('/.netlify/functions/enhance-prompt')) {
          if (!openaiKey) {
            return jsonError(res, 500, 'VITE_OPENAI_API_KEY (or VITE_MUAPI_KEY) not set.');
          }
          const { prompt, mode } = body ? JSON.parse(body) : {};
          const messages = buildLegacyMessages(prompt, mode);
          const upstreamBody = JSON.stringify({ model: 'gpt-4o-mini', messages });
          return proxyRequest(
            req,
            res,
            'https://api.openai.com/v1/chat/completions',
            { Authorization: `Bearer ${openaiKey}` },
            upstreamBody
          );
        }

        return next();
      });
    },
  };
}

async function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      resolve(chunks.length ? Buffer.concat(chunks).toString('utf8') : undefined);
    });
  });
}

function buildLegacyMessages(prompt, mode) {
  const system =
    mode === 'script'
      ? 'You are a professional video script writer. Write a concise, engaging script based on the user description.'
      : mode === 'campaign'
      ? 'You are a marketing copywriter. Write short, punchy campaign copy based on the user description.'
      : 'You are a helpful prompt engineer. Improve the prompt to be more detailed and effective for AI generation.';
  return [
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ];
}

async function proxyRequest(req, res, target, headers, body) {
  try {
    const upstream = await fetch(target, {
      method: req.method || 'GET',
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        ...headers,
      },
      body: body && req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
    });
    const text = await upstream.text();
    res.statusCode = upstream.status;
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.end(text);
  } catch (err) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: `Dev proxy error: ${err instanceof Error ? err.message : String(err)}` }));
  }
}

function jsonError(res, status, message) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: message }));
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

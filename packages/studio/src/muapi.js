import { getModelById, getVideoModelById, getI2IModelById, getI2VModelById, getV2VModelById, getRecastModelById, getLipSyncModelById, getAudioModelById } from './models.js';

// Local mirrors for workflow/agent thumbnails. Maps upstream MuAPI thumbnail
// URLs -> local files in /public/thumbnails/workflows. Plain ESM import so it
// bundles cleanly in the browser (Turbopack/Webpack/Vite) with no fs/JSON-assert.
import thumbnailLocalMap from './thumbnail-map.js';

// A URL is already "final" (no further rewriting needed) when it is a
// same-origin path — either a local file under /public (e.g.
// /thumbnails/workflows/foo.jpg) or an already-proxied URL
// (/api/thumbnail?url=...). This makes the function idempotent so it can be
// applied safely on data that the /api/workflow and /api/agents proxies have
// ALREADY rewritten (previously a second pass turned local paths into broken
// "/api/thumbnail?url=/thumbnails/..." URLs, collapsing every card to the
// placeholder).
function isFinalUrl(url) {
  return typeof url === 'string' && url.startsWith('/');
}

export function rewriteThumbnail(url) {
  if (!url || typeof url !== 'string') return url;
  if (isFinalUrl(url)) return url;
  if (thumbnailLocalMap[url]) return thumbnailLocalMap[url];
  // Same-origin proxy: server fetches the upstream image (with Referer) and
  // streams it back so it always loads regardless of CDN hotlink protection.
  return `/api/thumbnail?url=${encodeURIComponent(url)}`;
}

export function rewriteThumbnails(list) {
  if (!Array.isArray(list)) return list;
  return list.map((item) => {
    if (!item || typeof item !== 'object') return item;
    let next = item;
    if (item.thumbnail) {
      next = { ...next, thumbnail: rewriteThumbnail(item.thumbnail) };
    }
    // Agents expose their artwork as `icon_url` rather than `thumbnail`.
    if (item.icon_url) {
      next = { ...next, icon_url: rewriteThumbnail(item.icon_url) };
    }
    return next;
  });
}

/**
 * Normalize a MuAPI prediction response into a consistent shape.
 * MuAPI wraps payloads in `data` and sometimes nests `video`/`output`,
 * so we tolerate both the flat and the wrapped response shapes.
 */
function normalizeMuapiResult(raw) {
  const body = (raw && raw.data) ? raw.data : raw;
  const video = (raw && raw.video) ? raw.video : (body && body.video);
  const requestId = (raw && (raw.request_id || raw.id)) || (body && (body.request_id || body.id));
  const status = String((raw && raw.status) || (body && body.status) || '').toLowerCase();
  const outputs = (raw && raw.outputs) || (body && body.outputs) || (video ? [video.url] : null);
  const url =
    (Array.isArray(outputs) && outputs[0]) ||
    (raw && (raw.url || raw.video_url)) ||
    (body && (body.url || body.video_url)) ||
    (video && video.url) ||
    (raw && raw.output && raw.output.url) ||
    (body && body.output && body.output.url) || null;
  const error = (raw && raw.error) || (body && body.error) || null;
  return { requestId, status, outputs, url, error, body };
}


// In an http(s) browser we route through the host app's proxy (Next.js routes
// under /api/* re-issue the call server-side) so api.muapi.ai CORS is bypassed.
// SSR (no window) and Electron's file:// renderer call the upstream directly.
const BASE_URL = (typeof window !== 'undefined' && window.location?.protocol?.startsWith('http'))
    ? '/api'
    : 'https://api.muapi.ai';
const PROXY_WF_BASE = '/api/workflow';

// Combine a caller-supplied AbortSignal (e.g. from a component's unmount
// cleanup) with a hard client-side timeout so a hung upstream connection
// cannot block forever. Degrades gracefully where AbortSignal.timeout /
// AbortSignal.any are unavailable (older runtimes / jsdom).
function toSignal(signal, timeoutMs = 120000) {
  const hasTimeout = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function';
  const timeout = hasTimeout ? AbortSignal.timeout(timeoutMs) : null;
  if (signal && timeout && typeof AbortSignal.any === 'function') {
    return AbortSignal.any([signal, timeout]);
  }
  return signal || timeout;
}

function notifyAuthRequired(status, detail) {
    if (typeof window === 'undefined') return;
    if (status !== 401 && status !== 403) return;
    window.dispatchEvent(new CustomEvent('muapi:auth-required', { detail: { status, message: detail } }));
}

async function pollForResult(requestId, key, maxAttempts = 900, interval = 2000, signal = null) {
    const pollUrl = `${BASE_URL}/api/v1/predictions/${requestId}/result`;
    const effSignal = toSignal(signal);
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (key) headers['x-api-key'] = key;
            const response = await fetch(pollUrl, {
                headers,
                signal: effSignal,
            });
            if (!response.ok) {
                const errText = await response.text();
                if (response.status >= 500) continue;
                notifyAuthRequired(response.status, errText);
                throw new Error(`Poll Failed: ${response.status} - ${errText.slice(0, 100)}`);
            }
            const data = await response.json();
            const norm = normalizeMuapiResult(data);
            const status = norm.status;
            if (status === 'completed' || status === 'succeeded' || status === 'success') return norm.body;
            if (status === 'failed' || status === 'error') throw new Error(`Generation failed: ${norm.error || 'Unknown error'}`);
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('Generation timed out after polling.');
}

async function submitAndPoll(endpoint, payload, key, onRequestId, maxAttempts = 60, signal = null) {
    const url = `${BASE_URL}/api/v1/${endpoint}`;
    const headers = { 'Content-Type': 'application/json' };
    if (key) headers['x-api-key'] = key;
    const effSignal = toSignal(signal);
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: effSignal,
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
    }
    const submitData = await response.json();
    const requestId = submitData.request_id || submitData.id;
    if (!requestId) return submitData;
    if (onRequestId) onRequestId(requestId);
    const result = await pollForResult(requestId, key, maxAttempts);
    const outputUrl = normalizeMuapiResult(result).url;
    return { ...result, url: outputUrl };
}


export async function generateImage(apiKey, params) {
    const modelInfo = getModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = { prompt: params.prompt };
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    if (params.image_url) {
        payload.image_url = params.image_url;
        payload.strength = params.strength || 0.6;
    } else if (params.images_list) {
        payload.images_list = params.images_list;
    }
    // NOTE: when neither is provided we intentionally send NO image reference
    // at all (previously an explicit `image_url: null`, which some endpoints
    // reject). The model defaults to a text-to-image generation.
    if (params.seed && params.seed !== -1) payload.seed = params.seed;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 60, params.signal);
}

export async function generateI2I(apiKey, params) {
    const modelInfo = getI2IModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = {};
    if (params.prompt) payload.prompt = params.prompt;
    const imageField = modelInfo?.imageField || 'image_url';
    const imagesList = params.images_list?.length > 0 ? params.images_list : (params.image_url ? [params.image_url] : null);
    if (imagesList) {
        if (imageField === 'images_list') payload.images_list = imagesList;
        else payload[imageField] = imagesList[0];
    }
    if (modelInfo?.swapField && params.swap_url) {
        payload[modelInfo.swapField] = params.swap_url;
    }
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    if (modelInfo?.inputs?.name) {
        payload.name = params.name || modelInfo.inputs.name.default;
    }
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 60, params.signal);
}

export async function generateVideo(apiKey, params) {
    const modelInfo = getVideoModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = {};
    if (params.prompt) payload.prompt = params.prompt;
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    if (params.mode) payload.mode = params.mode;
    if (params.image_url) payload.image_url = params.image_url;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, params.signal);
}

export async function generateI2V(apiKey, params) {
    const modelInfo = getI2VModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = {};
    if (params.prompt) payload.prompt = params.prompt;
    const imageField = modelInfo?.imageField || 'image_url';
    if (params.images_list && params.images_list.length > 0) {
        if (imageField === 'images_list') payload.images_list = params.images_list;
        else payload[imageField] = params.images_list[0];
    } else if (params.image_url) {
        if (imageField === 'images_list') payload.images_list = [params.image_url];
        else payload[imageField] = params.image_url;
    }
    const lastImageField = modelInfo?.lastImageField;
    if (lastImageField && params.last_image) {
        if (lastImageField === 'images_list') {
            if (!payload.images_list) payload.images_list = [];
            if (payload.images_list.indexOf(params.last_image) === -1) {
                payload.images_list.push(params.last_image);
            }
        } else {
            payload[lastImageField] = params.last_image;
        }
    }
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    if (params.mode) payload.mode = params.mode;
    if (modelInfo?.inputs?.name) {
        payload.name = params.name || modelInfo.inputs.name.default;
    }
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, params.signal);
}

export async function generateMarketingStudioAd(apiKey, params) {
    const endpoint = params.resolution === '1080p' ? 'sd-2-vip-omni-reference-1080p' : 'seedance-2-vip-omni-reference';
    const payload = {
        prompt: params.prompt,
        aspect_ratio: params.aspect_ratio || '16:9',
        duration: params.duration || 5,
        images_list: params.images_list || [],
        video_files: params.video_files || []
    };
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, params.signal);
}

export async function processV2V(apiKey, params) {
    const modelInfo = getV2VModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const videoField = modelInfo?.videoField || 'video_url';
    const payload = { [videoField]: params.video_url };
    if (modelInfo?.imageField && params.image_url) {
        payload[modelInfo.imageField] = params.image_url;
    }
    if (modelInfo?.hasPrompt && params.prompt) {
        payload.prompt = params.prompt;
    }
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, params.signal);
}

export async function processRecast(apiKey, params) {
    const modelInfo = getRecastModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const videoField = modelInfo?.videoField || 'video_url';
    const payload = { [videoField]: params.video_url };
    if (modelInfo?.imageField && params.image_url) {
        payload[modelInfo.imageField] = params.image_url;
    }
    if (modelInfo?.hasPrompt && params.prompt) {
        payload.prompt = params.prompt;
    }
    if (params.aspect_ratio) {
        payload.aspect_ratio = params.aspect_ratio;
    }
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, params.signal);
}

export async function processLipSync(apiKey, params) {
    const modelInfo = getLipSyncModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = {};
    if (params.audio_url) payload.audio_url = params.audio_url;
    if (params.image_url) payload.image_url = params.image_url;
    if (params.video_url) payload.video_url = params.video_url;
    if (modelInfo?.hasPrompt) payload.prompt = params.prompt || '';
    if (params.resolution) payload.resolution = params.resolution;
    if (params.seed !== undefined && params.seed !== -1) payload.seed = params.seed;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, params.signal);
}

export async function generateAudio(apiKey, params) {
    const modelId = params._modelId || params.model;
    const modelInfo = getAudioModelById(modelId);
    const endpoint = modelInfo?.endpoint || modelId;
    const payload = {};
    const skipKeys = ['_modelId', 'onRequestId'];
    for (const key in params) {
        if (!skipKeys.includes(key) && params[key] !== undefined && params[key] !== null) {
            payload[key] = params[key];
        }
    }
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, params.signal);
}

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/webm',
  'application/zip', 'application/pdf', 'application/json',
]);
const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per MuAPI docs

function parseApiErrorBody(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed.detail || parsed.error || parsed.message || text.slice(0, 200);
  } catch {
    return text.slice(0, 200);
  }
}

export function uploadFile(apiKey, file, onProgress) {
  return new Promise((resolve, reject) => {
    // --- Client-side pre-flight validation (MuAPI file upload spec) ---
    if (!file) {
      return reject(new Error('No file provided'));
    }
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
      return reject(new Error(`Invalid file type: ${file.type}. Allowed: ${[...ALLOWED_UPLOAD_MIME_TYPES].join(', ')}`));
    }
    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      return reject(new Error(`File too large: ${sizeMB} MB. Maximum size: 10 MB`));
    }

    const url = `${BASE_URL}/api/v1/upload_file`;
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (apiKey) xhr.setRequestHeader('x-api-key', apiKey);

        if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    onProgress(percentComplete);
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status < 200 || xhr.status >= 300) {
              let detail = xhr.statusText;
              try {
                detail = parseApiErrorBody(xhr.responseText);
              } catch {
                // fallback to statusText
              }
              notifyAuthRequired(xhr.status, detail);
              return reject(new Error(`Image upload failed: ${xhr.status} - ${detail}`));
            }

            try {
              const data = JSON.parse(xhr.responseText);
              const fileUrl = data.url || data.file_url || data.data?.url;
              if (!fileUrl) {
                return reject(new Error('No URL returned from file upload'));
              }
              resolve(fileUrl);
            } catch {
              reject(new Error('Invalid upload response'));
            }
        };

        xhr.onerror = () => reject(new Error('Network error during file upload'));
        xhr.send(formData);
    });
}

export async function getUserBalance(apiKey) {
    const response = await fetch(`${BASE_URL}/api/v1/account/balance`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`Failed to fetch balance: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function getTemplateWorkflows(apiKey) {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    const response = await fetch(`${BASE_URL}/workflow/get-template-workflows`, {
        headers
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch template workflows: ${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return rewriteThumbnails(Array.isArray(data) ? data : (data.workflows || data.items || []));
};

export async function getUserWorkflows(apiKey) {
    const response = await fetch(`${BASE_URL}/workflow/get-workflow-defs`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch user workflows: ${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return rewriteThumbnails(Array.isArray(data) ? data : (data.workflows || data.items || []));
};

export async function getPublishedWorkflows(apiKey) {
    const response = await fetch(`${BASE_URL}/workflow/get-published-workflows`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch published workflows: ${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return rewriteThumbnails(Array.isArray(data) ? data : (data.workflows || data.items || []));
};

// Agents — uses direct URL → https://api.muapi.ai/agents/...
export async function getTemplateAgents(apiKey) {
    const response = await fetch(`${BASE_URL}/agents/templates/agents`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch template agents: ${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return rewriteThumbnails(Array.isArray(data) ? data : (data.agents || data.items || []));
};

export async function getUserAgents(apiKey) {
    const response = await fetch(`${BASE_URL}/agents/user/agents`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch user agents: ${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return rewriteThumbnails(Array.isArray(data) ? data : (data.agents || data.items || []));
};

export async function getPublishedAgents(apiKey) {
    // MuAPI: GET /agents/featured/agents
    const response = await fetch(`${BASE_URL}/agents/featured/agents`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch featured agents: ${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return rewriteThumbnails(Array.isArray(data) ? data : (data.agents || data.items || []));
};

// GET /agents/user/conversations — returns the user's chat history across all agents
export async function getUserConversations(apiKey) {
    const response = await fetch(`${BASE_URL}/agents/user/conversations`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch conversations: ${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
};

export async function createWorkflow(apiKey, payload) {
    const response = await fetch(`${BASE_URL}/workflow/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to create workflow: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function updateWorkflowName(apiKey, workflowId, name) {
    const response = await fetch(`${BASE_URL}/workflow/update-name/${workflowId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify({ name })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to rename workflow: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function deleteWorkflow(apiKey, workflowId) {
    const response = await fetch(`${BASE_URL}/workflow/delete-workflow-def/${workflowId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to delete workflow: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getWorkflowInputs(apiKey, workflowId) {
    const response = await fetch(`${BASE_URL}/workflow/${workflowId}/api-inputs`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch workflow inputs: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

// Single source of truth for the workflow execute request body. Keeping this in
// one place ensures the copy-paste snippets (buildWorkflowApiSnippets) stay in
// sync with what executeWorkflow actually sends over the wire.
export function buildWorkflowBody(inputs = {}, webhookUrl) {
    return { inputs, ...(webhookUrl ? { webhook_url: webhookUrl } : {}) };
}

export async function executeWorkflow(apiKey, workflowId, inputs, webhookUrl) {
    const response = await fetch(`${BASE_URL}/workflow/${workflowId}/api-execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify(buildWorkflowBody(inputs, webhookUrl))
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to execute workflow: ${response.status} - ${errText.slice(0, 100)}`);
    }
    const submitData = await response.json();
    const runId = submitData.run_id || submitData.id;
    if (!runId) return submitData;
    
    // Poll for results
    return await pollWorkflowResult(runId, apiKey);
};

// Pure helper: builds copy-paste "how to use" snippets for a workflow's playground.
// No network calls. Returns strings the UI can render + copy.
export function buildWorkflowApiSnippets(workflowId, inputs = {}, options = {}) {
    const id = workflowId || '<workflow_id>';
    const webhookUrl = options.webhookUrl || '';
    const publicBase = 'https://api.muapi.ai';
    const endpoint = `${publicBase}/workflow/${id}/api-execute`;
    const pollUrl = `${publicBase}/workflow/run/{run_id}/api-outputs`;

    const bodyObj = buildWorkflowBody(inputs, webhookUrl);
    const json = JSON.stringify(bodyObj, null, 2);

    // Escape single quotes so the body survives bash single-quoted strings
    // (JSON.stringify does not escape "'"; a prompt like "don't" would break it).
    const curlBody = JSON.stringify(bodyObj).replace(/'/g, `'\\''`);

    const curl = [
        `curl -X POST '${endpoint}' \\`,
        `  -H 'Content-Type: application/json' \\`,
        `  -H 'x-api-key: YOUR_API_KEY' \\`,
        `  -d '${curlBody}'`,
    ].join('\n');

    const node = [
        `const res = await fetch('${endpoint}', {`,
        `  method: 'POST',`,
        `  headers: {`,
        `    'Content-Type': 'application/json',`,
        `    'x-api-key': process.env.MUAPI_API_KEY,`,
        `  },`,
        `  body: JSON.stringify(${JSON.stringify(bodyObj, null, 2).replace(/\n/g, '\n  ')}),`,
        `});`,
        `const { run_id } = await res.json();`,
        `// Then poll: GET ${pollUrl}`,
    ].join('\n');

    const python = [
        `import requests`,
        ``,
        `resp = requests.post(`,
        `    "${endpoint}",`,
        `    headers={"Content-Type": "application/json", "x-api-key": "YOUR_API_KEY"},`,
        `    json=${json.replace(/\n/g, '\n    ')},`,
        `)`,
        `run_id = resp.json()["run_id"]`,
        `# Then poll: GET ${pollUrl}`,
    ].join('\n');

    const cliGet = `muapi workflow get ${id} --output-json`;
    const cliRun = `muapi workflow run-interactive ${id}`;
    const cliDiscover = `muapi workflow discover --output-json`;

    return {
        endpoint,
        pollUrl,
        method: 'POST',
        json,
        curl,
        node,
        python,
        cliGet,
        cliRun,
        cliDiscover,
    };
}

async function pollWorkflowResult(runId, apiKey, maxAttempts = 900, interval = 2000) {
    const pollUrl = `${BASE_URL}/workflow/run/${runId}/api-outputs`;
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, {
                headers
            });
            if (!response.ok) {
                if (response.status >= 500) continue;
                throw new Error(`Poll Failed: ${response.status}`);
            }
            const data = await response.json();
            const status = data.status?.toLowerCase();
            if (status === 'completed' || status === 'succeeded' || status === 'success') return data;
            if (status === 'failed' || status === 'error') throw new Error(`Workflow failed: ${data.error || 'Unknown error'}`);
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('Workflow timed out after polling.');
};

export async function getAllNodeSchemas(apiKey, workflowId) {
    const response = await fetch(`${BASE_URL}/workflow/${workflowId}/node-schemas`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch node schemas: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getWorkflowData(apiKey, workflowId) {
    const response = await fetch(`${BASE_URL}/workflow/get-workflow-def/${workflowId}`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch workflow data: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getNodeSchemas(apiKey, workflowId) {
    const response = await fetch(`${BASE_URL}/workflow/${workflowId}/api-node-schemas`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch node schemas: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function runSingleNode(apiKey, workflowId, nodeId, payload) {
    const response = await fetch(`${BASE_URL}/workflow/${workflowId}/node/${nodeId}/run`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to run single node: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function deleteNodeRun(apiKey, nodeRunId) {
    const response = await fetch(`${BASE_URL}/workflow/node-run/${nodeRunId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to delete node run: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function getNodeStatus(apiKey, runId) {
    const response = await fetch(`${BASE_URL}/workflow/run/${runId}/status`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to get node status: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

/**
 * Handle proxy requests centralizing communication logic with MuAPI.
 * This is used by the server-side entry points.
 */
export async function handleProxyRequest(prefix, path, method, headers, body, apiKey) {
    const url = `${BASE_URL}/${prefix}/${path}`;
    
    const finalHeaders = new Headers(headers);
    finalHeaders.delete('host');
    finalHeaders.delete('connection');
    finalHeaders.delete('content-length'); // Let fetch recalculate this for safety

    if (apiKey) {
        finalHeaders.set('x-api-key', apiKey);
    }

    try {
        const response = await fetch(url, {
            method,
            headers: finalHeaders,
            body: (method !== 'GET' && method !== 'HEAD') ? body : undefined,
            redirect: 'follow',
        });

        const contentType = response.headers.get('Content-Type') || 'application/json';
        const buffer = await response.arrayBuffer();
        
        return {
            status: response.status,
            contentType,
            data: buffer
        };
    } catch (error) {
        console.error(`MuAPI Proxy error for ${url}:`, error);
        throw error;
    }
}

/**
 * A centralized handler for Next.js API routes or middleware.
 */
export async function handleServerSideProxy(prefix, request, params, apiKey) {
    try {
        const slug = await params;
        const pathSegments = slug.path || [];
        const path = pathSegments.join('/');
        
        const method = request.method;
        let body = null;
        if (method !== 'GET' && method !== 'HEAD') {
            body = await request.arrayBuffer();
        }

        const { search } = new URL(request.url);
        const pathWithSearch = search ? `${path}${search}` : path;

        return await handleProxyRequest(
            prefix, 
            pathWithSearch, 
            method, 
            request.headers, 
            body, 
            apiKey
        );
    } catch (error) {
        console.error(`Server proxy failed:`, error);
        throw error;
    }
}

export async function calculateDynamicCost(apiKey, taskName, payload) {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    const response = await fetch(`${BASE_URL}/api/v1/app/calculate_dynamic_cost`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ task_name: taskName, payload })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to calculate dynamic cost: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function registerAppInterest(apiKey, appName) {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    const response = await fetch(`${BASE_URL}/app/interest`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ app_name: appName })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to register interest: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function getAppInterests(apiKey) {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    const response = await fetch(`${BASE_URL}/app/interests`, { headers });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch interests: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function runClipping(apiKey, params) {
    const payload = {
        video_url: params.video_url,
        num_highlights: params.num_highlights || 3,
        aspect_ratio: params.aspect_ratio || "9:16",
        return_coordinates_only: !!params.return_coordinates_only
    };
    return submitAndPoll("ai-clipping", payload, apiKey, params.onRequestId, 900, params.signal);
}

export async function runMotionGraphics(apiKey, params) {
    const payload = {
        prompt: params.prompt,
        aspect_ratio: params.aspect_ratio || "16:9",
        duration_seconds: params.duration_seconds || 6,
    };
    return submitAndPoll("motion-graphics", payload, apiKey, params.onRequestId, 900, params.signal);
}

export async function runMotionGraphicsEdit(apiKey, params) {
    const payload = {
        request_id: params.request_id,
        edit_prompt: params.edit_prompt,
        aspect_ratio: params.aspect_ratio || "16:9",
        duration_seconds: params.duration_seconds || 6,
    };
    return submitAndPoll("motion-graphics-edit", payload, apiKey, params.onRequestId, 900, params.signal);
}

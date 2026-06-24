import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL });

export async function createProject(data) {
  const res = await api.post('/api/projects', data);
  return res.data;
}

export async function listProjects() {
  const res = await api.get('/api/projects');
  return res.data;
}

export async function getProject(id) {
  const res = await api.get(`/api/projects/${id}`);
  return res.data;
}

export async function deleteProject(id) {
  await api.delete(`/api/projects/${id}`);
}

function parseSseStream(response, onEvent) {
  return new Promise((resolve, reject) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let eventType = '';

    function read() {
      reader.read().then(({ done, value }) => {
        if (done) {
          resolve();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.replace('event:', '').trim();
          } else if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.replace('data:', '').trim());
              onEvent && onEvent(eventType, data);
            } catch (e) {
              // ignore malformed JSON in stream
            }
            if (eventType === 'done') resolve(data);
            if (eventType === 'error') reject(new Error(data.message || 'Stream error'));
          } else if (line.trim() === '') {
            eventType = '';
          }
        }
        read();
      }).catch(reject);
    }
    read();
  });
}

export function generateFromPremise(payload, onEvent, signal) {
  const url = `${baseURL}/api/storyboard/generate/premise`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  }).then((res) => {
    if (!res.ok) throw new Error('Generation stream failed');
    return parseSseStream(res, onEvent);
  });
}

export function generateFromScript(payload, onEvent, signal) {
  const url = `${baseURL}/api/storyboard/generate/script`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  }).then((res) => {
    if (!res.ok) throw new Error('Generation stream failed');
    return parseSseStream(res, onEvent);
  });
}

export async function getStoryboard(scriptId) {
  const res = await api.get(`/api/storyboard/${scriptId}`);
  return res.data;
}

export async function updateScene(sceneId, data) {
  const res = await api.patch(`/api/scenes/${sceneId}`, data);
  return res.data;
}

export async function regenerateScene(sceneId) {
  const res = await api.post(`/api/scenes/${sceneId}/regenerate`);
  return res.data;
}

export async function regenerateFrame(sceneId) {
  const res = await api.post(`/api/scenes/${sceneId}/regenerate-frame`);
  return res.data;
}

export async function reorderScenes(order) {
  await api.put('/api/scenes/reorder', order);
  return { ok: true };
}

export async function exportJson(scriptId) {
  const res = await api.get(`/api/storyboard/${scriptId}/export/json`, { responseType: 'blob' });
  return res.data;
}

export async function exportPdf(scriptId) {
  const res = await api.get(`/api/storyboard/${scriptId}/export/pdf`, { responseType: 'blob' });
  return res.data;
}

export default api;

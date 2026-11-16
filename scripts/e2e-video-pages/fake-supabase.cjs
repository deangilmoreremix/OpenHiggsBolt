// Minimal fake Supabase REST server for the landing page routes (published page + contact + rpc + inserts).
const http = require('http'); const fs = require('fs');
const state = { pages: {}, contacts: {}, leads: [], events: [] };
const seedFile = process.env.SEED; if (seedFile && fs.existsSync(seedFile)) Object.assign(state, JSON.parse(fs.readFileSync(seedFile, 'utf8')));
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x'); let body = '';
  req.on('data', (c) => (body += c)); req.on('end', () => {
    const send = (status, obj, headers = {}) => { res.writeHead(status, { 'content-type': 'application/json', ...headers }); res.end(JSON.stringify(obj)); };
    const wantObject = (req.headers.accept || '').includes('pgrst.object');
    const eq = (k) => { const v = url.searchParams.get(k); return v && v.startsWith('eq.') ? decodeURIComponent(v.slice(3)) : null; };
    if (url.pathname === '/__state') return send(200, state);
    if (url.pathname === '/rest/v1/landing_pages' && req.method === 'GET') {
      const id = eq('id'); let rows = Object.values(state.pages).filter((p) => (!id || p.id === id) && (eq('published') !== 'true' || p.published));
      if (wantObject) return rows[0] ? send(200, rows[0]) : send(406, { code: 'PGRST116', message: 'no rows', details: '', hint: '' });
      return send(200, rows);
    }
    if (url.pathname === '/rest/v1/landing_page_contacts' && req.method === 'GET') {
      const r = state.contacts[eq('id')]; if (wantObject) return r ? send(200, r) : send(406, { code: 'PGRST116', message: 'no rows' }); return send(200, r ? [r] : []);
    }
    if (url.pathname === '/rest/v1/landing_page_leads' && req.method === 'POST') { state.leads.push(JSON.parse(body)); return send(201, []); }
    if (url.pathname === '/rest/v1/rpc/landing_page_record_event') { state.events.push(JSON.parse(body)); return send(200, null); }
    if (url.pathname === '/rest/v1/rpc/landing_page_stats') return send(200, [{ views: 12, plays: 7, completes: 3, cta_clicks: 2, leads: 1, unique_contacts: 2, likes: 4 }]);
    return send(404, { message: 'not handled ' + url.pathname });
  });
}).listen(54399, '127.0.0.1', () => console.log('fake supabase on 54399'));

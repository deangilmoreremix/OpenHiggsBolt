const { chromium } = require('playwright'); const fs = require('fs');
const BASE = 'http://127.0.0.1:3111'; const results = [];
const check = (n, ok, x = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x && !ok ? '  [' + x + ']' : ''}`); };
const seed = JSON.parse(fs.readFileSync(__dirname + '/seed.json', 'utf8'));
(async () => {
  const b = await chromium.launch({ args: ['--no-proxy-server'] }); const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
  await ctx.addCookies([{ name: '__client_uat', value: '0', url: BASE }, { name: '__clerk_db_jwt', value: 'dev', url: BASE }]);
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => { if (!/ClerkRuntimeError|failed_to_load_clerk_js/.test(String(e))) errs.push(String(e)); });
  await p.route(/clerk\.accounts\.dev|clerk\.go\.smartvid|cdn\.test/, (r) => r.abort());
  let pages = [{ ...seed.pages.StartPage01, id: 'ExistPage01', title: 'Existing page', published: true, view_count: 9 }]; const writes = [];
  const json = (route, obj, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(obj) });
  await p.route('**/api/assets/library**', (r) => { const k = new URL(r.request().url()).searchParams.get('kind'); json(r, { assets: k === 'video' ? [{ id: 'a1', kind: 'video', name: 'Launch video', url: 'https://cdn.test/launch.mp4' }] : [{ id: 'i1', kind: 'image', name: 'Hero shot', url: 'https://cdn.test/hero.png' }] }); });
  await p.route('**/api/landing-pages/*/stats', (r) => json(r, { stats: { views: 12, plays: 7, completes: 3, ctaClicks: 2, leads: 1, uniqueContacts: 2, likes: 4 } }));
  await p.route(/\/api\/landing-pages(\/[A-Za-z0-9_-]+)?$/, async (r) => {
    const req = r.request(); const id = new URL(req.url()).pathname.split('/')[3];
    if (req.method() === 'GET') return id ? json(r, { page: pages.find((x) => x.id === id) }) : json(r, { pages });
    const body = JSON.parse(req.postData() || '{}');
    if (req.method() === 'POST') { const row = { ...seed.pages.StartPage01, id: 'NewPage0001', title: body.title, video_url: body.videoUrl, config: body.config, published: false, view_count: 0 }; writes.push(['create', body]); pages = [row, ...pages]; return json(r, { page: row }, 201); }
    if (req.method() === 'PATCH') { const i = pages.findIndex((x) => x.id === id); pages[i] = { ...pages[i], ...(body.title ? { title: body.title } : {}), ...(body.config ? { config: body.config } : {}), ...('published' in body ? { published: body.published } : {}) }; writes.push(['patch', body]); return json(r, { page: pages[i] }); }
    return json(r, { ok: true });
  });
  let contacts = []; const cwrites = [];
  await p.route(/\/api\/landing-pages\/[A-Za-z0-9_-]+\/contacts\/stats$/, (r) => json(r, { stats: contacts.length ? [{ contactId: contacts[0].id, views: 2, plays: 1, maxProgress: 75, completes: 0, ctaClicks: 1, leads: 0, lastSeen: 'now' }] : [] }));
  await p.route(/\/api\/landing-pages\/[A-Za-z0-9_-]+\/contacts(\?.*)?$/, async (r) => {
    const req = r.request();
    if (req.method() === 'GET') return json(r, { contacts });
    if (req.method() === 'POST') { const body = JSON.parse(req.postData()); cwrites.push(body); const made = body.contacts.map((c, i) => ({ id: `contact${contacts.length + i}abcdef`, fields: c.fields, created_at: 'now' })); contacts = [...made, ...contacts]; return json(r, { contacts: made }, 201); }
    if (req.method() === 'DELETE') { const cid = new URL(req.url()).searchParams.get('contactId'); contacts = contacts.filter((c) => c.id !== cid); return json(r, { ok: true }); }
  });
  const rewriteReqs = []; let connected = false; const syncCalls = [];
  await p.route('**/api/landing-pages/rewrite', async (r) => { const { input } = JSON.parse(r.request().postData()); rewriteReqs.push(input); json(r, { ok: true, items: input.items.map((i) => ({ id: i.id, text: i.text.includes('{{') ? 'No tokens' : i.text + ' (AI)' })) }); });
  await p.route('**/api/landing-pages/sync', async (r) => {
    const m = r.request().method(); const b = r.request().postData() ? JSON.parse(r.request().postData()) : {}; syncCalls.push([m, b]);
    if (m === 'GET') return json(r, { connected, masked: connected ? '••••••••abcd' : '' });
    if (m === 'PUT') { connected = true; return json(r, { connected: true, masked: '••••••••abcd' }); }
    if (m === 'DELETE') { connected = false; return json(r, { connected: false }); }
    if (b.action === 'groups') return json(r, { groups: [{ id: '77', name: 'Video leads' }] });
    return json(r, { pushed: 2, failed: [], rateLimited: false, retryAfter: null, next: null, total: 2 });
  });
  p.on('dialog', (d) => d.accept());
  await p.goto(`${BASE}/harness-e2e`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await p.waitForSelector('text=Video Pages', { timeout: 90000 });
  await p.waitForSelector('text=Existing page', { timeout: 30000 });
  check('the page list shows existing pages with their status and views', (await p.locator('text=Published').count()) >= 1 && (await p.locator('text=9 views').count()) === 1);
  await p.screenshot({ path: require('node:path').join(process.env.E2E_OUT || require('node:os').tmpdir(), 'studio-list.png') });
  await p.click('text=New page'); await p.waitForSelector('text=Launch video', { timeout: 20000 });
  check('the new-page flow lists library videos and the designs', (await p.locator('button[aria-pressed]').count()) >= 34, String(await p.locator('button[aria-pressed]').count()));
  await p.screenshot({ path: require('node:path').join(process.env.E2E_OUT || require('node:os').tmpdir(), 'studio-new.png') });
  await p.click('button:has-text("Launch video")'); await p.waitForSelector('text=Change');
  await p.click('button[aria-pressed]:has-text("VideoSpark")').catch(async () => { await p.locator('button[aria-pressed]').nth(5).click(); });
  await p.click('button:has-text("Create page")'); await p.waitForSelector('input[aria-label="Page title"]', { timeout: 30000 });
  check('creating a page sends the video, title and a sanitized puck config', writes[0]?.[0] === 'create' && writes[0][1].videoUrl === 'https://cdn.test/launch.mp4' && writes[0][1].config?.puck?.content?.length > 3, JSON.stringify(writes[0]).slice(0, 160));
  await p.waitForSelector('iframe', { timeout: 60000 });
  check('the visual editor mounts with a preview frame', true);
  await p.waitForTimeout(2000); await p.screenshot({ path: require('node:path').join(process.env.E2E_OUT || require('node:os').tmpdir(), 'studio-editor.png') });
  const editor = p.locator('.hb-puck'); const bg = await editor.evaluate((e) => getComputedStyle(e).backgroundColor);
  check('the editor chrome uses the app dark theme', bg === 'rgb(10, 10, 10)', bg);
  await p.fill('input[aria-label="Page title"]', 'My launch page');
  const saveBtn = p.locator('button:has-text("Save")'); check('Save is enabled once something changes', await saveBtn.isEnabled());
  await saveBtn.click(); await p.waitForSelector('text=Saved', { timeout: 15000 });
  check('Save sends the title and page data', writes.some((w) => w[0] === 'patch' && w[1].title === 'My launch page' && w[1].config?.puck));
  await p.click('button:has-text("Rewrite with AI")');
  await p.fill('input[placeholder^="What should change"]', 'friendlier, for dentists');
  const beforeJson = JSON.stringify(writes.filter((w) => w[0] === 'patch').at(-1)[1].config.puck);
  await p.click('button:text-is("Rewrite")'); await p.waitForSelector('text=/Apply \\d+ change/', { timeout: 15000 });
  check('the AI request carries only ids, roles and texts', rewriteReqs[0].items.every((i) => Object.keys(i).sort().join() === 'id,role,text') && !JSON.stringify(rewriteReqs[0]).match(/https:|variant|landing-art/), JSON.stringify(rewriteReqs[0]).slice(0, 160));
  check('the instruction is sent', rewriteReqs[0].instruction === 'friendlier, for dentists');
  await p.screenshot({ path: require('node:path').join(process.env.E2E_OUT || require('node:os').tmpdir(), 'studio-rewrite.png') });
  await p.click('button:has-text("Apply")'); await p.waitForSelector('text=/Applied \\d+ change/', { timeout: 10000 }); await p.waitForSelector('iframe', { timeout: 30000 }); await p.waitForTimeout(800);
  await p.click('button:has-text("Save")'); await p.waitForTimeout(1200);
  const afterPuck = writes.filter((w) => w[0] === 'patch').at(-1)[1].config.puck;
  const strip = (d) => JSON.stringify(d, (k, v) => (typeof v === 'string' ? '' : v));
  check('after the rewrite the sections and structure are identical', strip(afterPuck) === strip(JSON.parse(beforeJson)));
  check('the words changed, and a {{token}} was never replaced', JSON.stringify(afterPuck).includes('(AI)') && !JSON.stringify(afterPuck).includes('No tokens'));
  await p.click('button:has-text("Undo last rewrite")'); await p.waitForSelector('text=Restored the text', { timeout: 5000 }); await p.waitForTimeout(500);
  await p.click('button:has-text("Save")'); await p.waitForTimeout(1200);
  check('undo restores the original text', !JSON.stringify(writes.filter((w) => w[0] === 'patch').at(-1)[1].config.puck).includes('(AI)'));
  await p.click('button:has-text("Publish")'); await p.waitForTimeout(1500);
  check('Publish sends published=true (after the sample-content confirm)', writes.some((w) => w[0] === 'patch' && w[1].published === true));
  check('a published page shows its link actions', (await p.locator('text=Copy link').count()) === 1);
  await p.click('button:has-text("Personal links")'); await p.waitForSelector('text=No contacts yet', { timeout: 10000 });
  await p.setInputFiles('input[type=file][accept*=csv]', { name: 'leads.csv', mimeType: 'text/csv', buffer: Buffer.from('First Name,Company,Email,Notes\nMaya,Brightline,maya@x.io,hi\nSam,Acme,sam@x.io,yo\nBad,Co,not-an-email,x\nMaya,Brightline,maya@x.io,dup\n') });
  await p.waitForSelector('text=ready to import', { timeout: 10000 });
  check('the CSV is mapped automatically and bad or duplicate rows are skipped', (await p.locator('text=2 ready to import').count()) === 1 && (await p.locator('text=2 skipped').count()) === 1);
  await p.screenshot({ path: require('node:path').join(process.env.E2E_OUT || require('node:os').tmpdir(), 'studio-contacts-import.png') });
  await p.click('button:has-text("Import 2")'); await p.waitForSelector('text=Maya', { timeout: 10000 });
  check('import sends only the mapped fields', cwrites[0]?.contacts?.length === 2 && JSON.stringify(cwrites[0].contacts[0].fields) === JSON.stringify({ firstname: 'Maya', company: 'Brightline', email: 'maya@x.io' }), JSON.stringify(cwrites[0]).slice(0, 200));
  check('each contact shows a personal link and who watched', (await p.locator('text=Copy link').count()) >= 2 && (await p.locator('text=75% watched').count()) === 1);
  await p.screenshot({ path: require('node:path').join(process.env.E2E_OUT || require('node:os').tmpdir(), 'studio-contacts.png') });
  await p.click('button[aria-label="Remove contact"] >> nth=0'); await p.waitForTimeout(800);
  check('a contact can be removed', (await p.locator('button[aria-label="Remove contact"]').count()) === 1);
  await p.waitForSelector('text=Connect', { timeout: 10000 });
  await p.fill('input[placeholder="MailerLite API token"]', 'ml-token-abcdefghijklmnop'); await p.click('button:has-text("Connect")');
  await p.waitForSelector('text=Connected', { timeout: 10000 }); await p.waitForSelector('option:has-text("Video leads")', { state: 'attached', timeout: 10000 });
  check('connecting MailerLite sends the token once, to our server, and shows only a masked key', syncCalls.filter(([m]) => m === 'PUT').length === 1 && (await p.locator('text=••••••••abcd').count()) >= 1 && !(await p.content()).includes('ml-token-abcdefghijklmnop'));
  await p.selectOption('select[aria-label="MailerLite group"]', '77'); await p.click('button:has-text("Send 1 contact")'); await p.waitForSelector('text=/Sent 2 contact/', { timeout: 10000 });
  check('push sends the page id and group (the contacts never leave the server)', syncCalls.some(([m, b]) => m === 'POST' && b.action === 'push' && b.groupId === '77' && b.pageId === 'NewPage0001' && !('contacts' in b)));
  await p.screenshot({ path: require('node:path').join(process.env.E2E_OUT || require('node:os').tmpdir(), 'studio-sync.png') });
  await p.click('button:has-text("Analytics")'); await p.waitForSelector('text=Play rate', { timeout: 10000 });
  check('analytics shows the numbers', (await p.locator('text=12').count()) >= 1 && (await p.locator('text=58%').count()) === 1);
  await p.screenshot({ path: require('node:path').join(process.env.E2E_OUT || require('node:os').tmpdir(), 'studio-analytics.png') });
  check('no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  await b.close(); console.log(`${results.filter(Boolean).length}/${results.length} checks passed`); process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });

const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:3111'; const results = [];
const check = (n, ok, x = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x && !ok ? '  [' + x + ']' : ''}`); };
const signedOut = (ctx) => ctx.addCookies([{ name: '__client_uat', value: '0', url: BASE }, { name: '__clerk_db_jwt', value: 'dev', url: BASE }]);
const state = async () => (await fetch('http://127.0.0.1:54399/__state')).json();
(async () => {
  const b = await chromium.launch({ args: ['--no-proxy-server'] }); const errs = [];
  for (const [w, h, tag] of [[1672, 941, 'desk'], [390, 844, 'mob']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); await signedOut(ctx); const p = await ctx.newPage();
    p.on('pageerror', (e) => { if (!/ClerkRuntimeError|failed_to_load_clerk_js/.test(String(e))) errs.push(`${tag}: ${e}`); });
    await p.route(/clerk\.accounts\.dev|clerk\.go\.smartvid|cdn\.test/, (r) => r.abort());
    const resp = await p.goto(`${BASE}/p/SparkPage01`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await p.waitForSelector('.pk-page', { timeout: 60000 });
    await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(3000);
    check(`${tag}: public page responds 200`, resp.status() === 200, String(resp.status()));
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`${tag}: no horizontal overflow`, ov <= 0, String(ov));
    check(`${tag}: one h1 and one video`, (await p.locator('h1').count()) === 1 && (await p.locator('video').count()) === 1);
    await p.screenshot({ path: require('node:path').join(process.env.E2E_OUT || require('node:os').tmpdir(), `public-${tag}.png`), fullPage: true });
    if (tag === 'desk') {
      const before = (await state()).events.length;
      check('a view event reached the server', (await (async () => { await p.waitForTimeout(1500); return (await state()).events.some((e) => e.p_kind === 'view' && e.p_page_id === 'SparkPage01'); })()));
      // lead form
      const form = p.locator('form').first();
      await form.locator('input[name="name"], input[type=text]').first().fill('Test Lead').catch(() => {});
      await form.locator('input[type=email]').first().fill('lead@example.com');
      await form.locator('button[type=submit]').first().click();
      await p.waitForTimeout(3000);
      const s = await state();
      check('lead form saved a lead for the published page', s.leads.some((l) => l.page_id === 'SparkPage01' && l.data.email === 'lead@example.com'), JSON.stringify(s.leads).slice(0, 200));
      check('a lead event was recorded', s.events.some((e) => e.p_kind === 'lead'));
    }
    await ctx.close();
  }
  { // draft pages are not public
    const ctx = await b.newContext(); await signedOut(ctx); const p = await ctx.newPage(); await p.route(/clerk\.accounts\.dev/, (r) => r.abort());
    const r = await p.goto(`${BASE}/p/DraftPage01`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    check('an unpublished page is not found', r.status() === 404, String(r.status()));
    const r2 = await p.goto(`${BASE}/p/..%2F..%2Fetc`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    check('a malformed id is not found', r2.status() === 404, String(r2.status()));
    await ctx.close();
  }
  { // personal link
    const ctx = await b.newContext(); await signedOut(ctx); const p = await ctx.newPage(); await p.route(/clerk\.accounts\.dev|clerk\.go\.smartvid|cdn\.test/, (r) => r.abort());
    await p.goto(`${BASE}/p/StartPage01?c=contactMaya1`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await p.waitForSelector('.pk-page'); await p.waitForTimeout(800);
    const txt = await p.locator('.pk-page').innerText();
    check('a personal link greets the contact by name', txt.includes('Maya'));
    check('the contact email is never in the page', !(await p.content()).includes('maya@x.io'));
    await ctx.close();
  }
  check('no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  await b.close();
  console.log(`${results.filter(Boolean).length}/${results.length} checks passed`); process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });

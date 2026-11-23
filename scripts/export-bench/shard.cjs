const { chromium } = require('/home/user/OpenHiggsBolt/node_modules/playwright');
const fs = require('fs');
const [k, n, port, out] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4], process.argv[5]];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto(`http://127.0.0.1:${port}/index3.html`); await p.waitForFunction(() => window.ready, null, { timeout: 90000 });
  const names = (await p.evaluate(() => window.names)).filter((_, i) => i % n === k);
  for (const nm of names) {
    try { const r = await p.evaluate((x) => window.runOne(x, 0.6, 40000), nm); fs.appendFileSync(out, JSON.stringify(r) + '\n'); }
    catch (e) { fs.appendFileSync(out, JSON.stringify({ name: nm, err: e.message.slice(0, 100) }) + '\n'); }
  }
  await b.close();
})();

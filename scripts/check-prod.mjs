import { chromium } from 'playwright-core';
const EXEC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'https://go.smartvid.app/sign-in';
const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
} catch (e) { console.log('goto failed:', e.message); }
await page.waitForTimeout(5000);
const email = page.getByLabel(/email address/i);
console.log('PROD email input count:', await email.count());
const mainText = await page.locator('main').innerText().catch(() => '(no main)');
console.log('--- prod main text (first 400) ---');
console.log((mainText || '').slice(0, 400));
console.log('--- errors ---'); console.log(errors.slice(0,10).join('\n') || '(none)');
await browser.close();

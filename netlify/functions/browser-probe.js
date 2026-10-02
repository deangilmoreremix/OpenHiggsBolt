const { chromium } = require('playwright-core');

let serverlessChromiumEnvironmentReady = false;

async function ensureServerlessChromiumEnvironment() {
  if (serverlessChromiumEnvironmentReady) {
    return;
  }
  try {
    const { setupLambdaEnvironment } = await import('@sparticuz/chromium');
    if (typeof setupLambdaEnvironment === 'function') {
      const { tmpdir } = require('node:os');
      const { join } = require('node:path');
      setupLambdaEnvironment(join(tmpdir(), 'al2023', 'lib'));
    }
  } catch {
    // ignore
  }
  serverlessChromiumEnvironmentReady = true;
}

ensureServerlessChromiumEnvironment();

async function getChromiumExecutablePath() {
  try {
    const { default: Chromium } = await import('@sparticuz/chromium');
    if (process.platform !== 'darwin') {
      return await Chromium.executablePath();
    }
  } catch {
    // ignore
  }
  return undefined;
}

async function getChromiumArgs() {
  try {
    const { default: Chromium } = await import('@sparticuz/chromium');
    const args = Array.isArray(Chromium.args) ? Chromium.args : [];
    const filtered = args.filter((arg) => !arg.startsWith('--disable-features='));
    filtered.push('--disable-features=site-per-process');
    return filtered;
  } catch {
    return [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-translate',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
      '--disable-default-apps',
      '--disable-features=site-per-process',
    ];
  }
}

async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  const result = {
    executableResolved: false,
    executablePath: null,
    browserLaunched: false,
    pageCreated: false,
    dataUrlLoaded: false,
    textRead: null,
    browserClosed: false,
    error: null,
    errorStack: null,
  };

  try {
    const executablePath = await getChromiumExecutablePath();
    result.executableResolved = !!executablePath;
    result.executablePath = executablePath || null;

    const browser = await chromium.launch({
      executablePath,
      args: await getChromiumArgs(),
    });
    result.browserLaunched = true;

    const page = await browser.newPage();
    result.pageCreated = true;

    await page.goto('data:text/html,<h1>test</h1>', {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });
    result.dataUrlLoaded = true;

    result.textRead = await page.title();

    await page.close();
    await browser.close();
    result.browserClosed = true;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, ...result }),
    };
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    result.errorStack = err instanceof Error ? err.stack : null;
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, ...result }),
    };
  }
}

module.exports.handler = handler;

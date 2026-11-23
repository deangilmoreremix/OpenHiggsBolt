// Which paths Clerk's middleware runs on. Matching uses Next's own path-to-regexp, as `config.matcher` does.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'

const { pathToRegexp } = createRequire(import.meta.url)('next/dist/compiled/path-to-regexp')
const source = readFileSync(new URL('../../middleware.js', import.meta.url), 'utf8')
const block = /matcher:\s*\[([\s\S]*?)\n\s*\],/.exec(source)?.[1]
assert.ok(block, 'could not find config.matcher in middleware.js')
const matchers = new Function(`return [${block.replace(/^\s*\/\/.*$/gm, '')}]`)().map((pattern) => pathToRegexp(pattern))
const runsOn = (pathname) => matchers.some((regexp) => regexp.test(pathname))

test('Smartvid Downloader export downloads and protocol URLs (which have file extensions) get Clerk auth context', () => {
  assert.equal(runsOn('/vidbee/exports/6f1c2f9e-0000-0000-0000-000000000000/transcript.srt'), true)
  assert.equal(runsOn('/vidbee/protocol/smartvid/thumbs/abc.jpg'), true)
})

test('the Smartvid Downloader pages and extension-less gated routes already ran the middleware and still do', () => {
  assert.equal(runsOn('/vidbee/'), true)
  assert.equal(runsOn('/vidbee/media'), true)
})

test('public static assets stay off the middleware', () => {
  assert.equal(runsOn('/vidbee/assets/index-abc123.js'), false)
  assert.equal(runsOn('/vidbee/favicon.ico'), false)
  assert.equal(runsOn('/_next/static/chunks/main.js'), false)
})

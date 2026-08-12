import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rateLimit } from '../lib/rateLimit.ts'

test('allows up to max requests', () => {
  const key = 'key-allows'
  for (let i = 0; i < 10; i++) {
    const res = rateLimit(key, { windowMs: 60_000, max: 10 })
    assert.equal(res.allowed, true)
  }
  const blocked = rateLimit(key, { windowMs: 60_000, max: 10 })
  assert.equal(blocked.allowed, false)
  assert.ok(blocked.retryAfterMs > 0)
})

test('blocks the 11th request with retryAfterMs > 0', () => {
  const key = 'key-blocks'
  for (let i = 0; i < 10; i++) {
    assert.equal(rateLimit(key, { windowMs: 60_000, max: 10 }).allowed, true)
  }
  const blocked = rateLimit(key, { windowMs: 60_000, max: 10 })
  assert.equal(blocked.allowed, false)
  assert.ok(blocked.retryAfterMs > 0)
})

test('different keys are independent', () => {
  const a = 'key-a'
  const b = 'key-b'
  for (let i = 0; i < 10; i++) {
    assert.equal(rateLimit(a, { windowMs: 60_000, max: 10 }).allowed, true)
  }
  assert.equal(rateLimit(a, { windowMs: 60_000, max: 10 }).allowed, false)
  assert.equal(rateLimit(b, { windowMs: 60_000, max: 10 }).allowed, true)
})

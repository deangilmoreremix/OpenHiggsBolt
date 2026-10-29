// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { displayDomain, isUrlLike, defaultCtaLabel } from '../displayText'

describe('displayDomain', () => {
  it('strips scheme and path from a tracking URL', () => {
    expect(
      displayDomain('https://www.kreindler.com/practices/x?gad_source=1&utm_campaign=test'),
    ).toBe('kreindler.com')
  })

  it('strips leading www.', () => {
    expect(displayDomain('https://www.example.com/path')).toBe('example.com')
  })

  it('returns empty string for invalid input', () => {
    expect(displayDomain('not-a-url')).toBe('')
    expect(displayDomain('')).toBe('')
  })
})

describe('isUrlLike', () => {
  it('recognizes full URLs', () => {
    expect(isUrlLike('https://www.kreindler.com/practices/x')).toBe(true)
    expect(isUrlLike('http://example.com')).toBe(true)
  })

  it('recognizes bare hosts', () => {
    expect(isUrlLike('kreindler.com')).toBe(true)
    expect(isUrlLike('www.kreindler.com/path')).toBe(true)
  })

  it('rejects plain text', () => {
    expect(isUrlLike('Book a consultation')).toBe(false)
    expect(isUrlLike('')).toBe(false)
    expect(isUrlLike('Call now')).toBe(false)
  })
})

describe('defaultCtaLabel', () => {
  it('prefers phone when available', () => {
    expect(defaultCtaLabel({ phone: '555-0100' })).toBe('Call now')
  })

  it('falls back to website when no phone', () => {
    expect(defaultCtaLabel({ website: 'https://example.com' })).toBe('Learn more')
  })

  it('defaults to Get in touch', () => {
    expect(defaultCtaLabel({})).toBe('Get in touch')
    expect(defaultCtaLabel({ industry: 'law' })).toBe('Get in touch')
  })
})

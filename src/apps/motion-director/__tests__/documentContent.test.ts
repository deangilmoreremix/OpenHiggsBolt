import { describe, expect, it } from 'vitest';
import { DOCUMENT_MIN_BLOCKS, documentBlockCount, documentFromCapture, documentFromText, fillSlots, isDocumentUsable } from '../lib/documentContent';

const content = {
  headline: 'Seaside Homes: beachfront living',
  description: 'Hand-picked beachfront homes on the Gulf coast. Every listing is walked by our own agents. Offers close within days.',
  headings: ['Featured homes', 'Why Seaside', 'Neighbourhoods', 'Open houses', 'Contact us'],
  ctas: ['Book a tour', 'Get the buyer guide'],
  nav: ['Homes', 'About', 'Journal', 'Contact'],
};

describe('a document made from what a site says', () => {
  const doc = documentFromCapture(content, 'Seaside Homes')!;
  it('headline = title, headings = sections, sentences and calls to action = the items under them', () => {
    expect(doc.title).toBe('Seaside Homes: beachfront living');
    expect(doc.sections.map((s) => s.heading)).toEqual(content.headings);
    expect(doc.sections.flatMap((s) => s.items)).toContain('Every listing is walked by our own agents.');
    expect(doc.sections.flatMap((s) => s.items)).toContain('Book a tour');
    expect(doc.sideLeft).toEqual(content.nav);
    expect(doc.sideRight).toEqual(content.ctas);
    expect(isDocumentUsable(doc)).toBe(true);
    expect(documentBlockCount(doc)).toBeGreaterThanOrEqual(DOCUMENT_MIN_BLOCKS);
  });
  it('invents nothing: a site with almost no text gives a document that is refused', () => {
    expect(isDocumentUsable(documentFromCapture({ headline: 'Acme', headings: ['A'] }, 'Acme'))).toBe(false);
    expect(documentFromCapture(null)).toBeNull();
  });
  it('fills the recipe\'s slots by tag, each section\'s items under its own heading, and leaves unfilled slots empty', () => {
    const slots = fillSlots(doc, ['h1', 'h2', 'li', 'li', 'h2', 'li', 'h2', 'li']);
    expect(slots[0]).toBe(doc.title);
    expect(slots[1]).toBe('Featured homes');
    expect(slots[2]).toBe(doc.sections[0].items[0]);
    expect(slots[4]).toBe('Why Seaside');
    expect(slots[5]).toBe(doc.sections[1].items[0]);
    const sparse = fillSlots({ ...doc, sections: [{ heading: 'Only', items: [] }] }, ['h1', 'h2', 'li', 'h2']);
    expect(sparse).toEqual([doc.title, 'Only', null, null]);
  });
});

describe('a document made from the person\'s own text', () => {
  const text = ['Quarterly update', '# Highlights', '- Revenue grew 12%', '- Two new offices opened', '# Risks', 'Hiring is slower than planned. Costs rose in March.', '# Next steps', '- Launch the mobile app', '- Close the Series B', '- Hire a head of sales'].join('\n');
  it('reads the first line as the title, short lines as headings, bullets and sentences as items', () => {
    const d = documentFromText(text, 'Acme')!;
    expect(d.title).toBe('Quarterly update');
    expect(d.sections.map((s) => s.heading)).toEqual(['Highlights', 'Risks', 'Next steps']);
    expect(d.sections[0].items).toEqual(['Revenue grew 12%', 'Two new offices opened']);
    expect(d.sections[1].items).toContain('Hiring is slower than planned.');
    expect(isDocumentUsable(d)).toBe(true);
  });
  it('a one-line request is not a document', () => { expect(documentFromText('make me a promo video')).toBeNull(); });
});

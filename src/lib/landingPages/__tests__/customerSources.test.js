import { describe, it, expect } from 'vitest';
import { collectCustomers } from '../customerSources.js';

const CLIENTS = [{ id: 'a', name: 'Dana Whitfield', businessName: 'Riverside Plumbing', location: 'Austin' }, { id: 'b', name: 'Sam Lee', businessName: 'Acme Roofing', email: 'sam@acme.test' }];

describe('collectCustomers', () => {
  it('puts the open window\'s client first, with its logo and brand colour', () => {
    const { customers, activeId } = collectCustomers({
      clientForm: { id: 'b', name: 'Sam Lee', businessName: 'Acme Roofing', website: 'acme.test' }, selectedClientId: 'b', clients: CLIENTS,
      assets: { primaryLogo: { uploadedUrl: 'https://cdn.test/acme.png' } }, brandColors: { primary: '#123abc' },
    });
    expect(activeId).toBe('b');
    expect(customers.map((c) => c.label)).toEqual(['Acme Roofing', 'Riverside Plumbing']);
    expect(customers[0].brand).toEqual({ accent: '#123abc', logoUrl: 'https://cdn.test/acme.png' });
    expect(customers[0].business.website).toBe('https://acme.test');
    expect(customers[0].email).toBe('sam@acme.test');
  });
  it('adds the business picked in Find your business, saved leads and given contacts, merging repeats', () => {
    const { customers } = collectCustomers({
      clients: CLIENTS, selectedBusiness: { id: 'osm-1', name: 'Glow Spa', city: 'Reno', phone: '775 555 0199' },
      leads: [{ id: 'l1', business: { name: 'riverside plumbing', website: 'https://rp.test' } }, { id: 'l2', business: { name: 'Peak Gym' } }],
      contacts: [{ firstName: 'Ana', lastName: 'Ruiz', company: 'Peak Gym', email: 'ana@peak.test' }],
    });
    expect(customers.map((c) => c.label)).toEqual(['Riverside Plumbing', 'Acme Roofing', 'Glow Spa', 'Peak Gym']);
    expect(customers[0].business.website).toBe('https://rp.test');
    expect(customers.find((c) => c.label === 'Peak Gym').tokens.firstname).toBe('Ana');
  });
  it('returns nothing for an empty window', () => {
    expect(collectCustomers({})).toEqual({ customers: [], activeId: '' });
    expect(collectCustomers({ clientForm: {}, clients: [null, {}] }).customers).toEqual([]);
  });
});

describe('personalized pictures', () => {
  it('collectCustomers attaches the newest saved picture to the active customer', () => {
    const { customers } = collectCustomers({
      clientForm: { id: 'a', name: 'Dana', businessName: 'Riverside Plumbing' }, selectedClientId: 'a', clients: [],
      projects: [{ updated_at: '2026-11-15', client: { id: 'a' }, output_type: 'image', generation: { outputUrls: ['https://cdn.test/p.png'] } }],
    });
    expect(customers[0].image).toBe('https://cdn.test/p.png');
  });
});

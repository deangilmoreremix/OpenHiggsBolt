import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Brand Studio API Routes', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('should export GET and POST from brands route', async () => {
    const mod = await import('./app/api/brands/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  it('should export GET, PATCH, DELETE from brand route', async () => {
    const mod = await import('./app/api/brand/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.PATCH).toBe('function');
    expect(typeof mod.DELETE).toBe('function');
  });

  it('should export GET and POST from animate route', async () => {
    const mod = await import('./app/api/animate/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  it('should export POST from animate upload route', async () => {
    const mod = await import('./app/api/animate/upload/route');
    expect(typeof mod.POST).toBe('function');
  });
});

describe('Brand Studio Types', () => {
  it('should export CAMPAIGN_GOALS with 6 goals', async () => {
    const mod = await import('./src/types/brand');
    expect(mod.CAMPAIGN_GOALS).toHaveLength(6);
    expect(mod.CAMPAIGN_GOALS.map(g => g.id)).toEqual([
      'product_launch',
      'lead_generation',
      'brand_awareness',
      'engagement',
      'thought_leadership',
      'sales',
    ]);
  });

  it('should export PLATFORMS with 8 platforms', async () => {
    const mod = await import('./src/types/brand');
    expect(mod.PLATFORMS).toHaveLength(8);
  });

  it('should export PHOTO_CATEGORIES with 30 styles', async () => {
    const mod = await import('./src/types/brand');
    const totalStyles = mod.PHOTO_CATEGORIES.reduce((sum, cat) => sum + cat.styles.length, 0);
    expect(totalStyles).toBe(30);
  });
});

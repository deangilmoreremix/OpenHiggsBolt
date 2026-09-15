import { describe, it, expect, vi } from 'vitest';
import { NextResponse } from 'next/server';

const routePath = '../../app/api/go-ai-viral/health/route.ts';

describe('health route (unit)', () => {
  function createMockFd() {
    const buffer = Buffer.from('[{"test": true}]');
    return {
      read: vi.fn(async (buf: Buffer) => {
        const len = Math.min(buffer.length, buf.length);
        buf.fill(buffer, 0, len);
        return { bytesRead: len };
      }),
      close: vi.fn(async () => {}),
    };
  }

  function mockFsOk() {
    vi.doMock('node:fs/promises', () => ({
      stat: vi.fn(async () => ({ size: 12345 })),
      open: vi.fn(async () => createMockFd()),
    }));
  }

  function mockFsMissing() {
    vi.doMock('node:fs/promises', () => ({
      stat: vi.fn(async () => { throw new Error('ENOENT'); }),
      open: vi.fn(async () => { throw new Error('ENOENT'); }),
    }));
  }

  function mockFetchOk() {
    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
    } as unknown as Response));
  }

  it('returns ok status when dataset exists and feed is reachable', async () => {
    mockFsOk();
    mockFetchOk();

    const mod = await import(routePath);
    const res = await mod.GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.seedanceDataset.status).toBe('ok');
    expect(json.status).toBe('ok');
  });

  it('returns degraded when dataset file is missing', async () => {
    mockFsMissing();

    const mod = await import(routePath);
    const res = await mod.GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('degraded');
    expect(json.seedanceDataset.status).toBe('unreachable');
  });

  it('returns degraded when JSON is corrupt', async () => {
    vi.doMock('node:fs/promises', () => ({
      stat: vi.fn(async () => ({ size: 100 })),
      open: vi.fn(async () => ({
        read: vi.fn(async (buf: Buffer) => {
          buf.fill(Buffer.from('not-json'));
          return { bytesRead: 8 };
        }),
        close: vi.fn(async () => {}),
      })),
    }));
    mockFetchOk();

    const mod = await import(routePath);
    const res = await mod.GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('degraded');
  });
});

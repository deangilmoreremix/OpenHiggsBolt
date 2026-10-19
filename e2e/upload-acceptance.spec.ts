import { test, expect } from '@playwright/test';

test.describe('Image upload acceptance', () => {
  test('upload route accepts demo uploads without entitlement block', async ({ page, request }) => {
    // Navigate to personalization demo to confirm the page loads
    await page.goto('/personalization-demo');
    await page.waitForLoadState('domcontentloaded');

    // Verify the page renders (not a 500 from missing modules)
    const title = await page.title();
    expect(title).toContain('SmartVideo GO');

    // Direct API test: POST to upload route without entitlement should
    // proceed past the entitlement gate (it will fail at MuAPI key validation,
    // not at entitlement). We use a clearly-invalid key so MuAPI rejects it,
    // proving the request reached MuAPI and wasn't blocked by our entitlement.
    const formData = new FormData();
    const blob = await page.evaluateHandle(() => {
      // Create a 1x1 PNG in the browser context
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 1, 1);
      return canvas.toDataURL('image/png');
    });
    const dataUrl = await (blob as any).jsonValue() as string;
    const response = await fetch('http://localhost:3111/api/v1/upload_file', {
      method: 'POST',
      headers: { 'x-api-key': 'test-key-12345' },
      body: formData,
    });
    // We can't easily send a File via fetch in Playwright, so instead we
    // verify the route is reachable by checking it doesn't return 403 from
    // entitlement. A missing file returns 400, invalid key returns 403 from
    // MuAPI — both prove the entitlement gate is gone.
    const res = await request.post('/api/v1/upload_file', {
      headers: { 'x-api-key': 'test-key-12345' },
      multipart: {
        file: {
          name: 'test.png',
          mimeType: 'image/png',
          buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
        },
      },
    });
    expect([400, 401, 403, 502]).toContain(res.status());
    // Most importantly: it must NOT be 403 with PAYMENT_REQUIRED from our
    // entitlement check. A 403 from MuAPI (invalid key) has a different body.
    const body = await res.json();
    if (res.status() === 403) {
      expect(body.error).not.toBe('PAYMENT_REQUIRED');
    }
  });

  test('upload route rejects missing API key with 401', async ({ request }) => {
    const res = await request.post('/api/v1/upload_file', {
      multipart: {
        file: {
          name: 'test.png',
          mimeType: 'image/png',
          buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
        },
      },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/Unauthorized/i);
  });

  test('upload route rejects invalid MIME type', async ({ request }) => {
    const res = await request.post('/api/v1/upload_file', {
      headers: { 'x-api-key': 'test-key-12345' },
      multipart: {
        file: {
          name: 'test.html',
          mimeType: 'text/html',
          buffer: Buffer.from('<html></html>'),
        },
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('REJECTED_MIME_TYPE');
  });
});

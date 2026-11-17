// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

vi.mock('next/dynamic', () => ({ default: () => () => <div data-testid="classic-studio" /> }));
import WarmblyDashboard from './WarmblyDashboard';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const reply = (ok, text) => vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok, text: async () => text });

describe('WarmblyDashboard', () => {
  it('embeds the built dashboard at the requested route', async () => {
    reply(true, '<script src="/warmbly-app/assets/index-abc.js"></script>');
    render(<WarmblyDashboard route="/app/campaigns" />);
    const frame = await screen.findByTitle('Warmbly Studio');
    expect(frame.getAttribute('src')).toBe('/warmbly-app/app/campaigns');
  });
  it('falls back to the in-repo studio when the dashboard is not built (host page returned)', async () => {
    reply(true, '<html><body>host app</body></html>');
    render(<WarmblyDashboard />);
    expect(await screen.findByTestId('classic-studio')).toBeTruthy();
    expect(screen.queryByTitle('Warmbly Studio')).toBeNull();
  });
  it('falls back when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    render(<WarmblyDashboard />);
    await waitFor(() => expect(screen.getByTestId('classic-studio')).toBeTruthy());
  });
});

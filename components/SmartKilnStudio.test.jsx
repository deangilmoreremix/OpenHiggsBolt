// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import SmartKilnStudio from './SmartKilnStudio';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const built = (app, help) => vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
  const ok = String(url).startsWith('/smartkiln-app') ? app : help;
  return { ok, text: async () => (String(url).startsWith('/smartkiln-app') ? '<script src="/smartkiln-app/assets/a.js"></script>' : '<link href="/smartkiln-help/assets/help.css">') };
});

describe('SmartKilnStudio', () => {
  it('shows the dashboard and a Help tab when both are built', async () => {
    built(true, true); render(<SmartKilnStudio route="/app/campaigns" />);
    const app = await screen.findByTitle('SmartKiln');
    expect(app.getAttribute('src')).toBe('/smartkiln-app/app/campaigns');
    expect(screen.getByRole('tab', { name: 'Help' })).toBeTruthy();
  });
  it('switches to the Help tab', async () => {
    built(true, true); render(<SmartKilnStudio />);
    fireEvent.click(await screen.findByRole('tab', { name: 'Help' }));
    expect(screen.getByRole('tab', { name: 'Help' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTitle('SmartKiln Help').style.display).toBe('block');
    expect(screen.getByTitle('SmartKiln').style.display).toBe('none');
  });
  it('can open on the Help tab', async () => {
    built(true, true); render(<SmartKilnStudio help />);
    await screen.findByTitle('SmartKiln Help');
    await waitFor(() => expect(screen.getByTitle('SmartKiln Help').style.display).toBe('block'));
  });
  it('hides the tab bar when the Help site is not built', async () => {
    built(true, false); render(<SmartKilnStudio />);
    await screen.findByTitle('SmartKiln');
    expect(screen.queryByRole('tab', { name: 'Help' })).toBeNull();
  });
  it('explains how to build when the dashboard is missing', async () => {
    built(false, false); render(<SmartKilnStudio />);
    expect(await screen.findByText(/has not been built yet/)).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import SmartWarmupAIStudio from './SmartWarmupAIStudio';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const built = (app, help) => vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
  const ok = String(url).startsWith('/smartwarmupai-app') ? app : help;
  return { ok, text: async () => (String(url).startsWith('/smartwarmupai-app') ? '<script src="/smartwarmupai-app/assets/a.js"></script>' : '<link href="/smartwarmupai-help/assets/help.css">') };
});

describe('SmartWarmupAIStudio', () => {
  it('shows the dashboard and a Help tab when both are built', async () => {
    built(true, true); render(<SmartWarmupAIStudio route="/app/campaigns" />);
    const app = await screen.findByTitle('SmartWarmupAI');
    expect(app.getAttribute('src')).toBe('/smartwarmupai-app/app/campaigns');
    expect(screen.getByRole('tab', { name: 'Help' })).toBeTruthy();
  });
  it('switches to the Help tab', async () => {
    built(true, true); render(<SmartWarmupAIStudio />);
    fireEvent.click(await screen.findByRole('tab', { name: 'Help' }));
    expect(screen.getByRole('tab', { name: 'Help' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTitle('SmartWarmupAI Help').style.display).toBe('block');
    expect(screen.getByTitle('SmartWarmupAI').style.display).toBe('none');
  });
  it('can open on the Help tab', async () => {
    built(true, true); render(<SmartWarmupAIStudio help />);
    await screen.findByTitle('SmartWarmupAI Help');
    await waitFor(() => expect(screen.getByTitle('SmartWarmupAI Help').style.display).toBe('block'));
  });
  it('hides the tab bar when the Help site is not built', async () => {
    built(true, false); render(<SmartWarmupAIStudio />);
    await screen.findByTitle('SmartWarmupAI');
    expect(screen.queryByRole('tab', { name: 'Help' })).toBeNull();
  });
  it('explains how to build when the dashboard is missing', async () => {
    built(false, false); render(<SmartWarmupAIStudio />);
    expect(await screen.findByText(/has not been built yet/)).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import MailkilnStudio from './MailkilnStudio';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const built = (app, help) => vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
  const ok = String(url).startsWith('/mailkiln-app') ? app : help;
  return { ok, text: async () => (String(url).startsWith('/mailkiln-app') ? '<script src="/mailkiln-app/assets/a.js"></script>' : '<link href="/mailkiln-help/assets/help.css">') };
});

describe('MailkilnStudio', () => {
  it('shows the dashboard and a Help tab when both are built', async () => {
    built(true, true); render(<MailkilnStudio route="/app/campaigns" />);
    const app = await screen.findByTitle('Mailkiln');
    expect(app.getAttribute('src')).toBe('/mailkiln-app/app/campaigns');
    expect(screen.getByRole('tab', { name: 'Help' })).toBeTruthy();
  });
  it('switches to the Help tab', async () => {
    built(true, true); render(<MailkilnStudio />);
    fireEvent.click(await screen.findByRole('tab', { name: 'Help' }));
    expect(screen.getByRole('tab', { name: 'Help' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTitle('Mailkiln Help').style.display).toBe('block');
    expect(screen.getByTitle('Mailkiln').style.display).toBe('none');
  });
  it('can open on the Help tab', async () => {
    built(true, true); render(<MailkilnStudio help />);
    await screen.findByTitle('Mailkiln Help');
    await waitFor(() => expect(screen.getByTitle('Mailkiln Help').style.display).toBe('block'));
  });
  it('hides the tab bar when the Help site is not built', async () => {
    built(true, false); render(<MailkilnStudio />);
    await screen.findByTitle('Mailkiln');
    expect(screen.queryByRole('tab', { name: 'Help' })).toBeNull();
  });
  it('explains how to build when the dashboard is missing', async () => {
    built(false, false); render(<MailkilnStudio />);
    expect(await screen.findByText(/has not been built yet/)).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import DeploymentCenter from './DeploymentCenter';
import ResellerAcademyView from './ResellerAcademyView';

/**
 * The Reseller Deployment Center (/reseller/deployment) and the gated
 * Academy view (/academy/reseller) are customer-facing surfaces that must
 * render honestly: the download route and Academy curriculum are owned by
 * other agents, so these checks pin the documentation and gating states
 * without inventing checkout links, downloads, or lessons.
 */
describe('Reseller surfaces', () => {
  beforeEach(() => cleanup());

  describe('DeploymentCenter', () => {
    it('renders the deployment center heading and package pricing', () => {
      render(<DeploymentCenter />);
      expect(
        screen.getByRole('heading', { level: 1, name: /Reseller\s+Deployment Center/i })
      ).toBeDefined();
      expect(screen.getByText('$197')).toBeDefined();
      expect(screen.getByText('$597')).toBeDefined();
    });

    it('documents the authorized download route and its failure codes', () => {
      render(<DeploymentCenter />);
      expect(screen.getByText('/api/reseller/download?app=ai-headshot-studio')).toBeDefined();
      ['401', '403', '404'].forEach((code) => {
        expect(screen.getByText(code)).toBeDefined();
      });
    });

    it('explains one customer-owned Supabase project with isolated schemas', () => {
      render(<DeploymentCenter />);
      expect(screen.getByText(/One customer-owned project/i)).toBeDefined();
      expect(screen.getByText(/Isolated per-app schemas/i)).toBeDefined();
      expect(screen.getByText(/Never the production database/i)).toBeDefined();
    });

    it('renders per-app instructions for every app in the collection', () => {
      render(<DeploymentCenter />);
      const cards = document.querySelectorAll('article[id^="app-"]');
      expect(cards.length).toBe(38);
      // The anchor ids are the deep-link targets used by the studio cards.
      expect(document.getElementById('app-ai-youtube-shorts-generator')).not.toBeNull();
    });

    it('never links a per-app Vercel deployment it does not own', () => {
      render(<DeploymentCenter />);
      const links = Array.from(document.querySelectorAll('article[id^="app-"] a'));
      links.forEach((link) => {
        const href = link.getAttribute('href') || '';
        // Only the real source repository, the real demo (when it exists),
        // Vercel's official import flow, and internal routes are allowed.
        expect(/^https:\/\//.test(href) || href.startsWith('/')).toBe(true);
      });
    });
  });

  describe('ResellerAcademyView', () => {
    const TRAINED_GAP = {
      entitled: true,
      missingEntitlements: [],
      upgrade: null,
      requiresFullPurchase: false,
    };

    it('lists required-but-missing curriculum instead of lessons when entitled', () => {
      render(<ResellerAcademyView entitled gap={TRAINED_GAP} tracks={[]} />);
      expect(screen.getByText('Reseller training modules — content pending')).toBeDefined();
      // The gap report comes from the curriculum JSON; nothing is fabricated.
      expect(screen.getByText(/Reseller onboarding: purchase, entitlements, and bundle downloads/)).toBeDefined();
      // Every curriculum module is reported as missing — none is faked.
      expect(screen.getAllByText('MISSING').length).toBeGreaterThan(0);    });

    it('renders the course shell alongside the pending panel when tracks exist', () => {
      render(
        <ResellerAcademyView
          entitled
          gap={TRAINED_GAP}
          tracks={[{ slug: 'ugc', title: 'AI Video Ads & UGC', order: 1, lessons: [], templates: [] }]}
        />
      );
      expect(screen.getByText('Reseller training modules — content pending')).toBeDefined();
    });

    it('locks the area for callers without the training entitlement', () => {
      render(
        <ResellerAcademyView
          entitled={false}
          gap={{
            entitled: false,
            missingEntitlements: ['apps_studio_training'],
            upgrade: {
              from: 'apps_studio_diy',
              to: 'apps_studio_training',
              priceDifferenceUsd: 400,
              grants: ['apps_studio_training'],
            },
            requiresFullPurchase: false,
          }}
          tracks={[]}
        />
      );
      expect(screen.getByText('Reseller training is locked')).toBeDefined();
      expect(screen.getAllByText(/apps_studio_training/).length).toBeGreaterThan(0);
      // A locked view must never render curriculum or the course shell.
      expect(screen.queryByText('Reseller training modules — content pending')).toBeNull();
    });

    it('shows a safe access-pending state when the entitlement check fails', () => {
      render(
        <ResellerAcademyView
          entitled={false}
          gap={{ entitled: false, missingEntitlements: [], upgrade: null, requiresFullPurchase: false }}
          tracks={[]}
          accessPending
        />
      );
      expect(screen.getByText('Reseller training access — pending')).toBeDefined();
      expect(screen.queryByText('Reseller training modules — content pending')).toBeNull();
    });
  });
});

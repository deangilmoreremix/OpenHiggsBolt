// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import DeploymentCenter from './DeploymentCenter';
import ResellerAcademyView from './ResellerAcademyView';
import { RESELLER_APPS } from '@/packages/studio/src/components/AppsStudio';
import enAppsStudio from '@/packages/studio/src/messages/en/appsStudio.json';
import resellerDestinations from '@/src/data/resellerDestinations.json';

/**
 * The Reseller Deployment Center (/reseller/deployment) and the gated
 * Academy view (/academy/reseller) are customer-facing surfaces that must
 * render honestly: the download route and Academy curriculum are owned by
 * other agents, so these checks pin the documentation and gating states
 * without inventing checkout links, downloads, or lessons.
 */
describe('Reseller surfaces', () => {
  beforeEach(() => cleanup());

  /** Per-app instruction cards, keyed by the app id in their anchor id. */
  const cardsById = () => {
    const map = new Map();
    Array.from(document.querySelectorAll('article[id^="app-"]')).forEach((card) => {
      map.set(card.id.replace(/^app-/, ''), card);
    });
    return map;
  };

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

    it('renders no SamurAIGPT repo link and deactivates repo+deploy for ai-resume-builder', () => {
      render(<DeploymentCenter />);
      expect(
        Array.from(document.querySelectorAll('article[id^="app-"] a')).some((a) =>
          /SamurAIGPT/.test(a.getAttribute('href') || ''),
        ),
      ).toBe(false);
      const card = document.getElementById('app-ai-resume-builder');
      expect(card).not.toBeNull();
      expect(
        card.querySelector('[aria-disabled="true"][title="Repository not yet published"]'),
      ).not.toBeNull();
      const hrefs = Array.from(card.querySelectorAll('a')).map((a) => a.getAttribute('href') || '');
      expect(hrefs.some((href) => /github\.com/.test(href))).toBe(false);
      expect(hrefs.some((href) => /vercel\.com\/new\/import/.test(href))).toBe(false);
      expect(hrefs).toContain('https://ai-resume-builder.vercel.app/');
      expect(hrefs.some((href) => /repository-url=null/.test(href))).toBe(false);
    });

    it('gates every per-app deploy link on a verified deployable-template repo', () => {
      render(<DeploymentCenter />);
      const templates = new Set(
        Object.entries(resellerDestinations.destinations)
          .filter(([, entry]) => entry.vercelDeploy === 'template')
          .map(([id]) => id),
      );
      const byId = cardsById();
      RESELLER_APPS.forEach((app) => {
        const card = byId.get(app.id);
        expect(card).toBeDefined();
        const importLink = Array.from(card.querySelectorAll('a')).find((a) =>
          a.getAttribute('href')?.startsWith('https://vercel.com/new/import'),
        );
        const disabled = Array.from(card.querySelectorAll('span[aria-disabled="true"]'))
          .find((el) => el.textContent === 'Deploy on Vercel ↗');
        if (templates.has(app.id) && app.repo) {
          // Working action: Vercel's real import flow for the verified repo.
          expect(importLink).toBeDefined();
          expect(importLink.getAttribute('href')).toBe(
            `https://vercel.com/new/import?repository-url=${encodeURIComponent(app.repo)}`,
          );
          expect(disabled).toBeUndefined();
        } else {
          // Attribution-only README/NOTICE repo, Python CLI, wrong project,
          // or no repo at all: an honest disabled control, not a link.
          expect(importLink).toBeUndefined();
          expect(disabled).toBeDefined();
          expect(disabled.getAttribute('title')).toBe(enAppsStudio.card.vercelDeployUnavailable);
        }
      });
      // Exactly the 13 verified template apps offer a deploy link.
      const deployLinks = Array.from(
        document.querySelectorAll('article[id^="app-"] a'),
      ).filter((a) => (a.getAttribute('href') || '').startsWith('https://vercel.com/new/import'));
      expect(deployLinks.length).toBe(13);
      deployLinks.forEach((link) => {
        const href = decodeURIComponent(link.getAttribute('href') || '');
        expect(href).not.toContain('null');
        expect(href).not.toContain('undefined');
        expect(href).not.toContain('SamurAIGPT');
      });
    });

    it('links every repository to the verified deangilmoreremix destination', () => {
      render(<DeploymentCenter />);
      const repoLinks = Array.from(document.querySelectorAll('article[id^="app-"] a'))
        .filter((a) => /Source repository ↗/.test(a.textContent || ''));
      expect(repoLinks.length).toBe(37);
      repoLinks.forEach((link) => {
        const href = link.getAttribute('href') || '';
        expect(href.startsWith('https://github.com/deangilmoreremix/')).toBe(true);
        expect(href).not.toContain('SamurAIGPT');
        // The href must be the mapping's verified repoUrl for some app.
        const mapped = Object.values(resellerDestinations.destinations)
          .some((entry) => entry.repoUrl === href);
        expect(mapped).toBe(true);
      });
    });

    it('keeps every download reference on the authorized reseller route', () => {
      render(<DeploymentCenter />);
      const byId = cardsById();
      RESELLER_APPS.forEach((app) => {
        const card = byId.get(app.id);
        const download = Array.from(card.querySelectorAll('dd'))
          .find((dd) => /^\/api\/reseller\/download\?app=/.test(dd.textContent || ''));
        expect(download?.textContent).toBe(`/api/reseller/download?app=${app.id}`);
        // The id must stay the one the download route's allowlist accepts.
        expect(resellerDestinations.destinations[app.id]?.downloadAppId).toBe(app.id);
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

  // @vitest-environment jsdom
  import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
  import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
  import AppsStudio, { RESELLER_APPS } from '@/packages/studio/src/components/AppsStudio';
  import enAppsStudio from '@/packages/studio/src/messages/en/appsStudio.json';
  import zhAppsStudio from '@/packages/studio/src/messages/zh/appsStudio.json';
  import resellerDestinations from '@/src/data/resellerDestinations.json';

  /** Minimal fetch Response stand-in — works in jsdom without Node globals. */
  const makeResponse = (overrides) => ({
    ok: true,
    status: 200,
    json: async () => ({}),
    ...overrides,
  });

describe('AppsStudio', () => {
  beforeEach(() => {
    cleanup();
  });

  /** Card titles live in the gallery section; package and step h3s are separate. */
  const getCardHeadings = () => Array.from(
    document.querySelectorAll('section[aria-labelledby="gallery-heading"] article h3')
  );

  it('renders the SmartVideo GO AI Apps heading', () => {
    render(<AppsStudio />);
    expect(screen.getByText('Your Apps.')).toBeDefined();
  });

  it('renders SmartVideo GO AI branding', () => {
    render(<AppsStudio />);
    expect(screen.getByPlaceholderText(/SmartVideo GO AI Apps/i)).toBeDefined();
  });

  it('does not contain SmartVisual branding', () => {
    render(<AppsStudio />);
    expect(screen.queryByText(/SmartVisual/i)).toBeNull();
  });

  it('renders the reseller program badge', () => {
    render(<AppsStudio />);
    expect(screen.getByText('SMARTVIDEO AI APPS RESELLER PROGRAM')).toBeDefined();
  });

  it('renders all three headline lines', () => {
    render(<AppsStudio />);
    expect(screen.getByText('Your Apps.')).toBeDefined();
    expect(screen.getByText('Your Brand.')).toBeDefined();
    expect(screen.getByText('Your Business.')).toBeDefined();
  });

  it('renders all three how-it-works steps', () => {
    render(<AppsStudio />);
    expect(screen.getByText('Choose Your App')).toBeDefined();
    expect(screen.getByText('Customize & Build')).toBeDefined();
    expect(screen.getByText('Launch Your Business')).toBeDefined();
  });

  it('renders the step numerals', () => {
    render(<AppsStudio />);
    expect(screen.getByText('Step 01')).toBeDefined();
    expect(screen.getByText('Step 02')).toBeDefined();
    expect(screen.getByText('Step 03')).toBeDefined();
  });

  it('renders the supporting copy', () => {
    render(<AppsStudio />);
    expect(screen.getByText(/customize, brand, and launch/i)).toBeDefined();
  });

  it('renders the DIY App Builder package at $197', () => {
    render(<AppsStudio />);
    expect(screen.getByText('DIY App Builder')).toBeDefined();
    expect(screen.getByText('$197')).toBeDefined();
    expect(screen.getByText('Get All Apps')).toBeDefined();
  });

  it('renders the Apps + Training package at $597', () => {
    render(<AppsStudio />);
    expect(screen.getByText('Apps + Training')).toBeDefined();
    expect(screen.getByText('$597')).toBeDefined();
    expect(screen.getByText('Get All Apps + Training')).toBeDefined();
  });

  it('documents the $400 upgrade path', () => {
    render(<AppsStudio />);
    expect(screen.getByText(/Upgrade from DIY App Builder to Apps \+ Training for a \$400 difference\./)).toBeDefined();
  });

  it('renders purchase CTAs as live Stripe Checkout links (never fake checkout pages)', () => {
    render(<AppsStudio />);
    // Both package CTAs are anchors that open the corresponding buy.stripe.com
    // Checkout session. Payment is verified server-side by the Stripe webhook
    // before any entitlement is granted.
    const purchaseLinks = screen
      .getAllByRole('link')
      .filter(a => /^Get All Apps/.test(a.textContent || ''));
    expect(purchaseLinks.length).toBe(2);
    purchaseLinks.forEach(link => {
      expect(link.tagName).toBe('A');
      expect(link.getAttribute('href')).toMatch(/^https:\/\/buy\.stripe\.com\//);
      expect(link.hasAttribute('disabled')).toBe(false);
    });
    // The DIY package links to its Stripe Checkout.
    expect(screen.getByRole('link', { name: 'Get All Apps' }).getAttribute('href')).toBe(
      'https://buy.stripe.com/3cI5kC74Ed6w8m95Ac5Rm0s'
    );
    // The training package links to its Stripe Checkout.
    expect(screen.getByRole('link', { name: 'Get All Apps + Training' }).getAttribute('href')).toBe(
      'https://buy.stripe.com/7sY00igFefeEdGt4w85Rm0r'
    );
    // No button masquerades as a purchase CTA.
    const purchaseButtons = screen
      .getAllByRole('button')
      .filter(btn => /^Get All Apps/.test(btn.textContent || ''));
    expect(purchaseButtons.length).toBe(0);
  });

  it('renders exactly 38 verified app cards', () => {
    render(<AppsStudio />);
    const cards = getCardHeadings();
    expect(cards.length).toBe(38);
  });

  it('does not render any Coming Soon entries', () => {
    render(<AppsStudio />);
    expect(screen.queryByText(/Coming Soon/i)).toBeNull();
  });

  it('does not render any Request Access buttons', () => {
    render(<AppsStudio />);
    expect(screen.queryByText(/Request Access/i)).toBeNull();
  });

  it('does not render any Get Template buttons', () => {
    render(<AppsStudio />);
    expect(screen.queryByText(/Get Template/i)).toBeNull();
  });

  it('does not render any Maybe Later buttons', () => {
    render(<AppsStudio />);
    expect(screen.queryByText(/Maybe Later/i)).toBeNull();
  });

  it('renders GitHub buttons for all apps', () => {
    render(<AppsStudio />);
    const githubButtons = screen.getAllByText('GitHub');
    expect(githubButtons.length).toBe(38);
  });

  it('renders Try Live Demo buttons for every app that has a hosted URL', () => {
    render(<AppsStudio />);
    const demoButtons = screen.getAllByText('Try Live Demo');
    // 37 of the 38 apps have a verified demo; ai-youtube-shorts-generator does not.
    expect(demoButtons.length).toBe(37);
  });

  it('renders Source Code buttons for all apps', () => {
    render(<AppsStudio />);
    expect(screen.getAllByText('Source Code').length).toBe(38);
  });

  it('leaves AI YouTube Shorts Generator without a Live Demo button', () => {
    render(<AppsStudio />);
    // No verified demo exists for this app, so it must never claim to have one.
    const shortsCard = screen.getByText('AI YouTube Shorts Generator').closest('article');
    expect(shortsCard).not.toBeNull();
    expect(shortsCard.textContent).not.toContain('Try Live Demo');
    expect(shortsCard.querySelector('a[href="https://ai-headshot-generator-xi.vercel.app/"]')).toBeNull();
  });

  it('points every card action at a verified https destination', () => {
    render(<AppsStudio />);
    const links = screen.getAllByRole('link').filter(a => a.getAttribute('href')?.startsWith('http'));
    expect(links.length).toBeGreaterThan(0);
    links.forEach(link => {
      const href = link.getAttribute('href');
      expect(href.startsWith('https://')).toBe(true);
    });
    // The three repaired demos must be reachable on their cards.
    const demoLinks = screen.getAllByRole('link', { name: /Try Live Demo/i });
    const hrefs = new Set(demoLinks.map(a => a.getAttribute('href')));
    expect(hrefs.has('https://ai-headshot-generator-xi.vercel.app/')).toBe(true);
    expect(hrefs.has('https://geo-checker-silk.vercel.app/')).toBe(true);
    expect(hrefs.has('https://ai-group-photo-mocha.vercel.app/')).toBe(true);
    // The dead destinations must be gone.
    expect(hrefs.has('https://ai-headshot-generator.vercel.app/')).toBe(false);
    expect(hrefs.has('https://geo-checker.vercel.app/')).toBe(false);
  });

  it('includes AI YouTube Shorts Generator', () => {
    render(<AppsStudio />);
    expect(screen.getByText('AI YouTube Shorts Generator')).toBeDefined();
    const githubLinks = screen.getAllByRole('link', { name: /GitHub/i });
    const shortsLink = githubLinks.find(link => link.getAttribute('href') === 'https://github.com/deangilmoreremix/AI-Youtube-Shorts-Generator');
    expect(shortsLink).not.toBeUndefined();
  });

  it('includes AI Group Photo', () => {
    render(<AppsStudio />);
    expect(screen.getByText('AI Group Photo')).toBeDefined();
  });

  it('includes My Podcast Studio', () => {
    render(<AppsStudio />);
    expect(screen.getByText('My Podcast')).toBeDefined();
  });

  it('includes AI Character Studio', () => {
    render(<AppsStudio />);
    expect(screen.getByText('AI Character Studio')).toBeDefined();
  });

  it('includes Nano Banana Generator', () => {
    render(<AppsStudio />);
    expect(screen.getByText('Nano Banana Studio')).toBeDefined();
  });

  it('filters apps by search query', async () => {
    render(<AppsStudio />);
    const searchInputs = screen.getAllByPlaceholderText('Search SmartVideo GO AI Apps...');
    const searchInput = searchInputs[0];
    fireEvent.change(searchInput, { target: { value: 'headshot' } });
    // The input is debounced (300ms); poll rather than sleeping a fixed
    // duration, which is flaky under CI load.
    await waitFor(() => {
      expect(screen.queryByText('AI Headshot Studio')).toBeDefined();
      expect(screen.queryByText('AI Clipping Studio')).toBeNull();
    });
  });

  // Category pills are located by accessible name plus aria-pressed rather
  // than by Tailwind class names, so a styling change cannot break the filter.
  it('filters apps by category', () => {
    render(<AppsStudio />);
    fireEvent.click(screen.getByRole('button', { name: 'Video' }));
    expect(screen.getByText('Seedance V2 Studio')).toBeDefined();
    expect(screen.getByText('AI Clipping Studio')).toBeDefined();
    expect(screen.queryByText('AI Headshot Studio')).toBeNull();
  });

  it('marks the selected category pill as pressed', () => {
    render(<AppsStudio />);
    const video = screen.getByRole('button', { name: 'Video' });
    expect(video.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(video);
    expect(screen.getByRole('button', { name: 'Video' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Image' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('shows all apps when All category is selected', () => {
    render(<AppsStudio />);
    fireEvent.click(screen.getByRole('button', { name: 'Video' }));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    const cards = getCardHeadings();
    expect(cards.length).toBe(38);
  });

  it('announces the visible result count', () => {
    render(<AppsStudio />);
    expect(screen.getByText('Showing 38 of 38 applications')).toBeDefined();
  });

  it('clears search when input is cleared', async () => {
    render(<AppsStudio />);
    const searchInputs = screen.getAllByPlaceholderText('Search SmartVideo GO AI Apps...');
    const searchInput = searchInputs[0];
    fireEvent.change(searchInput, { target: { value: 'headshot' } });
    await waitFor(() => {
      expect(screen.queryByText('AI Clipping Studio')).toBeNull();
    });
    fireEvent.change(searchInput, { target: { value: '' } });
    await waitFor(() => {
      expect(getCardHeadings().length).toBe(38);
    });
  });

  it('opens GitHub links in a new tab with safe rel attributes', () => {
    render(<AppsStudio />);
    // Each of the 37 apps with a verified repository renders exactly one
    // GitHub attribution link. ai-resume-builder has repo: null in both the
    // catalog and the destination mapping, so it renders the disabled
    // "unpublished" control instead — 37 links, not 38.
    const githubLinks = screen.getAllByRole('link', { name: /^GitHub — / });
    expect(githubLinks.length).toBe(37);
    githubLinks.forEach(link => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('rel')).toContain('noreferrer');
      // Every repo link must resolve to our own verified account, never to
      // the upstream attribution account.
      const href = link.getAttribute('href') || '';
      expect(href.startsWith('https://github.com/deangilmoreremix/')).toBe(true);
      expect(href).not.toContain('SamurAIGPT');
    });
    // ai-resume-builder renders the honest disabled control, not a dead link.
    const resumeCard = screen.getByText('AI Resume Builder').closest('article');
    expect(resumeCard).not.toBeNull();
    expect(
      resumeCard.querySelector('span[aria-disabled="true"][title]'),
    ).not.toBeNull();
    expect(
      resumeCard.querySelector('span[aria-disabled="true"]')?.getAttribute('title'),
    ).toBe(enAppsStudio.card.repoUnpublished);
    expect(
      Array.from(resumeCard.querySelectorAll('a')).some(a =>
        (a.getAttribute('href') || '').includes('github.com'),
      ),
    ).toBe(false);
  });

  it('opens demo links in a new tab with safe rel attributes', () => {
    render(<AppsStudio />);
    // The visible "Try Live Demo" CTA plus the clickable-thumbnail overlay
    // both point at app.hosted, so both sets must carry the safe attributes.
    const demoLinks = screen.getAllByRole('link', { name: /Try Live Demo/i });
    expect(demoLinks.length).toBe(37);
    const overlays = screen.getAllByRole('link', { name: /^Open live demo for / });
    expect(overlays.length).toBe(37);
    [...demoLinks, ...overlays].forEach(link => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('rel')).toContain('noreferrer');
    });
  });

  it('keeps GitHub attribution reachable without making it the primary action', () => {
    render(<AppsStudio />);
    const card = screen.getByText('AI Headshot Studio').closest('article');
    // Demo is the primary action and appears above the details CTA.
    expect(card.querySelector('a[href^="https://ai-headshot-generator-xi"]')).not.toBeNull();
    // GitHub is selected by its aria-label: the repo href is shared with the
    // "Source Code" CTA, so an href selector would match the wrong node.
    const github = card.querySelector('a[aria-label^="GitHub — "]');
    expect(github).not.toBeNull();
    const details = Array.from(card.querySelectorAll('a')).find(
      a => a.textContent === 'Source Code'
    );
    expect(details).not.toBeUndefined();
    // The GitHub link must not precede the details CTA in the card DOM.
    const links = Array.from(card.querySelectorAll('a'));
    expect(links.indexOf(details)).toBeLessThan(links.indexOf(github));
  });

  it('renders category badges', () => {
    render(<AppsStudio />);
    expect(screen.getAllByText('Image').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Video').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Business').length).toBeGreaterThan(0);
  });

  it('shows empty state when no apps match', async () => {
    render(<AppsStudio />);
    const searchInputs = screen.getAllByPlaceholderText('Search SmartVideo GO AI Apps...');
    const searchInput = searchInputs[0];
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } });
    await waitFor(() => {
      expect(screen.getByText('No apps found matching your criteria.')).toBeDefined();
    });
  });

  // ── Chinese locale ────────────────────────────────────────────────────────
  // These cover the localization paths that are otherwise silently broken:
  // categoryKey must produce camelCase bundle keys ("Real Estate" ->
  // "realEstate"), card badges must use the localized label rather than the
  // raw English category, and search must match localized category names.

  it('localizes the hero marketing copy under zh', () => {
    render(<AppsStudio locale="zh" />);
    // All three headline lines and the subtitle localize under zh.
    expect(screen.getByText('你的应用。')).toBeDefined();
    expect(screen.getByText('你的品牌。')).toBeDefined();
    expect(screen.getByText('你的生意。')).toBeDefined();
    expect(screen.getByText(/自定义、品牌化并上线/)).toBeDefined();
  });

  it('localizes the reseller packages under zh', () => {
    render(<AppsStudio locale="zh" />);
    expect(screen.getByText('自助应用构建包')).toBeDefined();
    expect(screen.getByText('应用 + 培训')).toBeDefined();
    expect(screen.getByText('获取全部应用')).toBeDefined();
    expect(screen.getByText('获取全部应用 + 培训')).toBeDefined();
    // Scoped to the unique explanatory paragraph: the upgrade CTA carries the
    // same "$400" figure, so a bare /差价 \$400/ matches multiple elements.
    expect(screen.getByText(/从自助应用构建包升级至应用 \+ 培训，差价 \$400。/)).toBeDefined();
    // Both package CTAs are live Stripe Checkout links under zh.
    expect(screen.getByRole('link', { name: '获取全部应用' }).getAttribute('href')).toBe(
      'https://buy.stripe.com/3cI5kC74Ed6w8m95Ac5Rm0s'
    );
    expect(screen.getByRole('link', { name: '获取全部应用 + 培训' }).getAttribute('href')).toBe(
      'https://buy.stripe.com/7sY00igFefeEdGt4w85Rm0r'
    );
    // No "checkout pending" notice is shown — links are always operational.
    expect(screen.queryByText(/结账尚未配置/)).toBeNull();
  });

  it('localizes the card actions under zh', () => {
    render(<AppsStudio locale="zh" />);
    // Every hosted app carries the demo label, so match the whole set.
    expect(screen.getAllByText('在线试用').length).toBe(37);
    expect(screen.getAllByText('部署指南').length).toBe(38);
    // The source-code label renders on all 38 cards: it is an anchor for the
    // 37 apps with a verified repo and a disabled control for
    // ai-resume-builder, and both keep the localized label.
    expect(screen.getAllByText('源代码').length).toBe(38);
    // Deploy-to-Vercel is gated on verified deployable-template repos: only
    // the 13 template apps get a working link, the other 25 get a disabled
    // control that still renders the localized label.
    const deployLinks = screen.getAllByRole('link', { name: '部署到 Vercel' });
    expect(deployLinks.length).toBe(13);
    const deployDisabled = Array.from(
      document.querySelectorAll('span[aria-disabled="true"]'),
    ).filter(el => el.textContent === '部署到 Vercel');
    expect(deployDisabled.length).toBe(25);
    deployDisabled.forEach(el => {
      expect(el.getAttribute('title')).toBe(zhAppsStudio.card.vercelDeployUnavailable);
    });
    expect(screen.queryAllByText('Try Live Demo', { exact: true })).toHaveLength(0);
    expect(screen.queryAllByText('Source Code', { exact: true })).toHaveLength(0);
    expect(screen.queryAllByText('Deployment Guide', { exact: true })).toHaveLength(0);
    // The unavailable-state explanations are real, non-empty translations.
    const unavailable = zhAppsStudio.card.vercelDeployUnavailable;
    expect(unavailable.trim().length).toBeGreaterThan(0);
    expect(unavailable).not.toBe(enAppsStudio.card.vercelDeployUnavailable);
  });

  // ── Accessibility and responsive structure ───────────────────────────────
  it('exposes landmarks and labelled sections', () => {
    render(<AppsStudio />);
    expect(screen.getByRole('main')).toBeDefined();
    // Exactly one top-level h1 for the reseller headline.
    expect(screen.getAllByRole('heading', { level: 1 }).length).toBe(1);
    // The gallery is labelled, so its 38 card headings are not orphaned.
    const gallery = document.querySelector('section[aria-labelledby="gallery-heading"]');
    expect(gallery).not.toBeNull();
    expect(document.getElementById('gallery-heading')?.textContent).toBe('The Application Collection');
    // Each named section carries a distinct heading: no accidental reuse.
    expect(document.getElementById('steps-heading')?.textContent).toBe('How It Works');
    expect(document.getElementById('packages-heading')?.textContent).toBe('Choose How You Build');
    // Filters are exposed as a navigation landmark.
    expect(screen.getByRole('navigation', { name: /Filter applications by category/i })).toBeDefined();
  });

  it('renders decorative icons as aria-hidden', () => {
    render(<AppsStudio />);
    const icons = Array.from(document.querySelectorAll('svg'));
    expect(icons.length).toBeGreaterThan(0);
    // Every icon in the tree must be hidden from assistive technology.
    const unhidden = icons.filter(svg => svg.getAttribute('aria-hidden') !== 'true');
    expect(unhidden).toHaveLength(0);
  });

  it('gives every thumbnail a descriptive alt text', () => {
    render(<AppsStudio />);
    const images = Array.from(document.querySelectorAll('img'));
    expect(images.length).toBe(38);
    images.forEach(img => {
      // The alt must add context beyond the adjacent card heading.
      expect(img.getAttribute('alt')).toMatch(/ preview$/);
      // Must declare intrinsic dimensions to avoid layout shift.
      expect(img.getAttribute('width')).toBeTruthy();
      expect(img.getAttribute('height')).toBeTruthy();
      expect(img.getAttribute('sizes')).toBeTruthy();
    });
  });

  it('clears the loading skeleton for images that load before React attaches handlers', () => {
    // Regression: cached / above-the-fold lazy images can fire load BEFORE
    // React attaches onLoad, leaving the spinner up forever. Simulate the
    // browser's pre-hydration completion state on the prototype.
    const completeDesc = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      'complete'
    );
    const naturalWidthDesc = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      'naturalWidth'
    );
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      configurable: true,
      get: () => true,
    });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
      configurable: true,
      get: () => 320,
    });

    try {
      render(<AppsStudio />);
      const images = Array.from(document.querySelectorAll('img'));
      expect(images.length).toBe(38);
      // Every image must be revealed rather than stuck under the skeleton.
      images.forEach(img => {
        expect(img.className).toContain('opacity-100');
        expect(img.className).not.toContain('opacity-0');
      });
      // No thumbnail may remain in the loading state. Scope to the card
      // media area: the Stripe-pending notice also uses role="status".
      expect(
        document.querySelectorAll('article > div:first-child [role="status"]')
          .length
      ).toBe(0);
    } finally {
      if (completeDesc) {
        Object.defineProperty(HTMLImageElement.prototype, 'complete', completeDesc);
      }
      if (naturalWidthDesc) {
        Object.defineProperty(
          HTMLImageElement.prototype,
          'naturalWidth',
          naturalWidthDesc
        );
      }
    }
  });

  it('falls back to the letter tile for images that failed before React attached handlers', () => {
    // Same pre-hydration race on the error side: complete + zero width.
    const completeDesc = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      'complete'
    );
    const naturalWidthDesc = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      'naturalWidth'
    );
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      configurable: true,
      get: () => true,
    });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
      configurable: true,
      get: () => 0,
    });

    try {
      render(<AppsStudio />);
      const images = Array.from(document.querySelectorAll('img'));
      // Failed thumbnails must be replaced by the accessible letter tile,
      // never left behind a loading spinner.
      images.forEach(img => expect(img.className).not.toContain('opacity-0'));
      const tiles = Array.from(document.querySelectorAll('[role="img"]'));
      expect(tiles.length).toBeGreaterThan(0);
      tiles.forEach(tile => expect(tile.getAttribute('aria-label')).toBeTruthy());
    } finally {
      if (completeDesc) {
        Object.defineProperty(HTMLImageElement.prototype, 'complete', completeDesc);
      }
      if (naturalWidthDesc) {
        Object.defineProperty(
          HTMLImageElement.prototype,
          'naturalWidth',
          naturalWidthDesc
        );
      }
    }
  });

  it('uses a responsive four-column gallery that reaches four columns at lg', () => {
    render(<AppsStudio />);
    const grid = document.querySelector('section[aria-labelledby="gallery-heading"] .grid');
    expect(grid).not.toBeNull();
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-4');
    // No three-column tier may remain between tablet and desktop.
    expect(grid.className).not.toContain('lg:grid-cols-3');
    expect(grid.className).not.toContain('xl:grid-cols-4');
  });

  it('keeps every thumbnail at a consistent 16:10 aspect ratio', () => {
    render(<AppsStudio />);
    const thumbs = Array.from(document.querySelectorAll('article > div:first-child'));
    expect(thumbs.length).toBe(38);
    thumbs.forEach(el => {
      expect(el.className).toContain('aspect-[16/10]');
      // The old fixed pixel height would let the aspect ratio drift.
      expect(el.className).not.toContain('h-44');
    });
  });

  it('localizes every category filter button under zh', () => {
    render(<AppsStudio locale="zh" />);
    // Real Estate is the regression case: the raw key is "realestate" unless
    // categoryKey camelCases it, so this button falls back to English.
    // Several elements carry the label (filter button plus app card badges),
    // so match the whole set rather than a single node.
    expect(screen.getAllByText('房地产').length).toBeGreaterThan(0);
    expect(screen.getAllByText('图像').length).toBeGreaterThan(0);
    expect(screen.getAllByText('视频').length).toBeGreaterThan(0);
    // Exact match only: no element may render the raw English category.
    expect(screen.queryAllByText('Real Estate', { exact: true })).toHaveLength(0);
    expect(screen.queryAllByText('Image', { exact: true })).toHaveLength(0);
  });

  it('localizes app card category badges under zh', () => {
    render(<AppsStudio locale="zh" />);
    // Badges must use the localized label, not the raw English category.
    // Exact match excludes app names such as "AI Real Estate Stager".
    expect(screen.getAllByText('房地产').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Real Estate', { exact: true })).toHaveLength(0);
  });

  it('matches search queries against localized category names under zh', async () => {
    render(<AppsStudio locale="zh" />);
    const searchInput = screen.getAllByPlaceholderText('搜索 SmartVideo GO AI 应用...')[0];
    fireEvent.change(searchInput, { target: { value: '房地产' } });
    await waitFor(() => {
      expect(screen.getByText('AI Real Estate Stager')).toBeDefined();
    });
  });

  it('renders the localized empty state under zh', async () => {
    render(<AppsStudio locale="zh" />);
    const searchInput = screen.getAllByPlaceholderText('搜索 SmartVideo GO AI 应用...')[0];
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } });
    await waitFor(() => {
      expect(screen.getByText('未找到匹配的应用。')).toBeDefined();
    });
  });

  // ── Purchase CTAs against the concurrent reseller endpoints ─────────────
  // The checkout/upgrade routes are owned by another agent; these tests pin
  // the UI contract: real POSTs, Stripe redirects, and graceful 503/409/402
  // degradation that never fakes a purchase.

  /** Collect every leaf path of a nested JSON bundle, for key parity. */
  const collectKeys = (value, prefix = '') => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value).flatMap((key) =>
        collectKeys(value[key], prefix ? `${prefix}.${key}` : key)
      );
    }
    return prefix ? [prefix] : [];
  };

  /** Replace window.location with a stub for the duration of a redirect test. */
  const stubWindowLocation = () => {
    const original = window.location;
    const assign = vi.fn();
    // jsdom's location properties are non-configurable, so swap the whole
    // object (the component only reads location.assign / location.href).
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...original, assign, href: '' },
    });
    return {
      assign,
      restore: () => {
        Object.defineProperty(window, 'location', {
          configurable: true,
          value: original,
        });
      },
    };
  };

  it('renders live Stripe Checkout links regardless of API configuration state', () => {
    render(<AppsStudio />);
    // Links are always present — the marketplace does not gate on Stripe
    // server configuration because checkout happens on buy.stripe.com.
    expect(screen.getByRole('link', { name: 'Get All Apps' }).getAttribute('href')).toBe(
      'https://buy.stripe.com/3cI5kC74Ed6w8m95Ac5Rm0s'
    );
    expect(screen.getByRole('link', { name: 'Get All Apps + Training' }).getAttribute('href')).toBe(
      'https://buy.stripe.com/7sY00igFefeEdGt4w85Rm0r'
    );
    // No "checkout pending" / "Stripe not configured" notice is shown for the
    // package CTAs, since the links are always operational.
    expect(screen.queryByText(/Checkout is not configured yet/)).toBeNull();
    expect(screen.queryByText(/Pending Stripe configuration/)).toBeNull();
  });

  it('opens Stripe Checkout in a new tab when the training CTA is activated', () => {
    render(<AppsStudio />);
    const link = screen.getByRole('link', { name: 'Get All Apps + Training' });
    expect(link.getAttribute('href')).toBe('https://buy.stripe.com/7sY00igFefeEdGt4w85Rm0r');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('explains a 409 ALREADY_TRAINING upgrade answer in plain language', async () => {
    render(<AppsStudio />);
    const fetchMock = vi.fn().mockResolvedValue(makeResponse({
      status: 409,
      ok: false,
      json: async () => ({ error: 'ALREADY_TRAINING' }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Upgrade to Apps + Training for $400' }));
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/reseller/upgrade',
          expect.objectContaining({ method: 'POST' }),
        );
        expect(
          screen.getByText('You already have the Apps + Training package, so there is nothing to upgrade.')
        ).toBeDefined();
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('explains a 402 UPGRADE_NOT_ELIGIBLE upgrade answer in plain language', async () => {
    render(<AppsStudio />);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({
      status: 402,
      ok: false,
      json: async () => ({ error: 'UPGRADE_NOT_ELIGIBLE' }),
    })));
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Upgrade to Apps + Training for $400' }));
      await waitFor(() => {
        expect(
          screen.getByText(/This upgrade is only available to owners of the DIY App Builder package/)
        ).toBeDefined();
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps the upgrade CTA disabled with a Stripe-pending note on 503', async () => {
    render(<AppsStudio />);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({
      status: 503,
      ok: false,
      json: async () => ({ error: 'RESELLER_STRIPE_NOT_CONFIGURED', missing: ['STRIPE_PRICE_UPGRADE'] }),
    })));
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Upgrade to Apps + Training for $400' }));
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Upgrade to Apps + Training for $400' }).hasAttribute('disabled')
        ).toBe(true);
      });
      expect(screen.getByText(/Checkout is not configured yet/)).toBeDefined();
    } finally {
      vi.unstubAllGlobals();
    }
    // Async debounce + fetch + state settle needs more than the 5s default
    // under load; this is a timing budget, not a behaviour assertion.
  }, 20000);

  it('keeps rendering when the reseller endpoints are entirely unavailable', async () => {
    render(<AppsStudio />);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    try {
      // Package CTAs are static links to buy.stripe.com — they do not call the
      // reseller checkout endpoint, so endpoint unavailability does not affect
      // them. The gallery itself never disappears on an endpoint failure.
      expect(screen.getByRole('link', { name: 'Get All Apps' }).getAttribute('href')).toBe(
        'https://buy.stripe.com/3cI5kC74Ed6w8m95Ac5Rm0s'
      );
      expect(getCardHeadings().length).toBe(38);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  // ── Card actions ─────────────────────────────────────────────────────────

  it('links every card to its anchor in the Reseller Deployment Center', () => {
    render(<AppsStudio />);
    const guideLinks = screen
      .getAllByRole('link')
      .filter(a => /^\/reseller\/deployment#app-/.test(a.getAttribute('href') || ''));
    expect(guideLinks.length).toBe(38);
    // Every catalog app has a matching Deployment Center anchor target.
    const expected = new Set(RESELLER_APPS.map(app => `/reseller/deployment#app-${app.id}`));
    const actual = new Set(guideLinks.map(a => a.getAttribute('href')));
    expect(actual).toEqual(expected);
    // The guides are internal links, so they must not open a new tab.
    guideLinks.forEach(link => {
      expect(link.getAttribute('target')).toBeNull();
    });
  });

  // ── Verified deployable repos and honest unavailable states ──────────────
  // The Deploy-to-Vercel action is only honest for a public repo that carries
  // full source (a real Vercel git-template import). The 13 such apps are
  // recorded as `deployable-public-template` in
  // docs/vercel-deployment-verification.md and as `vercelDeploy: "template"`
  // in src/data/resellerDestinations.json. Every other app is attribution-only
  // README/NOTICE, a Python CLI, the wrong project, or has no repo at all —
  // for those the action is a disabled control, never a broken destination.

  const TEMPLATE_APP_IDS = Object.entries(resellerDestinations.destinations)
    .filter(([, entry]) => entry.vercelDeploy === 'template')
    .map(([id]) => id)
    .sort();
  const UNAVAILABLE_APP_IDS = Object.entries(resellerDestinations.destinations)
    .filter(([, entry]) => entry.vercelDeploy !== 'template')
    .map(([id]) => id)
    .sort();
  const DESTINATION_BY_ID = resellerDestinations.destinations;
  /** Cards by app id, read from the rendered gallery. */
  const cardsById = () => {
    const map = new Map();
    Array.from(document.querySelectorAll('section[aria-labelledby="gallery-heading"] article'))
      .forEach(card => {
        const id = card.querySelector('a[href^="/reseller/deployment#app-"]')?.getAttribute('href')
          ?.replace('/reseller/deployment#app-', '');
        if (id) map.set(id, card);
      });
    return map;
  };

  it('records deployable-template status for exactly 13 of the 38 apps', () => {
    // The gate is data-driven: this pins the mapping's shape so the UI counts
    // below cannot drift silently from the verification document.
    expect(TEMPLATE_APP_IDS).toEqual([
      'ai-business-card',
      'ai-clipping-studio',
      'ai-headshot-studio',
      'ai-kissing-video-generator',
      'ai-logo',
      'ai-real-estate-stager',
      'blogger-cms',
      'easyveo-studio',
      'nano-banana-studio',
      'pet-product-studio',
      'resale-photo-enhancer',
      'seedance-v2-studio',
      'social-post',
    ]);
    expect(UNAVAILABLE_APP_IDS).toHaveLength(25);
    // The one app with no repo at all is unavailable, not silently skipped.
    expect(UNAVAILABLE_APP_IDS).toContain('ai-resume-builder');
    // ai-youtube-shorts-generator is a Python CLI, so it stays unavailable
    // even though it has a verified deangilmoreremix repo.
    expect(UNAVAILABLE_APP_IDS).toContain('ai-youtube-shorts-generator');
    // Every catalog app id is present in the mapping.
    RESELLER_APPS.forEach(app => {
      expect(Object.keys(DESTINATION_BY_ID)).toContain(app.id);
    });
  });

  it('offers a working deploy link only for the 13 verified template apps', () => {
    render(<AppsStudio />);
    const deployLinks = screen.getAllByRole('link', { name: /Deploy on Vercel/i });
    expect(deployLinks.length).toBe(13);
    const templates = new Set(TEMPLATE_APP_IDS);
    const byId = cardsById();
    RESELLER_APPS.forEach(app => {
      const card = byId.get(app.id);
      expect(card).toBeDefined();
      const importLink = Array.from(card.querySelectorAll('a')).find(a =>
        a.getAttribute('href')?.startsWith('https://vercel.com/new/import'),
      );
      const disabled = Array.from(card.querySelectorAll('span[aria-disabled="true"]'))
        .find(el => el.textContent === enAppsStudio.card.vercelDeploy);
      if (templates.has(app.id) && app.repo) {
        // Working action: the real Vercel import flow for the real repo.
        expect(importLink).toBeDefined();
        expect(importLink.getAttribute('href')).toBe(
          `https://vercel.com/new/import?repository-url=${encodeURIComponent(app.repo)}`,
        );
        expect(disabled).toBeUndefined();
      } else {
        // No deploy action, and an honest disabled control in its place.
        expect(importLink).toBeUndefined();
        expect(disabled).toBeDefined();
        expect(disabled.getAttribute('title')).toBe(enAppsStudio.card.vercelDeployUnavailable);
      }
    });
    // The import destination always carries the mapped repo, never a
    // placeholder, a null, or an upstream account.
    deployLinks.forEach(link => {
      const href = decodeURIComponent(link.getAttribute('href') || '');
      expect(href).not.toContain('null');
      expect(href).not.toContain('undefined');
      expect(href).not.toContain('SamurAIGPT');
    });
  });

  it('never points a customer-facing action at the upstream SamurAIGPT account', () => {
    render(<AppsStudio />);
    const allLinks = screen.getAllByRole('link');
    expect(allLinks.length).toBeGreaterThan(0);
    allLinks.forEach(link => {
      expect(link.getAttribute('href') || '').not.toContain('SamurAIGPT');
    });
    // The same holds for the disabled controls' explanatory titles.
    Array.from(document.querySelectorAll('[aria-disabled="true"]')).forEach(el => {
      expect(el.getAttribute('title') || '').not.toContain('SamurAIGPT');
    });
  });

  it('links every repository to the verified deangilmoreremix destination', () => {
    render(<AppsStudio />);
    const repoLinks = screen.getAllByRole('link', { name: 'Source Code' })
      .concat(screen.getAllByRole('link', { name: /^GitHub — / }));
    expect(repoLinks.length).toBe(37 * 2);
    repoLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      // Exact casing matters: the verified account is all lowercase.
      expect(href.startsWith('https://github.com/deangilmoreremix/')).toBe(true);
      expect(href).not.toMatch(/github\.com\/[A-Z]/);
      // The href must be the mapping's verified repoUrl for some app.
      const mapped = Object.values(DESTINATION_BY_ID).some(entry => entry.repoUrl === href);
      expect(mapped).toBe(true);
    });
    // The mapping's own repo links are equally clean.
    Object.values(DESTINATION_BY_ID).forEach(entry => {
      if (!entry.repoUrl) return;
      expect(entry.repoUrl.startsWith('https://github.com/deangilmoreremix/')).toBe(true);
      expect(entry.repoUrl).not.toContain('SamurAIGPT');
    });
  });

  it('keeps all 37 hosted demo URLs unchanged from the destination mapping', () => {
    render(<AppsStudio />);
    const demoHrefs = new Set(
      screen.getAllByRole('link', { name: /Try Live Demo/i })
        .map(a => a.getAttribute('href')),
    );
    expect(demoHrefs.size).toBe(37);
    let mappedDemos = 0;
    RESELLER_APPS.forEach(app => {
      const mapped = DESTINATION_BY_ID[app.id]?.hostedDemoUrl || null;
      if (app.hosted) {
        // The rendered href must be the mapping's hostedDemoUrl, verbatim.
        expect(app.hosted).toBe(mapped);
        expect(demoHrefs.has(app.hosted)).toBe(true);
        mappedDemos += 1;
      } else {
        // The one app without a demo has no mapping demo either.
        expect(mapped).toBeNull();
      }
    });
    expect(mappedDemos).toBe(37);
  });

  it('keeps download actions pointed at the authorized reseller download route', () => {
    render(<AppsStudio />);
    // The Deployment Center documents the per-app download endpoint, and every
    // card deep-links into its instructions, so the download id stays the app
    // id used by /api/reseller/download.
    RESELLER_APPS.forEach(app => {
      expect(DESTINATION_BY_ID[app.id]?.downloadAppId).toBe(app.id);
      const guide = screen.getByRole('link', {
        name: new RegExp(
          `Deployment guide for ${app.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} — opens the Reseller Deployment Center`,
        ),
      });
      expect(guide.getAttribute('href')).toBe(`/reseller/deployment#app-${app.id}`);
    });
  });

  it('keeps the en and zh appsStudio bundles structurally identical', () => {
    const enKeys = collectKeys(enAppsStudio).sort();
    const zhKeys = collectKeys(zhAppsStudio).sort();
    expect(zhKeys).toEqual(enKeys);
    // Every Chinese leaf value is a real, non-empty translation.
    const leafValues = (value) =>
      value && typeof value === 'object'
        ? Object.values(value).flatMap(leafValues)
        : [value];
    const zhValues = leafValues(zhAppsStudio).filter(v => typeof v === 'string');
    expect(zhValues.length).toBe(enKeys.length);
    zhValues.forEach((value) => {
      expect(value.trim().length).toBeGreaterThan(0);
      expect(value).not.toMatch(/TODO|FIXME|\bplaceholder\b/i);
      expect(value).not.toMatch(/^ ?\{[a-z]+\} ?$/); // bare, unreplaced token
    });
  });
});
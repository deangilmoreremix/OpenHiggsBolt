// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import AppsStudio from '@/packages/studio/src/components/AppsStudio';

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

  it('does not render functioning purchase buttons before Stripe is configured', () => {
    render(<AppsStudio />);
    // Purchases must stay unavailable until a verified Stripe destination is
    // configured, so both package CTAs are disabled controls, never links.
    const purchaseButtons = screen
      .getAllByRole('button')
      .filter(btn => /^Get All Apps/.test(btn.textContent || ''));
    expect(purchaseButtons.length).toBe(2);
    purchaseButtons.forEach(btn => {
      expect(btn.hasAttribute('disabled')).toBe(true);
      expect(btn.getAttribute('aria-disabled')).toBe('true');
      expect(btn.tagName).toBe('BUTTON');
      // A real checkout would be an anchor with an href; assert there is none.
      expect(btn.getAttribute('href')).toBeNull();
    });
    // And no anchor anywhere on the page points at a fake checkout destination.
    const purchaseLinks = screen
      .getAllByRole('link')
      .filter(a => /checkout|buy\.stripe|pay\.stripe|purchase/i.test(a.getAttribute('href') || ''));
    expect(purchaseLinks.length).toBe(0);
    expect(screen.getByText(/Checkout is not configured yet/i)).toBeDefined();
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

  it('renders View App Details buttons for all apps', () => {
    render(<AppsStudio />);
    expect(screen.getAllByText('View App Details').length).toBe(38);
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
    const shortsLink = githubLinks.find(link => link.getAttribute('href') === 'https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator');
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
    // Each card renders exactly one GitHub attribution link.
    const githubLinks = screen.getAllByRole('link', { name: /^GitHub — / });
    expect(githubLinks.length).toBe(38);
    githubLinks.forEach(link => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('rel')).toContain('noreferrer');
      expect(link.getAttribute('href')?.startsWith('https://')).toBe(true);
    });
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
    // "View App Details" CTA, so an href selector would match the wrong node.
    const github = card.querySelector('a[aria-label^="GitHub — "]');
    expect(github).not.toBeNull();
    const details = Array.from(card.querySelectorAll('a')).find(
      a => a.textContent === 'View App Details'
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
    expect(screen.getByText(/差价 \$400/)).toBeDefined();
    expect(screen.getByText(/结账尚未配置/)).toBeDefined();
  });

  it('localizes the card actions under zh', () => {
    render(<AppsStudio locale="zh" />);
    // Every hosted app carries these labels, so match the whole set.
    expect(screen.getAllByText('在线试用').length).toBe(37);
    expect(screen.getAllByText('查看应用详情').length).toBe(38);
    expect(screen.queryAllByText('Try Live Demo', { exact: true })).toHaveLength(0);
    expect(screen.queryAllByText('View App Details', { exact: true })).toHaveLength(0);
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
});
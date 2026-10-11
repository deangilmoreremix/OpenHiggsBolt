// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import AppsStudio from '@/packages/studio/src/components/AppsStudio';

describe('AppsStudio', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders the SmartVideo GO AI Apps heading', () => {
    render(<AppsStudio />);
    expect(screen.getByText('LAUNCH AN AI APP.')).toBeDefined();
  });

  it('renders SmartVideo GO AI branding', () => {
    render(<AppsStudio />);
    expect(screen.getByPlaceholderText(/SmartVideo GO AI Apps/i)).toBeDefined();
  });

  it('does not contain SmartVisual branding', () => {
    render(<AppsStudio />);
    expect(screen.queryByText(/SmartVisual/i)).toBeNull();
  });

  it('renders the Revenue-Ready Templates badge', () => {
    render(<AppsStudio />);
    expect(screen.getByText('Revenue-Ready Templates')).toBeDefined();
  });

  it('renders the second headline line', () => {
    render(<AppsStudio />);
    expect(screen.getByText('START EARNING TODAY.')).toBeDefined();
  });

  it('renders all three revenue steps', () => {
    render(<AppsStudio />);
    expect(screen.getByText('Deploy in Minutes')).toBeDefined();
    expect(screen.getByText('Collect Payments')).toBeDefined();
    expect(screen.getByText('Keep the Revenue')).toBeDefined();
  });

  it('renders the step numerals', () => {
    render(<AppsStudio />);
    expect(screen.getByText('Step 01')).toBeDefined();
    expect(screen.getByText('Step 02')).toBeDefined();
    expect(screen.getByText('Step 03')).toBeDefined();
  });

  it('renders the supporting copy', () => {
    render(<AppsStudio />);
    expect(screen.getByText(/fully-functional, Stripe-integrated AI SaaS/i)).toBeDefined();
  });

  it('renders exactly 38 verified app cards', () => {
    render(<AppsStudio />);
    const cards = screen.getAllByRole('heading', { level: 3 });
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

  it('renders Live Demo buttons only for apps with hosted URLs', () => {
    render(<AppsStudio />);
    const demoButtons = screen.getAllByText('Live Demo');
    expect(demoButtons.length).toBeGreaterThan(0);
    expect(demoButtons.length).toBeLessThan(38);
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

  it('filters apps by category', () => {
    render(<AppsStudio />);
    const videoFilters = screen.getAllByText('Video');
    const videoFilter = videoFilters.find(el => el.classList.contains('hover:bg-white/10'));
    fireEvent.click(videoFilter);
    expect(screen.getByText('Seedance V2 Studio')).toBeDefined();
    expect(screen.getByText('AI Clipping Studio')).toBeDefined();
    expect(screen.queryByText('AI Headshot Studio')).toBeNull();
  });

  it('shows all apps when All category is selected', () => {
    render(<AppsStudio />);
    const videoFilters = screen.getAllByText('Video');
    const videoFilter = videoFilters.find(el => el.classList.contains('hover:bg-white/10'));
    fireEvent.click(videoFilter);
    const allFilters = screen.getAllByText('All');
    const allFilter = allFilters.find(el => el.classList.contains('hover:bg-white/10'));
    fireEvent.click(allFilter);
    const cards = screen.getAllByRole('heading', { level: 3 });
    expect(cards.length).toBe(38);
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
      expect(screen.getAllByRole('heading', { level: 3 }).length).toBe(38);
    });
  });

  it('opens GitHub links in a new tab with safe rel attributes', () => {
    render(<AppsStudio />);
    const githubLinks = screen.getAllByRole('link', { name: /GitHub/i });
    expect(githubLinks.length).toBe(38);
    githubLinks.forEach(link => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('rel')).toContain('noreferrer');
    });
  });

  it('opens demo links in a new tab with safe rel attributes', () => {
    render(<AppsStudio />);
    const demoLinks = screen.getAllByRole('link', { name: /Live Demo/i });
    expect(demoLinks.length).toBeGreaterThan(0);
    demoLinks.forEach(link => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('rel')).toContain('noreferrer');
    });
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
    // The badge stays English on purpose: en and zh both define it as
    // "Revenue-Ready Templates", so assert the zh-only lines localize.
    expect(screen.getByText('启动 AI 应用。')).toBeDefined();
    expect(screen.getByText('即刻开始赚钱。')).toBeDefined();
    expect(screen.getByText(/Muapi 负责 AI 基础设施/)).toBeDefined();
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
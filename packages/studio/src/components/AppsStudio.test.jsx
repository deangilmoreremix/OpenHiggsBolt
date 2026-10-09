// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AppsStudio from '@/packages/studio/src/components/AppsStudio';

describe('AppsStudio', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders the SmartVideo GO AI Apps heading', () => {
    render(<AppsStudio />);
    expect(screen.getByText('AI Apps')).toBeDefined();
  });

  it('renders SmartVideo GO AI branding', () => {
    render(<AppsStudio />);
    expect(screen.getByPlaceholderText(/SmartVideo GO AI Apps/i)).toBeDefined();
  });

  it('does not contain SmartVisual branding', () => {
    render(<AppsStudio />);
    expect(screen.queryByText(/SmartVisual/i)).toBeNull();
  });

  it('renders the supporting copy', () => {
    render(<AppsStudio />);
    expect(screen.getByText(/Explore a collection of available AI applications/i)).toBeDefined();
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
    // Wait for debounce (300ms) + rendering
    await new Promise(resolve => setTimeout(resolve, 400));
    expect(screen.getByText('AI Headshot Studio')).toBeDefined();
    expect(screen.queryByText('AI Clipping Studio')).toBeNull();
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
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 400));
    expect(screen.queryByText('AI Clipping Studio')).toBeNull();
    fireEvent.change(searchInput, { target: { value: '' } });
    await new Promise(resolve => setTimeout(resolve, 400));
    const cards = screen.getAllByRole('heading', { level: 3 });
    expect(cards.length).toBe(38);
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
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 400));
    expect(screen.getByText('No apps found matching your criteria.')).toBeDefined();
  });
});
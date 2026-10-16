// @vitest-environment jsdom
/**
 * Unit tests for the Motion Studio template browser surfaced in Step 2 of
 * the Easy Personalization Wizard.
 *
 * The browser is driven by a context-typed `useDemoPersonalize()` hook. We
 * mock the hook (not the provider) so the tests stay focused on the
 * browser's rendering, search, category filtering and selection behaviour
 * without spinning up the full personalization provider.
 *
 * Performance note: rendering 150 cards is slow under jsdom (~5s per
 * render). The interaction tests therefore work with the *first* visible
 * card rather than asserting on the full grid, and the catalog totals are
 * verified against the module directly.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import {
  MOTION_CATEGORIES,
  MOTION_TEMPLATES,
  MOTION_TEMPLATE_CARDS,
  getMotionTemplate,
  getMotionTemplateByComponent,
  getMotionTemplatesByCategory,
  searchMotionTemplates,
} from '@/data/motionRecipeCatalog'
import type { MotionCategoryKey, MotionTemplate } from '@/data/motionRecipeCatalog'

// Mock the provider hook so we can drive the browser without mounting the
// real provider. The browser only needs `useMotionTemplate`,
// `launchMotionTemplate`, and `motionTemplate` from the context.
const useMotionTemplateMock = vi.fn<(template: MotionTemplate) => void>()
const launchMotionTemplateMock = vi.fn<(template: MotionTemplate) => void>()

let currentMotionTemplate: MotionTemplate | null = null

vi.mock('../../DemoPersonalizeProvider', () => ({
  useDemoPersonalize: () => ({
    motionTemplate: currentMotionTemplate,
    useMotionTemplate: (template: MotionTemplate) => {
      currentMotionTemplate = template
      useMotionTemplateMock(template)
    },
    launchMotionTemplate: (template: MotionTemplate) => {
      currentMotionTemplate = template
      launchMotionTemplateMock(template)
    },
  }),
}))

// Mock lucide-react icons to keep the test output (and snapshot diffs) small
// and stable. The browser doesn't depend on icon internals.
vi.mock('lucide-react', () => {
  const Stub = ({ size, color }: { size?: number; color?: string }) =>
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <svg data-testid="icon" data-size={size} data-color={color} />
  return {
    Image: Stub,
    Search: Stub,
    ChevronRight: Stub,
    Sparkles: Stub,
    Type: Stub,
    Camera: Stub,
    Layers: Stub,
    Sliders: Stub,
    BarChart3: Stub,
    Hand: Stub,
    ArrowRightLeft: Stub,
    Music: Stub,
    Sparkle: Stub,
    LogIn: Stub,
    ExternalLink: Stub,
    Check: Stub,
    Clock: Stub,
    Box: Stub,
    FileImage: Stub,
    MonitorPlay: Stub,
    ShoppingBag: Stub,
    MessageSquareQuote: Stub,
    Film: Stub,
    FolderOpen: Stub,
    Upload: Stub,
    Video: Stub,
  }
})

// Import AFTER mocks so the component picks up the stubbed hook.
import { TemplateBrowser } from '../TemplateBrowser'

describe('Motion Studio catalog', () => {
  it('exposes 150 shots in 10 categories summing correctly', () => {
    // Regression guard for the catalog contract: the catalog subagent must
    // keep these totals. A change that breaks the library scope lands here.
    expect(MOTION_TEMPLATES.length).toBe(150)
    expect(MOTION_TEMPLATE_CARDS.length).toBe(124)
    expect(MOTION_CATEGORIES.length).toBe(10)
    const sum = MOTION_CATEGORIES.reduce((acc, c) => acc + c.count, 0)
    expect(sum).toBe(150)
  })

  it('catalog accessors return canonical entries', () => {
    const first = MOTION_TEMPLATES[0]
    expect(getMotionTemplate(first.id)?.id).toBe(first.id)
    expect(getMotionTemplateByComponent(first.componentName)?.componentName).toBe(first.componentName)
  })

  it('per-category shot counts sum to 150 and match the per-category total', () => {
    // Cross-check the per-category totals by enumerating MOTION_TEMPLATES
    // directly. If the catalog drifts, this test fails before the UI does.
    const byCategory: Record<string, number> = {}
    for (const template of MOTION_TEMPLATES) {
      byCategory[template.category] = (byCategory[template.category] ?? 0) + 1
    }
    for (const category of MOTION_CATEGORIES) {
      expect(byCategory[category.key]).toBe(category.count)
    }
  })

  it('searchMotionTemplates is case-insensitive and matches nameEn, slug and category label', () => {
    const crash = searchMotionTemplates('CRASH')
    expect(crash.length).toBeGreaterThan(0)
    for (const t of crash) {
      // The catalog's `searchMotionTemplates` searches `name`, `nameEn`,
      // `categoryLabel`, `summary`, `summaryEn` and `slug` — assert every
      // result matches the query in at least one of those fields.
      const haystack =
        `${t.name} ${t.nameEn} ${t.categoryLabel} ${t.summary} ${t.summaryEn} ${t.slug}`.toLowerCase()
      expect(haystack).toContain('crash')
    }
  })

  it('every template has a unique id and componentName', () => {
    const ids = new Set(MOTION_TEMPLATES.map((t) => t.id))
    expect(ids.size).toBe(MOTION_TEMPLATES.length)
    const components = new Set(MOTION_TEMPLATES.map((t) => t.componentName))
    expect(components.size).toBe(MOTION_TEMPLATES.length)
  })

  it('every template declares its asset-insertion matrix as a complete object', () => {
    // The browser renders asset badges from `template.assets`; a missing
    // key would silently drop the badge for that asset kind.
    const required: Array<keyof MotionTemplate['assets']> = ['logo', 'image', 'screenshot', 'product', 'text', 'cta']
    for (const template of MOTION_TEMPLATES) {
      for (const key of required) {
        expect(typeof template.assets[key]).toBe('boolean')
      }
    }
  })
})

describe('TemplateBrowser', () => {
  beforeEach(() => {
    useMotionTemplateMock.mockClear()
    launchMotionTemplateMock.mockClear()
    currentMotionTemplate = null
  })

  afterEach(() => {
    cleanup()
  })

  it('renders all 10 Motion Studio categories as tabs', () => {
    render(<TemplateBrowser />)
    const tabs = screen.getAllByRole('tab')
    // 10 category tabs + 1 "All" tab
    expect(tabs.length).toBe(MOTION_CATEGORIES.length + 1)
  })

  it('every category tab carries its catalog count badge', () => {
    render(<TemplateBrowser />)
    // The browser renders tabs with short English labels (Camera, Opening,
    // …) defined in `CATEGORY_LABELS_EN`. The count badge mirrors
    // `MOTION_CATEGORIES[].count`.
    const TAB_LABELS: Record<MotionCategoryKey, string> = {
      opening: 'Opening',
      typography: 'Typography',
      'ui-entrance': 'UI Entrance',
      camera: 'Camera',
      data: 'Data',
      interaction: 'Interaction',
      transition: 'Transitions',
      rhythm: 'Rhythm',
      effects: 'Effects',
      outro: 'Outro',
    }
    for (const category of MOTION_CATEGORIES) {
      expect(screen.getAllByText(TAB_LABELS[category.key]).length).toBeGreaterThan(0)
      expect(screen.getAllByText(String(category.count)).length).toBeGreaterThan(0)
    }
  })

  it('shows the "All" tab as active by default and renders the full library', () => {
    const { container } = render(<TemplateBrowser />)
    const cards = container.querySelectorAll('[data-testid="motion-template-card"]')
    expect(cards.length).toBe(150)
  })

  it('clicking a category tab narrows the visible cards to that category', () => {
    const { container } = render(<TemplateBrowser />)
    const category: MotionCategoryKey = 'camera'
    // The browser renders tabs with short English labels (e.g. "Camera").
    const tab = screen.getAllByRole('tab').find((node) => node.textContent?.includes('Camera'))
    expect(tab).toBeTruthy()
    fireEvent.click(tab!)
    const expected = getMotionTemplatesByCategory(category)
    const cards = container.querySelectorAll('[data-testid="motion-template-card"]')
    expect(cards.length).toBe(expected.length)
  })

  it('search box filters the grid by name/component/category', () => {
    const { container } = render(<TemplateBrowser />)
    const input = screen.getByPlaceholderText(/search by name/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'crash' } })
    const expected = searchMotionTemplates('crash')
    const cards = container.querySelectorAll('[data-testid="motion-template-card"]')
    expect(cards.length).toBe(expected.length)
    expect(expected.length).toBeGreaterThan(0)
  })

  it('shows an empty state when search yields no results', () => {
    render(<TemplateBrowser />)
    const input = screen.getByPlaceholderText(/search by name/i)
    fireEvent.change(input, { target: { value: 'zzzzzz-no-match' } })
    expect(screen.queryAllByTestId('motion-template-card').length).toBe(0)
    expect(screen.getByText(/no motion studio shots match/i)).toBeTruthy()
  })

  it('calls useMotionTemplate when "Use this template" is clicked', () => {
    render(<TemplateBrowser />)
    const firstButton = screen.getAllByTestId('motion-template-use')[0]
    expect(firstButton).toBeTruthy()
    fireEvent.click(firstButton)
    expect(useMotionTemplateMock).toHaveBeenCalledTimes(1)
    const called = useMotionTemplateMock.mock.calls[0][0] as MotionTemplate
    expect(called).toBeTruthy()
    expect(called.componentName).toBeTruthy()
  })

  it('calls launchMotionTemplate when "Motion Studio" is clicked', () => {
    render(<TemplateBrowser />)
    const firstButton = screen.getAllByTestId('motion-template-launch')[0]
    expect(firstButton).toBeTruthy()
    fireEvent.click(firstButton)
    expect(launchMotionTemplateMock).toHaveBeenCalledTimes(1)
  })

  it('marks the currently-selected template card as active', () => {
    currentMotionTemplate = getMotionTemplateByComponent('CrashImpactReal') ?? null
    const { container } = render(<TemplateBrowser />)
    const id = currentMotionTemplate!.id
    const active = container.querySelector(`[data-testid="motion-template-card"][data-template-id="${id}"]`)
    expect(active).toBeTruthy()
    // The active card carries the "Selected" badge text.
    expect(active!.textContent).toMatch(/selected/i)
  })

  it('uses the catalog count badge to show the library size', () => {
    render(<TemplateBrowser />)
    // The header carries "150 shots" as a badge.
    expect(screen.getAllByText(/150 shots/i).length).toBeGreaterThan(0)
  })
})

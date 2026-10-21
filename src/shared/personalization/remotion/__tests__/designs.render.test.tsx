// @vitest-environment jsdom
/**
 * Render smoke test for the adapted Remotion designs.
 *
 * The designs are rendered with the REAL Remotion runtime (through
 * `@remotion/player`) so this covers the things the registry test cannot:
 *  - every design mounts with its default props and no runtime error;
 *  - the overlay designs really are transparent (they paint no background),
 *    and the full-frame designs really do paint one;
 *  - the `<Sequence>`-based design reveals its scenes on the expected frames.
 *
 * `<Sequence>` only registers itself with Remotion's `SequenceManager` inside
 * the Studio, so the browser path (Player and `@remotion/web-renderer`) renders
 * it without the no-op provider that `PersonalizationComposition` installs.
 */
import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Player } from '@remotion/player'
import { REMOTION_DESIGN_REGISTRY, getRemotionDesign } from '../registry'
import type { RemotionDesign } from '../registry'

const mounted: Array<{ root: ReturnType<typeof createRoot>; container: HTMLElement }> =
  []

afterEach(() => {
  while (mounted.length > 0) {
    const { root, container } = mounted.pop()!
    act(() => root.unmount())
    container.remove()
  }
})

function renderDesign(
  design: RemotionDesign,
  options: { frame?: number; props?: Record<string, unknown> } = {},
): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  mounted.push({ root, container })

  act(() => {
    root.render(
      <Player
        component={design.component as never}
        inputProps={{ ...design.defaultProps, ...(options.props ?? {}) }}
        durationInFrames={design.durationInFrames}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        initialFrame={options.frame ?? 0}
        acknowledgeRemotionLicense
        style={{ width: 480, height: 270 }}
      />,
    )
  })

  return container
}

function designRoot(container: HTMLElement, id: string): HTMLElement {
  const root = container.querySelector<HTMLElement>(
    `[data-remotion-design-id="${id}"]`,
  )
  expect(root).not.toBeNull()
  return root as HTMLElement
}

describe('adapted Remotion designs render', () => {
  it('mounts every registered design with its default props', () => {
    for (const design of REMOTION_DESIGN_REGISTRY) {
      const container = renderDesign(design)
      const root = designRoot(container, design.id)
      expect(root).toBeTruthy()
      expect(container.textContent).not.toBeNull()
    }
  })

  it('keeps the overlay designs transparent and paints the full-frame ones', () => {
    for (const design of REMOTION_DESIGN_REGISTRY) {
      const container = renderDesign(design)
      const root = designRoot(container, design.id)
      const style = root.getAttribute('style') ?? ''
      const paintsBackground = /background(-color)?\s*:/i.test(style)

      if (design.placement === 'overlay') {
        expect(
          paintsBackground,
          `${design.id} is an overlay and must not paint a background`,
        ).toBe(false)
      } else {
        expect(
          paintsBackground,
          `${design.id} is a full-frame design and must paint a background`,
        ).toBe(true)
      }
    }
  })

  it('renders the editable copy of the headline and lower third', () => {
    const headline = getRemotionDesign('bounce-in-headline') as RemotionDesign
    const headlineContainer = renderDesign(headline)
    expect(headlineContainer.textContent).toContain('Make It Bounce')

    const lowerThird = getRemotionDesign('lower-third-glass-card') as RemotionDesign
    const lowerThirdContainer = renderDesign(lowerThird)
    expect(lowerThirdContainer.textContent).toContain('Alex Morgan')
    expect(lowerThirdContainer.textContent).toContain('Head of Product, Acme Inc.')
  })

  it('draws the particle burst and no opaque backdrop', () => {
    const effect = getRemotionDesign('particle-explosion') as RemotionDesign
    const container = renderDesign(effect)
    const root = designRoot(container, 'particle-explosion')

    // One absolutely positioned particle per configured particle, and no
    // centre word (the upstream "BOOM!" was replaced by an empty default).
    expect(root.children.length).toBe(
      (effect.defaultProps.particleCount as number) ?? 150,
    )
    expect(container.textContent).not.toContain('BOOM!')
  })

  it('reveals the social reel scenes on their expected frames', () => {
    const reel = getRemotionDesign('social-reel') as RemotionDesign

    // Frame 0 is inside scene 1 (the catch copy).
    const first = renderDesign(reel, { frame: 0 })
    expect(first.textContent).toContain('Make it')
    expect(first.textContent).not.toContain('New drop / Studio Aria')

    // Frame 100 is inside scene 3 (the info panel).
    const third = renderDesign(reel, { frame: 100 })
    expect(third.textContent).toContain('New drop / Studio Aria')
    expect(third.textContent).not.toContain('Make it')
  })
})

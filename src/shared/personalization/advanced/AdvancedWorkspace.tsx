'use client'

/**
 * Layout shell for the personalization modal's Advanced Editing view.
 *
 * Advanced Editing used to be one long page (every section flowed through a
 * CSS multi-column body). It is now a four-tab workspace with a sticky preview
 * column, so each task fits on one screen and the result stays in view.
 *
 * Every existing section is kept: tabs only regroup them. All four panels stay
 * mounted (inactive ones are hidden), so switching tabs never loses typed
 * input or editor selection, and every section id stays in the DOM for links.
 */

import type { ReactNode } from 'react'
import type { AdvancedEditingTab } from '../types'
import { C } from '../guided/tokens'

export const ADVANCED_TABS: ReadonlyArray<{ id: AdvancedEditingTab; label: string; hint: string }> = [
  { id: 'client', label: 'Client', hint: 'Who is this for?' },
  { id: 'assets', label: 'Assets', hint: 'Logo, people, products' },
  { id: 'recast', label: 'Full Body Recast', hint: 'Put a person in a video' },
  { id: 'create', label: 'Overlays & Create', hint: 'Prompt, output, engine' },
]

/** Which tab holds each Advanced Editing section (for links and deep scrolls). */
export const SECTION_TAB: Record<string, AdvancedEditingTab> = {
  'pz-overview': 'client',
  'pz-discovered': 'assets',
  'pz-client-assets': 'assets',
  'pz-saved-assets': 'assets',
  'pz-content': 'assets',
  'pz-recast': 'recast',
  'pz-onvideo-overlays': 'create',
  'pz-prompt': 'create',
  'pz-output': 'create',
  'pz-mode': 'create',
  'pz-engine': 'create',
}

export function AdvancedStepBar({
  active,
  onSelect,
  done,
}: {
  active: AdvancedEditingTab
  onSelect: (tab: AdvancedEditingTab) => void
  done: Partial<Record<AdvancedEditingTab, boolean>>
}) {
  return (
    <div
      role="tablist"
      aria-label="Advanced Editing steps"
      className="pz-adv-steps sticky top-0 z-10 grid grid-cols-2 md:grid-cols-4"
      style={{ gap: 8, padding: '12px 0', background: C.modal, borderBottom: `1px solid ${C.border}` }}
    >
      {ADVANCED_TABS.map((tab, index) => {
        const isActive = tab.id === active
        const complete = Boolean(done[tab.id]) && !isActive
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`pz-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`pz-tabpanel-${tab.id}`}
            data-testid={`pz-tab-${tab.id}`}
            onClick={() => onSelect(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              borderRadius: 12,
              border: `1px solid ${isActive ? C.cyanBorder : C.border}`,
              background: isActive ? C.cyanSoft : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              minWidth: 0,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800,
                background: complete ? C.green : isActive ? C.cyan : 'rgba(255,255,255,.06)',
                color: complete || isActive ? '#041014' : C.muted,
              }}
            >
              {complete ? '✓' : index + 1}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', color: isActive ? C.cyan : C.text, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tab.label}
              </span>
              <span style={{ display: 'block', color: C.muted2, fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tab.hint}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function AdvancedTabPanel({
  tab,
  active,
  children,
}: {
  tab: AdvancedEditingTab
  active: AdvancedEditingTab
  children: ReactNode
}) {
  return (
    <div
      role="tabpanel"
      id={`pz-tabpanel-${tab}`}
      aria-labelledby={`pz-tab-${tab}`}
      data-testid={`pz-tabpanel-${tab}`}
      hidden={tab !== active}
    >
      {children}
    </div>
  )
}

/** "← Back / Next →" links at the bottom of each tab. */
export function AdvancedTabFooter({
  active,
  onSelect,
}: {
  active: AdvancedEditingTab
  onSelect: (tab: AdvancedEditingTab) => void
}) {
  const index = ADVANCED_TABS.findIndex((tab) => tab.id === active)
  const prev = index > 0 ? ADVANCED_TABS[index - 1] : null
  const next = index < ADVANCED_TABS.length - 1 ? ADVANCED_TABS[index + 1] : null
  const linkStyle = {
    minHeight: 34,
    padding: '0 14px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: 'transparent',
    color: C.text,
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
  } as const
  return (
    <div className="flex items-center justify-between" style={{ padding: '18px 0 6px', gap: 10 }}>
      {prev ? (
        <button type="button" style={linkStyle} onClick={() => onSelect(prev.id)}>← {prev.label}</button>
      ) : <span />}
      {next && (
        <button
          type="button"
          style={{ ...linkStyle, border: `1px solid ${C.cyanBorder}`, background: C.cyanSoft, color: C.cyan }}
          onClick={() => onSelect(next.id)}
        >
          Next: {next.label} →
        </button>
      )}
    </div>
  )
}

/** The sticky right-hand column: live preview + what will be used. */
export function AdvancedPreviewColumn({ children }: { children: ReactNode }) {
  return (
    <aside
      aria-label="Live preview"
      data-testid="pz-preview-column"
      className="pz-adv-preview xl:sticky"
      style={{ top: 72, alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16 }}
    >
      {children}
    </aside>
  )
}

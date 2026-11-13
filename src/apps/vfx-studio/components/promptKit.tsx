import React from 'react';
import {
  PromptAction as PromptActionBase,
  PromptComposer,
  promptControlClassName,
} from 'studio/src/components/prompt/PromptComposer';

/**
 * The prompt-bar pieces the other studios (Image, Video, Cinema, ...) are built from, re-exported with types so the
 * VFX studio uses exactly the same colours, buttons and panel instead of a copy that can drift.
 * The shared module is plain JS; the cast gives its button the props this studio passes (the same one Motion
 * Studio's agent panel uses).
 */
export const PromptAction = PromptActionBase as unknown as React.ForwardRefExoticComponent<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode } & React.RefAttributes<HTMLButtonElement>
>;

export { PromptComposer, promptControlClassName };

/** Text-field look shared with the studios' prompt controls. */
export const FIELD_CLASS =
  'rounded-md border border-white/[0.06] bg-[#16161a]/60 text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#22d3ee]/45 focus:ring-1 focus:ring-[#22d3ee]/30';

/** The studios' main action button (same classes as PromptAction), for buttons that are not Generate. */
export const PRIMARY_BUTTON_CLASS =
  'flex items-center justify-center gap-2 rounded-full bg-[#22d3ee]/10 px-5 py-2.5 text-sm font-bold text-[#22d3ee] ring-1 ring-inset ring-[#22d3ee]/50 transition-all hover:bg-[#22d3ee]/20 hover:ring-[#22d3ee]/80 active:scale-[0.98]';

/** A quiet secondary button on the dark panels. */
export const SECONDARY_BUTTON_CLASS =
  'flex items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-[#16161a]/60 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#202026]/80';

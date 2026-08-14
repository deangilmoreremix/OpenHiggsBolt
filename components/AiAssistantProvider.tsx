'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AiAssistantModal from './AiAssistantModal';

/**
 * Central AI Assistant hub.
 *
 * Wrap the studio content once (in StandaloneShell) with
 * <AiAssistantProvider apiKey={apiKey} openaiKey={openaiKey}>. Any studio can
 * then call `useAiAssistant().openAssist(...)` — or drop in <AssistStep /> —
 * to open the shared assistant modal pre-filled with the generated media or
 * text. A single modal instance is mounted for the whole app, so wiring a new
 * studio is just adding a step in its result area.
 */

export type AiAssistantResult = { kind: 'text'; text: string } | { kind: 'image'; url: string };

export interface AiAssistantModalProps {
  open: boolean;
  mode: 'image' | 'text';
  allowToggle: boolean;
  input: string | null;
  inputKind: 'url' | 'text';
  defaultValue: string;
  apiKey: string;
  openaiKey: string;
  onClose: () => void;
  onApply: (result: AiAssistantResult) => void;
}

type OpenAssistOpts = {
  assetType: 'image' | 'text' | 'both' | 'video';
  input: string | null;
  inputKind: 'url' | 'text';
  onApply?: (r: AiAssistantResult) => void;
};

type AiAssistantContextValue = {
  openAssist: (opts: OpenAssistOpts) => void;
  closeAssist: () => void;
};

type AiAssistantState = {
  open: boolean;
  mode: 'image' | 'text';
  allowToggle: boolean;
  input: string | null;
  inputKind: 'url' | 'text';
  defaultValue: string;
  onApply: ((r: AiAssistantResult) => void) | null;
};

const AiAssistantContext = createContext<AiAssistantContextValue | null>(null);

export function AiAssistantProvider({
  apiKey,
  openaiKey,
  children,
}: {
  apiKey: string | null;
  openaiKey: string | null;
  children: ReactNode;
}) {
  const [state, setState] = useState<AiAssistantState>({
    open: false,
    mode: 'image',
    allowToggle: false,
    input: null,
    inputKind: 'url',
    defaultValue: '',
    onApply: null,
  });

  const openAssist = useCallback((opts: OpenAssistOpts) => {
    const { assetType, input, inputKind, onApply } = opts;
    const text = inputKind === 'text' ? input : null;
    const assetUrl = inputKind === 'url' ? input : null;
    setState({
      open: true,
      mode: assetType === 'text' ? 'text' : 'image',
      allowToggle: assetType === 'both',
      inputKind: inputKind,
      input: text || assetUrl || null,
      defaultValue: text || '',
      onApply: onApply ?? null,
    });
  }, []);

  const closeAssist = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const value = useMemo(() => ({ openAssist, closeAssist }), [openAssist, closeAssist]);

  return (
    <AiAssistantContext.Provider value={value}>
      {children}
      <AiAssistantModal
        open={state.open}
        mode={state.mode}
        allowToggle={state.allowToggle}
        input={state.input}
        inputKind={state.inputKind}
        defaultValue={state.defaultValue}
        apiKey={apiKey ?? ''}
        openaiKey={openaiKey ?? ''}
        onClose={closeAssist}
        onApply={(result) => {
          state.onApply?.(result);
          closeAssist();
        }}
      />
    </AiAssistantContext.Provider>
  );
}

export function useAiAssistant(): AiAssistantContextValue {
  const ctx = useContext(AiAssistantContext);
  if (!ctx) {
    throw new Error('useAiAssistant must be used within a <AiAssistantProvider>');
  }
  return ctx;
}

/**
 * Drop-in "Enhance with AI" step for any studio's result area.
 *
 * Renders a theme-neutral button wrapping `children`. Clicking it opens the
 * shared assistant modal pre-filled with the asset. Renders nothing when there
 * is no assetUrl and no text, so it is safe to place unconditionally next to
 * Download / Copy URL / Publish.
 */
export function AssistStep({
  assetUrl,
  text,
  assetType = 'both',
  onApply,
  children,
  className,
  style,
}: {
  assetUrl?: string | null;
  text?: string | null;
  assetType?: 'image' | 'text' | 'both' | 'video';
  onApply?: (r: AiAssistantResult) => void;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { openAssist } = useAiAssistant();
  if (!assetUrl && !text) return null;

  return (
    <button
      type="button"
      onClick={() =>
        openAssist({
          assetType,
          input: text || assetUrl || null,
          inputKind: text ? 'text' : 'url',
          onApply,
        })
      }
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}

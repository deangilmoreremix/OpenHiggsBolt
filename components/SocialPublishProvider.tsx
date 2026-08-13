'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Share2, Play, Camera, Music2 } from 'lucide-react';
import SocialPublishModal from './SocialPublishModal';

/**
 * Central social-publishing hub.
 *
 * Wrap the studio content once (in StandaloneShell) with
 * <SocialPublishProvider apiKey={apiKey}>. Any studio can then call
 * `useSocialPublish().openPublish(...)` — or drop in <PublishButton /> /
 * <PublishStep /> — to open the shared publish modal pre-filled with the
 * generated media URL. A single modal instance is mounted for the whole app, so
 * wiring a new studio is just adding a button/step in its result area.
 */

export type SocialPublishOptions = {
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  title?: string;
  caption?: string;
};

type SocialPublishContextValue = {
  openPublish: (opts: SocialPublishOptions) => void;
  closePublish: () => void;
};

const SocialPublishContext = createContext<SocialPublishContextValue | null>(null);

export function SocialPublishProvider({
  apiKey,
  children,
}: {
  apiKey: string | null;
  children: ReactNode;
}) {
  const [state, setState] = useState<{
    open: boolean;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    title: string;
    caption: string;
  }>({
    open: false,
    mediaUrl: '',
    mediaType: 'video',
    title: '',
    caption: '',
  });

  const openPublish = useCallback((opts: SocialPublishOptions) => {
    setState({
      open: true,
      mediaUrl: opts.mediaUrl || '',
      mediaType: opts.mediaType === 'image' ? 'image' : 'video',
      title: opts.title || '',
      caption: opts.caption || '',
    });
  }, []);

  const closePublish = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const value = useMemo(() => ({ openPublish, closePublish }), [openPublish, closePublish]);

  return (
    <SocialPublishContext.Provider value={value}>
      {children}
      <SocialPublishModal
        open={state.open}
        onClose={closePublish}
        apiKey={apiKey ?? ''}
        mediaUrl={state.mediaUrl}
        mediaType={state.mediaType}
        defaultTitle={state.title}
        defaultCaption={state.caption}
      />
    </SocialPublishContext.Provider>
  );
}

export function useSocialPublish(): SocialPublishContextValue {
  const ctx = useContext(SocialPublishContext);
  if (!ctx) {
    throw new Error('useSocialPublish must be used within a <SocialPublishProvider>');
  }
  return ctx;
}

const PLATFORM_ICONS: Record<string, React.ComponentType<any>> = {
  youtube: Play,
  instagram: Camera,
  tiktok: Music2,
};

/**
 * Drop-in "Post to social" step for any studio's result area.
 *
 * Renders a compact, theme-neutral step card (Share icon + label + the platforms
 * this media type supports). Clicking it opens the shared publish modal
 * pre-filled with the asset. Renders nothing when there is no mediaUrl, so it is
 * safe to place unconditionally next to Download / Copy URL.
 */
export function PublishStep({
  mediaUrl,
  mediaType = 'video',
  title,
  caption,
  className,
  style,
}: {
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video';
  title?: string;
  caption?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { openPublish } = useSocialPublish();
  if (!mediaUrl) return null;

  const platforms = mediaType === 'image' ? ['instagram'] : ['youtube', 'instagram', 'tiktok'];

  return (
    <button
      type="button"
      onClick={() => openPublish({ mediaUrl, mediaType, title, caption })}
      title="Post this to a social network"
      className={
        className ||
        'flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-sm font-medium transition-all border border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:border-[#22d3ee]/40'
      }
      style={style}
    >
      <Share2 size={14} className="text-[#22d3ee]" />
      <span>Post to social</span>
      <span className="flex items-center gap-1 ml-1 opacity-70">
        {platforms.map((p) => {
          const Icon = PLATFORM_ICONS[p];
          return <Icon key={p} size={12} />;
        })}
      </span>
    </button>
  );
}

/**
 * Bare publish button (no card chrome) — use inline next to Download / Copy URL.
 */
export function PublishButton({
  mediaUrl,
  mediaType = 'video',
  title,
  caption,
  children,
  className,
  style,
}: {
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video';
  title?: string;
  caption?: string;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { openPublish } = useSocialPublish();
  if (!mediaUrl) return null;
  return (
    <button
      type="button"
      onClick={() => openPublish({ mediaUrl, mediaType, title, caption })}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}

'use client';
import { useCallback, useRef, useState } from 'react'
import LazyVideo from './LazyVideo';
import Reveal from './Reveal';
import { useDemoPrompt } from './DemoPromptModal';
import { useDemoPersonalize } from '@/shared/personalization';
import type { VideoDemo } from '@/data/types';
import { DemoTemplateActions } from '@/shared/demo-actions';
import { VideoCreateTargetPicker } from './VideoCreateTargetPicker';

type DemoMediaCardProps = {
  demo: VideoDemo;
  badge?: string;
  aspectClassName?: string;
  objectFit?: 'cover' | 'contain';
  /** Stagger the reveal animation. */
  index?: number;
};

export default function DemoMediaCard({
  demo,
  badge,
  aspectClassName = 'aspect-video',
  objectFit = 'cover',
  index = 0,
}: DemoMediaCardProps) {
  const { openPrompt } = useDemoPrompt();
  const { openPersonalize } = useDemoPersonalize();
  const [showCreatePicker, setShowCreatePicker] = useState(false)
  const createStyleTriggerRef = useRef<HTMLElement | null>(null)
  const handleCreatePickerClose = useCallback(() => {
    setShowCreatePicker(false)
  }, [])

  return (
    <Reveal
      as="article"
      delay={Math.min(index, 8) * 60}
      className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition duration-300 hover:border-white/20 hover:bg-white/[0.04]"
    >
      {/* Media */}
      <div className="relative">
        <LazyVideo
          src={demo.videoSrc}
          poster={demo.posterSrc}
          label={`${demo.title} — video preview`}
          hoverPlay
          toggleOnClick
          className={`${aspectClassName} w-full`}
          objectFit={objectFit}
        />
        <span className="glass-panel absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90">
          {badge ?? demo.category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-white">{demo.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-white/55">{demo.useCase}</p>

        <div className="mt-auto pt-5">
          <DemoTemplateActions
            onViewPrompt={(event) => openPrompt(demo, event.currentTarget)}
            onPersonalize={(event) => {
              event.preventDefault();
              openPersonalize({ source: demo, trigger: event.currentTarget });
            }}
            onCreateStyle={(event) => {
              event.preventDefault();
              createStyleTriggerRef.current = event.currentTarget
              setShowCreatePicker(true);
            }}
          />
          {showCreatePicker && (
            <VideoCreateTargetPicker
              demo={demo}
              triggerElement={createStyleTriggerRef.current}
              onClose={handleCreatePickerClose}
            />
          )}
        </div>
      </div>
    </Reveal>
  );
}

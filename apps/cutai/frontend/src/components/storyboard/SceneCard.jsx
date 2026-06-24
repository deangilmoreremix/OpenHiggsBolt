import { useSortable } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { GripVertical, Clock, RefreshCw } from 'lucide-react';
import useUIStore from '../../stores/useUIStore';
import useStoryboardStore from '../../stores/useStoryboardStore';
import { updateScene, regenerateScene } from '../../services/api';
import Badge from '../shared/Badge';
import FramePreview from './FramePreview';
import { useState } from 'react';

const moodColors = {
  thrilling: '#ef4444',
  romantic: '#ec4899',
  mysterious: '#8b5cf6',
  tense: '#f59e0b',
  neutral: '#64748b',
  happy: '#22c55e',
  sad: '#3b82f6',
  dark: '#1e293b',
};

const timeIcons = {
  day: '☀️',
  night: '🌙',
  dawn: '🌅',
  dusk: '🌇',
  overcast: '☁️',
  'night-interior': '💡',
  'day-interior': '🪟',
};

export default function SceneCard({ scene }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: scene.id,
  });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.9 : 1,
  };
  const { openShotPanel } = useUIStore();
  const { updateScene, selectScene } = useStoryboardStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(scene.title);

  const handleSaveTitle = async () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== scene.title) {
      const updated = await updateScene(scene.id, { title: trimmed });
      updateScene(updated);
    }
    setEditingTitle(false);
  };

  const handleRegenerateScene = async () => {
    const updated = await regenerateScene(scene.id);
    updateScene(updated);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex flex-col rounded-xl border border-cutai-border bg-cutai-surface transition hover:shadow-lg hover:-translate-y-1 hover:border-cutai-accent/60"
    >
      <div className="flex items-center justify-between border-b border-cutai-border px-3 py-2">
        <Badge className="bg-cutai-bg text-[10px] text-cutai-muted">Scene {scene.scene_number}</Badge>
        <div className="flex items-center gap-1">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-cutai-muted hover:text-cutai-text"
            aria-label="Drag"
          >
            <GripVertical size={14} />
          </button>
          <button
            onClick={handleRegenerateScene}
            className="rounded-lg p-1.5 text-cutai-muted hover:bg-cutai-border hover:text-cutai-accent"
            aria-label="Regenerate scene"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="relative h-40 w-full overflow-hidden bg-cutai-bg" onClick={() => openShotPanel()}>
        <FramePreview src={scene.frame_image_url} alt={scene.title} />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3" onClick={() => openShotPanel()}>
        {editingTitle ? (
          <input
            autoFocus
            className="rounded border border-cutai-accent bg-cutai-bg px-2 py-1 text-sm text-cutai-text outline-none"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
          />
        ) : (
          <h3
            className="text-sm font-semibold text-cutai-text"
            onDoubleClick={() => {
              setEditingTitle(true);
              setTitleDraft(scene.title);
            }}
          >
            {scene.title}
          </h3>
        )}

        <div className="flex items-center gap-2 text-xs text-cutai-muted">
          <span>{timeIcons[scene.time_of_day] || '🎬'}</span>
          <span className="truncate">{scene.location}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge
            className="border-0 text-[10px]"
            style={{
              backgroundColor: `${moodColors[scene.mood_overall] || '#64748b'}20`,
              color: moodColors[scene.mood_overall] || '#64748b',
            }}
          >
            {scene.mood_overall}
          </Badge>
          {(scene.characters || []).slice(0, 3).map((char) => (
            <span key={char} className="rounded-full border border-cutai-border bg-cutai-bg px-2 py-0.5 text-[10px] text-cutai-muted">
              {char}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-1 text-[10px] text-cutai-muted">
          <Clock size={12} />
          <span>~{scene.shots?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0)}s</span>
        </div>
      </div>
    </div>
  );
}

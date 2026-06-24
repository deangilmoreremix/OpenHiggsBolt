import useUIStore from '../../stores/useUIStore';
import useStoryboardStore from '../../stores/useStoryboardStore';
import { motion } from 'framer-motion';
import { ZoomIn } from 'lucide-react';

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

export default function VisualTimeline() {
  const scenes = useStoryboardStore((s) => s.scenes);
  const selectScene = useStoryboardStore((s) => s.selectScene);
  const { openShotPanel } = useUIStore();

  const sorted = [...scenes].sort((a, b) => a.scene_number - b.scene_number);

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cutai-border bg-cutai-surface/40 p-10 text-center">
        <p className="text-lg font-medium text-cutai-text">No timeline yet.</p>
        <p className="mt-1 text-sm text-cutai-muted">Generate a script to see your scenes visualized.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-cutai-border bg-cutai-surface p-4">
        {sorted.map((scene, idx) => (
          <div key={scene.id} className="flex items-center gap-2">
            {idx > 0 && (
              <div className="h-px w-8 bg-cutai-border" />
            )}
            <button
              onClick={() => {
                selectScene(scene.id);
                openShotPanel();
              }}
              className="group flex h-20 w-32 flex-col items-center justify-center rounded-lg border border-cutai-border bg-cutai-bg px-2 text-center transition hover:border-cutai-accent/60"
              style={{
                borderLeftColor: moodColors[scene.mood_overall] || '#64748b',
                borderLeftWidth: 3,
              }}
            >
              <span className="text-[10px] uppercase tracking-wide text-cutai-muted">
                Scene {scene.scene_number}
              </span>
              <span className="mt-1 truncate text-xs font-medium text-cutai-text">
                {scene.title}
              </span>
              <ZoomIn size={10} className="mt-1 text-cutai-accent opacity-0 transition group-hover:opacity-100" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-cutai-muted">
        Click a scene to open its shot breakdown. Nodes are derived from Zustand store (one-way data flow).
      </p>
    </div>
  );
}

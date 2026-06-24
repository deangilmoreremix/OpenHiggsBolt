import useUIStore from '../../stores/useUIStore';
import useStoryboardStore from '../../stores/useStoryboardStore';
import { regenerateFrame, updateScene } from '../../services/api';
import Badge from '../shared/Badge';
import CameraAngleTag from '../analysis/CameraAngleTag';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FramePreview from './FramePreview';

export default function ShotPanel() {
  const { shotPanelOpen, closeShotPanel } = useUIStore();
  const { selectedScene, scenes, updateScene } = useStoryboardStore();

  const scene = scenes.find((s) => s.id === selectedScene);

  if (!scene) return null;

  const shots = [...(scene.shots || [])].sort((a, b) => a.shot_number - b.shot_number);

  const handleRegenerateFrame = async () => {
    const updated = await regenerateFrame(scene.id);
      updateScene(updated);
  };

  return (
    <AnimatePresence>
      {shotPanelOpen ? (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 24, stiffness: 200 }}
          className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-cutai-border bg-cutai-surface shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-cutai-border p-4">
            <div>
              <h3 className="text-sm font-semibold text-cutai-text">
                Scene {scene.scene_number}: {scene.title}
              </h3>
              <p className="text-xs text-cutai-muted">{scene.location}</p>
            </div>
            <button
              onClick={closeShotPanel}
              className="rounded-lg p-2 text-cutai-muted hover:bg-cutai-border"
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>

          <div className="h-56 w-full bg-cutai-bg">
            <FramePreview src={scene.frame_image_url} alt={scene.title} />
          </div>

          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-cutai-text">Shots</h4>
              <button
                onClick={handleRegenerateFrame}
                className="inline-flex items-center gap-1 rounded-lg border border-cutai-border px-3 py-1.5 text-xs text-cutai-muted hover:text-cutai-accent"
              >
                <RefreshCw size={12} />
                Regenerate Frame
              </button>
            </div>

            {shots.map((shot) => (
              <div
                key={shot.id}
                className="rounded-lg border border-cutai-border bg-cutai-bg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Badge>Shot {shot.shot_number}</Badge>
                  <span className="text-[10px] text-cutai-muted">{shot.duration_seconds}s</span>
                </div>
                <CameraAngleTag
                  shotType={shot.shot_type}
                  cameraAngle={shot.camera_angle}
                  cameraMovement={shot.camera_movement}
                />
                <p className="text-xs leading-relaxed text-cutai-text/90">{shot.description}</p>
                {shot.dialogue && (
                  <p className="rounded-lg bg-cutai-surface p-2 font-mono text-xs italic text-cutai-muted">
                    {shot.dialogue}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

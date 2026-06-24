import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import useStoryboardStore from '../../stores/useStoryboardStore';
import { reorderScenes } from '../../services/api';
import { motion } from 'framer-motion';
import SceneCard from './SceneCard';

export default function StoryboardCanvas() {
  const scenes = useStoryboardStore((s) => s.scenes);
  const reorderScenes = useStoryboardStore((s) => s.reorderScenes);

  const sorted = [...scenes].sort((a, b) => a.scene_number - b.scene_number);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sorted.findIndex((s) => s.id === active.id);
    const newIndex = sorted.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(sorted, oldIndex, newIndex);

    const orderPayload = newOrder.map((scene, idx) => ({
      scene_id: scene.id,
      scene_number: idx + 1,
    }));

    reorderScenes(orderPayload);
    await reorderScenes(orderPayload);
  };

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cutai-border bg-cutai-surface/40 p-10 text-center">
        <p className="text-lg font-medium text-cutai-text">No scenes yet.</p>
        <p className="mt-1 text-sm text-cutai-muted">Generate a script to create your storyboard.</p>
      </div>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sorted.map((s) => s.id)}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sorted.map((scene, idx) => (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <SceneCard scene={scene} />
            </motion.div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

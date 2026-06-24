import { create } from 'zustand';
import api from '../services/api';

const useStoryboardStore = create((set, get) => ({
  script: null,
  scenes: [],
  selectedScene: null,
  generationStatus: 'idle', // idle | generating | done | error
  progress: { stage: '', message: '', current: 0, total: 0 },

  setScript(script) {
    set({ script, scenes: script?.scenes || [] });
  },

  setScenes(scenes) {
    set({ scenes });
  },

  selectScene(id) {
    set({ selectedScene: id });
  },

  updateScene(updated) {
    set((s) => ({
      scenes: s.scenes.map((sc) => (sc.id === updated.id ? updated : sc)),
    }));
  },

  upsertScene(updated) {
    set((s) => {
      const exists = s.scenes.some((sc) => sc.id === updated.id);
      const scenes = exists
        ? s.scenes.map((sc) => (sc.id === updated.id ? updated : sc))
        : [...s.scenes, updated];
      return { scenes };
    });
  },

  reorderScenes(order) {
    const mapped = order.map((item) => {
      const scene = get().scenes.find((s) => s.id === item.scene_id);
      return scene ? { ...scene, scene_number: item.scene_number } : null;
    }).filter(Boolean);
    set({ scenes: mapped });
  },

  setGenerationStatus(status) {
    set({ generationStatus: status });
  },

  setProgress(progress) {
    set({ progress });
  },

  resetGeneration() {
    set({
      script: null,
      scenes: [],
      selectedScene: null,
      generationStatus: 'idle',
      progress: { stage: '', message: '', current: 0, total: 0 },
    });
  },
}));

export default useStoryboardStore;

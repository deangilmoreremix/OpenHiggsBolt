import { create } from 'zustand';

const useUIStore = create((set) => ({
  activeTab: 'storyboard', // storyboard | timeline | analysis
  shotPanelOpen: false,
  exportModalOpen: false,
  newProjectModalOpen: false,

  setActiveTab(tab) {
    set({ activeTab: tab });
  },

  openShotPanel() {
    set({ shotPanelOpen: true });
  },

  closeShotPanel() {
    set({ shotPanelOpen: false });
  },

  openExportModal() {
    set({ exportModalOpen: true });
  },

  closeExportModal() {
    set({ exportModalOpen: false });
  },

  openNewProjectModal() {
    set({ newProjectModalOpen: true });
  },

  closeNewProjectModal() {
    set({ newProjectModalOpen: false });
  },
}));

export default useUIStore;

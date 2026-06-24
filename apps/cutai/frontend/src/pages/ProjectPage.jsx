import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useProjectStore from '../stores/useProjectStore';
import useStoryboardStore from '../stores/useStoryboardStore';
import useUIStore from '../stores/useUIStore';
import { exportJson, exportPdf } from '../services/api';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MainCanvas from '../components/layout/MainCanvas';
import ScriptGenerator from '../components/script/ScriptGenerator';
import ScriptEditor from '../components/script/ScriptEditor';
import StoryboardCanvas from '../components/storyboard/StoryboardCanvas';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import VisualTimeline from '../components/timeline/VisualTimeline';
import MoodGraph from '../components/analysis/MoodGraph';
import SoundtrackPanel from '../components/analysis/SoundtrackPanel';
import Modal from '../components/shared/Modal';

export default function ProjectPage() {
  const { id } = useParams();
  const { currentProject, setCurrentProject, fetchProjects } = useProjectStore();
  const { script, generationStatus, setScript, resetGeneration, scenes } = useStoryboardStore();
  const { activeTab, openExportModal, closeExportModal, setActiveTab } = useUIStore();

  useEffect(() => {
    fetchProjects().then(() => {
      const proj = useProjectStore.getState().projects.find((p) => String(p.id) === String(id));
      setCurrentProject(proj || null);
    });
  }, [id]);

  useEffect(() => {
    if (!currentProject || String(currentProject.id) !== String(id)) {
      fetchProjects();
    }
  }, [id]);

  useEffect(() => {
    setActiveTab('storyboard');
    resetGeneration();
  }, [id]);

  const handleExportJson = async () => {
    if (!script) return;
    const blob = await exportJson(script.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyboard-${script.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    closeExportModal();
  };

  const handleExportPdf = async () => {
    if (!script) return;
    const blob = await exportPdf(script.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyboard-${script.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    closeExportModal();
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainCanvas>
          <div className="mt-2 flex items-center gap-2 border-b border-cutai-border">
            {['storyboard', 'timeline', 'analysis'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-t-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-cutai-accent text-cutai-accent'
                    : 'text-cutai-muted hover:text-cutai-text'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="py-6">
            {activeTab === 'storyboard' && (
              <>
              {!script ? (
                <div className="space-y-6">
                  <ScriptGenerator />
                </div>
              ) : (
                <ErrorBoundary>
                  <StoryboardCanvas />
                </ErrorBoundary>
              )}
              </>
            )}
            {activeTab === 'timeline' && <VisualTimeline />}
            {activeTab === 'analysis' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <MoodGraph />
                <SoundtrackPanel />
              </div>
            )}
          </div>
        </MainCanvas>
      </div>
      <Modal
        isOpen={useUIStore((s) => s.exportModalOpen)}
        onClose={closeExportModal}
        title="Export Storyboard"
      >
        <div className="space-y-3">
          <button
            onClick={handleExportJson}
            className="w-full rounded-lg border border-cutai-border px-4 py-2 text-left text-sm hover:border-cutai-accent/60"
          >
            Download JSON
          </button>
          <button
            onClick={handleExportPdf}
            className="w-full rounded-lg border border-cutai-border px-4 py-2 text-left text-sm hover:border-cutai-accent/60"
          >
            Download PDF
          </button>
        </div>
      </Modal>
    </div>
  );
}

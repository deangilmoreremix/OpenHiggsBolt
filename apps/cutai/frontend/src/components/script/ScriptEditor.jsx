import { useState, useRef } from 'react';
import useStoryboardStore from '../../stores/useStoryboardStore';
import { generateFromScript, getStoryboard } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import ScriptGenerator from './ScriptGenerator';

export default function ScriptEditor() {
  const [rawScript, setRawScript] = useState('');
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('generator');
  const abortRef = useRef(null);

  const { setGenerationStatus, setProgress, resetGeneration, setScript } = useStoryboardStore();

  const handleParse = async () => {
    if (!rawScript.trim()) return;
    setError(null);
    resetGeneration();
    setGenerationStatus('generating');

    abortRef.current = new AbortController();

    try {
      await generateFromScript(
        { genre: 'Drama', raw_script: rawScript.trim(), num_scenes: 4, project_id: null },
        (eventType, data) => {
          if (eventType === 'progress') {
            setProgress(data);
          }
          if (eventType === 'done') {
            setProgress({ stage: '', message: '', current: 0, total: 0 });
            getStoryboard(data.script_id).then((storyboard) => {
              setScript(storyboard);
              setGenerationStatus('done');
            });
          }
          if (eventType === 'error') {
            setError(data.message);
            setGenerationStatus('error');
          }
        },
        abortRef.current.signal,
      );
    } catch (e) {
      setError(e.message);
      setGenerationStatus('error');
    }
  };

  if (mode === 'generator') {
    return <ScriptGenerator />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-cutai-border bg-cutai-surface p-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMode('generator')}
          className="text-sm text-cutai-muted underline underline-offset-2"
        >
          Use generator instead
        </button>
      </div>
      <h2 className="text-xl font-semibold text-cutai-text">Parse Screenplay</h2>
      <p className="text-sm text-cutai-muted">
        Paste your raw screenplay text. The AI will parse it into a structured storyboard.
      </p>
      <textarea
        value={rawScript}
        onChange={(e) => setRawScript(e.target.value)}
        className="h-64 w-full rounded-lg border border-cutai-border bg-cutai-bg px-3 py-2 font-mono text-sm text-cutai-text outline-none focus:border-cutai-accent"
        placeholder="INT. JAZZ BAR - NIGHT...
A DETECTIVE enters the smoky room..."
      />

      {useStoryboardStore.getState().generationStatus === 'generating' && (
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-cutai-border">
            <div
              className="h-full bg-cutai-accent transition-all duration-300"
              style={{
                width: `${
                  useStoryboardStore.getState().progress.total
                    ? (useStoryboardStore.getState().progress.current / useStoryboardStore.getState().progress.total) * 100
                    : 0
                }%`,
              }}
            />
          </div>
          <p className="text-xs text-cutai-muted">
            {useStoryboardStore.getState().progress.message || 'Starting...'}
          </p>
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={handleParse}
        disabled={useStoryboardStore.getState().generationStatus === 'generating'}
        className="w-full rounded-lg bg-cutai-accent py-3 text-sm font-semibold text-black hover:bg-cutai-accent/90 disabled:opacity-60"
      >
        Parse & Generate Storyboard
      </button>
    </div>
  );
}

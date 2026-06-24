import { useState, useRef } from 'react';
import useProjectStore from '../../stores/useProjectStore';
import useStoryboardStore from '../../stores/useStoryboardStore';
import useUIStore from '../../stores/useUIStore';
import { generateFromPremise, getStoryboard } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';

const GENRE_SUGGESTIONS = ['Noir', 'Thriller', 'Romance', 'Horror', 'Sci-Fi', 'Drama'];

export default function ScriptGenerator() {
  const [genre, setGenre] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [premise, setPremise] = useState('');
  const [numScenes, setNumScenes] = useState(4);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const { currentProject } = useProjectStore();
  const { setGenerationStatus, setProgress, resetGeneration, setScript } = useStoryboardStore();

  const handleGenerate = async () => {
    if (!premise.trim() || !genre.trim()) return;
    setError(null);
    resetGeneration();
    setGenerationStatus('generating');

    abortControllerRef.current = new AbortController();

    try {
      const scriptId = await generateFromPremise(
        {
          genre: genre.trim(),
          premise: premise.trim(),
          num_scenes: numScenes,
          project_id: currentProject?.id || null,
        },
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
        abortControllerRef.current.signal,
      );
    } catch (e) {
      setError(e.message);
      setGenerationStatus('error');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-cutai-border bg-cutai-surface p-6">
      <h2 className="text-xl font-semibold text-cutai-text">Generate from Premise</h2>

      <div className="space-y-2">
        <label className="text-xs font-medium text-cutai-muted">Genre</label>
        <div className="relative">
          <input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full rounded-lg border border-cutai-border bg-cutai-bg px-3 py-2 text-sm text-cutai-text outline-none focus:border-cutai-accent"
            placeholder="e.g. noir thriller"
          />
          {showSuggestions && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-cutai-border bg-cutai-surface shadow-xl">
              {GENRE_SUGGESTIONS.filter((g) => !genre.includes(g.toLowerCase())).map((g) => (
                <button
                  key={g}
                  onMouseDown={() => {
                    setGenre((prev) => (prev ? `${prev}, ${g}` : g));
                    setShowSuggestions(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-cutai-text hover:bg-cutai-border/60"
                  type="button"
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-cutai-muted">Premise</label>
        <textarea
          value={premise}
          onChange={(e) => setPremise(e.target.value)}
          className="h-32 w-full rounded-lg border border-cutai-border bg-cutai-bg px-3 py-2 text-sm text-cutai-text outline-none focus:border-cutai-accent"
          placeholder="A detective finds a body in a dimly lit jazz bar..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-cutai-muted">
          Scenes: <span className="text-cutai-accent">{numScenes}</span>
        </label>
        <input
          type="range"
          min={1}
          max={8}
          value={numScenes}
          onChange={(e) => setNumScenes(Number(e.target.value))}
          className="w-full accent-cutai-accent"
        />
      </div>

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
          <button
            onClick={handleGenerate}
            className="mt-2 text-xs font-medium underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={useStoryboardStore.getState().generationStatus === 'generating'}
        className="w-full rounded-lg bg-cutai-accent py-3 text-sm font-semibold text-black hover:bg-cutai-accent/90 disabled:opacity-60"
      >
        Generate Storyboard
      </button>
    </div>
  );
}

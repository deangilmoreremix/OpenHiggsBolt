import { useEffect, useRef, useState } from 'react';
import { runSkill } from '../lib/promptRecipes';
import { uploadFile } from '../muapi.js';
import {
  describeWorkflowOutputs,
  estimateWorkflowCost,
  formatUsd,
  staticCostNote,
  summarizeWorkflowSteps,
} from '../lib/workflowCost';

const isVideoUrl = (url) => /\.(mp4|webm|mov)(\?|$)/i.test(url || '');

function StepOutput({ url }) {
  if (!url) return null;
  return (
    <div className="mt-2">
      {isVideoUrl(url) ? (
        <video src={url} controls className="max-h-56 rounded-md border border-white/10" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="max-h-56 rounded-md border border-white/10" />
      )}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-1 block text-xs text-[#22d3ee] hover:underline"
      >
        Open / download
      </a>
    </div>
  );
}

/**
 * Runs a multi-step ("workflow") recipe: collects its inputs, runs each step in
 * order via runSkill, and pauses at approval steps.
 */
export default function SkillRunner({ skill, apiKey, onClose }) {
  const [values, setValues] = useState({});
  const [uploading, setUploading] = useState({});
  const [steps, setSteps] = useState({});
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [approval, setApproval] = useState(null);
  const abortRef = useRef(null);
  const approvalRef = useRef(null);
  const uploadSeq = useRef({});
  const panelRef = useRef(null);
  const [liveCost, setLiveCost] = useState(null);
  const [costLoading, setCostLoading] = useState(false);

  const summary = summarizeWorkflowSteps(skill);
  const hasVideo = summary.video > 0;

  // Defaults shown in the fields count as values, so a prompt never silently
  // loses a field the user left at its displayed default.
  const effectiveValues = {
    ...Object.fromEntries(
      (skill.inputs || []).filter((i) => i.default).map((i) => [i.name, i.default]),
    ),
    ...values,
  };
  const textValuesKey = JSON.stringify(
    Object.fromEntries(
      (skill.inputs || [])
        .filter((i) => i.type === 'text')
        .map((i) => [i.name, effectiveValues[i.name] ?? '']),
    ),
  );

  // Live estimate from the estimate-cost endpoint; the static note is the fallback.
  useEffect(() => {
    if (!apiKey) {
      setLiveCost(null);
      return undefined;
    }
    let cancelled = false;
    setCostLoading(true);
    const timer = setTimeout(async () => {
      let cost = null;
      try {
        cost = await estimateWorkflowCost(apiKey, skill, JSON.parse(textValuesKey));
      } catch {
        cost = null;
      }
      if (cancelled) return;
      setLiveCost(cost);
      setCostLoading(false);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [apiKey, skill, textValuesKey]);

  const inputs = skill.inputs || [];
  const missing = inputs.filter((i) => i.required && !effectiveValues[i.name]);
  const busy = Object.values(uploading).some(Boolean);

  const setValue = (name, v) => setValues((cur) => ({ ...cur, [name]: v }));

  async function handleFile(input, file) {
    if (!file) return;
    setError('');
    // Only the most recent upload for a field may apply its result.
    const id = (uploadSeq.current[input.name] || 0) + 1;
    uploadSeq.current[input.name] = id;
    setUploading((u) => ({ ...u, [input.name]: true }));
    try {
      const url = await uploadFile(apiKey, file);
      if (uploadSeq.current[input.name] === id) setValue(input.name, url);
    } catch (e) {
      if (uploadSeq.current[input.name] === id) setError(`Upload failed: ${e?.message || e}`);
    } finally {
      if (uploadSeq.current[input.name] === id) setUploading((u) => ({ ...u, [input.name]: false }));
    }
  }

  async function handleRun() {
    if (!apiKey) {
      setError('Add your SmartVideo Go API key in Settings to run this workflow.');
      return;
    }
    setError('');
    setSteps({});
    setRunning(true);
    abortRef.current = new AbortController();
    try {
      await runSkill(
        apiKey,
        skill,
        effectiveValues,
        (i, patch) => setSteps((cur) => ({ ...cur, [i]: { ...cur[i], ...patch } })),
        {
          signal: abortRef.current.signal,
          onApproval: (i) =>
            new Promise((resolve) => {
              const pending = { index: i, resolve };
              approvalRef.current = pending;
              setApproval(pending);
            }),
        },
      );
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setRunning(false);
      approvalRef.current = null;
      setApproval(null);
    }
  }

  function decide(ok) {
    approval?.resolve(ok);
    approvalRef.current = null;
    setApproval(null);
  }

  function handleClose() {
    abortRef.current?.abort();
    approval?.resolve(false);
    onClose();
  }

  // If the runner is removed while a run is active (e.g. navigation), stop the
  // run so no further paid steps start, and release a pending approval.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      approvalRef.current?.resolve(false);
    },
    [],
  );

  // Focus: move into the dialog on open, restore to the opener on close.
  useEffect(() => {
    const opener = typeof document !== 'undefined' ? document.activeElement : null;
    panelRef.current?.focus();
    return () => {
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, []);

  // Keep Tab inside the dialog.
  function trapTab(e) {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) {
      e.preventDefault();
      panelRef.current.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // Escape closes the modal, like the Close button.
  const closeRef = useRef(handleClose);
  closeRef.current = handleClose;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const previousUrl = (index) => {
    for (let i = index - 1; i >= 0; i--) if (steps[i]?.url) return steps[i].url;
    return '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={skill.title || skill.name}
      onKeyDown={trapTab}
      onMouseDown={(e) => {
        // Backdrop click (not a click inside the panel) closes the modal.
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#0b0b0b] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{skill.title || skill.name}</h2>
            <p className="mt-1 text-sm text-white/60">{skill.description}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="rounded-md border border-white/10 px-2 py-1 text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>

        {inputs.length > 0 && (
          <div className="mt-5 space-y-3">
            {inputs.map((input) => {
              const label = input.label || input.name.replace(/_/g, ' ');
              const isFile = input.type === 'image_url' || input.type === 'video_url';
              return (
                <label key={input.name} className="block text-sm text-white/80">
                  <span className="mb-1 block capitalize">
                    {label}
                    {input.required ? ' *' : ''}
                  </span>
                  {isFile ? (
                    <div className="space-y-1">
                      <input
                        type="file"
                        accept={input.type === 'video_url' ? 'video/*' : 'image/*'}
                        disabled={running || Boolean(uploading[input.name])}
                        onChange={(e) => handleFile(input, e.target.files?.[0])}
                        className="block w-full text-xs text-white/70"
                      />
                      <input
                        type="url"
                        placeholder="…or paste a URL"
                        value={values[input.name] || ''}
                        disabled={running || Boolean(uploading[input.name])}
                        onChange={(e) => setValue(input.name, e.target.value)}
                        className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                      />
                      {uploading[input.name] && (
                        <span className="text-xs text-white/50">Uploading…</span>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={values[input.name] ?? input.default ?? ''}
                      disabled={running}
                      onChange={(e) => setValue(input.name, e.target.value)}
                      className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                    />
                  )}
                </label>
              );
            })}
          </div>
        )}

        <ol className="mt-6 space-y-3">
          {(skill.steps || []).map((step, i) => {
            const st = steps[i] || {};
            const label =
              step.type === 'approval'
                ? 'Review and approve'
                : step.type === 'script'
                  ? 'Plan'
                  : step.type === 'upload'
                    ? 'Source file'
                    : `${step.type} · ${step.endpoint || step.model || ''}`;
            return (
              <li key={i} className="rounded-lg border border-white/10 bg-black/40 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">
                    {i + 1}. {label}
                  </span>
                  <span
                    className={
                      st.status === 'error'
                        ? 'text-red-400'
                        : st.status === 'done'
                          ? 'text-emerald-400'
                          : st.status === 'running'
                            ? 'text-[#22d3ee]'
                            : 'text-white/40'
                    }
                  >
                    {st.status || 'pending'}
                  </span>
                </div>
                {st.note && <p className="mt-1 text-xs text-white/50">{st.note}</p>}
                {st.error && <p className="mt-1 text-xs text-red-400">{st.error}</p>}
                <StepOutput url={st.url} />
                {approval?.index === i && (
                  <div className="mt-3 space-y-2">
                    <StepOutput url={previousUrl(i)} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => decide(true)}
                        className="rounded-md bg-[#22d3ee] px-3 py-1.5 text-sm font-semibold text-black"
                      >
                        Approve and continue
                      </button>
                      <button
                        type="button"
                        onClick={() => decide(false)}
                        className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-white/80"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <div
          data-testid="cost-note"
          className={`mt-5 rounded-lg border p-3 text-sm ${
            hasVideo
              ? 'border-amber-400/40 bg-amber-500/10 text-amber-200'
              : 'border-white/10 bg-white/5 text-white/70'
          }`}
        >
          <p>{describeWorkflowOutputs(summary)}</p>
          <p className="mt-1">
            {liveCost !== null ? (
              <>
                Estimated cost: <strong>{formatUsd(liveCost)}</strong> per run.
              </>
            ) : costLoading && apiKey ? (
              'Estimating cost…'
            ) : (
              staticCostNote(summary)
            )}
          </p>
          {hasVideo && <p className="mt-1">Each run spends credits from your account.</p>}
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/70"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={running || busy || missing.length > 0}
            className="rounded-md bg-[#22d3ee] px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
          >
            {running ? 'Running…' : 'Run workflow'}
          </button>
        </div>
      </div>
    </div>
  );
}

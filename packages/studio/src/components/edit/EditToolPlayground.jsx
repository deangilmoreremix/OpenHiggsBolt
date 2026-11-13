"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadFile } from "../../muapi.js";
import { getUploadAcceptAttribute, isAllowedUploadMimeType } from "../../uploadContract.js";
import {
  EDIT_TOOLS,
  editToolModelKey,
  getDefaultEditToolModel,
  getEditToolModels,
} from "../../editTools.js";
import {
  getDefaultEditToolValues,
  getEditToolFields,
  getEditToolPrompt,
  getEditToolSlots,
  runEditTool,
  validateEditToolInput,
} from "../../editToolRunner.js";
import { ModelParameterFields } from "../ModelParameterControls.jsx";
import EditToolIcon from "./EditToolIcon.jsx";
import AssetLibraryButton from "../AssetLibraryButton.jsx";

const CATALOG_LABELS = {
  t2i: "Text to image",
  i2i: "Image to image",
  t2v: "Text to video",
  i2v: "Image to video",
  v2v: "Video to video",
  lipsync: "Lip sync",
  motion: "Motion control",
  audio: "Audio",
};

const PANEL = "rounded-xl border border-white/10 bg-white/[0.03] p-4";
const LABEL = "mb-2 block text-[11px] font-bold uppercase tracking-wider text-white/50";

function requireApiKey() {
  toast.error("Add your muapi API key to run this tool.");
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("muapi:auth-required", {
        detail: { status: 401, message: "Add your muapi API key to run Edit tools." },
      }),
    );
  }
}

function MediaPreview({ url, type, className = "" }) {
  if (type === "video") {
    return <video src={url} className={className} controls playsInline loop />;
  }
  if (type === "audio") {
    return (
      <div className={`flex items-center justify-center p-6 ${className}`}>
        <audio src={url} controls className="w-full" />
      </div>
    );
  }
  return <img src={url} alt="Result" className={className} />;
}

function UploadSlot({ slot, urls, progress, onFiles, onRemove, onAddUrl }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [pasted, setPasted] = useState("");
  const full = urls.length >= slot.max;
  const replace = slot.max === 1 && urls.length === 1;

  return (
    <div>
      <span className={LABEL}>
        {slot.label}
        {slot.required ? <span className="text-[#22d3ee]"> *</span> : <span className="normal-case text-white/30"> (optional)</span>}
        {slot.max > 1 && <span className="normal-case text-white/30"> · up to {slot.max}</span>}
      </span>
      {urls.length > 0 && (
        <div className="mb-2 grid grid-cols-3 gap-2">
          {urls.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-black">
              {slot.kind === "image" ? (
                <img src={url} alt="" className="h-full w-full object-cover" />
              ) : slot.kind === "video" ? (
                <video src={url} className="h-full w-full object-cover" muted playsInline />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/60">
                  <EditToolIcon name="music" className="h-8 w-8" />
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemove(url)}
                aria-label="Remove"
                className="absolute right-1 top-1 rounded-full bg-black/70 px-2 text-xs text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {(!full || replace) && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDragging(false);
            if (event.dataTransfer.files?.length) onFiles(event.dataTransfer.files);
          }}
          className={`flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center transition-colors ${
            dragging ? "border-[#22d3ee] bg-[#22d3ee]/10" : "border-white/15 bg-white/[0.02] hover:border-white/30"
          }`}
        >
          {progress != null ? (
            <span className="text-xs font-semibold text-[#22d3ee]">Uploading… {progress}%</span>
          ) : (
            <>
              <span className="text-xs font-semibold text-white/80">
                {replace ? "Replace" : "Upload"} {slot.kind}
              </span>
              <span className="text-[10px] text-white/40">Click or drop a file here</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={getUploadAcceptAttribute(slot.kind)}
        multiple={slot.max > 1}
        onChange={(event) => {
          if (event.target.files?.length) onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {(!full || replace) && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const value = pasted.trim();
            if (!/^https?:\/\//i.test(value)) {
              toast.error("Paste a full http(s) URL.");
              return;
            }
            onAddUrl(value);
            setPasted("");
          }}
        >
          <input
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            placeholder={`or paste ${slot.kind === "video" ? "a" : "an"} ${slot.kind} URL`}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white outline-none focus:border-[#22d3ee]/50"
          />
          <button type="submit" className="rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/70 hover:text-white">
            Add
          </button>
          {/* Saved uploads and generations, shared by every studio */}
          <AssetLibraryButton kinds={[slot.kind]} label="Saved" onSelect={(asset) => onAddUrl(asset.url)} />
        </form>
      )}
    </div>
  );
}

export default function EditToolPlayground({
  tool,
  apiKey,
  onBack,
  onOpenTool,
  onGenerationStart,
  onGenerationEnd,
  onGenerationComplete,
  onGenerationError,
}) {
  const models = useMemo(() => getEditToolModels(tool), [tool]);
  const [modelKey, setModelKey] = useState(() => editToolModelKey(getDefaultEditToolModel(tool)));
  const selected = models.find((entry) => editToolModelKey(entry) === modelKey) || models[0] || null;
  const catalog = selected?.catalog;
  const model = selected?.model;

  const slots = useMemo(() => getEditToolSlots(catalog, model), [catalog, model]);
  const promptConfig = useMemo(() => getEditToolPrompt(catalog, model), [catalog, model]);
  const fields = useMemo(() => getEditToolFields(catalog, model), [catalog, model]);

  const [prompt, setPrompt] = useState("");
  const [uploads, setUploads] = useState({});
  const [uploading, setUploading] = useState({});
  const [values, setValues] = useState(() => getDefaultEditToolValues(catalog, model));
  const [runs, setRuns] = useState([]);
  const [activeRunId, setActiveRunId] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // A new model keeps uploads whose slot still exists and resets parameters.
  useEffect(() => {
    setValues(getDefaultEditToolValues(catalog, model));
    setUploads((previous) => {
      const next = {};
      for (const slot of getEditToolSlots(catalog, model)) {
        if (previous[slot.key]?.length) next[slot.key] = previous[slot.key].slice(0, slot.max);
      }
      return next;
    });
  }, [catalog, model]);

  const running = runs.some((run) => run.status === "running");
  useEffect(() => {
    if (!running) return undefined;
    const startedAt = Date.now();
    setElapsed(0);
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const addUrls = (slot, urls) => {
    setUploads((previous) => {
      const current = slot.max === 1 ? [] : previous[slot.key] || [];
      return { ...previous, [slot.key]: [...current, ...urls].slice(0, slot.max) };
    });
  };

  const handleFiles = async (slot, fileList) => {
    if (!apiKey) {
      requireApiKey();
      return;
    }
    const existing = slot.max === 1 ? 0 : (uploads[slot.key] || []).length;
    const files = Array.from(fileList).slice(0, Math.max(1, slot.max - existing));
    for (const file of files) {
      if (!isAllowedUploadMimeType(file, slot.kind)) {
        toast.error(`${file.name}: please choose a ${slot.kind} file.`);
        continue;
      }
      setUploading((previous) => ({ ...previous, [slot.key]: 0 }));
      try {
        const url = await uploadFile(apiKey, file, (pct) => {
          if (mountedRef.current) setUploading((previous) => ({ ...previous, [slot.key]: pct }));
        });
        if (mountedRef.current) addUrls(slot, [url]);
      } catch (error) {
        toast.error(error?.message || "Upload failed");
      } finally {
        if (mountedRef.current) {
          setUploading((previous) => {
            const next = { ...previous };
            delete next[slot.key];
            return next;
          });
        }
      }
    }
  };

  const removeUrl = (slot, url) => {
    setUploads((previous) => ({ ...previous, [slot.key]: (previous[slot.key] || []).filter((item) => item !== url) }));
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      requireApiKey();
      return;
    }
    const problem = validateEditToolInput(catalog, model, { prompt, uploads });
    if (problem) {
      toast.error(problem);
      return;
    }
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setRuns((previous) => [
      { id: runId, status: "running", modelName: model.name, prompt, outputs: [], requestId: null, startedAt: Date.now() },
      ...previous,
    ]);
    setActiveRunId(runId);
    onGenerationStart?.();
    try {
      const result = await runEditTool(apiKey, {
        catalog,
        model,
        prompt,
        uploads,
        values,
        onRequestId: (requestId) => {
          if (mountedRef.current) {
            setRuns((previous) => previous.map((run) => (run.id === runId ? { ...run, requestId } : run)));
          }
        },
      });
      if (mountedRef.current) {
        setRuns((previous) =>
          previous.map((run) => (run.id === runId ? { ...run, status: "done", outputs: result.outputs } : run)),
        );
      }
      onGenerationComplete?.({ url: result.outputs[0]?.url, tool: tool.slug, model: model.id });
    } catch (error) {
      const message = error?.message || "Generation failed";
      if (mountedRef.current) {
        setRuns((previous) => previous.map((run) => (run.id === runId ? { ...run, status: "error", error: message } : run)));
        toast.error(message);
      }
      onGenerationError?.(message);
    } finally {
      onGenerationEnd?.();
    }
  };

  const activeRun = runs.find((run) => run.id === activeRunId) || runs[0] || null;
  const firstSlotFor = (type) => slots.find((slot) => slot.kind === type);

  const multipleCatalogs = new Set(models.map((entry) => entry.catalog)).size > 1;
  const grouped = models.reduce((groups, entry) => {
    (groups[entry.catalog] ||= []).push(entry);
    return groups;
  }, {});

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 hover:text-white"
          >
            ← All tools
          </button>
          <div className={`hidden rounded-xl bg-gradient-to-br p-2.5 text-white sm:block ${tool.gradient}`}>
            <EditToolIcon name={tool.icon} className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{tool.name}</h1>
            <p className="text-xs text-white/50">{tool.description}</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-white/50">
          <span className="whitespace-nowrap">Switch tool</span>
          <select
            value={tool.slug}
            onChange={(event) => onOpenTool(event.target.value)}
            className="rounded-lg border border-white/10 bg-[#111] px-2 py-1.5 text-xs text-white outline-none"
          >
            {EDIT_TOOLS.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="flex flex-col gap-4">
          {models.length > 1 && (
            <div className={PANEL}>
              <label className={LABEL} htmlFor={`edit-model-${tool.slug}`}>
                Model
              </label>
              <select
                id={`edit-model-${tool.slug}`}
                value={modelKey}
                onChange={(event) => setModelKey(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#22d3ee]/50"
              >
                {multipleCatalogs
                  ? Object.entries(grouped).map(([group, entries]) => (
                      <optgroup key={group} label={CATALOG_LABELS[group] || group}>
                        {entries.map((entry) => (
                          <option key={editToolModelKey(entry)} value={editToolModelKey(entry)}>
                            {entry.model.name}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  : models.map((entry) => (
                      <option key={editToolModelKey(entry)} value={editToolModelKey(entry)}>
                        {entry.model.name}
                      </option>
                    ))}
              </select>
              {model?.description && <p className="mt-2 text-[11px] leading-relaxed text-white/40">{model.description}</p>}
            </div>
          )}

          {slots.length > 0 && (
            <div className={`${PANEL} flex flex-col gap-4`}>
              {slots.map((slot) => (
                <UploadSlot
                  key={slot.key}
                  slot={slot}
                  urls={uploads[slot.key] || []}
                  progress={uploading[slot.key]}
                  onFiles={(files) => handleFiles(slot, files)}
                  onRemove={(url) => removeUrl(slot, url)}
                  onAddUrl={(url) => addUrls(slot, [url])}
                />
              ))}
            </div>
          )}

          {promptConfig.show && (
            <div className={PANEL}>
              <label className={LABEL} htmlFor={`edit-prompt-${tool.slug}`}>
                Prompt
                {promptConfig.required ? <span className="text-[#22d3ee]"> *</span> : <span className="normal-case text-white/30"> (optional)</span>}
              </label>
              <textarea
                id={`edit-prompt-${tool.slug}`}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={promptConfig.placeholder}
                rows={4}
                className="w-full resize-y rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#22d3ee]/50"
              />
            </div>
          )}

          {fields.length > 0 && (
            <div className={PANEL}>
              <span className={LABEL}>Settings</span>
              <ModelParameterFields
                inputs={fields}
                values={values}
                onChange={(key, value) => setValues((previous) => ({ ...previous, [key]: value }))}
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={Object.keys(uploading).length > 0}
            className="rounded-xl bg-[#25280e] text-white ring-1 ring-inset ring-[#586608] hover:bg-[#2f3410] hover:ring-[#d9ff00]/70 px-4 py-3 text-sm font-black transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running ? "Run again" : "Generate"}
          </button>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className={`${PANEL} flex flex-col`}>
            <span className={LABEL}>Result</span>
            <div className="flex min-h-[360px] items-center justify-center overflow-hidden rounded-lg bg-black/40 lg:min-h-[480px]">
              {!activeRun && (
                <div className="flex flex-col items-center gap-3 p-10 text-center text-white/40">
                  <EditToolIcon name={tool.icon} className="h-12 w-12" />
                  <p className="text-sm">Your result will appear here.</p>
                </div>
              )}
              {activeRun?.status === "running" && (
                <div className="flex flex-col items-center gap-3 p-10 text-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#22d3ee]" />
                  <p className="text-sm font-semibold text-white/80">Generating… {elapsed}s</p>
                  {activeRun.requestId && <p className="text-[10px] text-white/30">Request {activeRun.requestId}</p>}
                </div>
              )}
              {activeRun?.status === "error" && (
                <p className="max-w-md p-10 text-center text-sm text-red-300">{activeRun.error}</p>
              )}
              {activeRun?.status === "done" && (
                <div className={`grid w-full gap-2 p-2 ${activeRun.outputs.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {activeRun.outputs.map((output) => (
                    <div key={output.url} className="flex flex-col gap-2">
                      <MediaPreview url={output.url} type={output.type} className="max-h-[65vh] w-full rounded-lg object-contain" />
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={output.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white"
                        >
                          Download
                        </a>
                        {firstSlotFor(output.type) && (
                          <button
                            type="button"
                            onClick={() => {
                              addUrls(firstSlotFor(output.type), [output.url]);
                              toast.success("Added as input.");
                            }}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white"
                          >
                            Use as input
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {runs.length > 1 && (
            <div className={PANEL}>
              <span className={LABEL}>This session</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {runs.map((run) => (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => setActiveRunId(run.id)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border ${
                      run.id === activeRun?.id ? "border-[#22d3ee]" : "border-white/10"
                    } bg-black`}
                    title={run.modelName}
                  >
                    {run.status === "done" && run.outputs[0]?.type === "image" ? (
                      <img src={run.outputs[0].url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white/50">
                        {run.status === "running" ? "…" : run.status === "error" ? "Error" : run.outputs[0]?.type || ""}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

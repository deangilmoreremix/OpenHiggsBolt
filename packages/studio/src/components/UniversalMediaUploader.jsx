"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadFile } from "../muapi.js";
import { formatErrorMessage } from "../utils/formatError.js";

const HISTORY_KEY = "smartvideo_media_upload_history_v1";
const DRAFT_KEY = "smartvideo_media_slot_drafts_v1";
const HISTORY_LIMIT = 40;
const DEFAULT_MAX_BYTES = {
  image: 20 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
};

function readHistory() {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeHistory(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
  } catch {
    // Storage is a convenience only; upload still succeeds when storage is unavailable.
  }
}

function readDrafts() {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(DRAFT_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function writeDraft(draftKey, urls) {
  if (typeof window === "undefined" || !draftKey) return;
  try {
    const drafts = readDrafts();
    if (urls.length) drafts[draftKey] = urls;
    else delete drafts[draftKey];
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  } catch {
    // Draft persistence is a convenience only.
  }
}

function matchesMediaType(file, mediaType) {
  return Boolean(file?.type?.startsWith(`${mediaType}/`));
}

function Preview({ type, url }) {
  if (type === "video") {
    return <video src={url} muted playsInline className="h-full w-full object-cover" />;
  }
  if (type === "audio") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white/[0.04] text-[#22d3ee]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M9 18V5l10-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="16" cy="16" r="3" />
        </svg>
      </div>
    );
  }
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

export default function UniversalMediaUploader({
  apiKey,
  slot,
  values = [],
  onChange,
  disabled = false,
  maxBytes,
  showHistory = true,
  className = "",
}) {
  const inputRef = useRef(null);
  const dragDepth = useRef(0);
  const intentionalClearRef = useRef(false);
  const previousValuesRef = useRef(values);
  const hydratedDraftKeyRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);

  const mediaType = slot?.mediaType || "image";
  const label = slot?.label || "Media";
  const role = slot?.role || slot?.id || "reference";
  const limit = Math.max(1, Number(slot?.maxItems || 1));
  const remaining = Math.max(limit - values.length, 0);
  const accepted = `${mediaType}/*`;
  const sizeLimit = maxBytes || DEFAULT_MAX_BYTES[mediaType] || DEFAULT_MAX_BYTES.image;
  // Workflow slots carry provider field metadata. Inline/base uploaders do not,
  // so only workflow-scoped controls automatically restore drafts.
  const slotDraftKey = slot?.field
    ? `${mediaType}:${slot.id || role}:${slot.field}:${slot.index ?? "all"}`
    : null;
  const history = useMemo(
    () => readHistory().filter((item) => item.type === mediaType),
    [historyOpen, historyVersion, mediaType],
  );

  useEffect(() => {
    if (!slotDraftKey || typeof window === "undefined") {
      previousValuesRef.current = values;
      return;
    }

    const previous = previousValuesRef.current || [];
    const changedSlot = hydratedDraftKeyRef.current !== slotDraftKey;
    const externallyReset = !changedSlot && previous.length > 0 && values.length === 0 && !intentionalClearRef.current;

    if (changedSlot || externallyReset) {
      hydratedDraftKeyRef.current = slotDraftKey;
      const stored = readDrafts()[slotDraftKey];
      if (values.length === 0 && Array.isArray(stored) && stored.length > 0) {
        const restored = [...new Set(stored.filter(Boolean))].slice(0, limit);
        previousValuesRef.current = restored;
        onChange?.(restored);
        intentionalClearRef.current = false;
        return;
      }
    }

    writeDraft(slotDraftKey, values);
    previousValuesRef.current = values;
    intentionalClearRef.current = false;
  }, [limit, onChange, slotDraftKey, values]);

  const updateHistory = (entries) => {
    const existing = readHistory();
    const urls = new Set(entries.map((item) => item.url));
    writeHistory([...entries, ...existing.filter((item) => !urls.has(item.url))]);
    setHistoryVersion((version) => version + 1);
  };

  const uploadFiles = async (files) => {
    if (!apiKey) {
      toast.error("Add your MuAPI key before uploading media.");
      return;
    }
    if (disabled || uploading || remaining <= 0) return;

    const candidates = Array.from(files || [])
      .filter((file) => matchesMediaType(file, mediaType))
      .slice(0, remaining);
    if (candidates.length === 0) {
      toast.error(`Drop or choose a ${mediaType} file for ${label}.`);
      return;
    }
    const tooLarge = candidates.find((file) => file.size > sizeLimit);
    if (tooLarge) {
      toast.error(`${tooLarge.name} exceeds the ${Math.round(sizeLimit / 1024 / 1024)}MB upload limit.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const perFile = new Array(candidates.length).fill(0);
      const urls = await Promise.all(
        candidates.map((file, index) =>
          uploadFile(apiKey, file, (value) => {
            perFile[index] = Number(value || 0);
            setProgress(Math.round(perFile.reduce((sum, item) => sum + item, 0) / perFile.length));
          }),
        ),
      );
      const validUrls = urls.filter(Boolean);
      const next = [...new Set([...values, ...validUrls])].slice(0, limit);
      onChange?.(next);
      updateHistory(
        validUrls.map((url, index) => ({
          url,
          type: mediaType,
          role,
          name: candidates[index]?.name || label,
          createdAt: new Date().toISOString(),
        })),
      );
    } catch (error) {
      toast.error(formatErrorMessage(error, `${label} upload failed`));
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (index) => {
    intentionalClearRef.current = true;
    onChange?.(values.filter((_, itemIndex) => itemIndex !== index));
  };

  const selectHistory = (item) => {
    if (remaining <= 0) return;
    onChange?.([...new Set([...values, item.url])].slice(0, limit));
    setHistoryOpen(false);
  };

  return (
    <div className={`relative flex min-w-[74px] flex-col gap-1.5 ${className}`}>
      <div className="flex min-h-[62px] items-center gap-2">
        {values.map((url, index) => (
          <div key={`${url}:${index}`} className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <Preview type={mediaType} url={url} />
            <button
              type="button"
              aria-label={`Remove ${label}`}
              onClick={() => removeAt(index)}
              className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/75 text-[10px] text-white opacity-80 hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (disabled || uploading) return;
              dragDepth.current += 1;
              setDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              event.stopPropagation();
              dragDepth.current = Math.max(0, dragDepth.current - 1);
              if (dragDepth.current === 0) setDragging(false);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              dragDepth.current = 0;
              setDragging(false);
              void uploadFiles(event.dataTransfer?.files);
            }}
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              dragging
                ? "scale-105 border-[#22d3ee] bg-[#22d3ee]/15 ring-2 ring-[#22d3ee]/30"
                : "border-white/15 bg-white/[0.03] text-white/45 hover:border-[#22d3ee]/50 hover:text-[#22d3ee]"
            }`}
            title={`Upload ${label}`}
          >
            {uploading ? (
              <div className="flex flex-col items-center text-[9px] font-bold text-[#22d3ee]">
                <span>{progress}%</span>
              </div>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
          </button>
        )}

        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept={accepted}
          multiple={remaining > 1}
          onChange={(event) => void uploadFiles(event.target.files)}
        />

        {showHistory && remaining > 0 && history.length > 0 && (
          <button
            type="button"
            onClick={() => setHistoryOpen((open) => !open)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/45 hover:text-white"
            title={`Choose previous ${mediaType}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5M12 7v5l3 2" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 text-[10px] font-semibold text-white/45">
        <span>{label}</span>
        {slot?.required && <span className="text-[#22d3ee]">*</span>}
        <span className="text-white/20">{values.length}/{limit}</span>
      </div>

      {historyOpen && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 z-[80] w-72 rounded-2xl border border-white/10 bg-[#101014]/95 p-3 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/35">Recent {mediaType}s</div>
          <div className="grid max-h-52 grid-cols-4 gap-2 overflow-y-auto">
            {history.map((item) => (
              <button
                type="button"
                key={`${item.url}:${item.createdAt}`}
                onClick={() => selectHistory(item)}
                className="h-14 overflow-hidden rounded-lg border border-white/10 bg-black/30 hover:border-[#22d3ee]/50"
                title={item.name || label}
              >
                <Preview type={mediaType} url={item.url} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

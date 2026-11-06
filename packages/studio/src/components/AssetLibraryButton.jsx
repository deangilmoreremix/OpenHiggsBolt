"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PromptPopover, promptControlClassName } from "./prompt/PromptComposer.jsx";
import { listAssets, deleteAsset, onLibraryChanged } from "../lib/assetStore.js";

const KIND_LABELS = { image: "Images", video: "Videos", audio: "Audio" };

function AssetThumb({ asset }) {
  if (asset.kind === "video") {
    return <video src={asset.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />;
  }
  if (asset.kind === "audio") {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#22d3ee] text-lg" aria-hidden="true">
        ♪
      </div>
    );
  }
  return <img src={asset.url} alt={asset.name || ""} className="w-full h-full object-cover" loading="lazy" />;
}

/**
 * "Library" button for any studio that takes images, video or audio: opens the user's saved uploads and
 * generated results (shared by every studio, kept server-side) and hands the chosen one back.
 *
 * Props: `kinds` which media types to offer (tabs when more than one); `onSelect(asset)` with
 * `{ id, kind, url, name, source }`; `label` button text.
 */
export default function AssetLibraryButton({ kinds = ["image"], onSelect, label = "Library", className = "" }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(kinds[0]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await listAssets({ kind });
    setAssets(next);
    setLoading(false);
  }, [kind]);

  useEffect(() => {
    if (!open) return undefined;
    refresh();
    return onLibraryChanged(refresh);
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  const remove = async (e, asset) => {
    e.stopPropagation();
    if (await deleteAsset(asset.id)) setAssets((prev) => prev.filter((a) => a.id !== asset.id));
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        title="Your saved uploads and generations"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={promptControlClassName({ className: `border-[#22d3ee]/30 ${className}` })}
      >
        <span className="text-xs font-semibold text-[#22d3ee]/80">{label}</span>
      </button>

      {open && (
        <PromptPopover className="w-96 max-w-[calc(100vw-2rem)] p-3 flex flex-col gap-2.5 z-50" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-xs font-bold text-white">Your library</span>
            {kinds.length > 1 && (
              <div className="flex items-center gap-1" role="tablist">
                {kinds.map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={k === kind}
                    onClick={() => setKind(k)}
                    className={`px-2 py-1 rounded-full text-[11px] font-bold border ${
                      k === kind ? "border-[#22d3ee]/60 text-[#22d3ee] bg-[#22d3ee]/10" : "border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    {KIND_LABELS[k] || k}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading && assets.length === 0 ? (
            <div className="py-6 text-center text-xs text-white/50">Loading…</div>
          ) : assets.length === 0 ? (
            <div className="py-6 text-center text-xs text-white/50">
              Nothing saved yet. Files you upload and things you generate show up here.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-0.5">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  title={asset.name || asset.kind}
                  className="relative group/asset aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50 cursor-pointer hover:border-[#22d3ee]/60"
                >
                  <button
                    type="button"
                    className="absolute inset-0 w-full h-full"
                    aria-label={`Use ${asset.name || asset.kind}`}
                    onClick={() => {
                      onSelect?.(asset);
                      setOpen(false);
                    }}
                  >
                    <AssetThumb asset={asset} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${asset.name || asset.kind} from the library`}
                    onClick={(e) => remove(e, asset)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 hover:bg-red-500 text-white text-[10px] leading-none flex items-center justify-center border border-white/20"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </PromptPopover>
      )}
    </div>
  );
}

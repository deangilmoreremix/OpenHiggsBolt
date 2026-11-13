"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";
import {
  EDIT_TOOLS,
  EDIT_TOOL_CATEGORIES,
  getEditToolBySlug,
  getEditToolModels,
} from "../../editTools.js";
import EditToolIcon from "./EditToolIcon.jsx";
import EditToolPlayground from "./EditToolPlayground.jsx";

const BASE_PATH = "/studio/edit";

// The tool slug lives in the URL (/studio/edit/<slug>) so every tool can be
// bookmarked and shared, and the browser back button returns to the gallery.
function readSlugFromLocation() {
  if (typeof window === "undefined") return null;
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments[0] !== "studio" || segments[1] !== "edit") return null;
  return getEditToolBySlug(segments[2]) ? segments[2] : null;
}

export function EditToolCard({ tool, onOpen }) {
  const modelCount = useMemo(() => getEditToolModels(tool).length, [tool]);
  // Gradient + icon show until the AI thumbnail loads, and stay if it fails.
  const [thumbnailState, setThumbnailState] = useState("loading");
  return (
    <article>
      <button
        type="button"
        onClick={() => onOpen(tool.slug)}
        aria-label={`Open ${tool.name}`}
        className="group flex w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#22d3ee]/40 hover:shadow-xl hover:shadow-[#22d3ee]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#22d3ee]"
      >
        <div className={`relative aspect-video w-full overflow-hidden bg-gradient-to-br ${tool.gradient}`}>
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl border border-white/20 bg-black/30 p-4 text-white shadow-2xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <EditToolIcon name={tool.icon} className="h-10 w-10" />
            </div>
          </div>
          {tool.thumbnail && thumbnailState !== "failed" && (
            <img
              src={tool.thumbnail}
              alt=""
              loading="lazy"
              onLoad={() => setThumbnailState("loaded")}
              onError={() => setThumbnailState("failed")}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
                thumbnailState === "loaded" ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
          {thumbnailState === "loaded" && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          )}
          <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
            {tool.media}
          </span>
          <span className="absolute bottom-3 right-3 translate-y-2 rounded-full bg-[#25280e] ring-1 ring-inset ring-[#586608] px-3 py-1 text-[11px] font-bold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            Open playground →
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="text-sm font-bold text-white">{tool.name}</h3>
          <p className="text-xs text-white/50">{tool.hint}</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
            {modelCount === 1 ? "1 model" : `${modelCount} models`}
          </p>
        </div>
      </button>
    </article>
  );
}

export function EditToolGallery({ onOpen }) {
  const [category, setCategory] = useState("All");
  const tools = category === "All" ? EDIT_TOOLS : EDIT_TOOLS.filter((tool) => tool.media === category);
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#22d3ee]">Edit Studio</p>
          <h1 id="edit-gallery-heading" className="mt-1 text-2xl font-black text-white md:text-3xl">
            AI tools, one click away
          </h1>
          <p className="mt-1 text-sm text-white/50">Pick a tool to open its playground.</p>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter tools">
          {EDIT_TOOL_CATEGORIES.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={category === name}
              onClick={() => setCategory(name)}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                category === name
                  ? "border-[#22d3ee] bg-[#22d3ee]/15 text-[#22d3ee]"
                  : "border-white/10 bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </header>
      <section aria-labelledby="edit-gallery-heading" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => (
          <EditToolCard key={tool.slug} tool={tool} onOpen={onOpen} />
        ))}
      </section>
    </div>
  );
}

export default function EditStudio({
  apiKey,
  active = true,
  initialTool = null,
  onGenerationStart,
  onGenerationEnd,
  onGenerationComplete,
  onGenerationError,
}) {
  const [slug, setSlug] = useState(() => readSlugFromLocation() || (getEditToolBySlug(initialTool) ? initialTool : null));

  useEffect(() => {
    const onPopState = () => {
      const segments = window.location.pathname.split("/").filter(Boolean);
      if (segments[0] === "studio" && segments[1] === "edit") setSlug(readSlugFromLocation());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Returning to the Edit tab keeps the open tool; restore its URL, which the
  // shell reset to /studio/edit when the tab was clicked.
  useEffect(() => {
    if (!active || !slug || typeof window === "undefined") return;
    if (window.location.pathname === BASE_PATH) {
      window.history.replaceState(null, "", `${BASE_PATH}/${slug}`);
    }
  }, [active, slug]);

  const navigate = useCallback((nextSlug) => {
    setSlug(nextSlug);
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/studio")) {
      const target = nextSlug ? `${BASE_PATH}/${nextSlug}` : BASE_PATH;
      if (window.location.pathname !== target) window.history.pushState(null, "", target);
    }
    if (typeof window !== "undefined") window.scrollTo?.(0, 0);
  }, []);

  const tool = slug ? getEditToolBySlug(slug) : null;

  return (
    <div className="h-full w-full overflow-y-auto bg-[#050505] text-white">
      {tool ? (
        <EditToolPlayground
          key={tool.slug}
          tool={tool}
          apiKey={apiKey}
          onBack={() => navigate(null)}
          onOpenTool={navigate}
          onGenerationStart={onGenerationStart}
          onGenerationEnd={onGenerationEnd}
          onGenerationComplete={onGenerationComplete}
          onGenerationError={onGenerationError}
        />
      ) : (
        <EditToolGallery onOpen={navigate} />
      )}
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{
          duration: 5000,
          style: {
            background: "#18181b",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.15)",
            fontSize: "13px",
            borderRadius: "12px",
          },
        }}
      />
    </div>
  );
}

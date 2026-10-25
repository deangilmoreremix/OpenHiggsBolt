import React, { useCallback, useMemo, useState } from "react";
import {
  MOTION_CATEGORIES,
  MOTION_TEMPLATE_CARDS,
  MOTION_TEMPLATES,
  motionTemplateVariants,
  resolveMotionTemplate,
  type MotionCategoryKey,
  type MotionTemplate,
} from "@/data/motionRecipeCatalog";
import MotionRecipeCard from "../components/MotionRecipeCard";
import { useStore } from "../store";
import {
  loadSavedRecipes,
  removeRecipe,
  renameRecipe,
  saveRecipe,
  type SavedRecipe,
} from "../lib/savedRecipes";

interface LibraryPanelProps {
  categories?: readonly MotionCategoryKey[];
  onSelectRecipe: (recipe: MotionTemplate) => void;
  onRenameRecipe?: (recipe: MotionTemplate) => void;
  onDeleteRecipe?: (id: string) => void;
  /** Insert the shot on the timeline at the playhead (library → timeline). */
  onAddToTimeline?: (recipe: MotionTemplate) => void;
}

const TABS: { id: LibraryTab; label: string }[] = [
  { id: "templates", label: "Templates" },
  { id: "recipes", label: "My Motion Recipes" },
  { id: "community", label: "Community" },
];

type LibraryTab = "templates" | "recipes" | "community";
type CategoryFilter = MotionCategoryKey | "all";

const matchesQuery = (t: MotionTemplate, q: string) =>
  t.name.toLowerCase().includes(q) ||
  t.nameEn.toLowerCase().includes(q) ||
  t.slug.toLowerCase().includes(q) ||
  t.summary.toLowerCase().includes(q) ||
  t.summaryEn.toLowerCase().includes(q) ||
  t.componentName.toLowerCase().includes(q);

export default function LibraryPanel({
  categories,
  onSelectRecipe,
  onRenameRecipe,
  onDeleteRecipe,
  onAddToTimeline,
}: LibraryPanelProps) {
  const [tab, setTab] = useState<LibraryTab>("templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [saved, setSaved] = useState<SavedRecipe[]>(() => loadSavedRecipes());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  /** Recipes the user already used in a session — they belong to "My Recipes"
   *  too, so the tab is never empty for someone who has built something. */
  const sessions = useStore((s) => s.sessions);
  const sessionRecipeIds = useMemo(
    () => sessions.map((sess) => sess.recipeId).filter((id): id is string => Boolean(id)),
    [sessions],
  );

  /** Each tab reads a different source:
   *  - Templates  → the 124 grouped cards (a card groups its shot variants)
   *  - Community  → the 151 individual shots
   *  - My Recipes → the shots the user saved (localStorage) plus the recipes
   *                 their sessions were built from */
  const source = useMemo<readonly MotionTemplate[]>(() => {
    if (tab === "templates") {
      const list = categories?.length
        ? MOTION_TEMPLATE_CARDS.filter((t) => categories.includes(t.category))
        : MOTION_TEMPLATE_CARDS;
      return list;
    }
    if (tab === "community") {
      return categories?.length
        ? MOTION_TEMPLATES.filter((t) => categories.includes(t.category))
        : MOTION_TEMPLATES;
    }
    const out: MotionTemplate[] = [];
    const seen = new Set<string>();
    for (const rec of saved) {
      const template = resolveMotionTemplate(rec.id);
      if (!template || seen.has(template.id)) continue;
      seen.add(template.id);
      out.push(template);
    }
    for (const id of sessionRecipeIds) {
      const template = resolveMotionTemplate(id);
      if (!template || seen.has(template.id)) continue;
      seen.add(template.id);
      out.push(template);
    }
    return out;
  }, [tab, categories, saved, sessionRecipeIds]);

  /** Per-category counts for the active source (the chips read as a rail). */
  const counts = useMemo(() => {
    const map = new Map<MotionCategoryKey, number>();
    for (const t of source) map.set(t.category, (map.get(t.category) ?? 0) + 1);
    return map;
  }, [source]);

  const recipes = useMemo(() => {
    let list = source;
    if (category !== "all") list = list.filter((t) => t.category === category);
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((t) => matchesQuery(t, q));
    return list;
  }, [source, category, searchQuery]);

  const savedIds = useMemo(() => new Set(saved.map((r) => r.id)), [saved]);

  const handleSave = useCallback((recipe: MotionTemplate) => {
    setSaved(saveRecipe(recipe.id));
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (onDeleteRecipe) {
        onDeleteRecipe(id);
        return;
      }
      setSaved(removeRecipe(id));
    },
    [onDeleteRecipe],
  );

  const handleRename = useCallback(
    (recipe: MotionTemplate) => {
      if (onRenameRecipe) {
        onRenameRecipe(recipe);
        return;
      }
      const current = saved.find((r) => r.id === recipe.id)?.name ?? recipe.name;
      const next = window.prompt("Rename recipe", current);
      if (next === null) return;
      setSaved(renameRecipe(recipe.id, next.trim() || current));
    },
    [onRenameRecipe, saved],
  );

  const toggleVariants = useCallback((recipe: MotionTemplate) => {
    setExpanded((prev) => ({ ...prev, [recipe.id]: !prev[recipe.id] }));
  }, []);

  const emptyMessage =
    tab === "recipes" && source.length === 0
      ? "No saved recipes yet — save a shot from Templates or Community to pin it here."
      : "No recipes found";

  return (
    <div className="library-panel p-4 bg-[#0a0a0a] text-white min-h-full">
      <div className="library-toolbar mb-4 flex flex-col gap-3">
        <div className="library-tabs flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-[#22d3ee] text-black"
                  : "bg-white/[0.05] text-white/60 hover:bg-white/[0.1]"
              }`}
              onClick={() => {
                setTab(t.id);
                setCategory("all");
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="library-search relative w-full">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:border-[#22d3ee] focus:outline-none focus:ring-1 focus:ring-[#22d3ee]"
          />
        </div>
        <div className="library-categories flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
              category === "all"
                ? "border-[#22d3ee]/60 bg-[#22d3ee]/10 text-[#22d3ee]"
                : "border-white/[0.08] text-white/50 hover:text-white/80"
            }`}
          >
            All <span className="opacity-60">{source.length}</span>
          </button>
          {MOTION_CATEGORIES.map((c) => {
            const n = counts.get(c.key) ?? 0;
            if (n === 0) return null;
            const active = category === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(active ? "all" : c.key)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                  active
                    ? "border-[#22d3ee]/60 bg-[#22d3ee]/10 text-[#22d3ee]"
                    : "border-white/[0.08] text-white/50 hover:text-white/80"
                }`}
              >
                {c.labelEn} <span className="opacity-60">{n}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="library-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe) => {
          const variants = tab === "templates" ? motionTemplateVariants(recipe) : [];
          const isOpen = Boolean(expanded[recipe.id]);
          return (
            <div key={recipe.id} className="library-item">
              <MotionRecipeCard
                recipe={recipe}
                onClick={onSelectRecipe}
                onRename={handleRename}
                onDelete={handleDelete}
                onSave={handleSave}
                onAddToTimeline={onAddToTimeline}
                saved={savedIds.has(recipe.id)}
                isUser={tab === "recipes"}
                variantCount={variants.length}
                variantsOpen={isOpen}
                onToggleVariants={toggleVariants}
              />
              {isOpen && variants.length > 1 && (
                <div className="library-variants mt-2 flex flex-col gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                  {variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-2 text-[11px] text-white/60"
                    >
                      <span className="truncate flex-1" title={v.componentName}>
                        {v.componentName}
                      </span>
                      <span className="text-white/30">{v.durationSec}s</span>
                      <button
                        type="button"
                        className="px-1.5 py-0.5 rounded bg-white/[0.05] hover:text-[#22d3ee] transition-colors"
                        onClick={() => onSelectRecipe(v)}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        className="px-1.5 py-0.5 rounded bg-white/[0.05] hover:text-[#22d3ee] transition-colors"
                        onClick={() => onAddToTimeline?.(v)}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {recipes.length === 0 && (
          <div className="col-span-full text-center py-12 text-sm text-white/40">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

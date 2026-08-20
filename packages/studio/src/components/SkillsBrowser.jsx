import { useState } from 'react';
import registry from '../skills/registry.json';
import { useRouter } from 'next/navigation';
import { setPendingRecipe } from '../lib/skillStore';
import SkillRunner from './SkillRunner';
import PromptLibrary from './PromptLibrary';

const CATEGORIES = ['all', 'visual', 'motion', 'social', 'edit', 'workflow'];

const CATEGORY_LABELS = {
  all: 'All',
  visual: 'Visual',
  motion: 'Motion',
  social: 'Social',
  edit: 'Edit',
  workflow: 'Workflow',
};

export default function SkillsBrowser({ apiKey }) {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState('all');
  const [runnerSkill, setRunnerSkill] = useState(null);
  const [view, setView] = useState('skills');

  const skills = registry.skills || [];
  const filtered =
    activeCat === 'all'
      ? skills
      : skills.filter((s) => (s.category || '').toLowerCase() === activeCat);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'skills', label: 'Skills' },
          { id: 'prompts', label: 'Prompt Library' },
        ].map((tab) => {
          const active = view === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                active
                  ? 'border-[#22d3ee] bg-[#22d3ee]/15 text-[#22d3ee]'
                  : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {view === 'prompts' ? (
        <PromptLibrary apiKey={apiKey} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const active = activeCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                active
                  ? 'border-[#22d3ee] bg-[#22d3ee]/15 text-[#22d3ee]'
                  : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20 hover:text-white'
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((skill) => (
          <div
            key={skill.slug}
            className="flex flex-col rounded-lg border border-white/10 bg-black/60 p-4 backdrop-blur transition hover:border-[#22d3ee]/40"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">{skill.name}</h3>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  (skill.kind || 'recipe') === 'workflow'
                    ? 'border-purple-400/40 bg-purple-500/15 text-purple-300'
                    : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300'
                }`}
              >
                {skill.kind === 'workflow' ? 'Workflow' : 'Recipe'}
              </span>
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-white/60">
              {skill.description}
            </p>

            <div className="mt-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                {skill.category || 'uncategorized'}
              </span>
            </div>

            <div className="mt-auto pt-4">
              {skill.kind === 'workflow' ? (
                <button
                  onClick={() => setRunnerSkill(skill)}
                  className="w-full rounded-md border border-[#22d3ee]/40 bg-[#22d3ee]/10 px-3 py-2 text-sm font-semibold text-[#22d3ee] transition hover:bg-[#22d3ee]/20"
                >
                  Run Skill
                </button>
              ) : (
                <button
                  onClick={() => {
                    setPendingRecipe(skill.slug, skill.studio);
                    router.push('/studio/' + skill.studio);
                  }}
                  className="w-full rounded-md bg-[#22d3ee] px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
                >
                  Open in Studio
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {runnerSkill && (
        <SkillRunner
          skill={runnerSkill}
          apiKey={apiKey}
          onClose={() => setRunnerSkill(null)}
        />
      )}
        </>
      )}
    </div>
  );
}

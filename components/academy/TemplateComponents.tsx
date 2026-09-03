'use client';

import React from 'react';
import {
  AcademyCard,
  ActionButton,
  Pill,
  SectionTitle,
  TextField,
  SparkIcon,
} from './primitives';
import { useRecipeExecutor } from '@/data/recipeRegistry';
import type { AnyAcademyTemplate } from '@/data/academyTemplates';
import type {
  ScriptTemplate,
  BriefTemplate,
  ConsistencyTemplate,
  BatchMatrixTemplate,
  OutreachTemplate,
  ProposalTemplate,
  TeardownTemplate,
} from '@/data/academyTemplates';
import { panels, buttons, semantic, colors } from '@/shared/styles/designTokens';

/* A small "RecipeAction" that renders the connected "Create With AI" /
   "Use Template" button(s) for a template. */
function RecipeActions({ template }: { template: AnyAcademyTemplate }) {
  const runRecipe = useRecipeExecutor();
  if (!template.recipes.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
      <SparkIcon />
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Connected recipe</span>
      {template.recipes.map((r) => (
        <ActionButton
          key={r.recipeId}
          variant={r.action === 'create' ? 'primary' : 'accent'}
          onClick={() => {
            const values: Record<string, unknown> = { ...(r.preset || {}) };
            if (template.kind === 'script') values.product = (template as ScriptTemplate).product.example;
            if (template.kind === 'matrix') values.product = (template as BatchMatrixTemplate).productField.example;
            runRecipe(r.recipeId, values);
          }}
        >
          {r.action === 'create' ? <SparkIcon /> : null}
          {r.label}
        </ActionButton>
      ))}
    </div>
  );
}

/* 1. UGC Script Template */
function ScriptView({ t }: { t: ScriptTemplate }) {
  const [vals, setVals] = React.useState<Record<string, string>>(() => {
    const init: Record<string, string> = { product: '', targetLength: '' };
    t.beats.forEach((b) => (init[b.key] = ''));
    t.checklist.forEach((c) => (init[`chk_${c.key}`] = ''));
    return init;
  });
  const set = (k: string, v: string) => setVals((s) => ({ ...s, [k]: v }));
  const filled = t.beats.filter((b) => vals[b.key]?.trim()).length;

  return (
    <AcademyCard>
      <SectionTitle hint="Hook → Pitch → Proof → CTA">UGC Script Builder</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField field={t.product} value={vals.product} onChange={(v) => set('product', v)} />
        <TextField field={t.targetLength} value={vals.targetLength} onChange={(v) => set('targetLength', v)} />
      </div>
      <div className="mt-3 space-y-3">
        {t.beats.map((b) => (
          <div key={b.key} className="rounded-xl p-3" style={panels.card}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: semantic.textPrimary }}>{b.label}</span>
              <Pill tone="primary">{b.timing}</Pill>
            </div>
            <textarea
              value={vals[b.key]}
              onChange={(e) => set(b.key, e.target.value)}
              placeholder={b.placeholder}
              rows={2}
              className="w-full resize-y rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={panels.card}
            />
            {b.hint && <span className="mt-1 block text-[11px]" style={{ color: semantic.textMuted }}>{b.hint}</span>}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <SectionTitle hint="Pre-flight check">Before recording</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2">
          {t.checklist.map((c) => (
            <label key={c.key} className="flex items-start gap-2 text-sm" style={{ color: semantic.textPrimary }}>
              <input
                type="checkbox"
                checked={!!vals[`chk_${c.key}`]}
                onChange={(e) => set(`chk_${c.key}`, e.target.checked ? '1' : '')}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/40 accent-[#22d3ee]"
              />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[11px]" style={{ color: semantic.textMuted }}>
        {filled}/{t.beats.length} beats written · {t.beats.filter((b) => !vals[b.key]?.trim()).length} empty
      </p>
      <RecipeActions template={t} />
    </AcademyCard>
  );
}

/* 2. Ad Brief Checklist */
function BriefView({ t }: { t: BriefTemplate }) {
  const [vals, setVals] = React.useState<Record<string, string>>({});
  const set = (k: string, v: string) => setVals((s) => ({ ...s, [k]: v }));
  const filled = t.fields.filter((f) => vals[f.key]?.trim()).length;
  const groups: Record<string, typeof t.fields> = { product: [], distribution: [], constraints: [] };
  t.fields.forEach((f) => groups[f.group].push(f));

  return (
    <AcademyCard>
      <SectionTitle hint="Pre-production brief">Ad Brief</SectionTitle>
      <div className="space-y-4">
        {Object.entries(groups).map(([g, fs]) => (
          <div key={g}>
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide" style={{ color: semantic.textMuted }}>{g}</span>
            <div className="space-y-3">
              {fs.map((f) => (
                <TextField key={f.key} field={f} value={vals[f.key] || ''} onChange={(v) => set(f.key, v)} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px]" style={{ color: semantic.textMuted }}>{filled}/{t.fields.length} fields filled</p>
      <RecipeActions template={t} />
    </AcademyCard>
  );
}

/* 3. Character Consistency Checklist */
function ConsistencyView({ t }: { t: ConsistencyTemplate }) {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});
  const toggle = (k: string) => setChecked((s) => ({ ...s, [k]: !s[k] }));
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <AcademyCard>
      <SectionTitle hint="Drift check">Character Consistency</SectionTitle>
      {t.exampleShots && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          {t.exampleShots.map((s) => (
            <div key={s.shot} className="rounded-lg p-2 text-center" style={panels.card}>
              <span className="block text-xs font-semibold" style={{ color: semantic.textPrimary }}>{s.shot}</span>
              <span className="text-[11px]" style={{ color: semantic.success }}>{s.exampleVerdict}</span>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {t.items.map((it) => (
          <label key={it.key} className="flex items-start gap-2 rounded-lg p-2 text-sm" style={panels.card}>
            <input
              type="checkbox"
              checked={!!checked[it.key]}
              onChange={() => toggle(it.key)}
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/40 accent-[#22d3ee]"
            />
            {it.label}
          </label>
        ))}
      </div>
      <p className="mt-3 text-[11px]" style={{ color: semantic.textMuted }}>{done}/{t.items.length} checks passed</p>
      <RecipeActions template={t} />
    </AcademyCard>
  );
}

/* 4. Batch Matrix */
function BatchView({ t }: { t: BatchMatrixTemplate }) {
  const [product, setProduct] = React.useState('');
  const [constants, setConstants] = React.useState('');
  const [rows, setRows] = React.useState(
    Array.from({ length: Math.max(t.rowCount, t.exampleRows.length) }, (_, i) => {
      const ex = t.exampleRows[i];
      return {
        ad: i + 1,
        hook: ex?.hookExample || '',
        angle: ex?.angleExample || '',
        notes: ex?.notesExample || '',
      };
    }),
  );
  const update = (i: number, k: string, v: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  return (
    <AcademyCard>
      <SectionTitle hint="Hook × Angle">10-Ad Batch Matrix</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField field={t.productField} value={product} onChange={setProduct} />
      </div>
      <div className="mt-3">
        <TextField field={t.constantsField} value={constants} onChange={setConstants} />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr>
              <th className="border px-2 py-1.5 font-semibold" style={{ borderColor: 'var(--border-color)', background: 'var(--glass-bg)', color: semantic.textPrimary }}>#</th>
              {t.columns.map((c) => (
                <th key={c.key} className="border px-2 py-1.5 font-semibold" style={{ borderColor: 'var(--border-color)', background: 'var(--glass-bg)', color: semantic.textPrimary }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.ad}>
                <td className="border px-2 py-1" style={{ borderColor: 'var(--border-color)', color: semantic.textSecondary }}>{r.ad}</td>
                {t.columns.map((c) => (
                  <td key={c.key} className="border p-1" style={{ borderColor: 'var(--border-color)' }}>
                    <input
                      value={(r as unknown as Record<string, string>)[c.key]}
                      onChange={(e) => update(i, c.key, e.target.value)}
                      placeholder={c.placeholder}
                      className="w-full rounded px-2 py-1 focus:outline-none"
                      style={panels.card}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px]" style={{ color: semantic.textMuted }}>
        Vary one or two axes per ad. Hold product + CTA constant so the test result is readable.
      </p>
      <RecipeActions template={t} />
    </AcademyCard>
  );
}

/* 5. Outreach */
function OutreachView({ t }: { t: OutreachTemplate }) {
  const [vals, setVals] = React.useState<Record<string, string>>({});
  const set = (k: string, v: string) => setVals((s) => ({ ...s, [k]: v }));
  const body = `Hi ${vals.contact || '[Name]'} — noticed ${vals.brand || '[Brand]'} is running paid social ads for ${vals.product || "[Brand]'s [product]"}. I put together a quick AI-generated UGC-style ad using the same product — thought it might be useful for testing a new angle. If it's a fit, I can turn around a full batch of variants (different hooks/angles) for testing — usually ${vals.turnaround || '[X days]'}. Happy to share more examples if useful. — ${vals.yourName || '[Your name]'}`;

  return (
    <AcademyCard>
      <SectionTitle hint="Cold outreach">Outreach Message</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField field={t.subjectField} value={vals.subject || ''} onChange={(v) => set('subject', v)} />
        {t.fields.map((f) => (
          <TextField key={f.key} field={f} value={vals[f.key] || ''} onChange={(v) => set(f.key, v)} />
        ))}
      </div>
      <div className="mt-4">
        <span className="mb-1 block text-xs font-semibold" style={{ color: semantic.textPrimary }}>Preview</span>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg p-3 text-xs leading-relaxed" style={panels.card}>
          Subject: {vals.subject || '[A quick ad concept for Brand]'}

{body}
        </pre>
      </div>
      <RecipeActions template={t} />
    </AcademyCard>
  );
}

/* 6. Retainer Proposal */
function ProposalView({ t }: { t: ProposalTemplate }) {
  const [vals, setVals] = React.useState<Record<string, string>>({});
  const set = (k: string, v: string) => setVals((s) => ({ ...s, [k]: v }));
  return (
    <AcademyCard>
      <SectionTitle hint="Pitch">Retainer Proposal</SectionTitle>
      <div className="space-y-3">
        {t.fields.map((f) => (
          <TextField key={f.key} field={f} value={vals[f.key] || ''} onChange={(v) => set(f.key, v)} />
        ))}
      </div>
      <p className="mt-3 text-[11px]" style={{ color: semantic.textMuted }}>
        Anchor to real ranges: gigs $10–$55/ad · batches $150–$300 · retainers $1,500–$3,000/mo.
      </p>
      <RecipeActions template={t} />
    </AcademyCard>
  );
}

/* 7. Teardown Worksheet */
function TeardownView({ t }: { t: TeardownTemplate }) {
  const [vals, setVals] = React.useState<Record<string, string>>({});
  const set = (k: string, v: string) => setVals((s) => ({ ...s, [k]: v }));
  return (
    <AcademyCard>
      <SectionTitle hint="Five-layer teardown">Ad Teardown</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {t.topFields.map((f) => (
          <TextField key={f.key} field={f} value={vals[f.key] || ''} onChange={(v) => set(f.key, v)} />
        ))}
      </div>
      <div className="mt-3 space-y-3">
        {t.layers.map((l) => (
          <div key={l.key}>
            <span className="mb-1 block text-xs font-semibold" style={{ color: semantic.textPrimary }}>{l.layer}</span>
            <textarea
              value={vals[l.key] || ''}
              onChange={(e) => set(l.key, e.target.value)}
              placeholder="What was done, and why it might work"
              rows={2}
              className="w-full resize-y rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={panels.card}
            />
          </div>
        ))}
        <TextField field={t.takeawayField} value={vals.takeaway || ''} onChange={(v) => set('takeaway', v)} />
      </div>
      <RecipeActions template={t} />
    </AcademyCard>
  );
}

/* Dispatcher */
export function TemplateView({ template }: { template: AnyAcademyTemplate }) {
  switch (template.kind) {
    case 'script':
      return <ScriptView t={template} />;
    case 'brief':
      return <BriefView t={template} />;
    case 'checklist':
      return <ConsistencyView t={template} />;
    case 'matrix':
      return <BatchView t={template} />;
    case 'outreach':
      return <OutreachView t={template} />;
    case 'proposal':
      return <ProposalView t={template} />;
    case 'worksheet':
      return <TeardownView t={template} />;
    default:
      return null;
  }
}

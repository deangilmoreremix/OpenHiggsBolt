import { useState } from 'react';
import { runSkill } from '../lib/promptRecipes.js';

const STATUS_STYLES = {
  idle: 'bg-white/10 text-white/60 border-white/10',
  running: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
  done: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  error: 'bg-red-500/20 text-red-300 border-red-400/40',
};

function statusLabel(s) {
  if (!s) return 'idle';
  return s.status || 'idle';
}

export default function SkillRunner({ skill, apiKey, onClose }) {
  const [inputs, setInputs] = useState(() => {
    const init = {};
    for (const inp of skill.inputs || []) {
      init[inp.name] = inp.default ?? '';
    }
    return init;
  });
  const [stepStatus, setStepStatus] = useState(() =>
    (skill.steps || []).map(() => ({ status: 'idle' }))
  );
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [outputs, setOutputs] = useState({});

  function setInput(name, value) {
    setInputs((prev) => ({ ...prev, [name]: value }));
  }

  function truncate(str, n = 80) {
    if (!str) return '';
    return str.length > n ? str.slice(0, n) + '…' : str;
  }

  async function handleRun() {
    setRunning(true);
    setErrorMsg('');
    try {
      await runSkill(apiKey, skill, inputs, (i, s) => {
        setStepStatus((prev) => {
          const n = [...prev];
          n[i] = s;
          return n;
        });
        if (s.url) {
          setOutputs((prev) => ({ ...prev, [i]: s.url }));
        }
      });
    } catch (e) {
      setErrorMsg(String(e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur p-4">
      <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-black/60 backdrop-blur shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">{skill.name}</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-4">
          {(skill.inputs || []).length > 0 && (
            <div className="space-y-3">
              {skill.inputs.map((inp) => (
                <label key={inp.name} className="block">
                  <span className="mb-1 block text-sm text-white/70">
                    {inp.label || inp.name}
                    {inp.required ? <span className="text-cyan-400"> *</span> : null}
                  </span>
                  <input
                    type={inp.type === 'image_url' ? 'url' : 'text'}
                    value={inputs[inp.name] ?? ''}
                    onChange={(e) => setInput(inp.name, e.target.value)}
                    placeholder={inp.label || inp.name}
                    className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#22d3ee]/50"
                  />
                </label>
              ))}
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={running}
            className="w-full rounded-md bg-[#22d3ee] px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? 'Running…' : 'Run Skill'}
          </button>

          {errorMsg && (
            <div className="rounded-md border border-red-400/40 bg-red-500/20 px-3 py-2 text-sm text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            {(skill.steps || []).map((step, i) => {
              const st = stepStatus[i] || { status: 'idle' };
              const label = statusLabel(st);
              return (
                <div
                  key={i}
                  className="rounded-md border border-white/10 bg-black/40 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wide text-white/50">
                      Step {i + 1} · {step.type}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        STATUS_STYLES[label] || STATUS_STYLES.idle
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {step.prompt ? (
                    <p className="mt-1 text-sm text-white/70">
                      {truncate(step.prompt)}
                    </p>
                  ) : null}
                  {st.note ? (
                    <p className="mt-1 text-xs text-cyan-300/80">{st.note}</p>
                  ) : null}
                  {st.error ? (
                    <p className="mt-1 text-xs text-red-300">{st.error}</p>
                  ) : null}
                  {outputs[i] ? (
                    <img
                      src={outputs[i]}
                      alt={`step ${i + 1} output`}
                      className="mt-2 max-h-32 rounded-md border border-white/10 object-contain"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

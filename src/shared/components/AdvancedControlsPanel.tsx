import { getAdvancedControlsForModel, buildAdvancedPayload } from 'studio/src/videoAdvancedControls.js'

export interface AdvancedModelRef {
  id: string
  provider?: string
}

export function getControlsForModel(modelRef: AdvancedModelRef) {
  return getAdvancedControlsForModel(modelRef)
}

export function buildAdvancedParams(controls: ReturnType<typeof getControlsForModel>, values: Record<string, any>) {
  return buildAdvancedPayload(controls, values)
}

interface AdvancedControlsPanelProps {
  controls: ReturnType<typeof getControlsForModel>
  values: Record<string, any>
  onChange: (key: string, value: any) => void
}

export function AdvancedControlsPanel({ controls, values, onChange }: AdvancedControlsPanelProps) {
  if (!controls.length) {
    return (
      <p className="text-sm text-muted">
        No additional advanced controls are available for this model.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {controls.map((c) => {
        const value = values[c.key] ?? c.default
        const fieldId = `adv-${c.key}`
        return (
          <div key={c.key}>
            <label htmlFor={fieldId} className="block text-sm font-medium mb-2">
              {c.label}
            </label>

            {c.type === 'textarea' && (
              <textarea
                id={fieldId}
                value={value}
                placeholder={c.description}
                onChange={(e) => onChange(c.key, e.target.value)}
                className="w-full h-24 bg-bg-card border border-border-color rounded-xl p-3 text-white placeholder-muted resize-none"
              />
            )}

            {(c.type === 'int' || c.type === 'number') && (
              <input
                id={fieldId}
                type="number"
                value={value}
                min={c.min}
                max={c.max}
                step={c.step}
                onChange={(e) => onChange(c.key, e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-bg-card border border-border-color rounded-xl p-2 text-white"
              />
            )}

            {c.type === 'enum' && (
              <select
                id={fieldId}
                value={value}
                onChange={(e) => onChange(c.key, e.target.value)}
                className="w-full bg-bg-card border border-border-color rounded-xl p-2 text-white"
              >
                {(c.enum || []).map((opt: string) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {c.type === 'boolean' && (
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  id={fieldId}
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => onChange(c.key, e.target.checked)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-sm text-muted">{c.description}</span>
              </label>
            )}

            {c.type !== 'boolean' && c.description && (
              <p className="text-xs text-muted mt-1">{c.description}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

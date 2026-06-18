const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4', label: 'GPT-4' },
]

interface ModelPickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function ModelPicker({ value, onChange, disabled }: ModelPickerProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-secondary">Model</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-bg-card border border-border-color rounded-xl p-2 text-sm outline-none"
      >
        {MODELS.map((model) => (
          <option key={model.value} value={model.value}>
            {model.label}
          </option>
        ))}
      </select>
    </div>
  )
}

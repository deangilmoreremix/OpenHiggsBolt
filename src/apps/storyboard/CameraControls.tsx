import type { CameraSpec } from './cameraTaxonomy'
import {
  CAMERA_OPTIONS,
  LENS_OPTIONS,
  FOCAL_OPTIONS,
  APERTURE_OPTIONS,
  SHOT_TYPE_OPTIONS,
  CAMERA_ANGLE_OPTIONS,
  CAMERA_MOVEMENT_OPTIONS,
} from './cameraTaxonomy'
import { panels, semantic } from '@/shared/styles/designTokens'

interface CameraControlsProps {
  value?: CameraSpec
  onChange: (spec: CameraSpec) => void
  compact?: boolean
}

const selectStyle = { ...panels.card, color: 'white' as const }

export default function CameraControls({ value, onChange, compact }: CameraControlsProps) {
  const spec = value || {}

  const set = (patch: Partial<CameraSpec>) => onChange({ ...spec, ...patch })

  const field = (
    label: string,
    current: string | number | undefined,
    options: (string | number)[],
    onSet: (v: string | number | undefined) => void,
  ) => (
    <div>
      <label className="block text-[10px] font-medium mb-1" style={{ color: semantic.textLabel }}>
        {label}
      </label>
      <select
        value={current ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') return onSet(undefined)
          const numeric = typeof options[0] === 'number' ? Number(raw) : raw
          onSet(numeric)
        }}
        className="w-full rounded-lg p-1.5 text-xs outline-none"
        style={selectStyle}
      >
        <option value="">Any</option>
        {options.map((opt) => (
          <option key={String(opt)} value={String(opt)}>
            {typeof opt === 'number' ? `${opt}mm` : opt}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
      {field('SHOT TYPE', spec.shotType, SHOT_TYPE_OPTIONS, (v) => set({ shotType: v as string | undefined }))}
      {field('ANGLE', spec.angle, CAMERA_ANGLE_OPTIONS, (v) => set({ angle: v as string | undefined }))}
      {field('MOVEMENT', spec.movement, CAMERA_MOVEMENT_OPTIONS, (v) => set({ movement: v as string | undefined }))}
      {field('CAMERA', spec.camera, CAMERA_OPTIONS, (v) => set({ camera: v as string | undefined }))}
      {field('LENS', spec.lens, LENS_OPTIONS, (v) => set({ lens: v as string | undefined }))}
      {field('FOCAL', spec.focalLength, FOCAL_OPTIONS, (v) => set({ focalLength: v as number | undefined }))}
      {field('APERTURE', spec.aperture, APERTURE_OPTIONS, (v) => set({ aperture: v as string | undefined }))}
    </div>
  )
}

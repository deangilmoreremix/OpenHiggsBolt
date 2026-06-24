const CAMERA_ANGLE_COLORS = {
  'low-angle': 'text-red-400',
  'high-angle': 'text-blue-400',
  'eye-level': 'text-green-400',
  'dutch-angle': 'text-yellow-400',
  'birds-eye': 'text-purple-400',
  'worms-eye': 'text-orange-400',
};

export default function CameraAngleTag({ shotType, cameraAngle, cameraMovement }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="rounded-full border border-cutai-border bg-cutai-surface px-2 py-0.5 text-[10px] font-medium text-cutai-text">
        {shotType}
      </span>
      <span
        className={`rounded-full border border-cutai-border bg-cutai-surface px-2 py-0.5 text-[10px] font-medium ${
          CAMERA_ANGLE_COLORS[cameraAngle] || 'text-cutai-muted'
        }`}
      >
        {cameraAngle}
      </span>
      <span className="rounded-full border border-cutai-border bg-cutai-surface px-2 py-0.5 text-[10px] text-cutai-muted">
        {cameraMovement}
      </span>
    </div>
  );
}

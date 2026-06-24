import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export default function TimelineNode({ data }) {
  return (
    <div
      className="rounded-lg border border-cutai-border bg-cutai-surface px-4 py-3 shadow-md"
      style={{ borderLeft: `4px solid ${data.color || '#64748b'}` }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="text-xs text-cutai-muted">Scene {data.scene_number}</div>
      <div className="text-sm font-medium text-cutai-text">{data.title}</div>
      <div className="text-[10px] text-cutai-muted">~{data.duration || 0}s</div>
      <div className="mt-1 text-[10px] capitalize" style={{ color: data.color }}>{data.mood}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

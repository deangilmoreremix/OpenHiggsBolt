import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import useStoryboardStore from '../../stores/useStoryboardStore';
import useUIStore from '../../stores/useUIStore';
import TimelineNode from './TimelineNode';

const customNodeTypes = { timelineNode: TimelineNode };

export default function VisualTimeline() {
  const scenes = useStoryboardStore((s) => s.scenes);
  const selectScene = useStoryboardStore((s) => s.selectScene);
  const { openShotPanel } = useUIStore();

  const sorted = useMemo(() => [...scenes].sort((a, b) => a.scene_number - b.scene_number), [scenes]);

  const moodColors = {
    thrilling: '#ef4444',
    romantic: '#ec4899',
    mysterious: '#8b5cf6',
    tense: '#f59e0b',
    neutral: '#64748b',
    happy: '#22c55e',
    sad: '#3b82f6',
    dark: '#1e293b',
  };

  const initialNodes = sorted.map((scene, idx) => ({
    id: String(scene.id),
    type: 'timelineNode',
    position: { x: idx * 220, y: 0 },
    data: {
      scene_number: scene.scene_number,
      title: scene.title,
      duration: scene.shots?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0),
      mood: scene.mood_overall,
      color: moodColors[scene.mood_overall] || '#64748b',
    },
  }));

  const initialEdges = sorted.slice(0, -1).map((_, idx) => ({
    id: `e-${idx}-${idx + 1}`,
    source: String(sorted[idx].id),
    target: String(sorted[idx + 1].id),
    type: 'smoothstep',
    animated: true,
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges]);

  const onNodeClick = useCallback(
    (_event, node) => {
      selectScene(Number(node.id));
      openShotPanel();
    },
    [selectScene, openShotPanel],
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cutai-border bg-cutai-surface/40 p-10 text-center">
        <p className="text-lg font-medium text-cutai-text">No timeline yet.</p>
        <p className="mt-1 text-sm text-cutai-muted">Generate a script to see your scenes visualized.</p>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full rounded-2xl border border-cutai-border bg-cutai-surface">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={customNodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e1e2e" />
        <MiniMap nodeColor={(node) => node.data?.color || '#64748b'} maskColor="rgba(10,10,15,0.7)" />
      </ReactFlow>
    </div>
  );
}

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useStoryboardStore from '../../stores/useStoryboardStore';

const MOOD_COLORS = {
  tension: '#ef4444',
  emotion: '#3b82f6',
  energy: '#f59e0b',
  darkness: '#8b5cf6',
};

export default function MoodGraph() {
  const scenes = useStoryboardStore((s) => s.scenes);
  const sorted = [...scenes].sort((a, b) => a.scene_number - b.scene_number);
  const data = sorted.map((s) => ({
    scene: s.scene_number,
    tension: s.mood_tension,
    emotion: s.mood_emotion,
    energy: s.mood_energy,
    darkness: s.mood_darkness,
  }));

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cutai-border bg-cutai-surface/40 p-10 text-center">
        <p className="text-sm text-cutai-muted">Generate a storyboard to see the mood arc.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cutai-border bg-cutai-surface p-4">
      <h3 className="mb-4 text-sm font-semibold text-cutai-text">Mood Arc</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="scene" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis stroke="#64748b" domain={[0, 1]} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: 8 }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Legend />
            {Object.keys(MOOD_COLORS).map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={MOOD_COLORS[key]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

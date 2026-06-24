import { Home, LayoutTemplate, BarChart3, X } from 'lucide-react';
import useUIStore from '../../stores/useUIStore';

const tabs = [
  { id: 'storyboard', label: 'Storyboard', icon: LayoutTemplate },
  { id: 'timeline', label: 'Timeline', icon: Home },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
];

export default function Sidebar() {
  const { activeTab, closeShotPanel, shotPanelOpen } = useUIStore();

  return (
    <aside className="relative hidden h-screen w-56 shrink-0 border-r border-cutai-border bg-cutai-surface/60 md:flex flex-col">
      <nav className="flex-1 space-y-1 p-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => useUIStore.setState({ activeTab: tab.id })}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-cutai-accent/10 text-cutai-accent'
                  : 'text-cutai-muted hover:bg-cutai-border/40 hover:text-cutai-text'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

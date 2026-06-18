import { NavLink } from 'react-router-dom'
import { Bell, Settings, Video, LayoutTemplate, Workflow, Film, Music, Image, FileText, Presentation, CalendarDays, Sparkles, Clapperboard } from 'lucide-react'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
}

export default function TopNavigation() {
  const navItems: NavItem[] = [
    { to: '/video-studio', icon: <Video size={18} />, label: 'Video Studio' },
    { to: '/videco', icon: <Clapperboard size={18} />, label: 'VideoCo' },
    { to: '/vfx-studio', icon: <Sparkles size={18} />, label: 'VFX Studio' },
    { to: '/storyboard', icon: <LayoutTemplate size={18} />, label: 'Storyboard' },
    { to: '/scene-planner', icon: <Workflow size={18} />, label: 'Scene Planner' },
    { to: '/cinema', icon: <Film size={18} />, label: 'Cinema' },
    { to: '/music-studio', icon: <Music size={18} />, label: 'Music Studio' },
    { to: '/thumbnail-studio', icon: <Image size={18} />, label: 'Thumbnail' },
    { to: '/script-writer', icon: <FileText size={18} />, label: 'Script Writer' },
    { to: '/presentation', icon: <Presentation size={18} />, label: 'Presentation' },
    { to: '/content-planner', icon: <CalendarDays size={18} />, label: 'Content Planner' }
  ]

  return (
    <header className="h-16 glass-panel border-b border-border-color flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-secondary">
          AI Generation Studios
        </h2>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm ${
                  isActive
                    ? 'bg-cyan-400/20 text-white'
                    : 'text-secondary hover:text-white hover:bg-bg-card'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-bg-card transition-colors">
          <Bell size={20} className="text-secondary" />
        </button>
        <button className="p-2 rounded-lg hover:bg-bg-card transition-colors">
          <Settings size={20} className="text-secondary" />
        </button>
      </div>
    </header>
  )
}

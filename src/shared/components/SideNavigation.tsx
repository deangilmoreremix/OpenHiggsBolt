import { NavLink } from 'react-router-dom'
import {
  Video,
  LayoutTemplate,
  Film,
  Image,
  Sparkles
} from 'lucide-react'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
}

export default function SideNavigation() {
  const navItems: NavItem[] = [
    { to: '/video-studio', icon: <Video size={20} />, label: 'Video Studio' },
    { to: '/vfx-studio', icon: <Sparkles size={20} />, label: 'VFX Studio' },
    { to: '/storyboard', icon: <LayoutTemplate size={20} />, label: 'Storyboard' },
    { to: '/cinema', icon: <Film size={20} />, label: 'Cinema' },
    { to: '/thumbnail-studio', icon: <Image size={20} />, label: 'Thumbnail' }
  ]

  return (
    <nav className="w-64 h-full glass-panel border-r border-border-color flex flex-col p-4">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <Video size={24} className="text-black" />
        </div>
         <h1 className="text-xl font-bold">SmartVideo GO</h1>
      </div>
      
      <div className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-cyan-400/20 text-cyan-400'
                  : 'text-secondary hover:text-white hover:bg-bg-card'
              }`
            }
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

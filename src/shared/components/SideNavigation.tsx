import { NavLink } from 'react-router-dom'
import { Sparkles, Image } from 'lucide-react'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
}

export default function SideNavigation() {
  const navItems: NavItem[] = [
    { to: '/vfx-studio', icon: <Sparkles size={20} />, label: 'VFX Studio' },
    { to: '/headshot-generator', icon: <Image size={20} />, label: 'Headshots' },
  ]

  return (
    <nav className="w-64 h-full glass-panel border-r border-border-color flex flex-col p-4">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <Sparkles size={24} className="text-black" />
        </div>
        <h1 className="text-xl font-bold">OpenHiggsBolt</h1>
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

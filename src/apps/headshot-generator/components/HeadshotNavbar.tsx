import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { CreditCard, History, Menu, Rocket, X } from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

export default function HeadshotNavbar() {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)

  const navItems: NavItem[] = [
    {
      to: '/headshot-generator',
      label: 'AI Headshot',
      icon: <Rocket size={18} />,
    },
    {
      to: '/headshot-generator/history',
      label: 'My Creations',
      icon: <History size={18} />,
    },
    {
      to: '/headshot-generator/pricing',
      label: 'Pricing',
      icon: <CreditCard size={18} />,
    },
  ]

  return (
    <header className="h-16 border-b border-border-color bg-bg-card/60 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between shrink-0">
      <NavLink
        to="/headshot-generator"
        className="flex items-center gap-3 group"
        onClick={() => setMobileOpen(false)}
      >
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
          <Rocket className="text-black" size={18} />
        </div>
        <span className="font-black text-lg tracking-tight uppercase text-white">AI Headshot</span>
      </NavLink>

      <nav className="hidden md:flex items-center gap-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/headshot-generator'}
            className={({ isActive }) =>
              `text-sm font-semibold tracking-tight transition-all relative py-2 flex items-center gap-2 ${
                isActive ? 'text-white' : 'text-secondary hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {item.icon}
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setMobileOpen((prev) => !prev)}
        className="md:hidden p-2 text-secondary hover:text-white transition-colors"
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 bg-bg-card border-b border-border-color md:hidden flex flex-col p-4 gap-2 shadow-2xl">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/headshot-generator'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `p-4 rounded-xl font-semibold text-sm transition-all flex items-center gap-3 ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-bg-panel'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}

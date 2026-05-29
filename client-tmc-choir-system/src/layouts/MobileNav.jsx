import { NavLink } from 'react-router-dom'
import { ClipboardList, Home, Mic2, MoreHorizontal, Users } from 'lucide-react'
import { cn } from '../lib/utils'

const mobileItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
  { to: '/members', icon: Users, label: 'Members' },
  { to: '/auditions', icon: Mic2, label: 'Auditions' },
  { to: '/reports', icon: MoreHorizontal, label: 'More' },
]

export default function MobileNav() {
  return (
    <nav className="grid h-16 grid-cols-5 border-t border-gray-100 bg-white/95 px-1 backdrop-blur md:hidden dark:border-slate-800/70 dark:bg-slate-950/95">
      {mobileItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => cn(
            'flex flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium text-gray-500 transition-colors dark:text-slate-400',
            isActive && 'text-blue-600 dark:text-blue-300'
          )}
        >
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

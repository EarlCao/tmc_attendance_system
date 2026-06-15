import { NavLink } from 'react-router-dom'
import { Home, ClipboardList, UserCircle, BookOpen, BarChart2 } from 'lucide-react'
import { cn } from '../lib/utils'

const mobileItems = [
  { to: '/member',            icon: Home,         label: 'Dashboard' },
  { to: '/member/attendance', icon: ClipboardList, label: 'Attendance' },
  { to: '/member/semesters',  icon: BarChart2,     label: 'Semesters' },
  { to: '/member/rules',      icon: BookOpen,      label: 'Rules' },
  { to: '/member/profile',    icon: UserCircle,    label: 'Profile' },
]

export default function MemberMobileNav() {
  return (
    <nav className="grid h-16 grid-cols-5 border-t border-slate-200/50 bg-white/95 px-1 backdrop-blur md:hidden z-20 shrink-0 dark:border-slate-800/70 dark:bg-slate-950/95">
      {mobileItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) => cn(
            'flex flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium text-slate-500 transition-colors dark:text-slate-400',
            isActive && 'text-blue-600 dark:text-blue-300'
          )}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

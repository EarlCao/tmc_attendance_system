import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/member',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/member/attendance', icon: ClipboardList,   label: 'My Attendance' },
  { to: '/member/profile',    icon: User,            label: 'My Profile' },
]

export default function MemberSidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'relative hidden h-screen shrink-0 flex-col border-r border-slate-200/50 bg-white/60 shadow-lg shadow-slate-200/20 backdrop-blur-xl transition-all duration-300 md:flex z-40 dark:border-slate-800/70 dark:bg-slate-950/70 dark:shadow-black/20',
        collapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 border-b border-slate-200/50 px-6 py-4 dark:border-slate-800/70',
        collapsed && 'justify-center px-2'
      )}>
        <img src="/tmc_choir.png" alt="TMC Choir logo" className="w-12 h-12 object-contain" />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-950 text-[18px] leading-tight truncate tracking-tight dark:text-slate-100">TMC Choir</p>
            <p className="text-[11px] font-medium text-slate-500 leading-tight truncate dark:text-slate-400">Member Portal</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">Menu</p>
        )}
        {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) => cn(
                'sidebar-link',
                isActive && 'active',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-300"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-gray-100 px-4 py-3 dark:border-slate-800/70">
          <p className="text-[10px] text-gray-400 dark:text-slate-500">TMC Choir &copy; 2026</p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">Trinidad Municipal College</p>
        </div>
      )}
    </aside>
  )
}

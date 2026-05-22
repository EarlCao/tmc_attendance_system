import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  FileX2,
  Users,
  Mic2,
  UserCheck,
  BarChart3,
  Settings,
  Music4,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/',          icon: LayoutDashboard,  label: 'Dashboard' },
  { to: '/semesters', icon: CalendarDays,      label: 'Semesters' },
  { to: '/attendance',icon: ClipboardList,     label: 'Attendance' },
  { to: '/absences',  icon: FileX2,            label: 'Absences & Excuses' },
  { to: '/members',   icon: Users,             label: 'Choir Members' },
  { to: '/auditions', icon: Mic2,              label: 'Auditions' },
  { to: '/judges',    icon: UserCheck,         label: 'Judges' },
  { to: '/reports',   icon: BarChart3,         label: 'Reports' },
]

const bottomItems = [
  { to: '/settings',  icon: Settings,          label: 'Settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-white border-r border-gray-100 h-screen transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-gray-100', collapsed && 'justify-center px-2')}>
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <Music4 size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight truncate">TMC Choir</p>
            <p className="text-[11px] text-gray-400 leading-tight truncate">Attendance System</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Main Menu</p>
        )}
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'sidebar-link',
                isActive && 'active',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          )
        })}

        <div className="pt-3">
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">System</p>
          )}
          {bottomItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'sidebar-link',
                  isActive && 'active',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400">TMC Choir &copy; 2025</p>
          <p className="text-[10px] text-gray-400">Trinidad Municipal College</p>
        </div>
      )}
    </aside>
  )
}

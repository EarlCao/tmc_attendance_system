import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ClipboardList, Home, Mic2, MoreHorizontal, Users, CalendarDays, UserCheck, Award, BarChart3, KeyRound, Settings, X, ShieldAlert } from 'lucide-react'
import { cn } from '../lib/utils'

const mobileItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
  { to: '/members', icon: Users, label: 'Members' },
  { to: '/auditions', icon: Mic2, label: 'Auditions' },
]

const moreItems = [
  { to: '/semesters',  icon: CalendarDays, label: 'Semesters' },
  { to: '/judges',     icon: UserCheck,    label: 'Judges' },
  { to: '/officers',   icon: Award,        label: 'Officers' },
  { to: '/reports',    icon: BarChart3,    label: 'Reports' },
  { to: '/audit-logs', icon: ShieldAlert,  label: 'Audit Logs' },
  { to: '/accounts',   icon: KeyRound,     label: 'Accounts' },
  { to: '/settings',   icon: Settings,     label: 'Settings' },
]

export default function MobileNav() {
  const [showMore, setShowMore] = useState(false)
  const location = useLocation()
  
  // Is one of the 'more' items currently active?
  const isMoreActive = moreItems.some(item => location.pathname.startsWith(item.to))

  // Close the menu if we click the browser back button
  useEffect(() => {
    setShowMore(false)
  }, [location.pathname])

  return (
    <>
      {/* Overlay for dismissing the More menu */}
      {showMore && (
        <div 
          className="fixed inset-0 z-[45] bg-slate-900/20 backdrop-blur-sm md:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* The More Menu Panel */}
      <div 
        className={cn(
          "fixed bottom-16 left-0 right-0 z-[50] bg-white border-t border-slate-200/50 p-5 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:hidden dark:bg-slate-950 dark:border-slate-800/70",
          showMore ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">More Options</h3>
          <button 
            onClick={() => setShowMore(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-y-6 gap-x-2">
          {moreItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={() => setShowMore(false)}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center gap-2 transition-all",
                isActive 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
                location.pathname.startsWith(to) 
                  ? "bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-200 dark:ring-blue-800" 
                  : "bg-slate-50 dark:bg-slate-900"
              )}>
                <Icon size={24} strokeWidth={location.pathname.startsWith(to) ? 2 : 1.5} />
              </div>
              <span className="text-[10px] font-semibold text-center">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="grid h-16 grid-cols-5 border-t border-slate-200/50 bg-white/95 px-1 backdrop-blur md:hidden z-[50] shrink-0 dark:border-slate-800/70 dark:bg-slate-950/95 relative">
        {mobileItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={() => setShowMore(false)}
            className={({ isActive }) => cn(
              'flex flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium text-slate-500 transition-colors dark:text-slate-400',
              isActive && 'text-blue-600 dark:text-blue-300'
            )}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
        
        <button
          onClick={() => setShowMore(!showMore)}
          className={cn(
            'flex flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium transition-colors',
            showMore || isMoreActive ? 'text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'
          )}
        >
          <MoreHorizontal size={18} />
          <span>More</span>
        </button>
      </nav>
    </>
  )
}

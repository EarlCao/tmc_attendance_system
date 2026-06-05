import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSemesterContext } from '../context/SemesterContext'
import ThemeToggle from '../components/common/ThemeToggle'
import LogoutModal from '../components/common/LogoutModal'

const crumbMap = {
  '/':           'Dashboard',
  '/semesters':  'Semester Management',
  '/attendance': 'Attendance Management',
  '/members':    'Choir Members',
  '/auditions':  'Audition Management',
  '/judges':     'Judge Management',
  '/officers':   'Officers',
  '/reports':    'Reports',
  '/settings':   'Settings',
}

export default function Header() {
  const location = useLocation()
  const pageTitle = crumbMap[location.pathname] ?? 'Page'
  const { user, logout } = useAuth()
  const { activeSemester, loading: semesterLoading } = useSemesterContext()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const getInitials = (name) => {
    if (!name) return 'AD'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleLogoutConfirm = () => {
    setLoggingOut(true)
    setTimeout(() => {
      setLoggingOut(false)
      setShowLogoutModal(false)
      logout()
    }, 1000)
  }

  const handleLogoutClose = () => {
    if (loggingOut) return
    setShowLogoutModal(false)
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/50 bg-white/70 px-6 backdrop-blur-xl z-30 transition-all duration-300 dark:border-slate-800/70 dark:bg-slate-950/70">
        {/* Left: Breadcrumb */}
        <div className="flex min-w-0 items-center gap-4">
          <img src="/tmc_choir.png" alt="TMC Choir logo" className="h-11 w-11 object-contain md:hidden" />
          <div className="min-w-0">
            <p className="mb-0.5 truncate text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">TMC Choir Attendance System</p>
            <h1 className="truncate text-lg font-bold text-slate-800 tracking-tight dark:text-slate-100">{pageTitle}</h1>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Active semester badge — hidden while loading to prevent flash of 'No active semester' */}
          {!semesterLoading && (
            activeSemester ? (
              <span className="hidden items-center gap-2 rounded-full border border-blue-200/50 bg-blue-50/50 px-4 py-1.5 text-[13px] font-semibold text-blue-700 shadow-sm lg:inline-flex backdrop-blur-sm dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                {activeSemester.name}
              </span>
            ) : (
              <span className="hidden items-center gap-2 rounded-full border border-slate-200/50 bg-slate-50/50 px-4 py-1.5 text-[13px] font-semibold text-slate-500 shadow-sm lg:inline-flex backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-400">
                No active semester
              </span>
            )
          )}

          <ThemeToggle />

          <div className="flex items-center gap-4 pl-4 border-l border-slate-200/50 dark:border-slate-800/70">
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{user?.username || 'Admin Officer'}</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{user?.role || 'System Administrator'}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 shadow-md ring-2 ring-white dark:from-blue-600 dark:to-indigo-600 dark:ring-slate-900">
                <span className="text-xs font-bold text-white tracking-wider">{getInitials(user?.username)}</span>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 dark:text-slate-500 dark:hover:bg-red-950/50 dark:hover:text-red-300"
              title="Log out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <LogoutModal
        open={showLogoutModal}
        onClose={handleLogoutClose}
        onConfirm={handleLogoutConfirm}
        loggingOut={loggingOut}
      />
    </>
  )
}

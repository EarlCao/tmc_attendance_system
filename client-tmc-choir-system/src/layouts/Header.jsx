import { useLocation } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { activeSemester } from '../data/mockData'
import { useTheme } from '../context/ThemeContext'

const crumbMap = {
  '/':           'Dashboard',
  '/semesters':  'Semester Management',
  '/attendance': 'Attendance Management',
  '/absences':   'Absences & Excuses',
  '/members':    'Choir Members',
  '/auditions':  'Audition Management',
  '/judges':     'Judge Management',
  '/officers':   'Officers',
  '/elections':  'Officer Elections',
  '/reports':    'Reports',
  '/settings':   'Settings',
}

export default function Header() {
  const location = useLocation()
  const pageTitle = crumbMap[location.pathname] ?? 'Page'
  const { dark, toggle } = useTheme()

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between px-6 shrink-0">
      {/* Left: Breadcrumb */}
      <div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">TMC Choir Attendance System</p>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">{pageTitle}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Active semester badge */}
        {activeSemester && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full border border-blue-100 dark:border-blue-700/40">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {activeSemester.name}
          </span>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-100 dark:border-gray-700">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">AD</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Admin Officer</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">TMC Choir</p>
          </div>
        </div>
      </div>
    </header>
  )
}

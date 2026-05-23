import { useLocation } from 'react-router-dom'
import { Music4 } from 'lucide-react'
import { activeSemester } from '../data/mockData'

const crumbMap = {
  '/':           'Dashboard',
  '/semesters':  'Semester Management',
  '/attendance': 'Attendance Management',
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

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white/92 px-4 backdrop-blur sm:px-6">
      {/* Left: Breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/25 md:hidden">
          <Music4 size={18} />
        </div>
        <div className="min-w-0">
          <p className="mb-0.5 truncate text-[11px] text-gray-400">TMC Choir Attendance System</p>
          <h1 className="truncate text-base font-semibold text-gray-900">{pageTitle}</h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active semester badge */}
        {activeSemester && (
          <span className="hidden items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 lg:inline-flex">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {activeSemester.name}
          </span>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-2 border-l border-gray-100 pl-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
            <span className="text-xs font-bold text-white">AD</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-gray-900">Admin Officer</p>
            <p className="text-[10px] text-gray-400">TMC Choir</p>
          </div>
        </div>
      </div>
    </header>
  )
}

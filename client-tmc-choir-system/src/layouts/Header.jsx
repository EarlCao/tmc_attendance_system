import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { activeSemester } from '../data/mockData'

const crumbMap = {
  '/':           'Dashboard',
  '/semesters':  'Semester Management',
  '/attendance': 'Attendance Management',
  '/absences':   'Absences & Excuses',
  '/members':    'Choir Members',
  '/auditions':  'Audition Management',
  '/judges':     'Judge Management',
  '/reports':    'Reports',
  '/settings':   'Settings',
}

export default function Header() {
  const location = useLocation()
  const pageTitle = crumbMap[location.pathname] ?? 'Page'

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      {/* Left: Breadcrumb */}
      <div>
        <p className="text-[11px] text-gray-400 mb-0.5">TMC Choir Attendance System</p>
        <h1 className="text-base font-semibold text-gray-900">{pageTitle}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Active semester badge */}
        {activeSemester && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {activeSemester.name}
          </span>
        )}

        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
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

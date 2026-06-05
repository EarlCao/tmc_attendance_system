import { createPortal } from 'react-dom'
import { Music2, Sparkles, X } from 'lucide-react'

export default function WelcomeModal({ open, onClose, user }) {
  if (!open) return null

  const getInitials = (name) => {
    if (!name) return 'AD'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-300 ease-out">
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

          {/* Top gradient banner */}
          <div className="relative flex flex-col items-center px-8 pb-6 pt-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white/80 transition-colors hover:bg-white/30 hover:text-white"
            >
              <X size={16} />
            </button>

            {/* Decorative sparkles */}
            <Sparkles size={18} className="absolute left-6 top-6 text-yellow-300/70" />
            <Sparkles size={12} className="absolute right-10 top-10 text-blue-200/60" />

            {/* Avatar */}
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30 shadow-lg">
              <span className="text-xl font-black text-white tracking-wide">
                {getInitials(user?.username)}
              </span>
            </div>

            <p className="text-sm font-medium text-blue-100">{getGreeting()},</p>
            <h2 className="mt-0.5 text-2xl font-black text-white tracking-tight">
              {user?.username || 'Admin'}!
            </h2>
          </div>

          {/* Body */}
          <div className="flex flex-col items-center px-8 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50">
              <Music2 size={20} className="text-blue-600 dark:text-blue-400" />
            </div>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              You're logged in as{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
                {user?.role || 'Administrator'}
              </span>.
            </p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              Welcome to the TMC Choir Attendance System.
            </p>

            <p className="mt-4 text-xs font-semibold text-amber-500 dark:text-amber-400 block md:hidden bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg">
              For the best view, please try using Desktop Mode on your browser.
            </p>

            <button
              onClick={onClose}
              className="btn-primary mt-6 w-full justify-center py-2.5 text-sm"
            >
              Let's get started
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}

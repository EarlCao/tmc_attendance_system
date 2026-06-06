import { createPortal } from 'react-dom'
import { FlaskConical, TriangleAlert, X } from 'lucide-react'

export default function TestingNoticeModal({ open, onClose }) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-300 ease-out">
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

          {/* Top banner */}
          <div className="relative flex flex-col items-center px-8 pb-6 pt-10 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500">
            <button
              onClick={onClose}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white/80 transition-colors hover:bg-white/30 hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30 shadow-lg">
              <FlaskConical size={28} className="text-white" />
            </div>

            <h2 className="text-xl font-black text-white tracking-tight text-center">
              Test Deployment Only
            </h2>
            <p className="mt-1 text-sm font-medium text-orange-100 text-center">
              Please read before continuing
            </p>
          </div>

          {/* Body */}
          <div className="flex flex-col items-center px-8 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50">
              <TriangleAlert size={20} className="text-amber-500" />
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              This system is currently for testing purposes only.
            </p>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              It is <span className="font-semibold text-red-500">not yet ready</span> for actual deployment or real-world use. Features may be incomplete, and data may be reset at any time without notice.
            </p>

            <div className="mt-4 w-full rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-left">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">Note</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
                Any information entered here is for demo and evaluation purposes only. Do not enter sensitive or real personal data.
              </p>
            </div>

            <button
              onClick={onClose}
              className="btn-primary mt-6 w-full justify-center py-2.5 text-sm bg-amber-500 hover:bg-amber-600 border-amber-500 hover:border-amber-600"
            >
              I understand, continue
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}

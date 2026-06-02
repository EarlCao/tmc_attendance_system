import { useEffect } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'
import { cn } from '../../lib/utils'

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const isSuccess = toast.type !== 'error'

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border min-w-[260px] max-w-xs pointer-events-auto',
        'animate-in slide-in-from-bottom-3 duration-300',
        isSuccess
          ? 'bg-emerald-50 border-emerald-200/80 text-emerald-800'
          : 'bg-red-50 border-red-200/80 text-red-800'
      )}
    >
      {isSuccess
        ? <CheckCircle2 size={17} className="text-emerald-500 shrink-0" />
        : <XCircle size={17} className="text-red-500 shrink-0" />
      }
      <p className="text-[13px] font-semibold flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-40 hover:opacity-100 transition-opacity ml-1"
      >
        <X size={13} />
      </button>
    </div>
  )
}

export default function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

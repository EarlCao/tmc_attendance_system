import { cn } from '../../lib/utils'

export default function StatCard({ label, value, sub, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue:   { icon: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-200',     text: 'text-blue-600 dark:text-blue-300' },
    green:  { icon: 'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-200', text: 'text-green-600 dark:text-green-300' },
    red:    { icon: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-200',         text: 'text-red-600 dark:text-red-300' },
    yellow: { icon: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-200', text: 'text-yellow-600 dark:text-yellow-300' },
    purple: { icon: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-200', text: 'text-purple-600 dark:text-purple-300' },
    orange: { icon: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-200', text: 'text-orange-600 dark:text-orange-300' },
  }
  const c = colors[color] ?? colors.blue

  return (
    <div className="card p-5 flex items-start gap-4">
      {Icon && (
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', c.icon)}>
          <Icon size={20} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 truncate dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 dark:text-slate-100">{value}</p>
        {sub && <p className={cn('text-xs mt-0.5', c.text)}>{sub}</p>}
      </div>
    </div>
  )
}

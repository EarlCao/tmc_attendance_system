import { cn } from '../../lib/utils'

export default function StatCard({ label, value, sub, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue:   { icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',   text: 'text-blue-600 dark:text-blue-400' },
    green:  { icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400', text: 'text-green-600 dark:text-green-400' },
    red:    { icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',       text: 'text-red-600 dark:text-red-400' },
    yellow: { icon: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400', text: 'text-yellow-600 dark:text-yellow-400' },
    purple: { icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400', text: 'text-purple-600 dark:text-purple-400' },
    orange: { icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400', text: 'text-orange-600 dark:text-orange-400' },
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
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
        {sub && <p className={cn('text-xs mt-0.5', c.text)}>{sub}</p>}
      </div>
    </div>
  )
}

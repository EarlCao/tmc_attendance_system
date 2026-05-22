import { cn } from '../../lib/utils'

export default function StatCard({ label, value, sub, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue:   { icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-600' },
    green:  { icon: 'bg-green-100 text-green-600', text: 'text-green-600' },
    red:    { icon: 'bg-red-100 text-red-600',       text: 'text-red-600' },
    yellow: { icon: 'bg-yellow-100 text-yellow-600', text: 'text-yellow-600' },
    purple: { icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600' },
    orange: { icon: 'bg-orange-100 text-orange-600', text: 'text-orange-600' },
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
        <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className={cn('text-xs mt-0.5', c.text)}>{sub}</p>}
      </div>
    </div>
  )
}

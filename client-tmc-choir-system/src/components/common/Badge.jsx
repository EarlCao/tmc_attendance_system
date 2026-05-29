import { cn } from '../../lib/utils'

export default function Badge({ children, variant = 'default', className }) {
  const variants = {
    default:   'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200',
    primary:   'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200',
    success:   'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-200',
    warning:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-200',
    danger:    'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200',
    purple:    'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-200',
    pink:      'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-200',
    orange:    'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200',
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant] ?? variants.default,
      className
    )}>
      {children}
    </span>
  )
}

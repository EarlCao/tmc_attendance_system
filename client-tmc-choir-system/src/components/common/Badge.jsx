import { cn } from '../../lib/utils'

export default function Badge({ children, variant = 'default', className }) {
  const variants = {
    default:   'bg-gray-100 text-gray-700',
    primary:   'bg-blue-100 text-blue-700',
    success:   'bg-green-100 text-green-700',
    warning:   'bg-yellow-100 text-yellow-700',
    danger:    'bg-red-100 text-red-700',
    purple:    'bg-purple-100 text-purple-700',
    pink:      'bg-pink-100 text-pink-700',
    orange:    'bg-orange-100 text-orange-700',
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

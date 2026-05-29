import { getInitials } from '../../lib/utils'
import { cn } from '../../lib/utils'

const colorsByPart = {
  Soprano: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-200',
  Alto:    'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-200',
  Tenor:   'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200',
  Bass:    'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-200',
  default: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200',
}

export default function Avatar({ name, voicePart, size = 'md', className }) {
  const color = colorsByPart[voicePart] ?? colorsByPart.default
  const sizes = {
    sm:  'w-7 h-7 text-[10px]',
    md:  'w-9 h-9 text-xs',
    lg:  'w-12 h-12 text-sm',
    xl:  'w-16 h-16 text-base',
  }
  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-bold shrink-0',
      sizes[size] ?? sizes.md,
      color,
      className
    )}>
      {getInitials(name)}
    </div>
  )
}

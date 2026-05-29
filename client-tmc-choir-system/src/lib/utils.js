import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getVoicePartColor(part) {
  const colors = {
    Soprano: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-200',
    Alto: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-200',
    Tenor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200',
    Bass: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-200',
  }
  return colors[part] || 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200'
}

export function getAttendanceColor(status) {
  const colors = {
    Present: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-200',
    Late: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-200',
    Absent: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200',
    Excused: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200'
}

export function getStatusColor(status) {
  const colors = {
    active: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-200',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300',
    archived: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200',
    Passed: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-200',
    Failed: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200',
    Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-200',
    Approved: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-200',
    Rejected: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200'
}

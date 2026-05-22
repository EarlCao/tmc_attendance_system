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
    Soprano: 'bg-pink-100 text-pink-700',
    Alto: 'bg-purple-100 text-purple-700',
    Tenor: 'bg-blue-100 text-blue-700',
    Bass: 'bg-green-100 text-green-700',
  }
  return colors[part] || 'bg-gray-100 text-gray-700'
}

export function getAttendanceColor(status) {
  const colors = {
    Present: 'bg-green-100 text-green-700',
    Late: 'bg-yellow-100 text-yellow-700',
    Absent: 'bg-red-100 text-red-700',
    Excused: 'bg-blue-100 text-blue-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export function getStatusColor(status) {
  const colors = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    archived: 'bg-orange-100 text-orange-700',
    Passed: 'bg-green-100 text-green-700',
    Failed: 'bg-red-100 text-red-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

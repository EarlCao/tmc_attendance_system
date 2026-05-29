import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const getStoredTheme = () => {
  try {
    const savedTheme = localStorage.getItem('tmcTheme')
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  } catch {
    // Fall back to the current document theme when storage is unavailable.
  }

  return document.documentElement.classList.contains('dark') || document.documentElement.dataset.theme === 'sunset'
    ? 'dark'
    : 'light'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getStoredTheme)
  const isDark = theme === 'dark'

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = isDark ? 'sunset' : 'light'
    root.classList.toggle('dark', isDark)
    root.style.colorScheme = theme

    try {
      localStorage.setItem('tmcTheme', theme)
    } catch {
      // Theme still applies for the current session.
    }
  }, [theme, isDark])

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="btn btn-circle btn-ghost border border-slate-200/60 bg-white/70 text-slate-500 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

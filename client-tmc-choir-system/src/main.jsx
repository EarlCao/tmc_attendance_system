import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem('tmcTheme')
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  } catch {
    // Ignore storage access failures and use the system preference below.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const initialTheme = getInitialTheme()
document.documentElement.dataset.theme = initialTheme === 'dark' ? 'sunset' : 'light'
document.documentElement.classList.toggle('dark', initialTheme === 'dark')
document.documentElement.style.colorScheme = initialTheme

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

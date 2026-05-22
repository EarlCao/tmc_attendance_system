import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

document.documentElement.classList.remove('dark')
document.documentElement.style.colorScheme = 'light'
try { localStorage.removeItem('tmcTheme') } catch {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

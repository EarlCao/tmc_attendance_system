import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Lock, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../lib/api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await authAPI.login({ username, password })
      if (response.status === 'success') {
        login(response.token, response.data.user)
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      {/* Background layer */}
      <div className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.95)), radial-gradient(circle at 10% 0%, rgba(59,130,246,0.18), transparent 45%), radial-gradient(circle at 90% 10%, rgba(139,92,246,0.15), transparent 45%)',
          filter: 'blur(0px)',
        }}
      />

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        {/* Card */}
        <div className="rounded-3xl border border-white/80 bg-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl px-8 pb-8 pt-4">
          {/* Logo & Title */}
          <div className="mb-8 text-center justify-center flex flex-col items-center">
              <img
                src="/tmc_choir_logo.png"
                alt="TMC Choir logo"
                className="object-contain h-28 w-28"
              />
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">TMC Choir System</h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">Sign in to access the attendance system</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100/95 ring-1 ring-slate-200/80">
                    <User size={16} className="text-slate-600" />
                  </span>
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  className="input pl-14"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100/95 ring-1 ring-slate-200/80">
                    <Lock size={16} className="text-slate-600" />
                  </span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="input pl-14 pr-14"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-3 flex items-center"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100/95 text-slate-600 ring-1 ring-slate-200/80 transition-colors hover:bg-slate-200/90 hover:text-slate-800">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 text-base shadow-blue-500/40"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-[11px] font-medium text-slate-400">
            TMC Choir &copy; {new Date().getFullYear()} · Trinidad Municipal College
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, AlertCircle, Music4 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../lib/api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
        <div className="rounded-3xl border border-white/80 bg-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl px-8 py-10">
          {/* Logo & Title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
              <Music4 size={28} />
            </div>
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
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  className="input pl-10"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock size={16} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className="input pl-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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

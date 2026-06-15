import { useState, useMemo } from 'react'
import {
  ShieldAlert, LogIn, LogOut, KeyRound, UserPlus, Trash2,
  Pencil, CalendarDays, Users, RefreshCw, Loader2, Search,
  Circle, AlertTriangle, X,
} from 'lucide-react'
import { useAuditLogs } from '../hooks/useAuditLogs'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../hooks/useToast'
import Toast from '../components/common/Toast'
import { cn } from '../lib/utils'

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORIES = ['ALL', 'AUTH', 'ACCOUNT', 'MEMBER', 'SEMESTER']

const ACTION_CONFIG = {
  // AUTH
  LOGIN:             { icon: LogIn,        color: 'text-emerald-600', bg: 'bg-emerald-50 ring-emerald-200',    label: 'Login',                badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  LOGIN_FAILED:      { icon: AlertTriangle, color: 'text-rose-600',   bg: 'bg-rose-50 ring-rose-200',          label: 'Login Failed',         badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
  LOGOUT:            { icon: LogOut,        color: 'text-amber-600',  bg: 'bg-amber-50 ring-amber-200',        label: 'Logout',               badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  // ACCOUNT
  CREATE_ACCOUNT:    { icon: UserPlus,      color: 'text-blue-600',   bg: 'bg-blue-50 ring-blue-200',          label: 'Create Account',       badge: 'bg-blue-50 text-blue-700 ring-blue-200' },
  DELETE_ACCOUNT:    { icon: Trash2,        color: 'text-rose-600',   bg: 'bg-rose-50 ring-rose-200',          label: 'Delete Account',       badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
  UPDATE_ACCOUNT:    { icon: Pencil,        color: 'text-slate-600',  bg: 'bg-slate-50 ring-slate-200',        label: 'Update Account',       badge: 'bg-slate-50 text-slate-700 ring-slate-200' },
  CHANGE_USERNAME:   { icon: KeyRound,      color: 'text-purple-600', bg: 'bg-purple-50 ring-purple-200',      label: 'Change Username',      badge: 'bg-purple-50 text-purple-700 ring-purple-200' },
  CHANGE_PASSWORD:   { icon: KeyRound,      color: 'text-orange-600', bg: 'bg-orange-50 ring-orange-200',      label: 'Change Password',      badge: 'bg-orange-50 text-orange-700 ring-orange-200' },
  CHANGE_CREDENTIALS:{ icon: KeyRound,      color: 'text-orange-600', bg: 'bg-orange-50 ring-orange-200',      label: 'Change Credentials',   badge: 'bg-orange-50 text-orange-700 ring-orange-200' },
  // MEMBER
  CREATE_MEMBER:     { icon: Users,         color: 'text-teal-600',   bg: 'bg-teal-50 ring-teal-200',          label: 'Add Member',           badge: 'bg-teal-50 text-teal-700 ring-teal-200' },
  UPDATE_MEMBER:     { icon: Pencil,        color: 'text-cyan-600',   bg: 'bg-cyan-50 ring-cyan-200',          label: 'Update Member',        badge: 'bg-cyan-50 text-cyan-700 ring-cyan-200' },
  DELETE_MEMBER:     { icon: Trash2,        color: 'text-rose-600',   bg: 'bg-rose-50 ring-rose-200',          label: 'Delete Member',        badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
  // SEMESTER
  CREATE_SEMESTER:   { icon: CalendarDays,  color: 'text-violet-600', bg: 'bg-violet-50 ring-violet-200',      label: 'Create Semester',      badge: 'bg-violet-50 text-violet-700 ring-violet-200' },
  UPDATE_SEMESTER:   { icon: CalendarDays,  color: 'text-indigo-600', bg: 'bg-indigo-50 ring-indigo-200',      label: 'Update Semester',      badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  END_SEMESTER:      { icon: CalendarDays,  color: 'text-amber-600',  bg: 'bg-amber-50 ring-amber-200',        label: 'End Semester',         badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  DELETE_SEMESTER:   { icon: Trash2,        color: 'text-rose-600',   bg: 'bg-rose-50 ring-rose-200',          label: 'Delete Semester',      badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
}

const DEFAULT_CONFIG = { icon: ShieldAlert, color: 'text-slate-500', bg: 'bg-slate-50 ring-slate-200', label: 'Action', badge: 'bg-slate-50 text-slate-600 ring-slate-200' }

function getConfig(action) {
  return ACTION_CONFIG[action] || DEFAULT_CONFIG
}

// ─── Time formatting ──────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 5)   return 'just now'
  if (diff < 60)  return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fullTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

// ─── Details parser ───────────────────────────────────────────────────────────

function parseDetails(raw) {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function DetailsChips({ raw }) {
  const d = parseDetails(raw)
  if (!d) return null
  const items = []
  if (d.role)           items.push({ k: 'role', v: d.role })
  if (d.note)           items.push({ k: 'note', v: d.note })
  if (d.linkedMember)   items.push({ k: 'linked', v: d.linkedMember })
  if (d.autoAccount)    items.push({ k: 'account', v: d.autoAccount })
  if (d.endedAt)        items.push({ k: 'ended', v: new Date(d.endedAt).toLocaleDateString() })
  if (d.reason)         items.push({ k: 'reason', v: d.reason })
  if (d.deletedUsername) items.push({ k: 'deleted', v: d.deletedUsername })
  if (Array.isArray(d.changes)) {
    d.changes.forEach(c => {
      if (typeof c === 'string') items.push({ k: 'changed', v: c })
      else if (c.field === 'password') items.push({ k: 'password', v: 'changed' })
      else if (c.from !== undefined) items.push({ k: c.field, v: `${c.from} → ${c.to}` })
    })
  }
  if (!items.length) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {items.map(({ k, v }, i) => (
        <span key={i} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <span className="text-slate-400 dark:text-slate-500">{k}:</span> {String(v)}
        </span>
      ))}
    </div>
  )
}

// ─── Single log row ───────────────────────────────────────────────────────────

function LogRow({ log, isNew }) {
  const cfg = getConfig(log.action)
  const Icon = cfg.icon

  return (
    <div className={cn(
      'flex items-start gap-4 px-6 py-4 border-b border-slate-50 transition-all duration-700',
      isNew ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
    )}>
      {/* Icon */}
      <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 shadow-sm', cfg.bg)}>
        <Icon size={16} className={cfg.color} />
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Action badge */}
          <span className={cn('text-[10px] font-bold px-2.5 py-0.5 rounded-full ring-1', cfg.badge)}>
            {cfg.label}
          </span>
          {/* Username */}
          {log.username && (
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
              {log.username}
            </span>
          )}
          {/* Target */}
          {log.target && (
            <span className="text-[12px] text-slate-400 dark:text-slate-500 font-medium truncate">
              → {log.target}
            </span>
          )}
          {/* Live pulse for brand-new entry */}
          {isNew && (
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
          )}
        </div>

        {/* Details chips */}
        <DetailsChips raw={log.details} />
      </div>

      {/* Time + IP */}
      <div className="shrink-0 text-right">
        <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap" title={fullTime(log.createdAt)}>
          {timeAgo(log.createdAt)}
        </p>
        {log.ipAddress && (
          <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5 font-mono">{log.ipAddress}</p>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditLogs() {
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [searchInput, setSearchInput] = useState('')
  const [clearConfirm, setClearConfirm] = useState(false)
  const search = useDebounce(searchInput, 350)

  const { logs, loading, error, fetchLogs, clearLogs, newLogIds } = useAuditLogs({
    category: categoryFilter,
    search,
  })
  const { toasts, toast, dismiss } = useToast()

  // Stat counts from full visible list
  const stats = useMemo(() => ({
    total: logs.length,
    auth: logs.filter(l => l.category === 'AUTH').length,
    account: logs.filter(l => l.category === 'ACCOUNT').length,
    member: logs.filter(l => l.category === 'MEMBER').length,
  }), [logs])

  async function handleClear() {
    try {
      await clearLogs()
      setClearConfirm(false)
      toast('Audit logs cleared.')
    } catch {
      toast('Failed to clear logs.', 'error')
    }
  }

  return (
    <div className="page-shell">
      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Logs',  value: stats.total,   color: 'bg-slate-100 text-slate-700 ring-slate-200' },
          { label: 'Auth Events', value: stats.auth,    color: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
          { label: 'Account',     value: stats.account, color: 'bg-blue-50 text-blue-700 ring-blue-200' },
          { label: 'Members',     value: stats.member,  color: 'bg-teal-50 text-teal-700 ring-teal-200' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5 text-center flex flex-col items-center justify-center gap-2 hover:-translate-y-1">
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</p>
            <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full ring-1', color)}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-8 text-sm"
              placeholder="Search username, action, target…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="flex gap-1 p-1 bg-slate-100/50 rounded-xl flex-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-200',
                  categoryFilter === cat
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto flex-none">
            <button
              onClick={fetchLogs}
              className="btn-secondary gap-1.5 text-[13px]"
              title="Refresh"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => setClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 ring-1 ring-rose-200 transition-colors"
            >
              <Trash2 size={14} /> Clear All
            </button>
          </div>
        </div>
      </div>

      {/* ── Live indicator ── */}
      <div className="flex items-center gap-2 px-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
          Live — new events appear automatically
        </p>
      </div>

      {/* ── Log list ── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin text-blue-500 w-7 h-7" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <ShieldAlert size={32} className="text-rose-400" />
            <p className="text-[13px] text-slate-500">{error}</p>
            <button onClick={fetchLogs} className="btn-secondary text-[12px]">Try Again</button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Circle size={32} className="text-slate-300" />
            <p className="text-[13px] font-medium text-slate-400">No audit logs yet</p>
            <p className="text-[12px] text-slate-300">Activity will appear here in real-time</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {logs.map(log => (
              <LogRow key={log.id} log={log} isNew={newLogIds.has(log.id)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Clear Confirm Modal ── */}
      {clearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="card p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 ring-1 ring-rose-200">
                <Trash2 size={18} className="text-rose-600" />
              </div>
              <h3 className="text-[16px] font-black text-slate-800 dark:text-slate-100">Clear All Logs?</h3>
            </div>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
              This will permanently delete all audit log entries. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setClearConfirm(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleClear} className="btn-danger">Yes, Clear All</button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

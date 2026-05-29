import { useNavigate } from 'react-router-dom'
import {
  Users, CheckCircle2, XCircle, CalendarDays,
  ClipboardList, Mic2, ArrowRight, BarChart3,
  Loader2
} from 'lucide-react'
import StatCard from '../components/common/StatCard'
import Avatar from '../components/common/Avatar'
import { formatDateShort, getStatusColor } from '../lib/utils'
import { useMembers } from '../hooks/useMembers'
import { useSessions } from '../hooks/useSessions'
import { useAuditions } from '../hooks/useAuditions'
import { useSemesters } from '../hooks/useSemesters'

const activityTypeColor = {
  Practice:    'bg-blue-100 text-blue-700',
  Performance: 'bg-orange-100 text-orange-700',
  Audition:    'bg-purple-100 text-purple-700',
}

export default function Dashboard() {
  const navigate = useNavigate()
  
  const { members, loading: membersLoading } = useMembers()
  const { sessions, loading: sessionsLoading } = useSessions()
  const { auditionees, loading: auditionsLoading } = useAuditions()
  const { activeSemester, loading: semestersLoading } = useSemesters()

  if (membersLoading || sessionsLoading || auditionsLoading || semestersLoading) {
    return <div className="page-shell flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
  }

  const activeMembers = members.filter(m => m.status?.toUpperCase() === 'ACTIVE').length
  const totalMembers = members.length
  const presentToday = 0 // Needs dedicated backend stats endpoint for accuracy, mock for now
  const absentToday = 0

  const voicePartStats = [
    { part: 'Soprano', count: members.filter(m => m.voiceType?.toUpperCase() === 'SOPRANO').length, color: 'bg-pink-400' },
    { part: 'Alto',    count: members.filter(m => m.voiceType?.toUpperCase() === 'ALTO').length,    color: 'bg-purple-400' },
    { part: 'Tenor',   count: members.filter(m => m.voiceType?.toUpperCase() === 'TENOR').length,   color: 'bg-blue-400' },
    { part: 'Bass',    count: members.filter(m => m.voiceType?.toUpperCase() === 'BASS').length,     color: 'bg-emerald-400' },
  ]

  const recentSessions = sessions.slice().reverse().slice(0, 5)

  return (
    <div className="page-shell">
      {/* Page header */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-br from-white to-slate-50/50">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-1">Operations overview</p>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Welcome back, Admin</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Monitor attendance, members, auditions, and semester activity in one place.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/attendance')} className="btn-primary">
              <ClipboardList size={16} /> Mark Attendance
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Members"     value={totalMembers}     icon={Users}        color="blue"   sub={`${activeMembers} active`} />
        <StatCard label="Present Today"     value={presentToday}     icon={CheckCircle2} color="green"  sub="Last session" />
        <StatCard label="Absent Today"      value={absentToday}      icon={XCircle}      color="red"    sub="Last session" />
        <StatCard label="Active Semester"   value={activeSemester ? 'Open' : 'Closed'} icon={CalendarDays} color="yellow" sub={activeSemester?.name ?? 'No active semester'} />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Attendance */}
        <div className="lg:col-span-2 card">
          <div className="panel-header">
            <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wide">Recent Attendance Sessions</h3>
            <button onClick={() => navigate('/attendance')} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-100/50">
            {recentSessions.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">No recent sessions.</div>
            ) : recentSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50/50 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                    <ClipboardList size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-800">{formatDateShort(s.sessionDate)}</p>
                    <p className="text-[12px] font-medium text-slate-500">{s.type}{s.description ? ` · ${s.description}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="text-[13px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full ring-1 ring-emerald-100">{s.counts?.Present || 0} present</span>
                  <span className="text-[13px] text-rose-600 font-bold bg-rose-50 px-3 py-1 rounded-full ring-1 ring-rose-100">{s.counts?.Absent || 0} absent</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Part Breakdown */}
        <div className="card p-6">
          <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wide mb-6">Members by Voice Part</h3>
          <div className="space-y-4">
            {voicePartStats.map((v) => (
              <div key={v.part}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] font-bold text-slate-700">{v.part}</span>
                  <span className="text-[12px] font-medium text-slate-500">{v.count} members</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full ${v.color} shadow-sm transition-all duration-1000 ease-out`}
                    style={{ width: `${totalMembers === 0 ? 0 : (v.count / totalMembers) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100/50 space-y-3">
            <div className="flex justify-between text-[13px]">
              <span className="font-semibold text-slate-500">Avg. Attendance Rate</span>
              <span className="font-bold text-blue-600">- %</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `0%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Auditions */}
        <div className="lg:col-span-2 card">
          <div className="panel-header">
            <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wide">Recent Auditions</h3>
            <button onClick={() => navigate('/auditions')} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100/50">
            {auditionees.length === 0 ? (
               <div className="p-6 text-center text-sm text-slate-500">No recent auditions.</div>
            ) : auditionees.slice(0, 5).map((a) => {
              return (
                <div key={a.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <Avatar name={a.name} voicePart={a.targetPart} size="md" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-slate-800 truncate">{a.name}</p>
                      <p className="text-[12px] font-medium text-slate-500">{a.targetPart}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ring-1 ${getStatusColor(a.status)}`}>
                      {a.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wide mb-5">Quick Actions</h3>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Mark Attendance',      icon: ClipboardList, to: '/attendance', color: 'btn-primary' },
              { label: 'Add Member',           icon: Users,         to: '/members',    color: 'btn-secondary' },
              { label: 'New Audition',         icon: Mic2,          to: '/auditions',  color: 'btn-secondary' },
              { label: 'View Reports',         icon: BarChart3,     to: '/reports',    color: 'btn-secondary' },
              { label: 'Manage Semesters',     icon: CalendarDays,  to: '/semesters',  color: 'btn-secondary' },
            ].map(({ label, icon: Icon, to, color }) => (
              <button key={label} onClick={() => navigate(to)} className={`${color} w-full justify-start py-3`}>
                <Icon size={16} className="opacity-80" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

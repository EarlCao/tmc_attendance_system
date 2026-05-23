import { useNavigate } from 'react-router-dom'
import {
  Users, CheckCircle2, XCircle, CalendarDays,
  ClipboardList, Mic2, ArrowRight, BarChart3,
} from 'lucide-react'
import StatCard from '../components/common/StatCard'
import Avatar from '../components/common/Avatar'
import {
  members, getDashboardStats, upcomingActivities,
  attendanceSessions, auditionees, activeSemester,
} from '../data/mockData'
import { formatDateShort, getStatusColor } from '../lib/utils'

const stats = getDashboardStats()

const voicePartStats = [
  { part: 'Soprano', count: members.filter(m => m.voicePart === 'Soprano').length, color: 'bg-pink-400', pct: 25 },
  { part: 'Alto',    count: members.filter(m => m.voicePart === 'Alto').length,    color: 'bg-purple-400', pct: 25 },
  { part: 'Tenor',   count: members.filter(m => m.voicePart === 'Tenor').length,   color: 'bg-blue-400', pct: 25 },
  { part: 'Bass',    count: members.filter(m => m.voicePart === 'Bass').length,     color: 'bg-green-400', pct: 25 },
]

const recentSessions = attendanceSessions.slice().reverse().slice(0, 5)

const activityTypeColor = {
  Practice:    'bg-blue-100 text-blue-700',
  Performance: 'bg-orange-100 text-orange-700',
  Audition:    'bg-purple-100 text-purple-700',
}

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="page-shell">
      {/* Page header */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Operations overview</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">Welcome back, Admin</h2>
          <p className="mt-1 text-sm text-gray-500">Monitor attendance, members, auditions, and semester activity in one place.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/attendance')} className="btn-primary">
            <ClipboardList size={15} /> Mark Attendance
          </button>
        </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members"     value={stats.totalMembers}     icon={Users}        color="blue"   sub={`${stats.activeMembers} active`} />
        <StatCard label="Present Today"     value={stats.presentToday}     icon={CheckCircle2} color="green"  sub="Last session" />
        <StatCard label="Absent Today"      value={stats.absentToday}      icon={XCircle}      color="red"    sub="Last session" />
        <StatCard label="Active Semester"   value={activeSemester?.status === 'active' ? 'Open' : 'Closed'} icon={CalendarDays} color="yellow" sub={activeSemester?.name ?? 'No active semester'} />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance */}
        <div className="lg:col-span-2 card">
          <div className="panel-header">
            <h3 className="text-sm font-semibold text-gray-900">Recent Attendance Sessions</h3>
            <button onClick={() => navigate('/attendance')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentSessions.map((s) => {
              const presentCount = Math.floor(Math.random() * 4) + 12
              const absentCount  = 16 - presentCount
              return (
                <div key={s.id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50/70">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <ClipboardList size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{formatDateShort(s.date)}</p>
                      <p className="text-xs text-gray-400">{s.type}{s.notes ? ` · ${s.notes}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-xs text-green-600 font-medium">{presentCount} present</span>
                    <span className="text-xs text-red-500 font-medium">{absentCount} absent</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Voice Part Breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Members by Voice Part</h3>
          <div className="space-y-3">
            {voicePartStats.map((v) => (
              <div key={v.part}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">{v.part}</span>
                  <span className="text-xs text-gray-500">{v.count} members</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${v.color}`}
                    style={{ width: `${(v.count / members.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-50 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Avg. Attendance Rate</span>
              <span className="font-semibold text-blue-600">{stats.averageAttendance}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${stats.averageAttendance}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Activities */}
        <div className="lg:col-span-2 card">
          <div className="panel-header">
            <h3 className="text-sm font-semibold text-gray-900">Upcoming Activities</h3>
            <CalendarDays size={16} className="text-gray-400" />
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingActivities.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-gray-50/70">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarDays size={14} className="text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                  <p className="text-xs text-gray-400">{formatDateShort(a.date)} · {a.time}</p>
                  <p className="text-xs text-gray-400 truncate">{a.location}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${activityTypeColor[a.type]}`}>
                  {a.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Auditions */}
        <div className="card">
          <div className="panel-header">
            <h3 className="text-sm font-semibold text-gray-900">Recent Auditions</h3>
            <button onClick={() => navigate('/auditions')} className="text-xs text-blue-600 hover:underline">
              View all
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {auditionees.slice(0, 5).map((a) => {
              const avg = a.ratings.length
                ? (a.ratings.reduce((s, r) => s + (r.vocalQuality + r.pitchAccuracy + r.tone + r.rhythm + r.confidence + r.stagePresence) / 6, 0) / a.ratings.length).toFixed(1)
                : null
              return (
                <div key={a.id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50/70">
                  <div className="flex items-center gap-2">
                    <Avatar name={a.name} voicePart={a.targetPart} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{a.name}</p>
                      <p className="text-[10px] text-gray-400">{a.targetPart}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {avg && <span className="text-[10px] text-yellow-600 font-semibold">{avg}</span>}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(a.status)}`}>
                      {a.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Mark Attendance',      icon: ClipboardList, to: '/attendance', color: 'btn-primary' },
            { label: 'Add Member',           icon: Users,         to: '/members',    color: 'btn-secondary' },
            { label: 'New Audition',         icon: Mic2,          to: '/auditions',  color: 'btn-secondary' },
            { label: 'View Reports',         icon: BarChart3,     to: '/reports',    color: 'btn-secondary' },
            { label: 'Manage Semesters',     icon: CalendarDays,  to: '/semesters',  color: 'btn-secondary' },
          ].map(({ label, icon: Icon, to, color }) => (
            <button key={label} onClick={() => navigate(to)} className={color}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

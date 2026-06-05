import { usePortal } from '../../hooks/usePortal'
import { useEffect } from 'react'
import { Loader2, CalendarCheck, CalendarX, Clock, MapPin, Award, Mic2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import Avatar from '../../components/common/Avatar'

export default function MemberDashboard() {
  const { dashboardData, loading, fetchDashboard } = usePortal()

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading || !dashboardData) {
    return <div className="page-shell flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
  }

  const { stats, member, recentAttendance } = dashboardData

  return (
    <div className="page-shell">
      {/* Welcome Banner */}
      <div className="card p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Mic2 size={120} />
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <Avatar name={member.fullName} voicePart={member.voiceType} size="xl" className="ring-4 ring-white/20 shadow-xl" />
          <div>
            <h1 className="text-3xl font-black tracking-tight">Welcome, {member.fullName}!</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={cn('text-xs font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm')}>{member.voiceType}</span>
              <span className={cn('text-xs font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm')}>{member.status}</span>
              {member.officer && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 backdrop-blur-sm flex items-center gap-1">
                  <Award size={14} /> {member.officer.position}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="card p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-sm font-bold">Present</span>
            <CalendarCheck size={20} />
          </div>
          <p className="text-4xl font-black text-slate-800 tracking-tight">{stats.present}</p>
        </div>
        <div className="card p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-red-600">
            <span className="text-sm font-bold">Absent</span>
            <CalendarX size={20} />
          </div>
          <p className="text-4xl font-black text-slate-800 tracking-tight">{stats.absent}</p>
        </div>
        <div className="card p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-sm font-bold">Late</span>
            <Clock size={20} />
          </div>
          <p className="text-4xl font-black text-slate-800 tracking-tight">{stats.late}</p>
        </div>
        <div className="card p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-sm font-bold">Excused</span>
            <MapPin size={20} />
          </div>
          <p className="text-4xl font-black text-slate-800 tracking-tight">{stats.excused}</p>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="card mt-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Recent Attendance</h2>
        </div>
        <div className="p-0">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-50">
              {recentAttendance.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{record.session?.title || 'Unknown Session'}</p>
                    <p className="text-[12px] text-slate-500">{new Date(record.session?.sessionDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ring-1 ${record.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : record.status === 'ABSENT' ? 'bg-red-50 text-red-700 ring-red-200' : record.status === 'LATE' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-blue-50 text-blue-700 ring-blue-200'}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentAttendance.length === 0 && (
                <tr>
                  <td colSpan="2" className="px-6 py-8 text-center text-slate-500">No recent attendance records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

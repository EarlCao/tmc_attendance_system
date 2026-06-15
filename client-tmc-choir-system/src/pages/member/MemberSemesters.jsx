import { usePortal } from '../../hooks/usePortal'
import { useEffect } from 'react'
import { Loader2, CalendarCheck, CalendarX, Clock, MapPin, BarChart2, CalendarRange } from 'lucide-react'
import { cn } from '../../lib/utils'

function AttendanceBadge({ status, count }) {
  const styles = {
    PRESENT: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    ABSENT:  'bg-red-50 text-red-700 ring-red-200',
    LATE:    'bg-amber-50 text-amber-700 ring-amber-200',
    EXCUSED: 'bg-blue-50 text-blue-700 ring-blue-200',
  }
  const icons = {
    PRESENT: CalendarCheck,
    ABSENT:  CalendarX,
    LATE:    Clock,
    EXCUSED: MapPin,
  }
  const Icon = icons[status]
  return (
    <div className={cn('flex flex-col items-center gap-1 px-4 py-3 rounded-xl ring-1', styles[status])}>
      <Icon size={18} />
      <p className="text-2xl font-black leading-none">{count}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{status.charAt(0) + status.slice(1).toLowerCase()}</p>
    </div>
  )
}

function RateBar({ rate }) {
  const color =
    rate >= 80 ? 'bg-emerald-500' :
    rate >= 60 ? 'bg-amber-500' :
    'bg-red-500'

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
        <span className={cn(
          'text-sm font-black',
          rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600'
        )}>{rate}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  )
}

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function MemberSemesters() {
  const { semesterSummaryData, loading, fetchSemesterSummary } = usePortal()

  useEffect(() => {
    fetchSemesterSummary()
  }, [fetchSemesterSummary])

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BarChart2 size={100} />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black tracking-tight">Semester Summaries</h1>
          <p className="text-sm text-white/70 mt-1">Your attendance performance per semester</p>
        </div>
      </div>

      {/* Empty state */}
      {semesterSummaryData.length === 0 && (
        <div className="card mt-6 p-12 flex flex-col items-center justify-center text-center">
          <CalendarRange size={40} className="text-slate-300 mb-4" />
          <p className="text-lg font-bold text-slate-600">No semester records yet</p>
          <p className="text-sm text-slate-400 mt-1">Your attendance data will appear here once the semester begins.</p>
        </div>
      )}

      {/* Semester cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        {semesterSummaryData.map((sem) => (
          <div key={sem.id} className="card p-6 flex flex-col gap-5">
            {/* Semester name + dates */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight leading-tight">{sem.name}</h2>
                {(sem.startDate || sem.endDate) && (
                  <p className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <CalendarRange size={12} />
                    {formatDate(sem.startDate)}
                    {sem.startDate && sem.endDate && ' – '}
                    {formatDate(sem.endDate)}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sessions</p>
                <p className="text-2xl font-black text-slate-800 leading-tight">{sem.totalSessions}</p>
              </div>
            </div>

            {/* Attendance rate bar */}
            <RateBar rate={sem.attendanceRate} />

            {/* Status breakdown */}
            <div className="grid grid-cols-4 gap-2">
              <AttendanceBadge status="PRESENT" count={sem.present} />
              <AttendanceBadge status="ABSENT"  count={sem.absent} />
              <AttendanceBadge status="LATE"    count={sem.late} />
              <AttendanceBadge status="EXCUSED" count={sem.excused} />
            </div>

            {/* Footer note */}
            <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
              {sem.recorded} of {sem.totalSessions} sessions recorded
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

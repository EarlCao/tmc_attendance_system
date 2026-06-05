import { usePortal } from '../../hooks/usePortal'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function MemberAttendance() {
  const { attendanceData, loading, fetchAttendance } = usePortal()
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  if (loading) {
    return <div className="page-shell flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
  }

  const filtered = attendanceData.filter(r => filter === 'All' || r.status === filter)

  return (
    <div className="page-shell">
      <div className="card p-4">
        <div className="flex flex-row items-center px-1 gap-4 overflow-x-auto">
          <div className="flex gap-1 p-1 bg-slate-100/50 rounded-xl flex-none">
            {['All', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn('px-4 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200',
                  filter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >{s === 'All' ? 'All Status' : s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Session</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {new Date(r.session?.sessionDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{r.session?.title || 'Unknown'}</p>
                    {r.session?.type && <p className="text-[12px] text-slate-400">{r.session.type}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ring-1 ${r.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : r.status === 'ABSENT' ? 'bg-red-50 text-red-700 ring-red-200' : r.status === 'LATE' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-blue-50 text-blue-700 ring-blue-200'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {r.notes || '-'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No attendance records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

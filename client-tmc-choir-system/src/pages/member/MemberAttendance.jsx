import { usePortal } from '../../hooks/usePortal'
import { useEffect, useState, useMemo } from 'react'
import { Loader2, CalendarDays, FileText } from 'lucide-react'
import Modal from '../../components/common/Modal'
import { cn } from '../../lib/utils'
import socket from '../../lib/socket'

export default function MemberAttendance() {
  const { attendanceData, loading, fetchAttendance } = usePortal()
  const [filter, setFilter] = useState('All')
  const [selectedSemesterId, setSelectedSemesterId] = useState('All')
  const [selectedNote, setSelectedNote] = useState(null)

  useEffect(() => {
    fetchAttendance()
    
    const onUpdate = () => fetchAttendance()
    
    socket.on('attendance:saved', onUpdate)
    socket.on('attendance:updated', onUpdate)
    socket.on('session:created', onUpdate)
    socket.on('session:updated', onUpdate)
    socket.on('session:deleted', onUpdate)

    return () => {
      socket.off('attendance:saved', onUpdate)
      socket.off('attendance:updated', onUpdate)
      socket.off('session:created', onUpdate)
      socket.off('session:updated', onUpdate)
      socket.off('session:deleted', onUpdate)
    }
  }, [fetchAttendance])

  const semesters = useMemo(() => {
    const map = new Map()
    attendanceData.forEach(r => {
      const sem = r.session?.semester
      if (sem && !map.has(sem.id)) {
        map.set(sem.id, sem)
      }
    })
    return Array.from(map.values()).sort((a, b) => b.id - a.id)
  }, [attendanceData])

  useEffect(() => {
    if (semesters.length > 0 && selectedSemesterId === 'All') {
      setSelectedSemesterId(semesters[0].id)
    }
  }, [semesters, selectedSemesterId])

  if (loading) {
    return <div className="page-shell flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
  }

  const filtered = attendanceData.filter(r => {
    const statusMatch = filter === 'All' || r.status === filter
    const semesterMatch = selectedSemesterId === 'All' || r.session?.semesterId === selectedSemesterId || String(r.session?.semesterId) === String(selectedSemesterId)
    return statusMatch && semesterMatch
  })

  return (
    <div className="page-shell">
      <div className="card p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-row items-center px-1 gap-4 overflow-x-auto w-full md:w-auto">
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
          
          <div className="flex items-center gap-2 w-full md:w-auto px-1">
            <CalendarDays size={16} className="text-slate-400" />
            <select
              className="input py-2 text-sm max-w-[200px]"
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value === 'All' ? 'All' : Number(e.target.value))}
            >
              {semesters.map(sem => (
                <option key={sem.id} value={sem.id}>{sem.name}</option>
              ))}
              {semesters.length === 0 && <option value="All">No semesters</option>}
            </select>
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
                    {r.notes ? (
                      <button 
                        onClick={() => setSelectedNote(r)}
                        className="btn-secondary py-1.5 px-3 text-[11px]"
                      >
                        <FileText size={12} className="mr-1" /> View
                      </button>
                    ) : (
                      <span className="text-slate-400 italic">No notes</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No attendance records found for this selection.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        title={selectedNote?.session?.sessionDate ? `Attendance Note (${new Date(selectedNote.session.sessionDate).toLocaleDateString()})` : "Attendance Note"}
        size="sm"
        footer={
          <button onClick={() => setSelectedNote(null)} className="btn-primary w-full justify-center">
            Close
          </button>
        }
      >
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap border border-slate-100 dark:border-slate-800">
          {selectedNote?.notes}
        </div>
      </Modal>
    </div>
  )
}

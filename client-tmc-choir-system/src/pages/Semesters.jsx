import { useState, useMemo } from 'react'
import { CalendarDays, Eye, Lock, Pencil, Plus, Loader2 } from 'lucide-react'
import { useSemesters } from '../hooks/useSemesters'
import { useSessions } from '../hooks/useSessions'
import { useMembers } from '../hooks/useMembers'
import { useAuditions } from '../hooks/useAuditions'
import { useJudges } from '../hooks/useJudges'
import { useExcuses } from '../hooks/useExcuses'
import { getStatusColor, formatDateShort, cn, getAttendanceColor, getVoicePartColor } from '../lib/utils'
import Avatar from '../components/common/Avatar'
import Modal from '../components/common/Modal'

const semesterTabs = ['Overview', 'Attendance', 'Sessions', 'People', 'Auditions']

function formatSemesterRange(semester) {
  if (!semester.startDate && !semester.endDate) return 'Dates not set'
  if (!semester.startDate) return `Until ${formatDateShort(semester.endDate)}`
  if (!semester.endDate) return `From ${formatDateShort(semester.startDate)}`
  return `${formatDateShort(semester.startDate)} to ${formatDateShort(semester.endDate)}`
}

export default function Semesters() {
  const { semesters: semesterList, activeSemester: currentSemester, loading: sLoading, createSemester, updateSemester } = useSemesters()
  const { sessions, loading: sessLoading } = useSessions()
  const { members, loading: mLoading } = useMembers()
  const { auditionees, loading: aLoading } = useAuditions()
  const { judges, loading: jLoading } = useJudges()
  const { excuses, loading: eLoading } = useExcuses()

  const [selectedSemester, setSelectedSemester] = useState(null)
  const [selectedTab, setSelectedTab] = useState('Overview')
  const [semesterModal, setSemesterModal] = useState(false)
  const [semesterForm, setSemesterForm] = useState({ name: '', startDate: '', endDate: '' })
  const [endConfirmModal, setEndConfirmModal] = useState(false)
  const [endConfirmText, setEndConfirmText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loading = sLoading || sessLoading || mLoading || aLoading || jLoading || eLoading

  async function handleEndSemester() {
    if (!currentSemester) return
    setIsSaving(true)
    try {
      await updateSemester(currentSemester.id, { status: 'archived' })
      setSelectedSemester((prev) =>
        prev?.id === currentSemester.id ? { ...prev, status: 'archived' } : prev
      )
      setEndConfirmText('')
      setEndConfirmModal(false)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCreateSemester() {
    if (!semesterForm.name.trim()) return
    setIsSaving(true)
    try {
      await createSemester({
        name: semesterForm.name.trim(),
        startDate: semesterForm.startDate,
        endDate: semesterForm.endDate,
        status: 'active'
      })
      setSemesterForm({ name: '', startDate: '', endDate: '' })
      setSemesterModal(false)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedSessions = useMemo(
    () => (selectedSemester ? sessions.filter((s) => s.semesterId === selectedSemester.id) : []),
    [selectedSemester, sessions]
  )
  const selectedExcuses = useMemo(
    () => (selectedSemester ? excuses.filter(e => {
        const d = e.date.slice(0, 10);
        return (!selectedSemester.startDate || d >= selectedSemester.startDate) && (!selectedSemester.endDate || d <= selectedSemester.endDate)
    }) : []),
    [selectedSemester, excuses]
  )
  const selectedAuditionees = useMemo(
    () => (selectedSemester ? auditionees.filter(a => {
        const d = a.auditionDate.slice(0, 10);
        return (!selectedSemester.startDate || d >= selectedSemester.startDate) && (!selectedSemester.endDate || d <= selectedSemester.endDate)
    }) : []),
    [selectedSemester, auditionees]
  )
  const selectedJudges = useMemo(
    () => (selectedSemester ? judges.filter(j => j.semesterId === selectedSemester.id || currentSemester?.id === selectedSemester.id) : []),
    [selectedSemester, judges, currentSemester]
  )
  const selectedAuditionSummary = useMemo(
    () => ({
      passed: selectedAuditionees.filter((a) => a.status === 'Passed').length,
      failed: selectedAuditionees.filter((a) => a.status === 'Failed').length,
      pending: selectedAuditionees.filter((a) => a.status === 'Pending').length,
    }),
    [selectedAuditionees]
  )
  // Need attendance fetching to do full reports, for now simple counts.
  const selectedAttendance = [] // Not fetching all attendance dynamically for memory, using summary instead if available.

  if (loading) {
    return <div className="page-shell flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
  }

  return (
    <div className="page-shell">
      <div className="card p-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Semester records</p>
          <h2 className="mt-1 text-2xl font-black text-slate-800 tracking-tight">Semester Management</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Ended semesters remain available for viewing, but archived records cannot be edited.</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={() => setSemesterModal(true)} className="btn-primary shadow-blue-500/30">
            <Plus size={16} /> New Semester
          </button>
          <button
            onClick={() => {
              setEndConfirmText('')
              setEndConfirmModal(true)
            }}
            disabled={!currentSemester}
            className="btn-secondary shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            title={currentSemester ? 'End the active semester and lock it from editing' : 'No active semester to end'}
          >
            <Lock size={14} /> End Current Semester
          </button>
        </div>
      </div>

      <div className="grid gap-5">
        {semesterList.map((semester) => {
          const isEnded = semester.status !== 'active'

          return (
            <div key={semester.id} className="card p-5 hover:bg-slate-50/30 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[15px] font-black text-slate-800">{semester.name}</h2>
                    {isEnded && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                        <Lock size={12} /> View only
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[13px] font-medium text-slate-500">
                    {formatSemesterRange(semester)}
                  </p>
                  {isEnded && (
                    <p className="mt-1 text-[12px] text-slate-400 font-medium">This semester has ended and is locked from editing.</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 shadow-sm ${getStatusColor(semester.status)}`}>
                    {semester.status === 'active' ? 'Active' : 'Archived'}
                  </span>
                  <button onClick={() => { setSelectedSemester(semester); setSelectedTab('Overview') }} className="btn-primary text-[12px] py-2 px-4 shadow-blue-500/30">
                    <Eye size={14} /> View
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        open={!!selectedSemester}
        onClose={() => {
          setSelectedSemester(null)
          setSelectedTab('Overview')
        }}
        title="Semester Details"
        size="lg"
        footer={<button onClick={() => { setSelectedSemester(null); setSelectedTab('Overview') }} className="btn-secondary">Close</button>}
      >
        {selectedSemester && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-black text-slate-800">{selectedSemester.name}</h3>
                  <p className="mt-1 text-[13px] font-medium text-slate-500">
                    {formatSemesterRange(selectedSemester)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${getStatusColor(selectedSemester.status)}`}>
                  {selectedSemester.status === 'active' ? 'Active' : 'Archived'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {semesterTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={cn(
                    'rounded-xl px-4 py-2 text-[12px] font-bold transition-all shadow-sm',
                    selectedTab === tab ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {selectedTab === 'Overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sessions</p>
                    <p className="mt-1 text-2xl font-black text-slate-800">{selectedSessions.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Excuses logged</p>
                    <p className="mt-1 text-2xl font-black text-slate-800">{selectedExcuses.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Auditionees</p>
                    <p className="mt-1 text-2xl font-black text-slate-800">{selectedAuditionees.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Judges</p>
                    <p className="mt-1 text-2xl font-black text-slate-800">{selectedJudges.length}</p>
                  </div>
                </div>

                {selectedSemester.status !== 'active' && (
                  <div className="rounded-xl bg-amber-50 p-4 text-[13px] font-medium text-amber-700 border border-amber-100/50">
                    This semester has ended. Records can be viewed for history and reports, but editing is locked.
                  </div>
                )}
              </div>
            )}
            
            {/* Keeping it simple for the rest for now since detailed summary requires all sessions attendance */}
            {selectedTab !== 'Overview' && (
              <div className="rounded-2xl bg-slate-50/50 p-8 text-center border border-slate-100/50 border-dashed">
                <p className="text-[14px] font-bold text-slate-500">Detailed {selectedTab.toLowerCase()} view is available in specific modules.</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={semesterModal}
        onClose={() => setSemesterModal(false)}
        title="Create New Semester"
        size="md"
        footer={
          <>
            <button onClick={() => setSemesterModal(false)} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button onClick={handleCreateSemester} disabled={isSaving} className="btn-primary shadow-blue-500/40">{isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : 'Create Semester'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50/50 border border-blue-100/50 p-4 text-[13px] font-medium text-blue-700">
            Creating a new semester will archive the current active semester and lock it as view-only.
          </div>
          <div>
            <label className="label">Semester Name *</label>
            <input className="input bg-white" value={semesterForm.name} onChange={e => setSemesterForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. 2nd Semester SY 2025-2026" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input className="input bg-white" type="date" value={semesterForm.startDate} onChange={e => setSemesterForm(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input className="input bg-white" type="date" value={semesterForm.endDate} onChange={e => setSemesterForm(p => ({ ...p, endDate: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={endConfirmModal}
        onClose={() => {
          setEndConfirmModal(false)
          setEndConfirmText('')
        }}
        title="End Current Semester"
        size="sm"
        footer={
          <>
            <button onClick={() => { setEndConfirmModal(false); setEndConfirmText('') }} className="btn-secondary">Cancel</button>
            <button onClick={handleEndSemester} disabled={endConfirmText !== 'end-semester' || isSaving} className="btn-danger shadow-red-500/30 disabled:cursor-not-allowed disabled:opacity-50">
              {isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : 'End Semester'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="rounded-xl bg-red-50 p-4 text-[13px] font-medium text-red-700 border border-red-100">
            This will lock <strong>{currentSemester?.name}</strong> as view-only. Attendance, officers, and semester records for this semester should no longer be editable after ending it.
          </div>
          <div>
            <label className="label">Type end-semester to confirm</label>
            <input
              className="input bg-white font-bold"
              value={endConfirmText}
              onChange={e => setEndConfirmText(e.target.value)}
              placeholder="end-semester"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

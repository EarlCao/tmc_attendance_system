import { useState, useMemo, useEffect } from 'react'
import { CalendarDays, Eye, Lock, Pencil, Plus, Loader2, Mic2, Users, Star } from 'lucide-react'
import { useSemesters } from '../hooks/useSemesters'
import { useSessions } from '../hooks/useSessions'
import { useMembers } from '../hooks/useMembers'
import { useAuditions } from '../hooks/useAuditions'
import { useJudges } from '../hooks/useJudges'
import { useExcuses } from '../hooks/useExcuses'
import { useDebounce } from '../hooks/useDebounce'
import { getStatusColor, formatDateShort, cn, getAttendanceColor, getVoicePartColor } from '../lib/utils'
import Avatar from '../components/common/Avatar'
import Modal from '../components/common/Modal'
import SearchBar from '../components/common/SearchBar'
import EmptyState from '../components/common/EmptyState'

const semesterTabs = ['Overview', 'Attendance', 'Sessions', 'People', 'Auditions']

const today = new Date().toISOString().split('T')[0]

const AUDIT_CATS = ['vocalQuality','pitchAccuracy','tone','rhythm','confidence','stagePresence']
function avgRating(evals = []) {
  if (!evals.length) return null
  const total = evals.reduce((s, r) => s + AUDIT_CATS.reduce((cs, c) => cs + Number(r[c] || 0), 0) / AUDIT_CATS.length, 0)
  return (total / evals.length).toFixed(1)
}

function formatSemesterRange(semester) {
  if (!semester.startDate && !semester.endDate) return 'Dates not set'
  if (!semester.startDate) return `Until ${formatDateShort(semester.endDate)}`
  if (!semester.endDate) return `From ${formatDateShort(semester.startDate)}`
  return `${formatDateShort(semester.startDate)} to ${formatDateShort(semester.endDate)}`
}

export default function Semesters() {
  const { semesters: semesterList, activeSemester: currentSemester, loading: sLoading, createSemester, updateSemester, endSemester } = useSemesters()
  const { sessions, loading: sessLoading } = useSessions()
  const { members, loading: mLoading } = useMembers()
  const { auditionees, loading: aLoading } = useAuditions()
  const { judges, loading: jLoading } = useJudges()
  const { excuses, loading: eLoading } = useExcuses()

  const [selectedSemester, setSelectedSemester] = useState(null)
  const [selectedTab, setSelectedTab] = useState('Overview')
  const [semesterModal, setSemesterModal] = useState(false)
  const [semesterForm, setSemesterForm] = useState({ name: '', startDate: today, endDate: '' })
  const [formErrors, setFormErrors] = useState({ name: '', startDate: '' })
  const [endConfirmModal, setEndConfirmModal] = useState(false)
  const [endConfirmText, setEndConfirmText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Tab search states — raw input drives SearchBar; debounced value drives filtering
  const [attSearchInput,  setAttSearchInput]  = useState('')
  const [sessSearchInput, setSessSearchInput] = useState('')
  const [pplSearchInput,  setPplSearchInput]  = useState('')
  const [audSearchInput,  setAudSearchInput]  = useState('')
  const attSearch  = useDebounce(attSearchInput,  300)
  const sessSearch = useDebounce(sessSearchInput, 300)
  const pplSearch  = useDebounce(pplSearchInput,  300)
  const audSearch  = useDebounce(audSearchInput,  300)
  // Tab filter states
  const [pplVoiceFilter,  setPplVoiceFilter]  = useState('All')
  const [audStatusFilter, setAudStatusFilter] = useState('All')
  const [editModal, setEditModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', endDate: '' })
  const [editErrors, setEditErrors] = useState({ name: '' })

  const loading = sLoading || sessLoading || mLoading || aLoading || jLoading || eLoading

  // Disable "New Semester" button when there is an active semester
  const hasActiveSemester = !!currentSemester

  function handleOpenSemesterModal() {
    setSemesterForm({ name: '', startDate: today, endDate: '' })
    setFormErrors({ name: '', startDate: '' })
    setSemesterModal(true)
  }

  function handleCloseSemesterModal() {
    if (isSaving) return
    setSemesterForm({ name: '', startDate: today, endDate: '' })
    setFormErrors({ name: '', startDate: '' })
    setSemesterModal(false)
  }

  function handleOpenEditModal(semester) {
    setEditTarget(semester)
    setEditForm({
      name: semester.name,
      endDate: semester.endDate ? semester.endDate.slice(0, 10) : '',
    })
    setEditErrors({ name: '' })
    setEditModal(true)
  }

  function handleCloseEditModal() {
    if (isSaving) return
    setEditModal(false)
    setEditTarget(null)
    setEditForm({ name: '', endDate: '' })
    setEditErrors({ name: '' })
  }

  async function handleUpdateSemester() {
    const errors = {}
    if (!editForm.name.trim()) errors.name = 'Semester name is required.'
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }
    setEditErrors({ name: '' })
    setIsSaving(true)
    try {
      await updateSemester(editTarget.id, {
        name: editForm.name.trim(),
        endDate: editForm.endDate || null,
      })
      handleCloseEditModal()
    } finally {
      setIsSaving(false)
    }
  }

  async function handleEndSemester() {
    if (!currentSemester) return
    setIsSaving(true)
    try {
      await endSemester(currentSemester.id)
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
    const errors = {}
    if (!semesterForm.name.trim()) errors.name = 'Semester name is required.'
    if (!semesterForm.startDate) errors.startDate = 'Start date is required.'
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({ name: '', startDate: '' })
    setIsSaving(true)
    try {
      await createSemester({
        name: semesterForm.name.trim(),
        startDate: semesterForm.startDate,
        endDate: semesterForm.endDate || null,
        status: 'active'
      })
      handleCloseSemesterModal()
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
    () => (selectedSemester ? judges.filter(j => Number(j.semesterId) === Number(selectedSemester.id)) : []),
    [selectedSemester, judges]
  )
  const selectedAuditionSummary = useMemo(
    () => ({
      passed: selectedAuditionees.filter((a) => a.status === 'Passed').length,
      failed: selectedAuditionees.filter((a) => a.status === 'Failed').length,
      pending: selectedAuditionees.filter((a) => a.status === 'Pending').length,
    }),
    [selectedAuditionees]
  )

  // Reset tab search / filters whenever the user opens a different semester
  useEffect(() => {
    setAttSearchInput('')
    setSessSearchInput('')
    setPplSearchInput('')
    setAudSearchInput('')
    setPplVoiceFilter('All')
    setAudStatusFilter('All')
  }, [selectedSemester?.id])

  // ── Attendance tab ───────────────────────────────────────────
  const filteredAttSessions = useMemo(() =>
    selectedSessions.filter(s => {
      if (!attSearch) return true
      const q = attSearch.toLowerCase()
      return (s.title || '').toLowerCase().includes(q) || s.type.toLowerCase().includes(q)
    }),
    [selectedSessions, attSearch]
  )
  const attAggregate = useMemo(() => ({
    Present: selectedSessions.reduce((n, s) => n + (s.counts?.Present || 0), 0),
    Late:    selectedSessions.reduce((n, s) => n + (s.counts?.Late    || 0), 0),
    Absent:  selectedSessions.reduce((n, s) => n + (s.counts?.Absent  || 0), 0),
    Excused: selectedSessions.reduce((n, s) => n + (s.counts?.Excused || 0), 0),
  }), [selectedSessions])

  // ── Sessions tab ─────────────────────────────────────────────
  const filteredSessList = useMemo(() =>
    selectedSessions.filter(s => {
      if (!sessSearch) return true
      const q = sessSearch.toLowerCase()
      return (s.title || '').toLowerCase().includes(q) ||
             s.type.toLowerCase().includes(q) ||
             (s.notes || '').toLowerCase().includes(q)
    }),
    [selectedSessions, sessSearch]
  )

  // ── People tab ───────────────────────────────────────────────
  const filteredPeople = useMemo(() =>
    members.filter(m => {
      if (m.status !== 'active') return false
      const name = `${m.firstName} ${m.lastName}`.toLowerCase()
      const matchSearch = !pplSearch || name.includes(pplSearch.toLowerCase())
      const matchVoice  = pplVoiceFilter === 'All' || m.voicePart === pplVoiceFilter
      return matchSearch && matchVoice
    }),
    [members, pplSearch, pplVoiceFilter]
  )

  // ── Auditions tab ────────────────────────────────────────────
  const filteredAudit = useMemo(() =>
    selectedAuditionees.filter(a => {
      const q = audSearch.toLowerCase()
      const name = `${a.firstName} ${a.lastName}`.toLowerCase()
      const matchSearch = !q || name.includes(q) || (a.course || '').toLowerCase().includes(q)
      const matchStatus = audStatusFilter === 'All' || a.status === audStatusFilter
      return matchSearch && matchStatus
    }),
    [selectedAuditionees, audSearch, audStatusFilter]
  )

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
          <button
            onClick={handleOpenSemesterModal}
            disabled={hasActiveSemester}
            className="btn-primary shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            title={hasActiveSemester ? 'End the current active semester before creating a new one' : 'Create a new semester'}
          >
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
        {hasActiveSemester && (
          <p className="mt-3 text-[12px] font-medium text-amber-600">
            A semester is currently active. End it first before creating a new one.
          </p>
        )}
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
                  {!isEnded && (
                    <button
                      onClick={() => handleOpenEditModal(semester)}
                      className="btn-secondary text-[12px] py-2 px-4 shadow-sm"
                      title="Edit semester name or end date"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                  )}
                  <button onClick={() => { setSelectedSemester(semester); setSelectedTab('Overview') }} className="btn-primary text-[12px] py-2 px-4 shadow-blue-500/30">
                    <Eye size={14} /> View
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Semester Details Modal */}
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

            {selectedTab !== 'Overview' && (
              <>
                {/* ── Attendance Tab ──────────────────────────────── */}
                {selectedTab === 'Attendance' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: 'Present', value: attAggregate.Present, cls: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
                        { label: 'Late',    value: attAggregate.Late,    cls: 'text-amber-700  bg-amber-50  ring-amber-200'  },
                        { label: 'Absent',  value: attAggregate.Absent,  cls: 'text-rose-700   bg-rose-50   ring-rose-200'   },
                        { label: 'Excused', value: attAggregate.Excused, cls: 'text-blue-700   bg-blue-50   ring-blue-200'   },
                      ].map(s => (
                        <div key={s.label} className={`rounded-2xl p-4 ring-1 ${s.cls}`}>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{s.label}</p>
                          <p className="mt-1 text-2xl font-black">{s.value}</p>
                        </div>
                      ))}
                    </div>
                    <SearchBar value={attSearchInput} onChange={setAttSearchInput} placeholder="Search sessions…" />
                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      {filteredAttSessions.length === 0 ? (
                        <EmptyState
                          icon={CalendarDays}
                          title={selectedSessions.length === 0 ? 'No sessions yet' : 'No sessions match your search'}
                          description={selectedSessions.length === 0 ? 'Sessions created for this semester will appear here.' : 'Try a different keyword.'}
                        />
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {filteredAttSessions.map(s => (
                            <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-slate-800 truncate">{s.title || formatDateShort(s.date)}</p>
                                <p className="text-[11px] font-medium text-slate-400 mt-0.5">{s.type} · {formatDateShort(s.date)}</p>
                              </div>
                              <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                                {['Present','Late','Absent','Excused'].map(st => (
                                  <span key={st} className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ring-1 ${getAttendanceColor(st)}`}>
                                    {s.counts?.[st] ?? 0}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Sessions Tab ────────────────────────────────── */}
                {selectedTab === 'Sessions' && (
                  <div className="space-y-4">
                    <SearchBar value={sessSearchInput} onChange={setSessSearchInput} placeholder="Search sessions…" />
                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      {filteredSessList.length === 0 ? (
                        <EmptyState
                          icon={CalendarDays}
                          title={selectedSessions.length === 0 ? 'No sessions yet' : 'No sessions match your search'}
                          description="Sessions created for this semester appear here."
                        />
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {filteredSessList.map(s => (
                            <div key={s.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[13px] font-bold text-slate-800">{s.title || '(Untitled session)'}</p>
                                  <p className="mt-0.5 text-[11px] font-semibold text-blue-500 flex items-center gap-1">
                                    <CalendarDays size={11}/> {formatDateShort(s.date)}
                                  </p>
                                  {s.notes && <p className="mt-1 text-[12px] font-medium text-slate-400 line-clamp-1">{s.notes}</p>}
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">{s.type}</span>
                                  {s.location && <span className="text-[11px] font-medium text-slate-400">{s.location}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── People Tab ──────────────────────────────────── */}
                {selectedTab === 'People' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <SearchBar value={pplSearchInput} onChange={setPplSearchInput} placeholder="Search members…" className="flex-1 min-w-[180px]" />
                      <div className="flex gap-1 p-1 bg-slate-100/50 rounded-xl shrink-0">
                        {['All','Soprano','Alto','Tenor','Bass'].map(v => (
                          <button
                            key={v}
                            onClick={() => setPplVoiceFilter(v)}
                            className={cn(
                              'px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all',
                              pplVoiceFilter === v ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            )}
                          >{v}</button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      {filteredPeople.length === 0 ? (
                        <EmptyState icon={Users} title="No members found" description="No active members match your filters." />
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {filteredPeople.map(m => (
                            <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">
                              <Avatar name={`${m.firstName} ${m.lastName}`} voicePart={m.voicePart} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-slate-800 truncate">{m.firstName} {m.lastName}</p>
                                <p className="text-[11px] font-medium text-slate-400">{m.course}{m.yearLevel ? ` · Yr ${m.yearLevel}` : ''}</p>
                              </div>
                              <span className={`shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full ring-1 ${getVoicePartColor(m.voicePart)}`}>{m.voicePart}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-center text-[12px] font-medium text-slate-400">
                      {filteredPeople.length} active member{filteredPeople.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* ── Auditions Tab ────────────────────────────────── */}
                {selectedTab === 'Auditions' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Passed',  value: selectedAuditionSummary.passed,  cls: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
                        { label: 'Failed',  value: selectedAuditionSummary.failed,  cls: 'text-rose-700   bg-rose-50   ring-rose-200'   },
                        { label: 'Pending', value: selectedAuditionSummary.pending, cls: 'text-amber-700  bg-amber-50  ring-amber-200'  },
                      ].map(s => (
                        <div key={s.label} className={`rounded-2xl p-4 ring-1 ${s.cls}`}>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{s.label}</p>
                          <p className="mt-1 text-2xl font-black">{s.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <SearchBar value={audSearchInput} onChange={setAudSearchInput} placeholder="Search auditionees…" className="flex-1 min-w-[180px]" />
                      <div className="flex gap-1 p-1 bg-slate-100/50 rounded-xl shrink-0">
                        {['All','Passed','Failed','Pending'].map(st => (
                          <button
                            key={st}
                            onClick={() => setAudStatusFilter(st)}
                            className={cn(
                              'px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all',
                              audStatusFilter === st ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            )}
                          >{st}</button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      {filteredAudit.length === 0 ? (
                        <EmptyState
                          icon={Mic2}
                          title={selectedAuditionees.length === 0 ? 'No auditionees yet' : 'No auditionees match your filters'}
                          description="Auditionees registered within this semester’s date range appear here."
                        />
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {filteredAudit.map(a => {
                            const avg = avgRating(a.evaluations || [])
                            return (
                              <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">
                                <Avatar name={`${a.firstName} ${a.lastName}`} voicePart={a.voicePart} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-bold text-slate-800 truncate">{a.firstName} {a.lastName}</p>
                                  <p className="text-[11px] font-medium text-slate-400">
                                    {a.course}{a.yearLevel ? ` · Yr ${a.yearLevel}` : ''} · {formatDateShort(a.auditionDate)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {avg && (
                                    <span className="flex items-center gap-1 text-[12px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg ring-1 ring-amber-200">
                                      <Star size={12} fill="currentColor"/>{avg}
                                    </span>
                                  )}
                                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ring-1 ${getVoicePartColor(a.voicePart)}`}>{a.voicePart}</span>
                                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ring-1 ${getStatusColor(a.status)}`}>{a.status}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Create Semester Modal */}
      <Modal
        open={semesterModal}
        onClose={handleCloseSemesterModal}
        title="Create New Semester"
        size="md"
        footer={
          <>
            <button onClick={handleCloseSemesterModal} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button onClick={handleCreateSemester} disabled={isSaving} className="btn-primary shadow-blue-500/40">
              {isSaving ? <><Loader2 className="animate-spin w-4 h-4" /> Creating...</> : 'Create Semester'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50/50 border border-blue-100/50 p-4 text-[13px] font-medium text-blue-700">
            Creating a new semester will archive the current active semester and lock it as view-only.
          </div>

          {/* Semester Name */}
          <div>
            <label className="label">Semester Name <span className="text-red-500">*</span></label>
            <input
              className={cn('input bg-white', formErrors.name && 'border-red-400 focus:border-red-500 focus:ring-red-500/10')}
              value={semesterForm.name}
              onChange={e => {
                setSemesterForm(p => ({ ...p, name: e.target.value }))
                if (formErrors.name) setFormErrors(p => ({ ...p, name: '' }))
              }}
              placeholder="e.g. 2nd Semester SY 2025-2026"
            />
            {formErrors.name && (
              <p className="mt-1.5 text-[12px] font-medium text-red-500">{formErrors.name}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date <span className="text-red-500">*</span></label>
              <input
                className={cn('input bg-white', formErrors.startDate && 'border-red-400 focus:border-red-500 focus:ring-red-500/10')}
                type="date"
                value={semesterForm.startDate}
                onChange={e => {
                  setSemesterForm(p => ({ ...p, startDate: e.target.value }))
                  if (formErrors.startDate) setFormErrors(p => ({ ...p, startDate: '' }))
                }}
              />
              {formErrors.startDate && (
                <p className="mt-1.5 text-[12px] font-medium text-red-500">{formErrors.startDate}</p>
              )}
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                className="input bg-white"
                type="date"
                value={semesterForm.endDate}
                onChange={e => setSemesterForm(p => ({ ...p, endDate: e.target.value }))}
              />
              <p className="mt-1.5 text-[11px] text-slate-400">Optional — can be set anytime.</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Semester Modal */}
      <Modal
        open={editModal}
        onClose={handleCloseEditModal}
        title="Edit Semester"
        size="md"
        footer={
          <>
            <button onClick={handleCloseEditModal} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button onClick={handleUpdateSemester} disabled={isSaving} className="btn-primary shadow-blue-500/40">
              {isSaving ? <><Loader2 className="animate-spin w-4 h-4" /> Saving...</> : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50/50 border border-blue-100/50 p-4 text-[13px] font-medium text-blue-700">
            Only the semester name and end date can be edited. The start date is locked after creation.
          </div>

          {/* Semester Name */}
          <div>
            <label className="label">Semester Name <span className="text-red-500">*</span></label>
            <input
              className={cn('input bg-white', editErrors.name && 'border-red-400 focus:border-red-500 focus:ring-red-500/10')}
              value={editForm.name}
              onChange={e => {
                setEditForm(p => ({ ...p, name: e.target.value }))
                if (editErrors.name) setEditErrors(p => ({ ...p, name: '' }))
              }}
              placeholder="e.g. 2nd Semester SY 2025-2026"
            />
            {editErrors.name && (
              <p className="mt-1.5 text-[12px] font-medium text-red-500">{editErrors.name}</p>
            )}
          </div>

          {/* End Date only */}
          <div>
            <label className="label">End Date</label>
            <input
              className="input bg-white"
              type="date"
              value={editForm.endDate}
              onChange={e => setEditForm(p => ({ ...p, endDate: e.target.value }))}
            />
            <p className="mt-1.5 text-[11px] text-slate-400">Optional — leave blank if the semester is still ongoing.</p>
          </div>
        </div>
      </Modal>

      {/* End Semester Confirm Modal */}
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

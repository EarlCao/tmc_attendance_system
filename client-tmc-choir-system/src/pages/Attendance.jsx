import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, CalendarDays, CheckCircle2, Clock, FileText,
  ListPlus, MapPin, Save, SlidersHorizontal, Trash2, XCircle, Loader2
} from 'lucide-react'
import { useMembers } from '../hooks/useMembers'
import { useSessions } from '../hooks/useSessions'
import { useSemesters } from '../hooks/useSemesters'
import { cn, formatDateShort, getVoicePartColor } from '../lib/utils'
import Avatar from '../components/common/Avatar'
import Badge from '../components/common/Badge'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import SearchBar from '../components/common/SearchBar'
import StatCard from '../components/common/StatCard'

const STATUS_OPTIONS = ['Present', 'Late', 'Absent', 'Excused']
const SESSION_TYPES = ['Practice', 'Performance', 'Audition', 'Meeting', 'Other']
const MEMBER_SORTS = [
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'voice-asc', label: 'Voice part' },
  { value: 'status-asc', label: 'Attendance status' },
]
const SESSION_SORTS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'type-asc', label: 'Type' },
]
const statusIcon = { Present: CheckCircle2, Late: Clock, Absent: XCircle, Excused: FileText }

const newSessionForm = {
  title: '',
  date: new Date().toISOString().slice(0, 10),
  type: 'Practice',
  notes: '',
}

function countStatuses(attendanceList = []) {
  return {
    Present: attendanceList.filter((a) => a.status === 'Present').length,
    Late: attendanceList.filter((a) => a.status === 'Late').length,
    Absent: attendanceList.filter((a) => a.status === 'Absent').length,
    Excused: attendanceList.filter((a) => a.status === 'Excused').length,
  }
}

function compareText(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' })
}

export default function Attendance() {
  const { members, loading: membersLoading } = useMembers()
  const { sessions, loading: sessionsLoading, createSession, getSessionAttendance, saveSessionAttendance } = useSessions()
  const { semesters, activeSemester, loading: semestersLoading } = useSemesters()

  const [selectedSemId, setSelectedSemId] = useState(null)
  
  // Set default semester once loaded
  useEffect(() => {
    if (semesters.length > 0 && !selectedSemId) {
      setSelectedSemId(activeSemester?.id || semesters[semesters.length - 1].id)
    }
  }, [semesters, activeSemester, selectedSemId])

  const [selectedSessionId, setSelectedSessionId] = useState(null)
  
  // Local state for the OPENED session
  const [currentAttendance, setCurrentAttendance] = useState([])
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [search, setSearch] = useState('')
  const [voiceFilter, setVoiceFilter] = useState('All')
  const [memberSort, setMemberSort] = useState('name-asc')
  const [sessionSearch, setSessionSearch] = useState('')
  const [sessionTypeFilter, setSessionTypeFilter] = useState('All')
  const [sessionSort, setSessionSort] = useState('date-desc')
  const [createModal, setCreateModal] = useState(false)
  const [sessionForm, setSessionForm] = useState(newSessionForm)
  const [notesModal, setNotesModal] = useState(null) // member object
  const [noteText, setNoteText] = useState('')
  const [saved, setSaved] = useState(false)

  const selectedSemester = semesters.find((semester) => semester.id === selectedSemId)
  const readOnly = selectedSemester?.status !== 'active'
  
  const semesterSessions = useMemo(() => sessions.filter((session) => session.semesterId === selectedSemId), [sessions, selectedSemId])
  
  const visibleSessions = useMemo(() => {
    return semesterSessions
      .filter((session) => {
        const normalizedSearch = sessionSearch.toLowerCase()
        const matchSearch = session.type.toLowerCase().includes(normalizedSearch) || (session.notes || '').toLowerCase().includes(normalizedSearch)
        const matchType = sessionTypeFilter === 'All' || session.type === sessionTypeFilter
        return matchSearch && matchType
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        if (sessionSort === 'date-asc') return dateA - dateB
        if (sessionSort === 'type-asc') return compareText(a.type, b.type) || dateB - dateA
        return dateB - dateA // date-desc default
      })
  }, [semesterSessions, sessionSearch, sessionSort, sessionTypeFilter])

  const selectedSession = sessions.find((session) => session.id === selectedSessionId)

  // Fetch attendance when session opens
  useEffect(() => {
    async function loadAtt() {
      if (!selectedSessionId) return
      setIsFetchingAttendance(true)
      try {
        const data = await getSessionAttendance(selectedSessionId)
        // If empty (new session), build default "Present" array
        if (data && data.length > 0) {
          setCurrentAttendance(data)
        } else {
          // Initialize active members as present
          const defaults = members.filter(m => m.status === 'active').map(m => ({
            memberId: m.id,
            status: 'Present',
            reason: ''
          }))
          setCurrentAttendance(defaults)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsFetchingAttendance(false)
      }
    }
    loadAtt()
  }, [selectedSessionId, members, getSessionAttendance])

  const counts = useMemo(() => countStatuses(currentAttendance), [currentAttendance])

  const filteredMembers = useMemo(() =>
    members
      .filter((member) => {
        const matchSearch = (member.firstName + ' ' + member.lastName).toLowerCase().includes(search.toLowerCase())
        const matchVoice = voiceFilter === 'All' || member.voicePart === voiceFilter
        return matchSearch && matchVoice
      })
      .sort((a, b) => {
        const nameA = a.firstName + ' ' + a.lastName
        const nameB = b.firstName + ' ' + b.lastName
        if (memberSort === 'name-desc') return compareText(nameB, nameA)
        if (memberSort === 'voice-asc') return compareText(a.voicePart, b.voicePart) || compareText(nameA, nameB)
        return compareText(nameA, nameB)
      }),
    [members, search, voiceFilter, memberSort]
  )

  function openCreateModal() {
    if (readOnly) return
    setSessionForm(newSessionForm)
    setCreateModal(true)
  }

  async function handleCreateSession() {
    if (readOnly) return
    setIsSaving(true)
    try {
      await createSession({
        semesterId: selectedSemId,
        date: new Date(sessionForm.date).toISOString(),
        type: sessionForm.type,
        notes: sessionForm.notes
      })
      setCreateModal(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  function setStatus(memberId, status) {
    if (!selectedSession || readOnly) return
    setCurrentAttendance(prev => {
      const exists = prev.find(a => a.memberId === memberId)
      if (exists) {
        return prev.map(a => a.memberId === memberId ? { ...a, status } : a)
      } else {
        return [...prev, { memberId, status, reason: '' }]
      }
    })
    setSaved(false)
  }

  function markAll(status) {
    if (!selectedSession || readOnly) return
    setCurrentAttendance(prev => {
      const updated = [...prev]
      members.filter(m => m.status === 'active').forEach(m => {
        const idx = updated.findIndex(a => a.memberId === m.id)
        if (idx !== -1) {
          updated[idx].status = status
        } else {
          updated.push({ memberId: m.id, status, reason: '' })
        }
      })
      return updated
    })
    setSaved(false)
  }

  async function handleSave() {
    if (!selectedSession || readOnly) return
    setIsSaving(true)
    try {
      await saveSessionAttendance(selectedSession.id, { attendanceData: currentAttendance })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  function openNotes(member) {
    if (!selectedSession) return
    const att = currentAttendance.find(a => a.memberId === member.id)
    setNoteText(att?.reason || '')
    setNotesModal(member)
  }

  function saveNote() {
    if (!selectedSession || !notesModal || readOnly) return
    setCurrentAttendance(prev => {
      const exists = prev.find(a => a.memberId === notesModal.id)
      if (exists) {
        return prev.map(a => a.memberId === notesModal.id ? { ...a, reason: noteText } : a)
      } else {
        return [...prev, { memberId: notesModal.id, status: 'Present', reason: noteText }]
      }
    })
    setNotesModal(null)
    setSaved(false)
  }

  if (membersLoading || sessionsLoading || semestersLoading) {
    return <div className="page-shell flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
  }

  if (!selectedSession) {
    return (
      <div className="page-shell">
        <div className="card p-6 bg-gradient-to-br from-white to-slate-50/50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Attendance sessions</p>
              <h2 className="mt-1 text-2xl font-black text-slate-800 tracking-tight">Meeting attendance list</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {readOnly ? 'This semester is archived. Attendance sheets can be viewed only.' : 'Create a meeting session, then open it to mark member attendance.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedSemId || ''}
                onChange={(event) => {
                  setSelectedSemId(Number(event.target.value))
                  setSelectedSessionId(null)
                }}
                className="input w-auto text-sm font-semibold"
              >
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>{semester.name}</option>
                ))}
              </select>
              {readOnly && (
                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">View only</span>
              )}
              <button onClick={openCreateModal} disabled={readOnly} className="btn-primary">
                <ListPlus size={16} /> Add Session
              </button>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="panel-header flex-wrap bg-slate-50/30">
            <div>
              <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wide">Session List</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Each meeting has its own attendance sheet.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SearchBar value={sessionSearch} onChange={setSessionSearch} placeholder="Search sessions..." className="w-full sm:w-64" />
              <select
                value={sessionTypeFilter}
                onChange={(event) => setSessionTypeFilter(event.target.value)}
                className="input w-auto text-xs font-medium"
              >
                <option value="All">All Types</option>
                {SESSION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <select
                value={sessionSort}
                onChange={(event) => setSessionSort(event.target.value)}
                className="input w-auto text-xs font-medium"
              >
                {SESSION_SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100/50">
            {visibleSessions.map((session) => {
              return (
                <div key={session.id} className="flex flex-col gap-4 px-6 py-5 hover:bg-blue-50/30 transition-colors lg:flex-row lg:items-center group">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-blue-400 text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <CalendarDays size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[15px] font-bold text-slate-800">{formatDateShort(session.date)}</h4>
                      <span className="rounded-full bg-white border border-slate-200 shadow-sm px-3 py-0.5 text-[11px] font-bold text-slate-600">{session.type}</span>
                    </div>
                    {session.notes && <p className="mt-1.5 text-[13px] font-medium text-slate-500">{session.notes}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button onClick={() => setSelectedSessionId(session.id)} className="btn-primary text-xs py-2 px-6">
                      Open Sheet
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {visibleSessions.length === 0 && (
            <EmptyState
              icon={CalendarDays}
              title={semesterSessions.length === 0 ? 'No attendance sessions yet' : 'No sessions match your filters'}
              description={semesterSessions.length === 0 ? 'Create the first meeting session for this semester.' : 'Try changing the search, type, or sort controls.'}
            />
          )}
        </div>

        <Modal
          open={createModal}
          onClose={() => setCreateModal(false)}
          title="Create Attendance Session"
          size="md"
          footer={
            <>
              <button onClick={() => setCreateModal(false)} className="btn-secondary" disabled={isSaving}>Cancel</button>
              <button onClick={handleCreateSession} className="btn-primary" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : 'Create Session'}</button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                value={sessionForm.date}
                onChange={(event) => setSessionForm((prev) => ({ ...prev, date: event.target.value }))}
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={sessionForm.type}
                onChange={(event) => setSessionForm((prev) => ({ ...prev, type: event.target.value }))}
              >
                {SESSION_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Notes / Location</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={sessionForm.notes}
                onChange={(event) => setSessionForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Optional details for this meeting"
              />
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="card p-6 bg-gradient-to-br from-white to-blue-50/30">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              onClick={() => setSelectedSessionId(null)}
              className="mb-4 inline-flex items-center gap-1 text-[13px] font-bold text-slate-400 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={16} /> Back to sessions
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{formatDateShort(selectedSession.date)}</h2>
              <span className="rounded-full bg-white border border-slate-200 shadow-sm px-3 py-1 text-xs font-bold text-slate-600">{selectedSession.type}</span>
              {readOnly && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">View only</span>}
            </div>
            {selectedSession.notes && (
              <p className="mt-2 text-sm font-medium text-slate-500">
                {selectedSession.notes}
              </p>
            )}
          </div>
          <button onClick={handleSave} disabled={readOnly || isSaving || isFetchingAttendance} className="btn-primary py-3 px-6 shadow-blue-500/40">
            {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} {saved ? 'Saved!' : 'Save Attendance'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Present" value={counts.Present} icon={CheckCircle2} color="green" />
        <StatCard label="Late" value={counts.Late} icon={Clock} color="yellow" />
        <StatCard label="Absent" value={counts.Absent} icon={XCircle} color="red" />
        <StatCard label="Excused" value={counts.Excused} icon={FileText} color="blue" />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-100/50 px-6 py-5 bg-slate-50/50">
          <SearchBar value={search} onChange={setSearch} placeholder="Search member..." className="w-full sm:w-64" />
          <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200/60">
            {['All', 'Soprano', 'Alto', 'Tenor', 'Bass'].map((voicePart) => (
              <button
                key={voicePart}
                onClick={() => setVoiceFilter(voicePart)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-200',
                  voiceFilter === voicePart ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                {voicePart}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-slate-400" />
            <select
              value={memberSort}
              onChange={(event) => setMemberSort(event.target.value)}
              className="input w-auto text-xs font-medium bg-white"
            >
              {MEMBER_SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
            </select>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Bulk mark:</span>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => markAll(status)}
                disabled={readOnly}
                className="rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                All {status}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100/50 relative">
          {isFetchingAttendance && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
            </div>
          )}
          {filteredMembers.map((member) => {
            const att = currentAttendance.find(a => a.memberId === member.id)
            const status = att?.status || 'Absent'
            const hasNote = !!att?.reason
            const isInactive = member.status === 'inactive'
            return (
              <div key={member.id} className="flex flex-col gap-4 px-6 py-4 transition-colors hover:bg-blue-50/30 sm:flex-row sm:items-center sm:gap-6 group">
                <Avatar name={member.firstName + ' ' + member.lastName} voicePart={member.voicePart} size="md" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-[14px] font-bold text-slate-800">
                      {member.firstName} {member.lastName}
                    </p>
                    {isInactive && <Badge variant="default">Inactive</Badge>}
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${getVoicePartColor(member.voicePart)}`}>
                      {member.voicePart}
                    </span>
                    {hasNote && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        <FileText size={12} /> Note added
                      </span>
                    )}
                    {isInactive && (
                      <span className="text-[11px] font-medium text-slate-400">Not included in attendance</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {STATUS_OPTIONS.map((option) => {
                    const Icon = statusIcon[option]
                    return (
                      <button
                        key={option}
                        onClick={() => setStatus(member.id, option)}
                        title={isInactive ? 'Inactive members cannot be marked for attendance' : option}
                        disabled={readOnly || isInactive}
                        className={cn(
                          'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
                          status === option
                            ? option === 'Present' ? 'border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100'
                            : option === 'Late' ? 'border-amber-300 bg-amber-50 text-amber-700 ring-2 ring-amber-100'
                            : option === 'Absent' ? 'border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-100'
                            : 'border-blue-300 bg-blue-50 text-blue-700 ring-2 ring-blue-100'
                            : 'border-slate-200/80 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:shadow-md'
                        )}
                      >
                        <Icon size={14} />
                        <span className="hidden sm:inline">{option}</span>
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => openNotes(member)}
                  className={cn(
                    'rounded-xl border p-2.5 text-xs transition-all duration-200 shadow-sm',
                    hasNote
                      ? 'border-blue-300 bg-blue-50 text-blue-600'
                      : 'border-slate-200/80 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
                  )}
                  title={readOnly ? 'View note' : 'Add note'}
                >
                  <FileText size={16} />
                </button>
              </div>
            )
          })}
        </div>

        {filteredMembers.length === 0 && (
          <div className="py-16 text-center text-sm font-medium text-slate-400">No members found.</div>
        )}
      </div>

      <Modal
        open={!!notesModal}
        onClose={() => setNotesModal(null)}
        title={`Attendance Note - ${notesModal?.firstName} ${notesModal?.lastName}`}
        size="sm"
        footer={
          <>
            <button onClick={() => setNotesModal(null)} className="btn-secondary">Cancel</button>
            {!readOnly && <button onClick={saveNote} className="btn-primary">Save Note</button>}
          </>
        }
      >
        <label className="label">Note / Reason</label>
        <textarea
          value={noteText}
          onChange={(event) => setNoteText(event.target.value)}
          readOnly={readOnly}
          rows={4}
          placeholder={readOnly ? 'No note recorded.' : 'Enter attendance note or absence reason...'}
          className="input resize-none"
        />
      </Modal>
    </div>
  )
}

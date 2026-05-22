import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  ListPlus,
  MapPin,
  Save,
  SlidersHorizontal,
  Trash2,
  XCircle,
} from 'lucide-react'
import { activeSemester, attendanceSessions, members, officerAssignments, semesters } from '../data/mockData'
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
  { value: 'officers-first', label: 'Officers first' },
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
const officerMap = Object.fromEntries(officerAssignments.map((officer) => [officer.memberId, officer.position]))

const newSessionForm = {
  title: '',
  date: new Date().toISOString().slice(0, 10),
  time: '',
  type: 'Practice',
  location: '',
  notes: '',
}

function buildInitialAttendance(memberList) {
  return Object.fromEntries(memberList.map((m) => [m.id, 'Present']))
}

function buildSessionRecords(sessions) {
  return Object.fromEntries(sessions.map((session) => [session.id, buildInitialAttendance(members)]))
}

function buildSessionNotes(sessions) {
  return Object.fromEntries(sessions.map((session) => [session.id, {}]))
}

function countStatuses(attendance = {}) {
  const all = Object.values(attendance)
  return {
    Present: all.filter((status) => status === 'Present').length,
    Late: all.filter((status) => status === 'Late').length,
    Absent: all.filter((status) => status === 'Absent').length,
    Excused: all.filter((status) => status === 'Excused').length,
  }
}

function compareText(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' })
}

function sessionTimestamp(session) {
  return new Date(`${session.date}T${session.time || '00:00'}`).getTime()
}

export default function Attendance() {
  const [selectedSemId, setSelectedSemId] = useState(activeSemester?.id ?? semesters[semesters.length - 1].id)
  const [sessions, setSessions] = useState(() =>
    attendanceSessions.map((session) => ({
      ...session,
      title: session.notes || `${session.type} Session`,
      time: session.time || '4:00 PM',
      location: session.location || 'TMC Music Room',
      saved: true,
    }))
  )
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [attendanceBySession, setAttendanceBySession] = useState(() => buildSessionRecords(attendanceSessions))
  const [notesBySession, setNotesBySession] = useState(() => buildSessionNotes(attendanceSessions))
  const [search, setSearch] = useState('')
  const [voiceFilter, setVoiceFilter] = useState('All')
  const [officerFilter, setOfficerFilter] = useState('All')
  const [memberSort, setMemberSort] = useState('officers-first')
  const [sessionSearch, setSessionSearch] = useState('')
  const [sessionTypeFilter, setSessionTypeFilter] = useState('All')
  const [sessionSort, setSessionSort] = useState('date-desc')
  const [createModal, setCreateModal] = useState(false)
  const [sessionForm, setSessionForm] = useState(newSessionForm)
  const [notesModal, setNotesModal] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [saved, setSaved] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const selectedSemester = semesters.find((semester) => semester.id === selectedSemId)
  const readOnly = selectedSemester?.status !== 'active'
  const semesterSessions = useMemo(
    () => sessions.filter((session) => session.semesterId === selectedSemId),
    [sessions, selectedSemId]
  )
  const visibleSessions = useMemo(() => {
    return semesterSessions
      .filter((session) => {
        const normalizedSearch = sessionSearch.toLowerCase()
        const matchSearch = session.title.toLowerCase().includes(normalizedSearch) ||
          session.location.toLowerCase().includes(normalizedSearch) ||
          session.type.toLowerCase().includes(normalizedSearch)
        const matchType = sessionTypeFilter === 'All' || session.type === sessionTypeFilter
        return matchSearch && matchType
      })
      .sort((a, b) => {
        if (sessionSort === 'date-asc') return sessionTimestamp(a) - sessionTimestamp(b)
        if (sessionSort === 'title-asc') return compareText(a.title, b.title)
        if (sessionSort === 'type-asc') return compareText(a.type, b.type) || sessionTimestamp(b) - sessionTimestamp(a)
        return sessionTimestamp(b) - sessionTimestamp(a)
      })
  }, [semesterSessions, sessionSearch, sessionSort, sessionTypeFilter])
  const selectedSession = sessions.find((session) => session.id === selectedSessionId)
  const currentAttendance = selectedSession ? attendanceBySession[selectedSession.id] ?? {} : {}
  const currentNotes = selectedSession ? notesBySession[selectedSession.id] ?? {} : {}
  const counts = useMemo(() => countStatuses(currentAttendance), [currentAttendance])

  const sessionSummary = useMemo(() => {
    const totals = semesterSessions.reduce((summary, session) => {
      const sessionCounts = countStatuses(attendanceBySession[session.id])
      return {
        Present: summary.Present + sessionCounts.Present,
        Late: summary.Late + sessionCounts.Late,
        Absent: summary.Absent + sessionCounts.Absent,
        Excused: summary.Excused + sessionCounts.Excused,
      }
    }, { Present: 0, Late: 0, Absent: 0, Excused: 0 })

    return {
      totalSessions: semesterSessions.length,
      attendanceMarked: totals.Present + totals.Late + totals.Absent + totals.Excused,
      absences: totals.Absent,
      excused: totals.Excused,
    }
  }, [attendanceBySession, semesterSessions])

  const filteredMembers = useMemo(() =>
    members
      .filter((member) => {
      const matchSearch = member.name.toLowerCase().includes(search.toLowerCase())
      const matchVoice = voiceFilter === 'All' || member.voicePart === voiceFilter
      const isOfficer = !!officerMap[member.id]
      const matchOfficer = officerFilter === 'All' ||
        (officerFilter === 'Officers' && isOfficer) ||
        (officerFilter === 'Members' && !isOfficer)
      return matchSearch && matchVoice && matchOfficer
    })
      .sort((a, b) => {
        if (memberSort === 'name-desc') return compareText(b.name, a.name)
        if (memberSort === 'officers-first') {
          const officerRank = Number(!!officerMap[b.id]) - Number(!!officerMap[a.id])
          return officerRank || compareText(a.name, b.name)
        }
        if (memberSort === 'voice-asc') return compareText(a.voicePart, b.voicePart) || compareText(a.name, b.name)
        if (memberSort === 'status-asc') {
          return compareText(currentAttendance[a.id] ?? '', currentAttendance[b.id] ?? '') || compareText(a.name, b.name)
        }
        return compareText(a.name, b.name)
    }),
    [currentAttendance, memberSort, officerFilter, search, voiceFilter]
  )

  function openCreateModal() {
    if (readOnly) return
    setSessionForm(newSessionForm)
    setCreateModal(true)
  }

  function handleCreateSession() {
    if (readOnly) return
    const id = Date.now()
    const session = {
      ...sessionForm,
      id,
      semesterId: selectedSemId,
      title: sessionForm.title.trim() || `${sessionForm.type} Session`,
      saved: false,
    }

    setSessions((prev) => [session, ...prev])
    setAttendanceBySession((prev) => ({ ...prev, [id]: buildInitialAttendance(members) }))
    setNotesBySession((prev) => ({ ...prev, [id]: {} }))
    setSelectedSessionId(id)
    setCreateModal(false)
    setSaved(false)
  }

  function deleteSession(sessionId) {
    if (readOnly) return
    setSessions((prev) => prev.filter((session) => session.id !== sessionId))
    setAttendanceBySession((prev) => {
      const next = { ...prev }
      delete next[sessionId]
      return next
    })
    setNotesBySession((prev) => {
      const next = { ...prev }
      delete next[sessionId]
      return next
    })
    if (selectedSessionId === sessionId) setSelectedSessionId(null)
    setDeleteConfirm(null)
  }

  function setStatus(memberId, status) {
    if (!selectedSession || readOnly) return
    setAttendanceBySession((prev) => ({
      ...prev,
      [selectedSession.id]: {
        ...(prev[selectedSession.id] ?? {}),
        [memberId]: status,
      },
    }))
    setSaved(false)
  }

  function markAll(status) {
    if (!selectedSession || readOnly) return
    const updated = {}
    filteredMembers.forEach((member) => { updated[member.id] = status })
    setAttendanceBySession((prev) => ({
      ...prev,
      [selectedSession.id]: {
        ...(prev[selectedSession.id] ?? {}),
        ...updated,
      },
    }))
    setSaved(false)
  }

  function handleSave() {
    if (!selectedSession || readOnly) return
    setSessions((prev) => prev.map((session) =>
      session.id === selectedSession.id ? { ...session, saved: true } : session
    ))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function openNotes(member) {
    if (!selectedSession) return
    setNoteText(currentNotes[member.id] ?? '')
    setNotesModal(member)
  }

  function saveNote() {
    if (!selectedSession || !notesModal || readOnly) return
    setNotesBySession((prev) => ({
      ...prev,
      [selectedSession.id]: {
        ...(prev[selectedSession.id] ?? {}),
        [notesModal.id]: noteText,
      },
    }))
    setNotesModal(null)
    setSaved(false)
  }

  if (!selectedSession) {
    return (
      <div className="page-shell">
        <div className="card p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Attendance sessions</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">Meeting attendance list</h2>
              <p className="mt-1 text-sm text-gray-500">
                {readOnly ? 'This semester is archived. Attendance sheets can be viewed only.' : 'Create a meeting session, then open it to mark member attendance.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSemId}
                onChange={(event) => {
                  setSelectedSemId(Number(event.target.value))
                  setSelectedSessionId(null)
                }}
                className="input w-auto text-xs"
              >
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>{semester.name}</option>
                ))}
              </select>
              {readOnly && (
                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">View only</span>
              )}
              <button onClick={openCreateModal} disabled={readOnly} className="btn-primary">
                <ListPlus size={15} /> Add Session
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Sessions" value={sessionSummary.totalSessions} icon={CalendarDays} color="blue" />
          <StatCard label="Marked Records" value={sessionSummary.attendanceMarked} icon={CheckCircle2} color="green" />
          <StatCard label="Absences" value={sessionSummary.absences} icon={XCircle} color="red" />
          <StatCard label="Excused" value={sessionSummary.excused} icon={FileText} color="yellow" />
        </div>

        <div className="card overflow-hidden">
          <div className="panel-header flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Session List</h3>
              <p className="text-xs text-gray-500">Each meeting has its own attendance sheet.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SearchBar value={sessionSearch} onChange={setSessionSearch} placeholder="Search sessions..." className="w-full sm:w-52" />
              <select
                value={sessionTypeFilter}
                onChange={(event) => setSessionTypeFilter(event.target.value)}
                className="input w-auto text-xs"
              >
                <option value="All">All Types</option>
                {SESSION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <select
                value={sessionSort}
                onChange={(event) => setSessionSort(event.target.value)}
                className="input w-auto text-xs"
              >
                {SESSION_SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
              </select>
              <button onClick={openCreateModal} disabled={readOnly} className="btn-secondary text-xs disabled:cursor-not-allowed disabled:opacity-50">
                <ListPlus size={14} /> New
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {visibleSessions.map((session) => {
              const sessionCounts = countStatuses(attendanceBySession[session.id])
              return (
                <div key={session.id} className="flex flex-col gap-4 px-5 py-4 hover:bg-gray-50/70 lg:flex-row lg:items-center">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <CalendarDays size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900">{session.title}</h4>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{session.type}</span>
                      {!session.saved && <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">Unsaved</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>{formatDateShort(session.date)}{session.time ? ` at ${session.time}` : ''}</span>
                      {session.location && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {session.location}</span>}
                    </div>
                    {session.notes && <p className="mt-1 text-xs text-gray-400">{session.notes}</p>}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs lg:w-72">
                    <div className="rounded-lg bg-green-50 px-2 py-1 text-green-700">{sessionCounts.Present} Present</div>
                    <div className="rounded-lg bg-yellow-50 px-2 py-1 text-yellow-700">{sessionCounts.Late} Late</div>
                    <div className="rounded-lg bg-red-50 px-2 py-1 text-red-700">{sessionCounts.Absent} Absent</div>
                    <div className="rounded-lg bg-blue-50 px-2 py-1 text-blue-700">{sessionCounts.Excused} Excused</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => setSelectedSessionId(session.id)} className="btn-primary text-xs py-1.5">
                      Open Sheet
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(session)}
                      disabled={readOnly}
                      className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                      title={readOnly ? 'Archived semester sessions cannot be deleted' : 'Delete session'}
                    >
                      <Trash2 size={14} />
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
              <button onClick={() => setCreateModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreateSession} className="btn-primary">Create Session</button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Session Title</label>
              <input
                className="input"
                value={sessionForm.title}
                onChange={(event) => setSessionForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Weekly practice, general meeting, performance call time"
              />
            </div>
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
              <label className="label">Time</label>
              <input
                className="input"
                type="time"
                value={sessionForm.time}
                onChange={(event) => setSessionForm((prev) => ({ ...prev, time: event.target.value }))}
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
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                value={sessionForm.location}
                onChange={(event) => setSessionForm((prev) => ({ ...prev, location: event.target.value }))}
                placeholder="TMC Music Room"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
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

        <Modal
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Attendance Session"
          size="sm"
          footer={
            <>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => deleteSession(deleteConfirm.id)} className="btn-danger">Delete Session</button>
            </>
          }
        >
          {deleteConfirm && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Delete <span className="font-semibold text-gray-900">{deleteConfirm.title}</span>? This will remove the session and its attendance records from this list.
              </p>
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                This action cannot be undone.
              </div>
            </div>
          )}
        </Modal>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              onClick={() => setSelectedSessionId(null)}
              className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-blue-600"
            >
              <ArrowLeft size={13} /> Back to sessions
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">{selectedSession.title}</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{selectedSession.type}</span>
              {readOnly && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">View only</span>}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {formatDateShort(selectedSession.date)}{selectedSession.time ? ` at ${selectedSession.time}` : ''}
              {selectedSession.location ? ` - ${selectedSession.location}` : ''}
            </p>
          </div>
          <button onClick={handleSave} disabled={readOnly} className="btn-primary">
            <Save size={15} /> {saved ? 'Saved!' : 'Save Attendance'}
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
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-50 px-5 py-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search member..." className="w-full sm:w-60" />
          <div className="flex gap-1">
            {['All', 'Soprano', 'Alto', 'Tenor', 'Bass'].map((voicePart) => (
              <button
                key={voicePart}
                onClick={() => setVoiceFilter(voicePart)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  voiceFilter === voicePart ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {voicePart}
              </button>
            ))}
          </div>
          <select
            value={officerFilter}
            onChange={(event) => setOfficerFilter(event.target.value)}
            className="input w-auto text-xs"
          >
            <option value="All">All Members</option>
            <option value="Officers">Officers Only</option>
            <option value="Members">Non-officers</option>
          </select>
          <div className="flex items-center gap-1">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select
              value={memberSort}
              onChange={(event) => setMemberSort(event.target.value)}
              className="input w-auto text-xs"
            >
              {MEMBER_SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
            </select>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Bulk mark:</span>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => markAll(status)}
                disabled={readOnly}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                All {status}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filteredMembers.map((member) => {
            const status = currentAttendance[member.id]
            const hasNote = !!currentNotes[member.id]
            const officerPosition = officerMap[member.id]
            return (
              <div key={member.id} className="flex flex-col gap-3 px-5 py-3 transition-colors hover:bg-gray-50/50 sm:flex-row sm:items-center sm:gap-4">
                <Avatar name={member.name} voicePart={member.voicePart} size="md" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {member.name}{officerPosition ? ` (${officerPosition})` : ''}
                    </p>
                    {member.status === 'inactive' && <Badge variant="default">Inactive</Badge>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getVoicePartColor(member.voicePart)}`}>
                      {member.voicePart}
                    </span>
                    {officerPosition && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">Officer</span>
                    )}
                    {hasNote && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-500">
                        <FileText size={10} /> Note added
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {STATUS_OPTIONS.map((option) => {
                    const Icon = statusIcon[option]
                    return (
                      <button
                        key={option}
                        onClick={() => setStatus(member.id, option)}
                        title={option}
                        disabled={readOnly}
                        className={cn(
                          'flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-75',
                          status === option
                            ? option === 'Present' ? 'border-green-300 bg-green-100 text-green-700'
                            : option === 'Late' ? 'border-yellow-300 bg-yellow-100 text-yellow-700'
                            : option === 'Absent' ? 'border-red-300 bg-red-100 text-red-700'
                            : 'border-blue-300 bg-blue-100 text-blue-700'
                            : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                        )}
                      >
                        <Icon size={12} />
                        <span className="hidden sm:inline">{option}</span>
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => openNotes(member)}
                  className={cn(
                    'rounded-lg border p-2 text-xs transition-colors',
                    hasNote
                      ? 'border-blue-200 bg-blue-50 text-blue-500'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  )}
                  title={readOnly ? 'View note' : 'Add note'}
                >
                  <FileText size={13} />
                </button>
              </div>
            )
          })}
        </div>

        {filteredMembers.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">No members found.</div>
        )}
      </div>

      <Modal
        open={!!notesModal}
        onClose={() => setNotesModal(null)}
        title={`Attendance Note - ${notesModal?.name}`}
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

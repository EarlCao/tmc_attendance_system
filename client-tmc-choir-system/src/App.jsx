import { useMemo, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { BarChart3, CalendarDays, CheckCircle2, Clock, Eye, FileText, Lock, Mail, Pencil, Phone, Plus, Save, Settings, Trash2, UserCheck, Users, XCircle } from 'lucide-react'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Attendance from './pages/Attendance'
import Members from './pages/Members'
import Auditions from './pages/Auditions'
import Modal from './components/common/Modal'
import Avatar from './components/common/Avatar'
import { activeSemester, attendanceRecords, attendanceSessions, auditionees, excuses, judges, members, officerAssignments, semesters } from './data/mockData'
import { cn, formatDateShort, getAttendanceColor, getStatusColor, getVoicePartColor } from './lib/utils'

const semesterTabs = ['Overview', 'Attendance', 'Sessions', 'People']
const attendanceIcons = {
  Present: CheckCircle2,
  Late: Clock,
  Absent: XCircle,
  Excused: FileText,
}

const officerMap = Object.fromEntries(officerAssignments.map((officer) => [officer.memberId, officer.position]))

function getSemesterSessions(semesterId) {
  return attendanceSessions.filter((session) => session.semesterId === semesterId)
}

function getSemesterAttendance(semesterId) {
  const sessionIds = new Set(getSemesterSessions(semesterId).map((session) => session.id))
  return attendanceRecords.filter((record) => sessionIds.has(record.sessionId))
}

function summarizeAttendance(records) {
  return records.reduce((summary, record) => {
    summary[record.status] = (summary[record.status] || 0) + 1
    return summary
  }, { Present: 0, Late: 0, Absent: 0, Excused: 0 })
}

function getSessionSummary(sessionId, records) {
  return summarizeAttendance(records.filter((record) => record.sessionId === sessionId))
}

function getSessionRecords(sessionId, records) {
  return records.filter((record) => record.sessionId === sessionId)
}

function getMemberAttendanceSummary(memberId, records) {
  return summarizeAttendance(records.filter((record) => record.memberId === memberId))
}

function getSemesterExcuses(semester) {
  return excuses.filter((excuse) => {
    const date = excuse.date.slice(0, 10)
    return date >= semester.startDate && date <= semester.endDate
  })
}

function formatSemesterRange(semester) {
  if (!semester.startDate && !semester.endDate) return 'Dates not set'
  if (!semester.startDate) return `Until ${formatDateShort(semester.endDate)}`
  if (!semester.endDate) return `From ${formatDateShort(semester.startDate)}`
  return `${formatDateShort(semester.startDate)} to ${formatDateShort(semester.endDate)}`
}

function PlaceholderPage({ icon: Icon, title, description }) {
  return (
    <div className="card p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon size={22} />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{description}</p>
    </div>
  )
}

function Semesters() {
  const [semesterList, setSemesterList] = useState(semesters)
  const [selectedSemester, setSelectedSemester] = useState(null)
  const [selectedTab, setSelectedTab] = useState('Overview')
  const [semesterModal, setSemesterModal] = useState(false)
  const [semesterForm, setSemesterForm] = useState({ name: '', startDate: '', endDate: '' })

  const currentSemester = semesterList.find((semester) => semester.status === 'active')

  function handleEndSemester() {
    if (!currentSemester) return

    setSemesterList((prev) =>
      prev.map((semester) =>
        semester.id === currentSemester.id ? { ...semester, status: 'archived' } : semester
      )
    )
    setSelectedSemester((prev) =>
      prev?.id === currentSemester.id ? { ...prev, status: 'archived' } : prev
    )
  }

  function handleCreateSemester() {
    if (!semesterForm.name.trim()) return

    const newSemester = {
      id: Date.now(),
      name: semesterForm.name.trim(),
      startDate: semesterForm.startDate,
      endDate: semesterForm.endDate,
      status: 'active',
      totalSessions: 0,
    }

    setSemesterList((prev) => [
      ...prev.map((semester) => semester.status === 'active' ? { ...semester, status: 'archived' } : semester),
      newSemester,
    ])
    setSemesterForm({ name: '', startDate: '', endDate: '' })
    setSemesterModal(false)
  }

  const selectedSessions = useMemo(
    () => (selectedSemester ? getSemesterSessions(selectedSemester.id) : []),
    [selectedSemester]
  )
  const selectedAttendance = useMemo(
    () => (selectedSemester ? getSemesterAttendance(selectedSemester.id) : []),
    [selectedSemester]
  )
  const selectedAttendanceSummary = useMemo(
    () => summarizeAttendance(selectedAttendance),
    [selectedAttendance]
  )
  const selectedExcuses = useMemo(
    () => (selectedSemester ? getSemesterExcuses(selectedSemester) : []),
    [selectedSemester]
  )
  const selectedOfficers = useMemo(
    () =>
      selectedSemester
        ? members.filter((member) => officerMap[member.id])
        : [],
    [selectedSemester]
  )
  const selectedMemberSummaries = useMemo(
    () =>
      selectedSemester
        ? members.map((member) => ({
          ...member,
          attendanceSummary: getMemberAttendanceSummary(member.id, selectedAttendance),
        }))
        : [],
    [selectedAttendance, selectedSemester]
  )

  return (
    <div className="page-shell">
      <div className="card p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Semester records</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">Semester Management</h2>
          <p className="mt-1 text-sm text-gray-500">Ended semesters remain available for viewing, but archived records cannot be edited.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setSemesterModal(true)} className="btn-primary">
            <Plus size={14} /> New Semester
          </button>
          <button
            onClick={handleEndSemester}
            disabled={!currentSemester}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            title={currentSemester ? 'End the active semester and lock it from editing' : 'No active semester to end'}
          >
            <Lock size={14} /> End Current Semester
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {semesterList.map((semester) => {
          const isEnded = semester.status !== 'active'

          return (
            <div key={semester.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-900">{semester.name}</h2>
                    {isEnded && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        <Lock size={10} /> View only
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatSemesterRange(semester)}
                  </p>
                  {isEnded && (
                    <p className="mt-1 text-xs text-gray-400">This semester has ended and is locked from editing.</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium text-gray-500">{semester.totalSessions} sessions</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(semester.status)}`}>
                    {semester.status === 'active' ? 'Active' : 'Archived'}
                  </span>
                  <button onClick={() => { setSelectedSemester(semester); setSelectedTab('Overview') }} className="btn-secondary text-xs py-1.5">
                    <Eye size={13} /> View
                  </button>
                  <button
                    disabled={isEnded}
                    title={isEnded ? 'Ended semesters cannot be edited' : 'Edit active semester'}
                    className="btn-secondary text-xs py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Pencil size={13} /> Edit
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
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{selectedSemester.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatSemesterRange(selectedSemester)}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(selectedSemester.status)}`}>
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
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    selectedTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {selectedTab === 'Overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Sessions</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">{selectedSessions.length}</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Attendance records</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">{selectedAttendance.length}</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Officers involved</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">{selectedOfficers.length}</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Excuses logged</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">{selectedExcuses.length}</p>
                  </div>
                </div>

                {selectedSemester.status !== 'active' && (
                  <div className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
                    This semester has ended. Records can be viewed for history and reports, but editing is locked.
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'Attendance' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {(['Present', 'Late', 'Absent', 'Excused']).map((status) => {
                    const Icon = attendanceIcons[status]
                    const total = selectedAttendance.length || 1
                    const value = selectedAttendanceSummary[status]
                    return (
                      <div key={status} className="rounded-lg border border-gray-100 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{status}</p>
                          <div className={`rounded-full p-1.5 ${getAttendanceColor(status)}`}>
                            <Icon size={12} />
                          </div>
                        </div>
                        <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
                        <p className="text-xs text-gray-400">{Math.round((value / total) * 100)}% of records</p>
                      </div>
                    )
                  })}
                </div>

                <div className="rounded-lg border border-gray-100">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">Attendance by session</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {selectedSessions.map((session) => {
                      const sessionRecords = getSessionRecords(session.id, selectedAttendance)
                      const summary = getSessionSummary(session.id, selectedAttendance)
                      const total = Object.values(summary).reduce((sum, value) => sum + value, 0) || 1
                      return (
                        <div key={session.id} className="p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{session.title || session.notes || session.type}</p>
                              <p className="text-xs text-gray-500">
                                {formatDateShort(session.date)}{session.time ? ` at ${session.time}` : ''} · {session.location || 'TMC Music Room'}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400">{total} records</span>
                          </div>
                          <div className="mt-3 grid grid-cols-4 gap-2">
                            {(['Present', 'Late', 'Absent', 'Excused']).map((status) => (
                              <div key={status} className={`rounded-md px-2 py-2 text-center text-[11px] font-medium ${getAttendanceColor(status)}`}>
                                <p>{status}</p>
                                <p className="mt-1 text-sm font-bold">{summary[status]}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 grid gap-3 lg:grid-cols-2">
                            {(['Present', 'Late', 'Absent', 'Excused']).map((status) => {
                              const statusRecords = sessionRecords.filter((record) => record.status === status)

                              return (
                                <div key={status} className="rounded-lg border border-gray-100 p-3">
                                  <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getAttendanceColor(status)}`}>
                                      {status}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{statusRecords.length} members</span>
                                  </div>
                                  <div className="space-y-2">
                                    {statusRecords.map((record) => (
                                      <div key={record.id} className="text-xs">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="font-medium text-gray-800">{record.memberName}</span>
                                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getVoicePartColor(record.voicePart)}`}>
                                            {record.voicePart}
                                          </span>
                                        </div>
                                        {(record.notes || record.excuseReason) && (
                                          <p className="mt-1 text-gray-400">{record.notes || record.excuseReason}</p>
                                        )}
                                      </div>
                                    ))}
                                    {statusRecords.length === 0 && (
                                      <p className="text-xs text-gray-400">No members under this status.</p>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {session.notes && (
                            <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">Session notes: {session.notes}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'Sessions' && (
              <div className="space-y-3">
                {selectedSessions.map((session) => {
                  const summary = getSessionSummary(session.id, selectedAttendance)
                  return (
                    <div key={session.id} className="rounded-lg border border-gray-100 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{session.title || session.notes || session.type}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDateShort(session.date)}{session.time ? ` at ${session.time}` : ''} · {session.type}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">{session.location || 'TMC Music Room'}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>{summary.Present} present</p>
                          <p>{summary.Late} late</p>
                          <p>{summary.Absent} absent</p>
                          <p>{summary.Excused} excused</p>
                        </div>
                      </div>
                      {session.notes && (
                        <p className="mt-3 text-xs text-gray-600">{session.notes}</p>
                      )}
                    </div>
                  )
                })}
                {selectedSessions.length === 0 && (
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No sessions are linked to this semester yet.</div>
                )}
              </div>
            )}

            {selectedTab === 'People' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Choir members and officers included</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedMemberSummaries.map((member) => (
                      <div key={member.id} className="rounded-lg border border-gray-100 p-3">
                        <div className="flex items-start gap-3">
                          <Avatar name={member.name} voicePart={member.voicePart} size="sm" />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                              {officerMap[member.id] && (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                  {officerMap[member.id]}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{member.course} · {member.yearLevel}</p>
                            <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${getVoicePartColor(member.voicePart)}`}>
                              {member.voicePart}
                            </span>
                            <div className="mt-3 grid grid-cols-4 gap-1">
                              {(['Present', 'Late', 'Absent', 'Excused']).map((status) => (
                                <div key={status} className={`rounded-md px-1.5 py-1 text-center text-[10px] font-medium ${getAttendanceColor(status)}`}>
                                  <p>{status}</p>
                                  <p className="text-xs font-bold">{member.attendanceSummary[status]}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
            <button onClick={() => setSemesterModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreateSemester} className="btn-primary">Create Semester</button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
            Creating a new semester will archive the current active semester and lock it as view-only.
          </div>
          <div>
            <label className="label">Semester Name *</label>
            <input className="input" value={semesterForm.name} onChange={e => setSemesterForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. 2nd Semester SY 2025-2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input className="input" type="date" value={semesterForm.startDate} onChange={e => setSemesterForm(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input className="input" type="date" value={semesterForm.endDate} onChange={e => setSemesterForm(p => ({ ...p, endDate: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Judges() {
  const [judgeList, setJudgeList] = useState(judges.map((judge) => ({ ...judge, semesterId: activeSemester?.id })))
  const [judgeModal, setJudgeModal] = useState(false)
  const [editingJudge, setEditingJudge] = useState(null)
  const [judgeForm, setJudgeForm] = useState({
    name: '',
    title: '',
    specialization: '',
    contact: '',
    email: '',
    semesterId: activeSemester?.id ?? semesters[0]?.id,
    status: 'active',
  })

  function openJudgeModal(judge) {
    if (judge) {
      setEditingJudge(judge)
      setJudgeForm({ ...judge })
    } else {
      setEditingJudge(null)
      setJudgeForm({
        name: '',
        title: '',
        specialization: '',
        contact: '',
        email: '',
        semesterId: activeSemester?.id ?? semesters[0]?.id,
        status: 'active',
      })
    }
    setJudgeModal(true)
  }

  function handleSaveJudge() {
    if (!judgeForm.name.trim()) return

    if (editingJudge) {
      setJudgeList((prev) => prev.map((judge) => judge.id === editingJudge.id ? { ...judge, ...judgeForm } : judge))
    } else {
      setJudgeList((prev) => [...prev, { ...judgeForm, id: Date.now(), ratingsGiven: 0 }])
    }
    setJudgeModal(false)
  }

  return (
    <div className="page-shell">
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Audition panel</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">Judges</h2>
            <p className="mt-1 text-sm text-gray-500">Add the judges assigned to each semester and use Auditions to manually enter their ratings and comments.</p>
          </div>
          <button onClick={() => openJudgeModal()} className="btn-primary">
            <Plus size={14} /> Add Judge
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {judgeList.map((judge) => {
          const semester = semesters.find((item) => item.id === Number(judge.semesterId))

          return (
            <div key={judge.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{judge.name}</h2>
                  <p className="mt-1 text-xs text-gray-500">{judge.title || 'Judge'}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(judge.status)}`}>
                  {judge.status}
                </span>
              </div>
              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <p>{judge.specialization || 'General audition evaluation'}</p>
                <p className="flex items-center gap-2"><Mail size={12} /> {judge.email || 'No email listed'}</p>
                <p className="flex items-center gap-2"><Phone size={12} /> {judge.contact || 'No contact listed'}</p>
                <p className="rounded-lg bg-gray-50 p-2 text-gray-600">{semester?.name ?? 'Semester not selected'}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                <span className="text-xs font-medium text-gray-700">{judge.ratingsGiven ?? 0} ratings submitted</span>
                <button onClick={() => openJudgeModal(judge)} className="btn-secondary text-xs py-1.5">
                  <Pencil size={12} /> Edit
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        open={judgeModal}
        onClose={() => setJudgeModal(false)}
        title={editingJudge ? 'Edit Judge' : 'Add Judge'}
        size="md"
        footer={
          <>
            <button onClick={() => setJudgeModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveJudge} className="btn-primary">Save Judge</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={judgeForm.name} onChange={e => setJudgeForm(p => ({ ...p, name: e.target.value }))} placeholder="Judge name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Title / Role</label>
              <input className="input" value={judgeForm.title} onChange={e => setJudgeForm(p => ({ ...p, title: e.target.value }))} placeholder="Music Director" />
            </div>
            <div>
              <label className="label">Semester</label>
              <select className="input" value={judgeForm.semesterId} onChange={e => setJudgeForm(p => ({ ...p, semesterId: Number(e.target.value) }))}>
                {semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Specialization</label>
            <input className="input" value={judgeForm.specialization} onChange={e => setJudgeForm(p => ({ ...p, specialization: e.target.value }))} placeholder="Vocal performance, choral conducting" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Contact</label>
              <input className="input" value={judgeForm.contact} onChange={e => setJudgeForm(p => ({ ...p, contact: e.target.value }))} placeholder="09XXXXXXXXX" />
            </div>
            <div>
              <label className="label">Email / FB</label>
              <input className="input" value={judgeForm.email} onChange={e => setJudgeForm(p => ({ ...p, email: e.target.value }))} placeholder="email or Facebook account" />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={judgeForm.status} onChange={e => setJudgeForm(p => ({ ...p, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Officers() {
  const [officerList, setOfficerList] = useState(officerAssignments.map((assignment, index) => {
    const member = members.find((item) => item.id === assignment.memberId)
    return {
      id: index + 1,
      memberId: assignment.memberId,
      name: member?.name ?? '',
      position: assignment.position,
      semesterId: activeSemester?.id ?? semesters[0]?.id,
      contact: member?.phone ?? '',
      email: member?.email ?? '',
      duties: '',
      status: 'active',
    }
  }))
  const [officerModal, setOfficerModal] = useState(false)
  const [editingOfficer, setEditingOfficer] = useState(null)
  const [officerForm, setOfficerForm] = useState({
    name: '',
    position: '',
    semesterId: activeSemester?.id ?? semesters[0]?.id,
    contact: '',
    email: '',
    duties: '',
    status: 'active',
  })

  function openOfficerModal(officer) {
    if (officer) {
      setEditingOfficer(officer)
      setOfficerForm({ ...officer })
    } else {
      setEditingOfficer(null)
      setOfficerForm({
        name: '',
        position: '',
        semesterId: activeSemester?.id ?? semesters[0]?.id,
        contact: '',
        email: '',
        duties: '',
        status: 'active',
      })
    }
    setOfficerModal(true)
  }

  function handleSaveOfficer() {
    if (!officerForm.name.trim() || !officerForm.position.trim()) return

    if (editingOfficer) {
      setOfficerList((prev) => prev.map((officer) => officer.id === editingOfficer.id ? { ...officer, ...officerForm } : officer))
    } else {
      setOfficerList((prev) => [...prev, { ...officerForm, id: Date.now() }])
    }
    setOfficerModal(false)
  }

  function handleDeleteOfficer(id) {
    setOfficerList((prev) => prev.filter((officer) => officer.id !== id))
  }

  return (
    <div className="page-shell">
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Choir leadership</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">Officers</h2>
            <p className="mt-1 text-sm text-gray-500">Manually add officers, keep their positions, and edit the list per semester.</p>
          </div>
          <button onClick={() => openOfficerModal()} className="btn-primary">
            <Plus size={14} /> Add Officer
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Officer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Position</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Semester</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {officerList.map((officer) => {
                const semester = semesters.find((item) => item.id === Number(officer.semesterId))

                return (
                  <tr key={officer.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{officer.name}</p>
                      {officer.duties && <p className="mt-1 text-xs text-gray-400">{officer.duties}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700">{officer.position}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{semester?.name ?? 'No semester'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <p>{officer.email || 'No email listed'}</p>
                      <p>{officer.contact || 'No contact listed'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(officer.status)}`}>{officer.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openOfficerModal(officer)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"><Pencil size={13} /></button>
                        <button onClick={() => handleDeleteOfficer(officer.id)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={officerModal}
        onClose={() => setOfficerModal(false)}
        title={editingOfficer ? 'Edit Officer' : 'Add Officer'}
        size="md"
        footer={
          <>
            <button onClick={() => setOfficerModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveOfficer} className="btn-primary">Save Officer</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={officerForm.name} onChange={e => setOfficerForm(p => ({ ...p, name: e.target.value }))} placeholder="Officer name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Position *</label>
              <input className="input" value={officerForm.position} onChange={e => setOfficerForm(p => ({ ...p, position: e.target.value }))} placeholder="President" />
            </div>
            <div>
              <label className="label">Semester</label>
              <select className="input" value={officerForm.semesterId} onChange={e => setOfficerForm(p => ({ ...p, semesterId: Number(e.target.value) }))}>
                {semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Contact</label>
              <input className="input" value={officerForm.contact} onChange={e => setOfficerForm(p => ({ ...p, contact: e.target.value }))} placeholder="09XXXXXXXXX" />
            </div>
            <div>
              <label className="label">Email / FB</label>
              <input className="input" value={officerForm.email} onChange={e => setOfficerForm(p => ({ ...p, email: e.target.value }))} placeholder="email or Facebook account" />
            </div>
          </div>
          <div>
            <label className="label">Duties / Notes</label>
            <textarea className="input min-h-24 resize-y" value={officerForm.duties} onChange={e => setOfficerForm(p => ({ ...p, duties: e.target.value }))} placeholder="Responsibilities, assignments, reminders" />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={officerForm.status} onChange={e => setOfficerForm(p => ({ ...p, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Reports() {
  const totalAuditions = auditionees.length
  const passedAuditions = auditionees.filter((auditionee) => auditionee.status === 'Passed').length
  const averageAttendance = Math.round(members.reduce((sum, member) => sum + member.attendanceRate, 0) / members.length)

  return (
    <div className="page-shell">
      <div className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Printable summaries</p>
        <h2 className="mt-1 text-2xl font-bold text-gray-900">Reports</h2>
        <p className="mt-1 text-sm text-gray-500">This panel can hold semester-end summaries for attendance, auditions, members, officers, and absences.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500">Average Attendance</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{averageAttendance}%</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500">Active Members</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{members.filter((member) => member.status === 'active').length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500">Audition Pass Rate</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{Math.round((passedAuditions / totalAuditions) * 100)}%</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500">Pending Excuses</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{excuses.filter((excuse) => excuse.status === 'Pending').length}</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { title: 'Semester Attendance Report', details: 'Member totals for present, late, absent, excused, attendance rate, and session history.' },
          { title: 'Audition Evaluation Report', details: 'Auditionee status, assigned judges, per-category ratings, comments, and final recommendation.' },
          { title: 'Officers Report', details: 'Officer list by semester, positions, contact details, duties, and active/inactive status.' },
          { title: 'Absence and Excuse Report', details: 'Excuse requests with reasons, review status, notes, and affected attendance sessions.' },
        ].map((report) => (
          <div key={report.title} className="card p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{report.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{report.details}</p>
                <button className="btn-secondary mt-4 text-xs py-1.5">Prepare Report</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SettingsPage() {
  const [settingsForm, setSettingsForm] = useState({
    choirName: 'TMC Choir',
    institution: 'Trinidad Municipal College',
    defaultVenue: 'TMC Music Room',
    attendanceGrace: 15,
    passingRating: 7,
    archiveMode: 'Lock ended semesters',
  })

  return (
    <div className="page-shell">
      <div className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">System setup</p>
        <h2 className="mt-1 text-2xl font-bold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">Use this area for choir profile details, attendance rules, audition scoring defaults, and semester locking behavior.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900">Choir Profile</h3>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label">Choir Name</label>
              <input className="input" value={settingsForm.choirName} onChange={e => setSettingsForm(p => ({ ...p, choirName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Institution</label>
              <input className="input" value={settingsForm.institution} onChange={e => setSettingsForm(p => ({ ...p, institution: e.target.value }))} />
            </div>
            <div>
              <label className="label">Default Venue</label>
              <input className="input" value={settingsForm.defaultVenue} onChange={e => setSettingsForm(p => ({ ...p, defaultVenue: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900">Rules and Defaults</h3>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label">Late Grace Period (minutes)</label>
              <input className="input" type="number" value={settingsForm.attendanceGrace} onChange={e => setSettingsForm(p => ({ ...p, attendanceGrace: e.target.value }))} />
            </div>
            <div>
              <label className="label">Audition Passing Rating</label>
              <input className="input" type="number" min="1" max="10" value={settingsForm.passingRating} onChange={e => setSettingsForm(p => ({ ...p, passingRating: e.target.value }))} />
            </div>
            <div>
              <label className="label">Ended Semester Behavior</label>
              <select className="input" value={settingsForm.archiveMode} onChange={e => setSettingsForm(p => ({ ...p, archiveMode: e.target.value }))}>
                <option>Lock ended semesters</option>
                <option>Allow admin edits</option>
              </select>
            </div>
            <button className="btn-primary">
              <Save size={14} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/semesters" element={<Semesters />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/members" element={<Members />} />
          <Route path="/auditions" element={<Auditions />} />
          <Route path="/judges" element={<Judges />} />
          <Route path="/officers" element={<Officers />} />
          <Route
            path="/elections"
            element={
              <PlaceholderPage
                icon={UserCheck}
                title="Officer Elections"
                description="Election setup, voting windows, and result summaries can be managed here."
              />
            }
          />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="*"
            element={
              <PlaceholderPage
                icon={CalendarDays}
                title="Page not found"
                description="Choose a section from the sidebar to continue."
              />
            }
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  )
}

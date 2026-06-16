import { useState, useEffect } from 'react'
import {
  CheckCircle2, FileText, Loader2, BarChart2, GraduationCap, UserCheck,
  ChevronDown, ChevronUp, CalendarRange, Search
} from 'lucide-react'
import { useSemesters } from '../hooks/useSemesters'
import { useMembers } from '../hooks/useMembers'
import { useSessions } from '../hooks/useSessions'
import { useAuditions } from '../hooks/useAuditions'
import { useOfficers } from '../hooks/useOfficers'
import { useExcuses } from '../hooks/useExcuses'
import { formatDateShort, cn } from '../lib/utils'
import { reportsAPI } from '../lib/api'
import Modal from '../components/common/Modal'

function RateBar({ rate, size = 'sm' }) {
  const color =
    rate >= 80 ? 'bg-emerald-500' :
    rate >= 60 ? 'bg-amber-500' :
    'bg-red-500'

  const height = size === 'sm' ? 'h-1.5' : 'h-2'

  return (
    <div className="w-full min-w-[60px]">
      <div className={cn('w-full rounded-full bg-slate-100 overflow-hidden', height)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  if (!status) return null
  const s = status.toLowerCase()
  if (s === 'active') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider"><UserCheck size={10} /> Active</span>
  if (s === 'graduated') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider"><GraduationCap size={10} /> Graduated</span>
  if (s === 'inactive') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">Inactive</span>
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">{status}</span>
}

function AttendanceCell({ count, label, colorClass, bgClass }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-2 py-1.5 rounded-lg', bgClass)}>
      <p className={cn('text-sm font-black leading-none', colorClass)}>{count}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

function MemberRow({ member, index }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className={cn(
          'transition-colors cursor-pointer',
          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50',
          'hover:bg-blue-50'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-black shrink-0">
              {member.firstName?.[0]}{member.lastName?.[0]}
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-800 leading-tight">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-[10px] font-medium text-slate-400">{member.voicePart || '—'}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3"><StatusBadge status={member.status} /></td>
        <td className="px-4 py-3 text-center">
          <span className="text-[13px] font-bold text-slate-700">{member.recorded}</span>
        </td>
        <td className="px-4 py-3">
          <AttendanceCell count={member.present} label="Pre" colorClass="text-emerald-600" bgClass="bg-emerald-50/50" />
        </td>
        <td className="px-4 py-3">
          <AttendanceCell count={member.absent} label="Abs" colorClass="text-red-600" bgClass="bg-red-50/50" />
        </td>
        <td className="px-4 py-3">
          <AttendanceCell count={member.late} label="Late" colorClass="text-amber-600" bgClass="bg-amber-50/50" />
        </td>
        <td className="px-4 py-3">
          <AttendanceCell count={member.excused} label="Exc" colorClass="text-blue-600" bgClass="bg-blue-50/50" />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <RateBar rate={member.attendanceRate} />
            </div>
            <span className={cn(
              'text-[13px] font-black w-9 text-right',
              member.attendanceRate >= 80 ? 'text-emerald-600' :
              member.attendanceRate >= 60 ? 'text-amber-600' :
              'text-red-600'
            )}>{member.attendanceRate}%</span>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          {expanded ? <ChevronUp size={14} className="text-slate-400 inline" /> : <ChevronDown size={14} className="text-slate-400 inline" />}
        </td>
      </tr>
      {expanded && member.sessions && member.sessions.length > 0 && (
        <tr className="bg-slate-50">
          <td colSpan={9} className="px-8 py-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Session Details</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {member.sessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-2 text-[12px] bg-white rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                    <span className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      session.status === 'PRESENT' ? 'bg-emerald-500' :
                      session.status === 'ABSENT' ? 'bg-red-500' :
                      session.status === 'LATE' ? 'bg-amber-500' :
                      session.status === 'EXCUSED' ? 'bg-blue-500' : 'bg-slate-300'
                    )} />
                    <span className="font-semibold text-slate-700 truncate">{session.title || `Session #${session.id}`}</span>
                    <span className="text-slate-400 ml-auto shrink-0">{session.date ? formatDateShort(session.date) : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
      {expanded && (!member.sessions || member.sessions.length === 0) && (
        <tr className="bg-slate-50">
          <td colSpan={9} className="px-8 py-4 text-center text-[13px] text-slate-400">
            No session records for this member in this semester.
          </td>
        </tr>
      )}
    </>
  )
}

export default function Reports() {
  const { activeSemester: currentSemester, loading: sLoading } = useSemesters()
  const { members, loading: mLoading } = useMembers()
  const { sessions, loading: sessLoading } = useSessions()
  const { auditionees, loading: aLoading } = useAuditions()
  const { officers, loading: oLoading } = useOfficers()
  const { excuses, loading: eLoading } = useExcuses()

  const [preparedReport, setPreparedReport] = useState(null)

  // Semester attendance summary state
  const [semesterData, setSemesterData] = useState([])
  const [selectedSemesterId, setSelectedSemesterId] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberFilter, setMemberFilter] = useState('all')

  const loading = sLoading || mLoading || sessLoading || aLoading || oLoading || eLoading

  const currentSemesterId = currentSemester?.id
  const currentSessions = currentSemesterId
    ? sessions.filter((session) => Number(session.semesterId) === Number(currentSemesterId))
    : []
  const currentAuditionees = currentSemesterId
    ? auditionees.filter((auditionee) => Number(auditionee.semesterId) === Number(currentSemesterId))
    : []
  const currentExcuses = currentSemesterId
    ? excuses.filter((excuse) => Number(excuse.semesterId) === Number(currentSemesterId))
    : []

  const totalAuditions = currentAuditionees.length
  const passedAuditions = currentAuditionees.filter((a) => a.status === 'Passed').length

  const activeMembers = members.filter((m) => m.status?.toLowerCase() === 'active')
  const pendingExcuses = currentExcuses.filter((e) => e.status === 'Pending')

  // Fetch semester attendance data
  useEffect(() => {
    async function fetchData() {
      setReportLoading(true)
      try {
        const res = await reportsAPI.getSemesterAttendanceSummary()
        setSemesterData(res.data?.semesters || [])
        // Default to active semester
        if (res.data?.semesters?.length > 0) {
          const now = new Date()
          const active = res.data.semesters.find(s => {
            if (!s.startDate) return false
            const notEnded = !s.endDate || new Date(s.endDate) > now
            return notEnded
          })
          setSelectedSemesterId(active?.id || res.data.semesters[0].id)
        }
      } catch (err) {
        console.error('Failed to load semester attendance data:', err)
      } finally {
        setReportLoading(false)
      }
    }
    fetchData()
  }, [])

  const officerMemberIds = new Set(officers.map(o => Number(o.memberId)))

  const selectedSemester = semesterData.find(s => s.id === selectedSemesterId)
  const filteredMembers = selectedSemester
    ? selectedSemester.members.filter(m => {
        const name = `${m.firstName} ${m.lastName}`.toLowerCase()
        if (!name.includes(memberSearch.toLowerCase())) return false

        if (memberFilter === 'all') return m.status !== 'graduated'
        if (memberFilter === 'all-graduated') return true
        if (memberFilter === 'inactive') return m.status === 'inactive'
        if (memberFilter === 'officers') return officerMemberIds.has(m.memberId)

        return true
      })
    : []

  // Compute overall stats for selected semester
  const overallPresent = filteredMembers.reduce((sum, m) => sum + m.present, 0)
  const overallAbsent = filteredMembers.reduce((sum, m) => sum + m.absent, 0)
  const overallLate = filteredMembers.reduce((sum, m) => sum + m.late, 0)
  const overallExcused = filteredMembers.reduce((sum, m) => sum + m.excused, 0)
  const overallRecorded = filteredMembers.reduce((sum, m) => sum + m.recorded, 0)
  const overallRate = overallRecorded > 0 ? Math.round((overallPresent / overallRecorded) * 100) : 0

  function getMemberName(member) {
    if (!member) return 'Unknown'
    return `${member.firstName || ''} ${member.lastName || ''}`.trim()
  }

  function getAuditionAverage(auditionee) {
    if (auditionee.averageRating) return Number(auditionee.averageRating).toFixed(1)
    const evaluations = auditionee.evaluations || []
    if (!evaluations.length) return null

    const categoryKeys = ['vocalQuality', 'pitchAccuracy', 'tone', 'rhythm', 'confidence', 'stagePresence']
    const total = evaluations.reduce((sum, evaluation) => {
      const ratedCategories = categoryKeys.filter((key) => evaluation[key] !== undefined && evaluation[key] !== null)
      if (!ratedCategories.length) return sum
      const score = ratedCategories.reduce((catSum, key) => catSum + Number(evaluation[key] || 0), 0) / ratedCategories.length
      return sum + score
    }, 0)

    return (total / evaluations.length).toFixed(1)
  }

  function getFinalRecommendation(auditionee) {
    if (auditionee.status === 'Passed') return 'Recommended for membership'
    if (auditionee.status === 'Failed') return 'Not recommended'
    return 'For final decision'
  }

  function getEvaluationNotes(auditionee) {
    const notes = (auditionee.evaluations || [])
      .map((evaluation) => evaluation.comments)
      .filter(Boolean)

    return notes.length ? notes.join(' / ') : 'No judge comments recorded'
  }

  const reportTypes = [
    { id: 'attendance', title: 'Semester Attendance Report',    details: 'Member list, voice parts, and status for the current semester.' },
    { id: 'auditions',  title: 'Audition Evaluation Report',    details: 'Auditionee status, voice parts, dates, and final recommendations.' },
    { id: 'officers',   title: 'Officers Report',               details: 'Officer list by semester, positions, contact details, duties, and status.' },
    { id: 'excuses',    title: 'Absence and Excuse Report',     details: 'Excuse requests with reasons, review status, and notes.' },
  ]

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
      <div className="card p-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Printable summaries</p>
        <h2 className="mt-1 text-2xl font-black text-slate-800 tracking-tight">Reports</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">Semester-end summaries for attendance, auditions, members, officers, and absences.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <div className="card p-5 bg-white shadow-sm">
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Active Members</p>
          <p className="mt-2 text-3xl font-black text-slate-800">{activeMembers.length}</p>
        </div>
        <div className="card p-5 bg-white shadow-sm">
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Sessions</p>
          <p className="mt-2 text-3xl font-black text-slate-800">{currentSessions.length}</p>
        </div>
        <div className="card p-5 bg-white shadow-sm">
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Audition Pass Rate</p>
          <p className="mt-2 text-3xl font-black text-slate-800">
            {totalAuditions ? Math.round((passedAuditions / totalAuditions) * 100) : 0}%
          </p>
        </div>
        <div className="card p-5 bg-white shadow-sm">
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Pending Excuses</p>
          <p className="mt-2 text-3xl font-black text-slate-800">{pendingExcuses.length}</p>
        </div>
      </div>

      {/* Report type cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        {reportTypes.map((report) => (
          <div key={report.id} className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-inner">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-slate-800">{report.title}</h3>
                <p className="mt-1.5 text-[13px] font-medium text-slate-500 leading-relaxed">{report.details}</p>
                <button onClick={() => setPreparedReport(report)} className="btn-secondary mt-4 text-[12px] py-2 px-4 shadow-sm hover:shadow-md">
                  <CheckCircle2 size={14} /> Generate Final Report
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* SEMESTER ATTENDANCE SUMMARY SECTION */}
      {/* ════════════════════════════════════════════════════ */}
      <div className="mt-10">
        <div className="card p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <BarChart2 size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner">
                <BarChart2 size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Attendance Overview</p>
                <h2 className="text-xl font-black tracking-tight">Semester Attendance Summary</h2>
                <p className="text-sm text-white/70 mt-0.5">Attendance ratings and summaries for all members per semester</p>
              </div>
            </div>
          </div>
        </div>

        {reportLoading ? (
          <div className="flex items-center justify-center h-48 mt-5">
            <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
          </div>
        ) : semesterData.length === 0 ? (
          <div className="card mt-5 p-12 flex flex-col items-center justify-center text-center">
            <BarChart2 size={40} className="text-slate-300 mb-4" />
            <p className="text-lg font-bold text-slate-600">No semester data available</p>
            <p className="text-sm text-slate-400 mt-1">Attendance data will appear here once semesters and sessions have been created.</p>
          </div>
        ) : (
          <>
            {/* Semester Selector — dropdown */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <label className="text-[13px] font-bold text-slate-600 shrink-0">Semester:</label>
              <div className="relative">
                <select
                  value={selectedSemesterId || ''}
                  onChange={(e) => setSelectedSemesterId(Number(e.target.value))}
                  className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-[13px] font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  {semesterData.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      {sem.name} ({sem.totalSessions} sessions)
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {selectedSemester && (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
                  {selectedSemester.isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  {selectedSemester.isActive ? 'Active' : 'Past'} semester
                </span>
              )}
            </div>

            {/* Selected Semester Summary */}
            {selectedSemester && (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <div className="card p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Members</p>
                    <p className="mt-1 text-2xl font-black text-slate-800">{selectedSemester.totalMembers}</p>
                  </div>
                  <div className="card p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sessions</p>
                    <p className="mt-1 text-2xl font-black text-slate-800">{selectedSemester.totalSessions}</p>
                  </div>
                  <div className="card p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attendance Rate</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={cn(
                        'text-2xl font-black',
                        overallRate >= 80 ? 'text-emerald-600' :
                        overallRate >= 60 ? 'text-amber-600' :
                        'text-red-600'
                      )}>{overallRate}%</span>
                    </div>
                    <div className="mt-2">
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            overallRate >= 80 ? 'bg-emerald-500' :
                            overallRate >= 60 ? 'bg-amber-500' :
                            'bg-red-500'
                          )}
                          style={{ width: `${overallRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="card p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Records</p>
                    <p className="mt-1 text-2xl font-black text-slate-800">{overallRecorded}</p>
                  </div>
                </div>

                {/* Search */}
                <div className="mt-5 flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-[13px] font-medium bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Filter chips */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Filter:</span>
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'all-graduated', label: 'All (include graduated)' },
                    { key: 'inactive', label: 'Inactive' },
                    { key: 'officers', label: 'Officers' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setMemberFilter(opt.key)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all',
                        memberFilter === opt.key
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <span className="ml-auto text-[12px] font-medium text-slate-400">
                    {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Members Table */}
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Member</th>
                          <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                          <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Rec</th>
                          <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-emerald-600">Present</th>
                          <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-red-600">Absent</th>
                          <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-amber-600">Late</th>
                          <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-blue-600">Excused</th>
                          <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Rate</th>
                          <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredMembers.map((member, index) => (
                          <MemberRow key={member.memberId} member={member} index={index} />
                        ))}
                        {filteredMembers.length === 0 && (
                          <tr>
                            <td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm font-medium">
                              No members match your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                  <span className="font-medium">Legend:</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Absent
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Excused
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarRange size={12} /> Click a row to see session details
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Prepared Report Modal */}
      <Modal
        open={!!preparedReport}
        onClose={() => setPreparedReport(null)}
        title={preparedReport?.title ?? 'Prepared Report'}
        size="2xl"
        footer={
          <>
            <button onClick={() => setPreparedReport(null)} className="btn-secondary">Close</button>
            <button onClick={() => window.print()} className="btn-primary shadow-blue-500/40">Print Report</button>
          </>
        }
      >
        {preparedReport && (
          <div className="print-report space-y-5">
            <div className="hidden print:block mb-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">TMC Choir Attendance System</p>
              <h2 className="mt-1 text-2xl font-black text-slate-800">{preparedReport.title}</h2>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Prepared for</p>
              <h3 className="mt-1 text-[16px] font-black text-slate-800">{currentSemester?.name ?? 'No active semester'}</h3>
              <p className="mt-1 text-[13px] font-medium text-slate-500">Trinidad Municipal College Choir</p>
              <p className="mt-1 text-[11px] font-medium text-slate-400">Final report generated from current system records.</p>
            </div>

            {preparedReport.id === 'attendance' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Members</p>
                    <p className="mt-1 text-2xl font-black text-slate-800">{members.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active</p>
                    <p className="mt-1 text-2xl font-black text-green-600">{activeMembers.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sessions</p>
                    <p className="mt-1 text-2xl font-black text-slate-800">{currentSessions.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Inactive</p>
                    <p className="mt-1 text-2xl font-black text-slate-600">{members.length - activeMembers.length}</p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                  <table className="w-full text-[13px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Member</th>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Voice Part</th>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Course</th>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {members.map((member) => (
                        <tr key={member.id} className="hover:bg-blue-600/25">
                          <td className="px-5 py-4 font-black text-slate-800">{getMemberName(member)}</td>
                          <td className="px-5 py-4 font-medium text-slate-600">{member.voicePart}</td>
                          <td className="px-5 py-4 font-medium text-slate-600">{member.course || '—'}</td>
                          <td className="px-5 py-4 font-medium text-slate-600">{member.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {preparedReport.id === 'auditions' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Auditionees</p>
                    <p className="mt-1 text-2xl font-black text-slate-800">{totalAuditions}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Passed</p>
                    <p className="mt-1 text-2xl font-black text-green-600">{passedAuditions}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Failed</p>
                    <p className="mt-1 text-2xl font-black text-red-600">{currentAuditionees.filter((a) => a.status === 'Failed').length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pending</p>
                    <p className="mt-1 text-2xl font-black text-yellow-600">{currentAuditionees.filter((a) => a.status === 'Pending').length}</p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                  <table className="w-full text-[13px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Auditionee</th>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Part</th>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Date</th>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Avg</th>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Judges</th>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Final Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentAuditionees.map((auditionee) => (
                        <tr key={auditionee.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-black text-slate-800">{auditionee.firstName} {auditionee.lastName}</td>
                          <td className="px-5 py-4 font-medium text-slate-600">{auditionee.voicePart}</td>
                          <td className="px-5 py-4 font-medium text-slate-600">{formatDateShort(auditionee.auditionDate)}</td>
                          <td className="px-5 py-4 font-bold text-slate-700">{getAuditionAverage(auditionee) ?? '—'}</td>
                          <td className="px-5 py-4 font-medium text-slate-600">{(auditionee.evaluations || []).length}</td>
                          <td className="px-5 py-4 font-bold text-slate-700">
                            <div>{getFinalRecommendation(auditionee)}</div>
                            <div className="mt-1 text-[11px] font-medium text-slate-500">{auditionee.status}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                  <table className="w-full text-[13px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Auditionee</th>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Final Notes / Evaluation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentAuditionees.map((auditionee) => (
                        <tr key={`${auditionee.id}-notes`} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-black text-slate-800">{auditionee.firstName} {auditionee.lastName}</td>
                          <td className="px-5 py-4 font-medium text-slate-600">{getEvaluationNotes(auditionee)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {preparedReport.id === 'officers' && (
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                <table className="w-full text-[13px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-4 text-left font-bold text-slate-500">Position</th>
                      <th className="px-5 py-4 text-left font-bold text-slate-500">Officer</th>
                      <th className="px-5 py-4 text-left font-bold text-slate-500">Email</th>
                      <th className="px-5 py-4 text-left font-bold text-slate-500">Phone</th>
                      <th className="px-5 py-4 text-left font-bold text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {officers.map((officer) => {
                      const member = members.find(m => m.id === Number(officer.memberId))
                      return (
                        <tr key={officer.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-bold text-slate-700">{officer.position}</td>
                          <td className="px-5 py-4 font-black text-slate-800">{getMemberName(member)}</td>
                          <td className="px-5 py-4 font-medium text-slate-600">{member?.email || '—'}</td>
                          <td className="px-5 py-4 font-medium text-slate-600">{member?.contactNumber || '—'}</td>
                          <td className="px-5 py-4 font-medium text-slate-600">{officer.status}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {preparedReport.id === 'excuses' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</p>
                    <p className="mt-1 text-2xl font-black text-slate-800">{currentExcuses.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Approved</p>
                    <p className="mt-1 text-2xl font-black text-green-600">{currentExcuses.filter((e) => e.status === 'Approved').length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pending</p>
                    <p className="mt-1 text-2xl font-black text-yellow-600">{pendingExcuses.length}</p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                  <table className="w-full text-[13px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Member</th>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Date</th>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Reason</th>
                        <th className="px-5 py-4 text-left font-bold text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentExcuses.map((excuse) => (
                        <tr key={excuse.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-black text-slate-800">{excuse.memberName}</td>
                          <td className="px-5 py-4 font-medium text-slate-600">{formatDateShort(excuse.date)}</td>
                          <td className="px-5 py-4 font-medium text-slate-600 max-w-xs truncate">{excuse.reason}</td>
                          <td className="px-5 py-4 font-bold text-slate-700">{excuse.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { CheckCircle2, FileText, Loader2 } from 'lucide-react'
import { useSemesters } from '../hooks/useSemesters'
import { useMembers } from '../hooks/useMembers'
import { useSessions } from '../hooks/useSessions'
import { useAuditions } from '../hooks/useAuditions'
import { useOfficers } from '../hooks/useOfficers'
import { useExcuses } from '../hooks/useExcuses'
import { formatDateShort } from '../lib/utils'
import Modal from '../components/common/Modal'

export default function Reports() {
  const { activeSemester: currentSemester, loading: sLoading } = useSemesters()
  const { members, loading: mLoading } = useMembers()
  const { sessions, loading: sessLoading } = useSessions()
  const { auditionees, loading: aLoading } = useAuditions()
  const { officers, loading: oLoading } = useOfficers()
  const { excuses, loading: eLoading } = useExcuses()

  const [preparedReport, setPreparedReport] = useState(null)

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
      <div className="card p-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Printable summaries</p>
        <h2 className="mt-1 text-2xl font-black text-slate-800 tracking-tight">Reports</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">Semester-end summaries for attendance, auditions, members, officers, and absences.</p>
      </div>

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

import { useState, useMemo } from 'react'
import { CheckCircle2, Clock, XCircle, FileText, Save, Filter } from 'lucide-react'
import { members, attendanceSessions, semesters, activeSemester } from '../data/mockData'
import { getVoicePartColor, getAttendanceColor, formatDateShort, cn } from '../lib/utils'
import SearchBar from '../components/common/SearchBar'
import Badge from '../components/common/Badge'
import Avatar from '../components/common/Avatar'
import Modal from '../components/common/Modal'
import StatCard from '../components/common/StatCard'

const STATUS_OPTIONS = ['Present', 'Late', 'Absent', 'Excused']

const statusVariant = { Present: 'success', Late: 'warning', Absent: 'danger', Excused: 'primary' }
const statusIcon = { Present: CheckCircle2, Late: Clock, Absent: XCircle, Excused: FileText }

function buildInitialAttendance(memberList) {
  return Object.fromEntries(memberList.map((m) => [m.id, 'Present']))
}

export default function Attendance() {
  const [selectedSemId, setSelectedSemId] = useState(activeSemester?.id ?? semesters[semesters.length - 1].id)
  const [selectedSessionId, setSelectedSessionId] = useState(attendanceSessions[attendanceSessions.length - 1].id)
  const [attendance, setAttendance] = useState(() => buildInitialAttendance(members))
  const [search, setSearch] = useState('')
  const [voiceFilter, setVoiceFilter] = useState('All')
  const [notesModal, setNotesModal] = useState(null) // { memberId, name }
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes] = useState({})
  const [saved, setSaved] = useState(false)

  const sessions = attendanceSessions.filter((s) => s.semesterId === selectedSemId)
  const currentSession = sessions.find((s) => s.id === selectedSessionId) ?? sessions[0]

  const filtered = useMemo(() =>
    members.filter((m) => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
      const matchVoice  = voiceFilter === 'All' || m.voicePart === voiceFilter
      return matchSearch && matchVoice
    }),
    [search, voiceFilter]
  )

  const counts = useMemo(() => {
    const all = Object.values(attendance)
    return {
      Present: all.filter(s => s === 'Present').length,
      Late:    all.filter(s => s === 'Late').length,
      Absent:  all.filter(s => s === 'Absent').length,
      Excused: all.filter(s => s === 'Excused').length,
    }
  }, [attendance])

  function setStatus(memberId, status) {
    setAttendance((prev) => ({ ...prev, [memberId]: status }))
    setSaved(false)
  }

  function markAll(status) {
    const updated = {}
    filtered.forEach((m) => { updated[m.id] = status })
    setAttendance((prev) => ({ ...prev, ...updated }))
    setSaved(false)
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function openNotes(member) {
    setNoteText(notes[member.id] ?? '')
    setNotesModal(member)
  }

  function saveNote() {
    setNotes((prev) => ({ ...prev, [notesModal.id]: noteText }))
    setNotesModal(null)
  }

  return (
    <div className="space-y-6">
      {/* Filters row */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Semester:</label>
          <select
            value={selectedSemId}
            onChange={(e) => setSelectedSemId(Number(e.target.value))}
            className="input py-1.5 w-auto text-xs"
          >
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Session:</label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(Number(e.target.value))}
            className="input py-1.5 w-auto text-xs"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{formatDateShort(s.date)} — {s.type}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={handleSave} className="btn-primary text-xs py-1.5">
            <Save size={13} /> {saved ? 'Saved!' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Present"  value={counts.Present} icon={CheckCircle2} color="green" />
        <StatCard label="Late"     value={counts.Late}    icon={Clock}         color="yellow" />
        <StatCard label="Absent"   value={counts.Absent}  icon={XCircle}       color="red" />
        <StatCard label="Excused"  value={counts.Excused} icon={FileText}      color="blue" />
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-50">
          <SearchBar value={search} onChange={setSearch} placeholder="Search member..." className="w-60" />
          <div className="flex gap-1">
            {['All','Soprano','Alto','Tenor','Bass'].map((v) => (
              <button
                key={v}
                onClick={() => setVoiceFilter(v)}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                  voiceFilter === v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <span className="text-xs text-gray-500">Bulk mark:</span>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => markAll(s)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                All {s}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.map((member) => {
            const status = attendance[member.id]
            const StatusIcon = statusIcon[status]
            const hasNote = !!notes[member.id]
            return (
              <div key={member.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                {/* Avatar */}
                <Avatar name={member.name} voicePart={member.voicePart} size="md" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    {member.status === 'inactive' && (
                      <Badge variant="default">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getVoicePartColor(member.voicePart)}`}>
                      {member.voicePart}
                    </span>
                    {hasNote && (
                      <span className="text-[10px] text-blue-500">📝 Note added</span>
                    )}
                  </div>
                </div>

                {/* Status buttons */}
                <div className="flex items-center gap-1">
                  {STATUS_OPTIONS.map((s) => {
                    const Icon = statusIcon[s]
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(member.id, s)}
                        title={s}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          status === s
                            ? s === 'Present' ? 'bg-green-100 text-green-700 border-green-300'
                            : s === 'Late'    ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                            : s === 'Absent'  ? 'bg-red-100 text-red-700 border-red-300'
                            : 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                        )}
                      >
                        <Icon size={12} />
                        <span className="hidden sm:inline">{s}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Notes */}
                <button
                  onClick={() => openNotes(member)}
                  className={cn(
                    'p-2 rounded-lg border text-xs transition-colors',
                    hasNote
                      ? 'border-blue-200 text-blue-500 bg-blue-50'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  )}
                  title="Add note"
                >
                  <FileText size={13} />
                </button>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">No members found.</div>
        )}
      </div>

      {/* Notes Modal */}
      <Modal
        open={!!notesModal}
        onClose={() => setNotesModal(null)}
        title={`Attendance Note — ${notesModal?.name}`}
        size="sm"
        footer={
          <>
            <button onClick={() => setNotesModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={saveNote} className="btn-primary">Save Note</button>
          </>
        }
      >
        <label className="label">Note / Reason</label>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={4}
          placeholder="Enter attendance note or absence reason..."
          className="input resize-none"
        />
      </Modal>
    </div>
  )
}

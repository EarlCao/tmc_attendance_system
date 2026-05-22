import { useState, useMemo } from 'react'
import { CheckCircle2, XCircle, Clock, Eye, Filter } from 'lucide-react'
import { excuses as initialExcuses } from '../data/mockData'
import { getStatusColor, formatDateShort, cn } from '../lib/utils'
import Avatar from '../components/common/Avatar'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import SearchBar from '../components/common/SearchBar'
import EmptyState from '../components/common/EmptyState'
import StatCard from '../components/common/StatCard'

const VOICE_PARTS = ['All', 'Soprano', 'Alto', 'Tenor', 'Bass']

export default function Absences() {
  const [excuses, setExcuses] = useState(initialExcuses)
  const [tab, setTab]         = useState('Pending') // Pending | Approved | Rejected
  const [search, setSearch]   = useState('')
  const [voiceFilter, setVoiceFilter] = useState('All')
  const [detailModal, setDetailModal] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')

  const filtered = useMemo(() =>
    excuses.filter((e) => {
      const matchTab    = e.status === tab
      const matchSearch = e.memberName.toLowerCase().includes(search.toLowerCase())
      const matchVoice  = voiceFilter === 'All' || e.voicePart === voiceFilter
      return matchTab && matchSearch && matchVoice
    }),
    [excuses, tab, search, voiceFilter]
  )

  const counts = {
    Pending:  excuses.filter(e => e.status === 'Pending').length,
    Approved: excuses.filter(e => e.status === 'Approved').length,
    Rejected: excuses.filter(e => e.status === 'Rejected').length,
  }

  function handleApprove(id) {
    setExcuses(prev => prev.map(e => e.id === id
      ? { ...e, status: 'Approved', reviewedAt: new Date().toISOString().slice(0,10), notes: reviewNotes }
      : e
    ))
    setDetailModal(null)
  }

  function handleReject(id) {
    setExcuses(prev => prev.map(e => e.id === id
      ? { ...e, status: 'Rejected', reviewedAt: new Date().toISOString().slice(0,10), notes: reviewNotes }
      : e
    ))
    setDetailModal(null)
  }

  return (
    <div className="page-shell">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pending Review" value={counts.Pending}  icon={Clock}        color="yellow" />
        <StatCard label="Approved"       value={counts.Approved} icon={CheckCircle2} color="green" />
        <StatCard label="Rejected"       value={counts.Rejected} icon={XCircle}      color="red" />
      </div>

      {/* Tabs + Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {['Pending','Approved','Rejected'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-4 py-1.5 text-xs font-medium rounded-md transition-all',
                  tab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {t} <span className="ml-1 text-[10px] font-bold text-gray-400">({counts[t]})</span>
              </button>
            ))}
          </div>

          <SearchBar value={search} onChange={setSearch} placeholder="Search member..." className="w-full sm:w-52" />

          <select
            value={voiceFilter}
            onChange={e => setVoiceFilter(e.target.value)}
            className="input py-1.5 w-auto text-xs"
          >
            {VOICE_PARTS.map(v => <option key={v} value={v}>{v === 'All' ? 'All Voice Parts' : v}</option>)}
          </select>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-50">
          {filtered.map((excuse) => (
            <div key={excuse.id} className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-gray-50/50 sm:flex-row sm:items-start">
              <Avatar name={excuse.memberName} voicePart={excuse.voicePart} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">{excuse.memberName}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-opacity-80 ${getStatusColor(excuse.voicePart === 'Soprano' ? 'pink' : excuse.voicePart)}`}>
                    {excuse.voicePart}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{excuse.reason}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Absence: {formatDateShort(excuse.date)} · Submitted: {formatDateShort(excuse.submittedAt)}
                  {excuse.reviewedAt && ` · Reviewed: ${formatDateShort(excuse.reviewedAt)}`}
                </p>
                {excuse.notes && (
                  <p className="text-[10px] text-orange-500 mt-1 italic">Note: {excuse.notes}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(excuse.status)}`}>
                  {excuse.status}
                </span>
                <button
                  onClick={() => { setReviewNotes(''); setDetailModal(excuse) }}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                  title="View details"
                >
                  <Eye size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <EmptyState
            title={`No ${tab.toLowerCase()} excuses`}
            description={`There are no ${tab.toLowerCase()} excuse requests at this time.`}
          />
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Excuse Request Details"
        size="md"
        footer={
          detailModal?.status === 'Pending' ? (
            <>
              <button onClick={() => setDetailModal(null)} className="btn-secondary">Close</button>
              <button onClick={() => handleReject(detailModal.id)} className="btn-danger">Reject</button>
              <button onClick={() => handleApprove(detailModal.id)} className="btn-primary">Approve</button>
            </>
          ) : (
            <button onClick={() => setDetailModal(null)} className="btn-secondary">Close</button>
          )
        }
      >
        {detailModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Avatar name={detailModal.memberName} voicePart={detailModal.voicePart} size="lg" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{detailModal.memberName}</p>
                <p className="text-xs text-gray-500">{detailModal.voicePart}</p>
              </div>
              <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(detailModal.status)}`}>
                {detailModal.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Absence Date</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{formatDateShort(detailModal.date)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Submitted</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{formatDateShort(detailModal.submittedAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Excuse Reason</p>
              <p className="text-sm text-gray-700 p-3 bg-blue-50 rounded-lg border border-blue-100">{detailModal.reason}</p>
            </div>

            {detailModal.status === 'Pending' && (
              <div>
                <label className="label">Review Notes (optional)</label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  className="input resize-none"
                  rows={3}
                  placeholder="Add a note for your decision..."
                />
              </div>
            )}

            {detailModal.notes && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Admin Notes</p>
                <p className="text-sm text-gray-600 italic">{detailModal.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { CheckCircle2, XCircle, Clock, Eye, Loader2 } from 'lucide-react'
import { useExcuses } from '../hooks/useExcuses'
import { useDebounce } from '../hooks/useDebounce'
import { getStatusColor, getVoicePartColor, formatDateShort, cn } from '../lib/utils'
import Avatar from '../components/common/Avatar'
import Modal from '../components/common/Modal'
import SearchBar from '../components/common/SearchBar'
import EmptyState from '../components/common/EmptyState'
import StatCard from '../components/common/StatCard'

const VOICE_PARTS = ['All', 'Soprano', 'Alto', 'Tenor', 'Bass']

export default function Absences() {
  const { excuses, loading, updateExcuseStatus } = useExcuses()
  const [tab, setTab]         = useState('Pending')
  const [searchInput, setSearch]   = useState('')
  const search = useDebounce(searchInput, 300)
  const [voiceFilter, setVoiceFilter] = useState('All')
  const [detailModal, setDetailModal] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const filtered = useMemo(() =>
    excuses.filter((e) => {
      const matchTab    = e.status === tab
      const matchSearch = (e.memberName || '').toLowerCase().includes(search.toLowerCase())
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

  async function handleApprove(id) {
    setIsSaving(true)
    try {
      await updateExcuseStatus(id, 'Approved', reviewNotes)
      setDetailModal(null)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleReject(id) {
    setIsSaving(true)
    try {
      await updateExcuseStatus(id, 'Rejected', reviewNotes)
      setDetailModal(null)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="page-shell">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="Pending Review" value={counts.Pending}  icon={Clock}        color="yellow" />
        <StatCard label="Approved"       value={counts.Approved} icon={CheckCircle2} color="green" />
        <StatCard label="Rejected"       value={counts.Rejected} icon={XCircle}      color="red" />
      </div>

      {/* Tabs + Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-100/50 px-6 py-5 bg-gradient-to-r from-white to-slate-50/50">
          <div className="flex gap-1 rounded-xl bg-slate-100/50 p-1.5 shadow-inner">
            {['Pending', 'Approved', 'Rejected'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-5 py-2 text-[13px] font-bold rounded-lg transition-all duration-200',
                  tab === t
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                {t} <span className="ml-1.5 text-[11px] font-black text-slate-400">({counts[t]})</span>
              </button>
            ))}
          </div>

          <SearchBar value={searchInput} onChange={setSearch} placeholder="Search member..." className="w-full sm:w-64" />

          <select
            value={voiceFilter}
            onChange={e => setVoiceFilter(e.target.value)}
            className="input py-2.5 w-auto text-[13px] font-medium bg-white shadow-sm"
          >
            {VOICE_PARTS.map(v => (
              <option key={v} value={v}>{v === 'All' ? 'All Voice Parts' : v}</option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-50">
          {filtered.map((excuse) => (
            <div key={excuse.id} className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-blue-50/30 sm:flex-row sm:items-start group">
              <Avatar name={excuse.memberName || '?'} voicePart={excuse.voicePart} size="md" />
              <div className="flex-1 min-w-0 mt-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-[14px] font-bold text-slate-800 tracking-tight">{excuse.memberName}</p>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ring-1 ${getVoicePartColor(excuse.voicePart)}`}>
                    {excuse.voicePart}
                  </span>
                </div>
                <p className="text-[13px] font-medium text-slate-600 mt-2 line-clamp-2">{excuse.reason}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">Absence: {formatDateShort(excuse.date)}</span>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">Submitted: {formatDateShort(excuse.submittedAt)}</span>
                  {excuse.reviewedAt && (
                    <span className="text-[11px] font-bold text-blue-400 bg-blue-50 px-2.5 py-1 rounded-md">Reviewed: {formatDateShort(excuse.reviewedAt)}</span>
                  )}
                </div>
                {excuse.notes && (
                  <div className="mt-3 text-[12px] font-medium text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50 italic">
                    <span className="font-bold text-amber-600 not-italic mr-1">Admin Note:</span>
                    {excuse.notes}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3 mt-1">
                <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full ring-1 ${getStatusColor(excuse.status)} shadow-sm`}>
                  {excuse.status}
                </span>
                <button
                  onClick={() => { setReviewNotes(''); setDetailModal(excuse) }}
                  className="p-2 rounded-xl border border-slate-200/60 bg-white text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm hover:shadow-md opacity-0 group-hover:opacity-100"
                  title="View details"
                >
                  <Eye size={16} />
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
              <button onClick={() => setDetailModal(null)} disabled={isSaving} className="btn-secondary">Close</button>
              <button onClick={() => handleReject(detailModal.id)} disabled={isSaving} className="btn-danger shadow-red-500/30">Reject</button>
              <button onClick={() => handleApprove(detailModal.id)} disabled={isSaving} className="btn-primary shadow-blue-500/40">
                {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Approve'}
              </button>
            </>
          ) : (
            <button onClick={() => setDetailModal(null)} className="btn-secondary">Close</button>
          )
        }
      >
        {detailModal && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-slate-50 to-white border border-slate-100/80 rounded-2xl shadow-sm">
              <Avatar name={detailModal.memberName || '?'} voicePart={detailModal.voicePart} size="lg" />
              <div>
                <p className="text-[15px] font-black text-slate-800">{detailModal.memberName}</p>
                <p className="text-[12px] font-bold text-slate-500 mt-0.5">{detailModal.voicePart}</p>
              </div>
              <span className={`ml-auto text-[11px] font-bold px-3 py-1 rounded-full ring-1 ${getStatusColor(detailModal.status)} shadow-sm`}>
                {detailModal.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Absence Date</p>
                <p className="text-[14px] font-black text-slate-700 mt-1">{formatDateShort(detailModal.date)}</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted</p>
                <p className="text-[14px] font-black text-slate-700 mt-1">{formatDateShort(detailModal.submittedAt)}</p>
              </div>
            </div>

            <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100/50">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Excuse Reason</p>
              <p className="text-[14px] font-medium text-slate-700 leading-relaxed">{detailModal.reason}</p>
            </div>

            {detailModal.status === 'Pending' && (
              <div className="pt-2">
                <label className="label">Review Notes (optional)</label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  className="input resize-none bg-white"
                  rows={3}
                  placeholder="Add a note for your decision..."
                />
              </div>
            )}

            {detailModal.notes && (
              <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100/50">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">Admin Notes</p>
                <p className="text-[13px] font-medium text-slate-600 italic leading-relaxed">{detailModal.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

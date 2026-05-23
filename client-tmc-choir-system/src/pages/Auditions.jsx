import { useState, useMemo } from 'react'
import { UserPlus, Star, Eye, CheckCircle2, XCircle, Clock, Mic2, Pencil } from 'lucide-react'
import { auditionees as initialAuditionees, judges } from '../data/mockData'
import { getStatusColor, getVoicePartColor, formatDateShort, cn } from '../lib/utils'
import Avatar from '../components/common/Avatar'
import Modal from '../components/common/Modal'
import SearchBar from '../components/common/SearchBar'
import EmptyState from '../components/common/EmptyState'
import StatCard from '../components/common/StatCard'

const CATEGORIES = ['vocalQuality','pitchAccuracy','tone','rhythm','confidence','stagePresence']
const CATEGORY_LABELS = { vocalQuality: 'Vocal Quality', pitchAccuracy: 'Pitch Accuracy', tone: 'Tone', rhythm: 'Rhythm', confidence: 'Confidence', stagePresence: 'Stage Presence' }
const VOICE_PARTS = ['Soprano','Alto','Tenor','Bass']
const COURSE_OPTIONS = ['BSIT', 'BSOA', 'BSCRIM', 'BSPOL', 'BSCOM', 'BEED', 'BSED']

function avgRating(ratings) {
  if (!ratings.length) return null
  const total = ratings.reduce((s, r) => s + CATEGORIES.reduce((cs, c) => cs + r[c], 0) / CATEGORIES.length, 0)
  return (total / ratings.length).toFixed(1)
}

function RatingStars({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(10)].map((_, i) => (
        <div key={i} className={cn('w-2 h-2 rounded-sm', i < Math.round(value) ? 'bg-yellow-400' : 'bg-gray-200')} />
      ))}
      <span className="ml-1.5 text-xs font-semibold text-gray-700">{value}/10</span>
    </div>
  )
}

const emptyForm = {
  name: '',
  targetPart: 'Soprano',
  age: '',
  course: '',
  yearLevel: '',
  religionDenomination: '',
  contact: '',
  email: '',
  address: '',
  notes: '',
  auditionDate: '',
}

const emptyRatingForm = {
  judgeId: '',
  vocalQuality: 8,
  pitchAccuracy: 8,
  tone: 8,
  rhythm: 8,
  confidence: 8,
  stagePresence: 8,
  comments: '',
}

export default function Auditions() {
  const [auditionees, setAuditionees] = useState(initialAuditionees)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [partFilter, setPartFilter]   = useState('All')
  const [evalModal, setEvalModal]     = useState(null)
  const [addModal, setAddModal]       = useState(false)
  const [form, setForm]               = useState(emptyForm)
  const [ratingForm, setRatingForm]   = useState(emptyRatingForm)
  const [editingRatingId, setEditingRatingId] = useState(null)

  const filtered = useMemo(() =>
    auditionees.filter((a) => {
      const normalizedSearch = search.toLowerCase()
      const matchSearch = a.name.toLowerCase().includes(normalizedSearch) ||
        (a.email ?? '').toLowerCase().includes(normalizedSearch) ||
        (a.course ?? '').toLowerCase().includes(normalizedSearch) ||
        (a.yearLevel ?? '').toLowerCase().includes(normalizedSearch) ||
        (a.religionDenomination ?? '').toLowerCase().includes(normalizedSearch) ||
        (a.address ?? '').toLowerCase().includes(normalizedSearch) ||
        (a.notes ?? '').toLowerCase().includes(normalizedSearch)
      const matchStatus = statusFilter === 'All' || a.status === statusFilter
      const matchPart   = partFilter === 'All' || a.targetPart === partFilter
      return matchSearch && matchStatus && matchPart
    }),
    [auditionees, search, statusFilter, partFilter]
  )

  const stats = {
    total:   auditionees.length,
    passed:  auditionees.filter(a => a.status === 'Passed').length,
    failed:  auditionees.filter(a => a.status === 'Failed').length,
    pending: auditionees.filter(a => a.status === 'Pending').length,
  }

  function handleAdd() {
    const newEntry = { ...form, id: Date.now(), age: Number(form.age), status: 'Pending', ratings: [] }
    setAuditionees(prev => [...prev, newEntry])
    setAddModal(false)
    setForm(emptyForm)
  }

  function handleUpdateStatus(id, status) {
    setAuditionees(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    setEvalModal(prev => prev ? { ...prev, status } : null)
  }

  function openRatingForm(rating) {
    if (rating) {
      setEditingRatingId(rating.judgeId)
      setRatingForm({
        judgeId: String(rating.judgeId),
        vocalQuality: rating.vocalQuality,
        pitchAccuracy: rating.pitchAccuracy,
        tone: rating.tone,
        rhythm: rating.rhythm,
        confidence: rating.confidence,
        stagePresence: rating.stagePresence,
        comments: rating.comments ?? '',
      })
      return
    }

    const ratedJudgeIds = new Set(evalModal?.ratings.map((rating) => rating.judgeId))
    const nextJudge = judges.find((judge) => !ratedJudgeIds.has(judge.id)) ?? judges[0]
    setEditingRatingId(null)
    setRatingForm({ ...emptyRatingForm, judgeId: nextJudge ? String(nextJudge.id) : '' })
  }

  function resetRatingForm() {
    setEditingRatingId(null)
    setRatingForm(emptyRatingForm)
  }

  function handleSaveRating() {
    const judge = judges.find((j) => j.id === Number(ratingForm.judgeId))
    if (!evalModal || !judge) return

    const nextRating = {
      judgeId: judge.id,
      judgeName: judge.name,
      ...Object.fromEntries(CATEGORIES.map((cat) => [cat, Number(ratingForm[cat]) || 0])),
      comments: ratingForm.comments,
    }

    const nextAuditionee = {
      ...evalModal,
      ratings: editingRatingId
        ? evalModal.ratings.map((rating) => rating.judgeId === editingRatingId ? nextRating : rating)
        : [...evalModal.ratings.filter((rating) => rating.judgeId !== judge.id), nextRating],
    }

    setAuditionees((prev) => prev.map((auditionee) => auditionee.id === nextAuditionee.id ? nextAuditionee : auditionee))
    setEvalModal(nextAuditionee)
    resetRatingForm()
  }

  return (
    <div className="page-shell">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Auditionees" value={stats.total}   icon={Mic2}         color="purple" />
        <StatCard label="Passed"            value={stats.passed}  icon={CheckCircle2} color="green" />
        <StatCard label="Failed"            value={stats.failed}  icon={XCircle}      color="red" />
        <StatCard label="Pending"           value={stats.pending} icon={Clock}        color="yellow" />
      </div>

      {/* Toolbar */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search auditionees..." className="w-full sm:w-60" />
        <div className="flex gap-1">
          {['All','Passed','Failed','Pending'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                statusFilter === s ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              )}>{s}</button>
          ))}
        </div>
        <select value={partFilter} onChange={e => setPartFilter(e.target.value)} className="input py-1.5 w-auto text-xs">
          <option value="All">All Parts</option>
          {VOICE_PARTS.map(v => <option key={v}>{v}</option>)}
        </select>
        <button onClick={() => setAddModal(true)} className="btn-primary ml-auto">
          <UserPlus size={14}/> Register Auditionee
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Auditionee</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Target Part</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Avg Rating</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Judges</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((a) => {
              const avg = avgRating(a.ratings)
              return (
                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={a.name} voicePart={a.targetPart} size="md" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.name}</p>
                        <p className="text-xs text-gray-400">{a.email}</p>
                        <p className="text-xs text-gray-400">{a.course}{a.yearLevel ? ` · ${a.yearLevel}` : ''}</p>
                        {a.religionDenomination && <p className="text-xs text-gray-400">{a.religionDenomination}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getVoicePartColor(a.targetPart)}`}>{a.targetPart}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{formatDateShort(a.auditionDate)}</td>
                  <td className="px-4 py-3">
                    {avg
                      ? <span className="flex items-center gap-1 text-sm font-semibold text-yellow-600"><Star size={13} fill="currentColor"/>{avg}</span>
                      : <span className="text-xs text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{a.ratings.length} / {judges.length}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(a.status)}`}>{a.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setEvalModal(a)} className="btn-secondary text-xs py-1.5">
                      <Eye size={12}/> Evaluation
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={Mic2} title="No auditionees found" description="Register auditionees or adjust your filters." />}
      </div>

      {/* Evaluation Modal */}
      <Modal
        open={!!evalModal}
        onClose={() => setEvalModal(null)}
        title={`Evaluation — ${evalModal?.name}`}
        size="xl"
        footer={
          evalModal?.status === 'Pending' ? (
            <>
              <button onClick={() => setEvalModal(null)} className="btn-secondary">Close</button>
              <button onClick={() => handleUpdateStatus(evalModal.id, 'Failed')} className="btn-danger">Mark Failed</button>
              <button onClick={() => handleUpdateStatus(evalModal.id, 'Passed')} className="btn-primary">Mark Passed</button>
            </>
          ) : <button onClick={() => setEvalModal(null)} className="btn-secondary">Close</button>
        }
      >
        {evalModal && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <Avatar name={evalModal.name} voicePart={evalModal.targetPart} size="xl" />
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900">{evalModal.name}</p>
                <p className="text-xs text-gray-500">{evalModal.contact} · {evalModal.email}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {evalModal.course}{evalModal.yearLevel ? ` · ${evalModal.yearLevel}` : ''}{evalModal.religionDenomination ? ` · ${evalModal.religionDenomination}` : ''}
                </p>
                {evalModal.address && <p className="mt-0.5 text-xs text-gray-400">{evalModal.address}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getVoicePartColor(evalModal.targetPart)}`}>{evalModal.targetPart}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(evalModal.status)}`}>{evalModal.status}</span>
                </div>
              </div>
              {evalModal.ratings.length > 0 && (
                <div className="text-right">
                  <p className="text-3xl font-black text-yellow-500">{avgRating(evalModal.ratings)}</p>
                  <p className="text-xs text-gray-400">Average / 10</p>
                </div>
              )}
            </div>

            {evalModal.notes && (
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</p>
                <p className="text-sm text-gray-600">{evalModal.notes}</p>
              </div>
            )}

            {/* Category summary if rated */}
            {evalModal.ratings.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category Averages</p>
                <div className="grid grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => {
                    const avg = (evalModal.ratings.reduce((s, r) => s + r[cat], 0) / evalModal.ratings.length).toFixed(1)
                    return (
                      <div key={cat} className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-[11px] text-gray-500 mb-1">{CATEGORY_LABELS[cat]}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-yellow-400" style={{ width: `${(avg / 10) * 100}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-700">{avg}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Per-judge ratings */}
            {evalModal.ratings.length > 0 ? (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Judge Evaluations</p>
                  <button onClick={() => openRatingForm()} className="btn-secondary text-xs py-1.5">
                    <UserPlus size={12} /> Add Evaluation
                  </button>
                </div>
                <div className="space-y-4">
                  {evalModal.ratings.map((r, i) => (
                    <div key={i} className="p-4 border border-gray-100 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-900">{r.judgeName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-yellow-500 flex items-center gap-1">
                            <Star size={13} fill="currentColor"/>
                            {(CATEGORIES.reduce((s, c) => s + r[c], 0) / CATEGORIES.length).toFixed(1)}
                          </span>
                          <button onClick={() => openRatingForm(r)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
                            <Pencil size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {CATEGORIES.map((cat) => (
                          <div key={cat} className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500">{CATEGORY_LABELS[cat]}</span>
                            <span className="font-semibold text-gray-800">{r[cat]}/10</span>
                          </div>
                        ))}
                      </div>
                      {r.comments && (
                        <p className="text-xs text-gray-600 italic border-t border-gray-50 pt-2">"{r.comments}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Mic2 size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No evaluations submitted yet.</p>
                <button onClick={() => openRatingForm()} className="btn-primary mt-4 text-xs">
                  <UserPlus size={12} /> Add Judge Evaluation
                </button>
              </div>
            )}

            {ratingForm.judgeId && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">{editingRatingId ? 'Edit evaluation' : 'Manual judge evaluation'}</p>
                  <button onClick={resetRatingForm} className="text-xs font-medium text-gray-500 hover:text-gray-800">Cancel</button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="label">Judge</label>
                    <select
                      className="input"
                      value={ratingForm.judgeId}
                      disabled={!!editingRatingId}
                      onChange={e => setRatingForm(p => ({ ...p, judgeId: e.target.value }))}
                    >
                      {judges.map((judge) => (
                        <option key={judge.id} value={judge.id}>{judge.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {CATEGORIES.map((cat) => (
                      <div key={cat}>
                        <label className="label">{CATEGORY_LABELS[cat]}</label>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          max="10"
                          value={ratingForm[cat]}
                          onChange={e => setRatingForm(p => ({ ...p, [cat]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="label">Notes / Comments / Evaluation</label>
                    <textarea
                      className="input min-h-24 resize-y"
                      value={ratingForm.comments}
                      onChange={e => setRatingForm(p => ({ ...p, comments: e.target.value }))}
                      placeholder="Type the judge's comments or evaluation notes"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleSaveRating} className="btn-primary text-xs">Save Evaluation</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Register New Auditionee" size="md"
        footer={<><button onClick={() => setAddModal(false)} className="btn-secondary">Cancel</button><button onClick={handleAdd} className="btn-primary">Register</button></>}>
        <div className="space-y-3">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Target Voice Part</label>
              <select className="input" value={form.targetPart} onChange={e => setForm(p => ({...p, targetPart: e.target.value}))}>
                {VOICE_PARTS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Age</label>
              <input className="input" type="number" value={form.age} onChange={e => setForm(p => ({...p, age: e.target.value}))} placeholder="Age" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Course</label>
              <select className="input" value={form.course} onChange={e => setForm(p => ({...p, course: e.target.value}))}>
                <option value="">Select course</option>
                {COURSE_OPTIONS.map((course) => <option key={course} value={course}>{course}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year Level</label>
              <select className="input" value={form.yearLevel} onChange={e => setForm(p => ({...p, yearLevel: e.target.value}))}>
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Religion / Denomination</label>
            <input className="input" value={form.religionDenomination} onChange={e => setForm(p => ({...p, religionDenomination: e.target.value}))} placeholder="e.g. Roman Catholic" />
          </div>
          <div>
            <label className="label">Contact Number</label>
            <input className="input" value={form.contact} onChange={e => setForm(p => ({...p, contact: e.target.value}))} placeholder="09XXXXXXXXX" />
          </div>
          <div>
            <label className="label">Email/FB Acct</label>
            <input className="input" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="email or Facebook account" />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} placeholder="City, Province" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input min-h-24 resize-y" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Audition notes, availability, or reminders" />
          </div>
          <div>
            <label className="label">Audition Date</label>
            <input className="input" type="date" value={form.auditionDate} onChange={e => setForm(p => ({...p, auditionDate: e.target.value}))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { UserPlus, Star, Eye, CheckCircle2, XCircle, Clock, Mic2, Pencil, Loader2 } from 'lucide-react'
import { useAuditions } from '../hooks/useAuditions'
import { useJudges } from '../hooks/useJudges'
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
  if (!ratings || !ratings.length) return null
  const total = ratings.reduce((s, r) => s + CATEGORIES.reduce((cs, c) => cs + Number(r[c] || 0), 0) / CATEGORIES.length, 0)
  return (total / ratings.length).toFixed(1)
}

function RatingStars({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(10)].map((_, i) => (
        <div key={i} className={cn('w-2 h-2 rounded-sm', i < Math.round(value) ? 'bg-yellow-400' : 'bg-gray-200')} />
      ))}
      <span className="ml-1.5 text-[11px] font-bold text-gray-700">{value}/10</span>
    </div>
  )
}

const emptyForm = {
  firstName: '',
  lastName: '',
  targetPart: 'Soprano',
  age: '',
  course: '',
  yearLevel: '',
  religion: '',
  contactNumber: '',
  email: '',
  address: '',
  notes: '',
  auditionDate: new Date().toISOString().slice(0, 10),
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

const emptyEvaluationForm = {
  auditioneeId: '',
  ...emptyRatingForm,
}

export default function Auditions() {
  const { auditionees, loading: auditionsLoading, createAuditionee, updateAuditionee, updateStatus, saveEvaluation } = useAuditions()
  const { judges, loading: judgesLoading } = useJudges()
  
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [partFilter, setPartFilter]   = useState('All')
  const [evalModal, setEvalModal]     = useState(null)
  const [addModal, setAddModal]       = useState(false)
  const [editModal, setEditModal]     = useState(null)
  const [form, setForm]               = useState(emptyForm)
  const [ratingForm, setRatingForm]   = useState(emptyRatingForm)
  const [editingRatingId, setEditingRatingId] = useState(null)
  const [evaluationModal, setEvaluationModal] = useState(false)
  const [evaluationForm, setEvaluationForm] = useState(emptyEvaluationForm)
  const [isSaving, setIsSaving] = useState(false)

  const filtered = useMemo(() =>
    auditionees.filter((a) => {
      const normalizedSearch = search.toLowerCase()
      const matchSearch = (a.firstName + ' ' + a.lastName).toLowerCase().includes(normalizedSearch) ||
        (a.email ?? '').toLowerCase().includes(normalizedSearch) ||
        (a.course ?? '').toLowerCase().includes(normalizedSearch)
      const matchStatus = statusFilter === 'All' || a.status === statusFilter
      const matchPart   = partFilter === 'All' || a.voicePart === partFilter
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

  async function handleAdd() {
    setIsSaving(true)
    try {
      const payload = { ...form, age: Number(form.age) || null }
      await createAuditionee(payload)
      setAddModal(false)
      setForm(emptyForm)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  function openEditAuditionee(auditionee) {
    setEditModal(auditionee)
    setForm({
      ...emptyForm,
      ...auditionee,
      targetPart: auditionee.voicePart || 'Soprano',
      age: String(auditionee.age ?? '')
    })
  }

  async function handleEditAuditionee() {
    if (!editModal) return
    setIsSaving(true)
    try {
      const payload = { ...form, age: Number(form.age) || null }
      await updateAuditionee(editModal.id, payload)
      setEditModal(null)
      setForm(emptyForm)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdateStatus(id, status) {
    setIsSaving(true)
    try {
      await updateStatus(id, { status })
      setEvalModal(prev => prev ? { ...prev, status } : null)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
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

    const ratedJudgeIds = new Set(evalModal?.evaluations?.map((rating) => rating.judgeId) || [])
    const nextJudge = judges.find((judge) => !ratedJudgeIds.has(judge.id)) ?? judges[0]
    setEditingRatingId(null)
    setRatingForm({ ...emptyRatingForm, judgeId: nextJudge ? String(nextJudge.id) : '' })
  }

  function resetRatingForm() {
    setEditingRatingId(null)
    setRatingForm(emptyRatingForm)
  }

  async function handleSaveRating() {
    const judge = judges.find((j) => String(j.id) === String(ratingForm.judgeId))
    if (!evalModal || !judge) return
    setIsSaving(true)
    try {
      const payload = {
        auditioneeId: evalModal.id,
        judgeId: judge.id,
        ...Object.fromEntries(CATEGORIES.map((cat) => [cat, Number(ratingForm[cat]) || 0])),
        comments: ratingForm.comments,
      }
      
      await saveEvaluation(payload)
      // Optimistic update of local evalModal is tricky if we don't have full object, 
      // best is to fetch Auditionees, but for now we rely on the hook returning the updated data.
      setEvalModal(null) 
      resetRatingForm()
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  function openEvaluationModal(auditionee) {
    const targetAuditionee = auditionee ?? filtered[0] ?? auditionees[0]
    const ratedJudgeIds = new Set(targetAuditionee?.evaluations?.map((rating) => rating.judgeId) || [])
    const nextJudge = judges.find((judge) => !ratedJudgeIds.has(judge.id)) ?? judges[0]

    setEvaluationForm({
      ...emptyEvaluationForm,
      auditioneeId: targetAuditionee ? String(targetAuditionee.id) : '',
      judgeId: nextJudge ? String(nextJudge.id) : '',
    })
    setEvaluationModal(true)
  }

  async function handleSaveEvaluation() {
    setIsSaving(true)
    try {
      const payload = {
        auditioneeId: Number(evaluationForm.auditioneeId),
        judgeId: Number(evaluationForm.judgeId),
        ...Object.fromEntries(CATEGORIES.map((cat) => [cat, Number(evaluationForm[cat]) || 0])),
        comments: evaluationForm.comments,
      }
      await saveEvaluation(payload)
      setEvaluationModal(false)
      setEvaluationForm(emptyEvaluationForm)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  if (auditionsLoading || judgesLoading) {
    return <div className="page-shell flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
  }

  return (
    <div className="page-shell">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Auditionees" value={stats.total}   icon={Mic2}         color="purple" />
        <StatCard label="Passed"            value={stats.passed}  icon={CheckCircle2} color="green" />
        <StatCard label="Failed"            value={stats.failed}  icon={XCircle}      color="red" />
        <StatCard label="Pending"           value={stats.pending} icon={Clock}        color="yellow" />
      </div>

      {/* Toolbar */}
      <div className="card p-5">
        <div className="flex flex-row items-center gap-4 px-1 overflow-x-auto">
          <SearchBar value={search} onChange={setSearch} placeholder="Search auditionees..." className="w-60 flex-none" />
          <div className="flex gap-1 p-1 bg-slate-100/50 rounded-xl flex-none">
            {['All','Passed','Failed','Pending'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn('px-4 py-2 text-[13px] font-bold rounded-lg transition-all duration-200',
                  statusFilter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}>{s}</button>
            ))}
          </div>
          <select value={partFilter} onChange={e => setPartFilter(e.target.value)} className="flex-none rounded-xl border border-slate-200/80 bg-white/50 px-4 py-2 text-[13px] font-medium text-slate-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="All">All Parts</option>
            {VOICE_PARTS.map(v => <option key={v}>{v}</option>)}
          </select>
          <div className="ml-auto flex items-center gap-3 flex-none">
            <button onClick={() => openEvaluationModal()} disabled={auditionees.length === 0} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50">
              <Star size={16}/> Add Evaluation
            </button>
            <button onClick={() => setAddModal(true)} className="btn-primary shadow-blue-500/40">
              <UserPlus size={16}/> Register Auditionee
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b ">
              <th className="text-left px-6 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Auditionee</th>
              <th className="text-left px-5 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Target Part</th>
              <th className="text-left px-5 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="text-left px-5 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Avg Rating</th>
              <th className="text-left px-5 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Judges</th>
              <th className="text-left px-5 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((a) => {
              const avg = avgRating(a.evaluations || [])
              return (
                <tr key={a.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar name={a.firstName + ' ' + a.lastName} voicePart={a.voicePart} size="md" />
                      <div>
                        <p className="text-[14px] font-bold text-slate-800">{a.firstName} {a.lastName}</p>
                        <p className="text-[12px] font-medium text-slate-500">{a.email}</p>
                        <p className="text-[12px] text-slate-400">{a.course}{a.yearLevel ? ` · ${a.yearLevel}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ${getVoicePartColor(a.voicePart)}`}>{a.voicePart}</span>
                  </td>
                  <td className="px-5 py-4 text-[13px] font-medium text-slate-600">{formatDateShort(a.auditionDate)}</td>
                  <td className="px-5 py-4">
                    {avg
                      ? <span className="flex items-center gap-1.5 text-[14px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-lg w-fit"><Star size={14} fill="currentColor"/>{avg}</span>
                      : <span className="text-[13px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg w-fit">—</span>
                    }
                  </td>
                  <td className="px-5 py-4 text-[13px] font-bold text-slate-600">
                    <span className="bg-slate-100 px-2 py-1 rounded-lg">{(a.evaluations || []).length} / {judges.length}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ${getStatusColor(a.status)}`}>{a.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditAuditionee(a)} className="btn-secondary text-[12px] py-2 px-3 shadow-sm hover:shadow-md">
                        <Pencil size={14}/> Edit
                      </button>
                      <button onClick={() => openEvaluationModal(a)} className="btn-secondary text-[12px] py-2 px-3 shadow-sm hover:shadow-md">
                        <Star size={14}/> Add
                      </button>
                      <button onClick={() => setEvalModal(a)} className="btn-primary text-[12px] py-2 px-3 shadow-blue-500/30 hover:shadow-blue-500/50">
                        <Eye size={14}/> Result
                      </button>
                    </div>
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
        title={`Evaluation Results — ${evalModal?.firstName} ${evalModal?.lastName}`}
        size="xl"
        footer={
          evalModal?.status === 'Pending' ? (
            <>
              <button onClick={() => setEvalModal(null)} className="btn-secondary" disabled={isSaving}>Close</button>
              <button onClick={() => handleUpdateStatus(evalModal.id, 'Failed')} className="btn-danger" disabled={isSaving}>Mark Failed</button>
              <button onClick={() => handleUpdateStatus(evalModal.id, 'Passed')} className="btn-primary" disabled={isSaving}>Mark Passed</button>
            </>
          ) : <button onClick={() => setEvalModal(null)} className="btn-secondary">Close</button>
        }
      >
        {evalModal && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-5 p-6 bg-gradient-to-r from-slate-50 to-white border border-slate-100/80 rounded-2xl shadow-sm">
              <Avatar name={evalModal.firstName + ' ' + evalModal.lastName} voicePart={evalModal.voicePart} size="xl" />
              <div className="flex-1">
                <p className="text-xl font-black text-slate-800 tracking-tight">{evalModal.firstName} {evalModal.lastName}</p>
                <p className="text-[13px] font-medium text-slate-500 mt-1">{evalModal.contactNumber} · {evalModal.email}</p>
                <p className="mt-0.5 text-[12px] text-slate-400">
                  {evalModal.course}{evalModal.yearLevel ? ` · Year ${evalModal.yearLevel}` : ''}{evalModal.religion ? ` · ${evalModal.religion}` : ''}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ${getVoicePartColor(evalModal.voicePart)}`}>{evalModal.voicePart}</span>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ${getStatusColor(evalModal.status)}`}>{evalModal.status}</span>
                </div>
              </div>
              {(evalModal.evaluations || []).length > 0 && (
                <div className="text-right p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                  <p className="text-4xl font-black text-yellow-500 tracking-tighter drop-shadow-sm">{avgRating(evalModal.evaluations || [])}</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Avg / 10</p>
                </div>
              )}
            </div>

            {evalModal.notes && (
              <div className="rounded-2xl bg-slate-50/50 p-5 border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Registry Notes</p>
                <p className="text-[14px] font-medium text-slate-600">{evalModal.notes}</p>
              </div>
            )}

            {/* Category summary if rated */}
            {(evalModal.evaluations || []).length > 0 && (
              <div>
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-4 px-1">Category Averages</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {CATEGORIES.map((cat) => {
                    const evals = evalModal.evaluations || []
                    const avg = (evals.reduce((s, r) => s + (Number(r[cat]) || 0), 0) / evals.length).toFixed(1)
                    return (
                      <div key={cat} className="p-4 bg-white border border-slate-100/80 shadow-sm rounded-2xl">
                        <p className="text-[12px] font-bold text-slate-500 mb-2">{CATEGORY_LABELS[cat]}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" style={{ width: `${(avg / 10) * 100}%` }} />
                          </div>
                          <span className="text-[13px] font-black text-slate-700">{avg}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Per-judge ratings */}
            {(evalModal.evaluations || []).length > 0 ? (
              <div className="pt-2">
                <div className="mb-4 flex items-center justify-between gap-4 px-1">
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Judge Evaluations</p>
                  <button onClick={() => openRatingForm()} className="btn-secondary text-[12px] py-2 px-3 shadow-sm hover:shadow-md">
                    <UserPlus size={14} /> Add Evaluation
                  </button>
                </div>
                <div className="space-y-4">
                  {(evalModal.evaluations || []).map((r, i) => {
                    const judge = judges.find(j => j.id === r.judgeId)
                    return (
                      <div key={i} className="p-5 border border-slate-200/60 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[15px] font-black text-slate-800">{judge?.name || `Judge ${r.judgeId}`}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[15px] font-black text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg flex items-center gap-1.5 ring-1 ring-yellow-200/50">
                              <Star size={16} fill="currentColor"/>
                              {(CATEGORIES.reduce((s, c) => s + (Number(r[c]) || 0), 0) / CATEGORIES.length).toFixed(1)}
                            </span>
                            {/* Edit disabled for now in new backend model as it replaces rather than updates easily, but logic is there */}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 mb-4 bg-slate-50/50 p-4 rounded-xl">
                          {CATEGORIES.map((cat) => (
                            <div key={cat} className="flex items-center justify-between text-[12px]">
                              <span className="font-semibold text-slate-500">{CATEGORY_LABELS[cat]}</span>
                              <span className="font-black text-slate-800">{r[cat]}/10</span>
                            </div>
                          ))}
                        </div>
                        {r.comments && (
                          <div className="flex gap-2 text-[13px] font-medium text-slate-600 italic bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                            <span className="text-blue-400">"</span>{r.comments}<span className="text-blue-400">"</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-slate-100/80 border-dashed">
                <Mic2 size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-[14px] font-bold text-slate-500">No evaluations submitted yet.</p>
                <button onClick={() => openRatingForm()} className="btn-primary mt-5 text-[13px] px-6 py-2.5 shadow-blue-500/30">
                  <UserPlus size={16} /> Add Judge Evaluation
                </button>
              </div>
            )}

            {ratingForm.judgeId && (
              <div className="rounded-2xl border border-blue-200/60 bg-blue-50/30 p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-4 border-b border-blue-100/50 pb-3">
                  <p className="text-[14px] font-black text-slate-800 tracking-tight">{editingRatingId ? 'Edit evaluation' : 'Manual judge evaluation'}</p>
                  <button onClick={resetRatingForm} className="text-[12px] font-bold text-slate-400 hover:text-slate-700 transition-colors">Cancel</button>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="label">Judge</label>
                    <select
                      className="input bg-white"
                      value={ratingForm.judgeId}
                      disabled={!!editingRatingId}
                      onChange={e => setRatingForm(p => ({ ...p, judgeId: e.target.value }))}
                    >
                      {judges.map((judge) => (
                        <option key={judge.id} value={judge.id}>{judge.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {CATEGORIES.map((cat) => (
                      <div key={cat}>
                        <label className="label">{CATEGORY_LABELS[cat]}</label>
                        <input
                          className="input bg-white font-bold"
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
                      className="input min-h-24 resize-y bg-white"
                      value={ratingForm.comments}
                      onChange={e => setRatingForm(p => ({ ...p, comments: e.target.value }))}
                      placeholder="Type the judge's comments or evaluation notes"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={handleSaveRating} disabled={isSaving} className="btn-primary text-[13px] px-6 py-2.5 shadow-blue-500/40">
                      {isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : 'Save Evaluation'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Evaluation Modal */}
      <Modal
        open={evaluationModal}
        onClose={() => {
          setEvaluationModal(false)
          setEvaluationForm(emptyEvaluationForm)
        }}
        title="Add Judge Evaluation"
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setEvaluationModal(false)
                setEvaluationForm(emptyEvaluationForm)
              }}
              className="btn-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button onClick={handleSaveEvaluation} disabled={isSaving} className="btn-primary shadow-blue-500/40">
              {isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : 'Save Evaluation'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Auditionee *</label>
              <select
                className="input bg-white"
                value={evaluationForm.auditioneeId}
                onChange={e => {
                  const auditionee = auditionees.find((item) => String(item.id) === String(e.target.value))
                  const ratedJudgeIds = new Set(auditionee?.evaluations?.map((rating) => String(rating.judgeId)) || [])
                  const nextJudge = judges.find((judge) => !ratedJudgeIds.has(String(judge.id))) ?? judges[0]

                  setEvaluationForm(p => ({
                    ...p,
                    auditioneeId: e.target.value,
                    judgeId: nextJudge ? String(nextJudge.id) : '',
                  }))
                }}
              >
                {auditionees.map((auditionee) => (
                  <option key={auditionee.id} value={auditionee.id}>{auditionee.firstName} {auditionee.lastName} - {auditionee.voicePart}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Judge *</label>
              <select
                className="input bg-white"
                value={evaluationForm.judgeId}
                onChange={e => setEvaluationForm(p => ({ ...p, judgeId: e.target.value }))}
              >
                {judges.map((judge) => (
                  <option key={judge.id} value={judge.id}>{judge.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50/80 p-5 border border-slate-100/50">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {CATEGORIES.map((cat) => (
                <div key={cat}>
                  <label className="label">{CATEGORY_LABELS[cat]}</label>
                  <input
                    className="input bg-white font-bold"
                    type="number"
                    min="0"
                    max="10"
                    value={evaluationForm[cat]}
                    onChange={e => setEvaluationForm(p => ({ ...p, [cat]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Notes / Comments / Evaluation</label>
            <textarea
              className="input min-h-28 resize-y bg-white"
              value={evaluationForm.comments}
              onChange={e => setEvaluationForm(p => ({ ...p, comments: e.target.value }))}
              placeholder="Type the judge's comments, recommendation, or evaluation notes"
            />
          </div>
        </div>
      </Modal>

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Register New Auditionee" size="md"
        footer={<><button onClick={() => { setAddModal(false); setForm(emptyForm) }} disabled={isSaving} className="btn-secondary">Cancel</button><button onClick={handleAdd} disabled={isSaving} className="btn-primary shadow-blue-500/40">{isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : 'Register'}</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input className="input bg-white" value={form.firstName} onChange={e => setForm(p => ({...p, firstName: e.target.value}))} placeholder="First name" />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input className="input bg-white" value={form.lastName} onChange={e => setForm(p => ({...p, lastName: e.target.value}))} placeholder="Last name" />
            </div>
            <div>
              <label className="label">Target Voice Part</label>
              <select className="input bg-white" value={form.targetPart} onChange={e => setForm(p => ({...p, targetPart: e.target.value}))}>
                {VOICE_PARTS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Age</label>
              <input className="input bg-white" type="number" value={form.age} onChange={e => setForm(p => ({...p, age: e.target.value}))} placeholder="Age" />
            </div>
            <div>
              <label className="label">Course</label>
              <select className="input bg-white" value={form.course} onChange={e => setForm(p => ({...p, course: e.target.value}))}>
                <option value="">Select course</option>
                {COURSE_OPTIONS.map((course) => <option key={course} value={course}>{course}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year Level</label>
              <select className="input bg-white" value={form.yearLevel} onChange={e => setForm(p => ({...p, yearLevel: e.target.value}))}>
                <option value="">Select year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Religion / Denomination</label>
              <input className="input bg-white" value={form.religion} onChange={e => setForm(p => ({...p, religion: e.target.value}))} placeholder="e.g. Roman Catholic" />
            </div>
            <div>
              <label className="label">Contact Number</label>
              <input className="input bg-white" value={form.contactNumber} onChange={e => setForm(p => ({...p, contactNumber: e.target.value}))} placeholder="09XXXXXXXXX" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input bg-white" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="email@example.com" />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input className="input bg-white" value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} placeholder="City, Province" />
            </div>
            <div className="col-span-2">
              <label className="label">Audition Date</label>
              <input className="input bg-white" type="date" value={form.auditionDate} onChange={e => setForm(p => ({...p, auditionDate: e.target.value}))} />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input min-h-24 resize-y bg-white" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Audition notes, availability, or reminders" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Registry Modal */}
      <Modal open={!!editModal} onClose={() => { setEditModal(null); setForm(emptyForm) }} title="Edit Auditionee Registry" size="md"
        footer={<><button onClick={() => { setEditModal(null); setForm(emptyForm) }} disabled={isSaving} className="btn-secondary">Cancel</button><button onClick={handleEditAuditionee} disabled={isSaving} className="btn-primary shadow-blue-500/40">{isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : 'Save Registry'}</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input className="input bg-white" value={form.firstName} onChange={e => setForm(p => ({...p, firstName: e.target.value}))} placeholder="First name" />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input className="input bg-white" value={form.lastName} onChange={e => setForm(p => ({...p, lastName: e.target.value}))} placeholder="Last name" />
            </div>
            <div>
              <label className="label">Target Voice Part</label>
              <select className="input bg-white" value={form.targetPart} onChange={e => setForm(p => ({...p, targetPart: e.target.value}))}>
                {VOICE_PARTS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Age</label>
              <input className="input bg-white" type="number" value={form.age} onChange={e => setForm(p => ({...p, age: e.target.value}))} placeholder="Age" />
            </div>
            <div>
              <label className="label">Course</label>
              <select className="input bg-white" value={form.course} onChange={e => setForm(p => ({...p, course: e.target.value}))}>
                <option value="">Select course</option>
                {(form.course && !COURSE_OPTIONS.includes(form.course) ? [form.course, ...COURSE_OPTIONS] : COURSE_OPTIONS).map((course) => <option key={course} value={course}>{course}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year Level</label>
              <select className="input bg-white" value={form.yearLevel} onChange={e => setForm(p => ({...p, yearLevel: e.target.value}))}>
                <option value="">Select year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Religion / Denomination</label>
              <input className="input bg-white" value={form.religion ?? ''} onChange={e => setForm(p => ({...p, religion: e.target.value}))} placeholder="e.g. Roman Catholic" />
            </div>
            <div>
              <label className="label">Contact Number</label>
              <input className="input bg-white" value={form.contactNumber ?? ''} onChange={e => setForm(p => ({...p, contactNumber: e.target.value}))} placeholder="09XXXXXXXXX" />
            </div>
            <div>
              <label className="label">Email/FB Acct</label>
              <input className="input bg-white" value={form.email ?? ''} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="email or Facebook account" />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input className="input bg-white" value={form.address ?? ''} onChange={e => setForm(p => ({...p, address: e.target.value}))} placeholder="City, Province" />
            </div>
            <div className="col-span-2">
              <label className="label">Audition Date</label>
              <input className="input bg-white" type="date" value={form.auditionDate ? form.auditionDate.slice(0,10) : ''} onChange={e => setForm(p => ({...p, auditionDate: e.target.value}))} />
            </div>
            <div className="col-span-2">
              <label className="label">Registry Notes</label>
              <textarea className="input min-h-24 resize-y bg-white" value={form.notes ?? ''} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Audition notes, availability, or reminders" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

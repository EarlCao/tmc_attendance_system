import { useState } from 'react'
import { Mail, Pencil, Phone, Plus, Loader2 } from 'lucide-react'
import { useJudges } from '../hooks/useJudges'
import { useSemesters } from '../hooks/useSemesters'
import { getStatusColor, cn } from '../lib/utils'
import Modal from '../components/common/Modal'
import EmptyState from '../components/common/EmptyState'

function validateJudgeForm(form) {
  const errors = {}
  if (!form.name?.trim()) errors.name = 'Judge name is required.'
  return errors
}

export default function Judges() {
  const { activeSemester, loading: sLoading } = useSemesters()
  const { judges, loading: jLoading, createJudge, updateJudge } = useJudges(activeSemester?.id)

  const [judgeModal, setJudgeModal] = useState(false)
  const [editingJudge, setEditingJudge] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [judgeForm, setJudgeForm] = useState({
    name: '',
    title: '',
    specialization: '',
    contact: '',
    email: '',
    status: 'active',
  })

  const loading = sLoading || jLoading

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
        status: 'active',
      })
    }
    setFormErrors({})
    setJudgeModal(true)
  }

  async function handleSaveJudge() {
    const errors = validateJudgeForm(judgeForm)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setIsSaving(true)
    try {
      if (editingJudge) {
        await updateJudge(editingJudge.id, judgeForm)
      } else {
        await createJudge({ ...judgeForm, semesterId: activeSemester?.id })
      }
      setJudgeModal(false)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <div className="page-shell flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
  }

  return (
    <div className="page-shell">
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Audition panel</p>
            <h2 className="mt-1 text-2xl font-black text-slate-800 tracking-tight">Judges</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Add judges and use Auditions to manually enter their ratings and comments.</p>
          </div>
          <button onClick={() => openJudgeModal()} className="btn-primary shadow-blue-500/30">
            <Plus size={16} /> Add Judge
          </button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {judges.map((judge) => {
          return (
            <div key={judge.id} className="card p-5 hover:bg-slate-50/30 transition-colors group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-black text-slate-800 truncate">{judge.name}</h2>
                  <p className="mt-1 text-[12px] font-bold text-slate-500">{judge.title || 'Judge'}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ring-1 shadow-sm ${getStatusColor(judge.status)}`}>
                  {judge.status}
                </span>
              </div>
              <div className="mt-5 space-y-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Specialization</p>
                  <p className="text-[13px] font-medium text-slate-700">{judge.specialization || 'General audition evaluation'}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                    <Mail size={14} className="text-slate-400" /> {judge.email || 'No email listed'}
                  </p>
                  <p className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                    <Phone size={14} className="text-slate-400" /> {judge.contact || 'No contact listed'}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100/60 pt-4">
                <span className="text-[12px] font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg">{judge.ratingsGiven ?? 0} ratings</span>
                <button onClick={() => openJudgeModal(judge)} className="btn-secondary text-[12px] py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil size={12} /> Edit
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {judges.length === 0 && (
        <EmptyState
          title="No judges found"
          description="You haven't added any judges yet. Click 'Add Judge' to get started."
        />
      )}

      <Modal
        open={judgeModal}
        onClose={() => { setJudgeModal(false); setFormErrors({}) }}
        title={editingJudge ? 'Edit Judge' : 'Add Judge'}
        size="md"
        footer={
          <>
            <button onClick={() => { setJudgeModal(false); setFormErrors({}) }} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveJudge} disabled={isSaving} className="btn-primary shadow-blue-500/40">{isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : 'Save Judge'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              className={cn('input bg-white', formErrors.name && 'border-red-400 ring-1 ring-red-300/50')}
              value={judgeForm.name}
              onChange={e => setJudgeForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Judge name"
            />
            {formErrors.name && <p className="mt-1 text-[11px] font-semibold text-red-500">{formErrors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Title / Role</label>
              <input className="input bg-white" value={judgeForm.title} onChange={e => setJudgeForm(p => ({ ...p, title: e.target.value }))} placeholder="Music Director" />
            </div>
            <div>
              <label className="label">Specialization</label>
              <input className="input bg-white" value={judgeForm.specialization} onChange={e => setJudgeForm(p => ({ ...p, specialization: e.target.value }))} placeholder="Vocal performance" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact</label>
              <input className="input bg-white" value={judgeForm.contact} onChange={e => setJudgeForm(p => ({ ...p, contact: e.target.value }))} placeholder="09XXXXXXXXX" />
            </div>
            <div>
              <label className="label">Email / FB</label>
              <input className="input bg-white" value={judgeForm.email} onChange={e => setJudgeForm(p => ({ ...p, email: e.target.value }))} placeholder="email or Facebook account" />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input bg-white" value={judgeForm.status} onChange={e => setJudgeForm(p => ({ ...p, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

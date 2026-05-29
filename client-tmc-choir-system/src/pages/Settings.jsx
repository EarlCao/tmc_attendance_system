import { useState, useEffect } from 'react'
import { Plus, Save, Trash2, Pencil, Loader2 } from 'lucide-react'
import { useRules } from '../hooks/useRules'
import { getStatusColor } from '../lib/utils'
import Modal from '../components/common/Modal'

export default function Settings() {
  const { rules, loading, createRule, updateRule, deleteRule } = useRules()
  
  const [settingsForm, setSettingsForm] = useState({
    choirName: 'TMC Choir',
    institution: 'Trinidad Municipal College',
    defaultVenue: 'TMC Music Room',
    attendanceGrace: 15,
    passingRating: 7,
    archiveMode: 'Lock ended semesters',
  })
  const [ruleModal, setRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [ruleForm, setRuleForm] = useState({ title: '', category: 'General', description: '', status: 'active' })
  const [deleteRuleConfirm, setDeleteRuleConfirm] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('tmc_settings')
    if (saved) {
      try {
        setSettingsForm(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])

  function handleSaveSettings() {
    setIsSaving(true)
    setTimeout(() => {
        localStorage.setItem('tmc_settings', JSON.stringify(settingsForm))
        setIsSaving(false)
    }, 500)
  }

  function openRuleModal(rule) {
    if (rule) {
      setEditingRule(rule)
      setRuleForm({ ...rule })
    } else {
      setEditingRule(null)
      setRuleForm({ title: '', category: 'General', description: '', status: 'active' })
    }
    setRuleModal(true)
  }

  async function handleSaveRule() {
    if (!ruleForm.title.trim()) return
    setIsSaving(true)
    try {
      if (editingRule) {
        await updateRule(editingRule.id, ruleForm)
      } else {
        await createRule(ruleForm)
      }
      setRuleModal(false)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteRule(id) {
    setIsSaving(true)
    try {
        await deleteRule(id)
        setDeleteRuleConfirm(null)
    } finally {
        setIsSaving(false)
    }
  }

  if (loading) {
    return <div className="page-shell flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
  }

  return (
    <div className="page-shell">
      <div className="card p-6 bg-gradient-to-r from-white to-slate-50/50">
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">System setup</p>
        <h2 className="mt-1 text-2xl font-black text-slate-800 tracking-tight">Settings</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">Use this area for choir profile details, lifetime choir rules, audition scoring defaults, and semester locking behavior.</p>
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-[15px] font-black text-slate-800">Choir Rules and Regulations</h3>
            <p className="mt-1 text-[13px] font-medium text-slate-500">These are lifetime choir policies. They are not tied to a semester and remain part of the organization record.</p>
          </div>
          <button onClick={() => openRuleModal()} className="btn-primary shadow-blue-500/30">
            <Plus size={16} /> Add Rule
          </button>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-slate-100 p-5 bg-white shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[14px] font-black text-slate-800">{rule.title}</h4>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-blue-100">{rule.category}</span>
                  </div>
                  <p className="mt-2 text-[13px] font-medium text-slate-600 leading-relaxed">{rule.description}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 shadow-sm ${getStatusColor(rule.status)}`}>{rule.status}</span>
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-50 pt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openRuleModal(rule)} className="rounded-xl p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                <button onClick={() => setDeleteRuleConfirm(rule)} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <div className="col-span-full rounded-2xl bg-slate-50 border border-slate-100 p-8 text-center border-dashed">
                <p className="text-[13px] font-bold text-slate-500">No rules have been added yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-[15px] font-black text-slate-800 border-b border-slate-100 pb-4">Choir Profile</h3>
          <div className="mt-5 space-y-4">
            <div>
              <label className="label">Choir Name</label>
              <input className="input bg-slate-50 focus:bg-white" value={settingsForm.choirName} onChange={e => setSettingsForm(p => ({ ...p, choirName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Institution</label>
              <input className="input bg-slate-50 focus:bg-white" value={settingsForm.institution} onChange={e => setSettingsForm(p => ({ ...p, institution: e.target.value }))} />
            </div>
            <div>
              <label className="label">Default Venue</label>
              <input className="input bg-slate-50 focus:bg-white" value={settingsForm.defaultVenue} onChange={e => setSettingsForm(p => ({ ...p, defaultVenue: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-[15px] font-black text-slate-800 border-b border-slate-100 pb-4">Rules and Defaults</h3>
          <div className="mt-5 space-y-4">
            <div>
              <label className="label">Late Grace Period (minutes)</label>
              <input className="input bg-slate-50 focus:bg-white" type="number" value={settingsForm.attendanceGrace} onChange={e => setSettingsForm(p => ({ ...p, attendanceGrace: e.target.value }))} />
            </div>
            <div>
              <label className="label">Audition Passing Rating</label>
              <input className="input bg-slate-50 focus:bg-white" type="number" min="1" max="10" value={settingsForm.passingRating} onChange={e => setSettingsForm(p => ({ ...p, passingRating: e.target.value }))} />
            </div>
            <div>
              <label className="label">Ended Semester Behavior</label>
              <select className="input bg-slate-50 focus:bg-white" value={settingsForm.archiveMode} onChange={e => setSettingsForm(p => ({ ...p, archiveMode: e.target.value }))}>
                <option>Lock ended semesters</option>
                <option>Allow admin edits</option>
              </select>
            </div>
            <div className="pt-2">
                <button onClick={handleSaveSettings} disabled={isSaving} className="btn-primary w-full justify-center shadow-blue-500/30">
                {isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : <><Save size={16} /> Save Settings</>}
                </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={ruleModal}
        onClose={() => setRuleModal(false)}
        title={editingRule ? 'Edit Choir Rule' : 'Add Choir Rule'}
        size="md"
        footer={
          <>
            <button onClick={() => setRuleModal(false)} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveRule} disabled={isSaving} className="btn-primary shadow-blue-500/40">{isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : 'Save Rule'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Rule Title *</label>
            <input className="input bg-white" value={ruleForm.title} onChange={e => setRuleForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Attendance Requirement" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input bg-white" value={ruleForm.category} onChange={e => setRuleForm(p => ({ ...p, category: e.target.value }))}>
                <option>General</option>
                <option>Attendance</option>
                <option>Conduct</option>
                <option>Membership</option>
                <option>Auditions</option>
                <option>Performances</option>
                <option>Officers</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input bg-white" value={ruleForm.status} onChange={e => setRuleForm(p => ({ ...p, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Rule / Regulation Details</label>
            <textarea className="input bg-white min-h-32 resize-y" value={ruleForm.description} onChange={e => setRuleForm(p => ({ ...p, description: e.target.value }))} placeholder="Write the rule, policy, or regulation here" />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteRuleConfirm}
        onClose={() => setDeleteRuleConfirm(null)}
        title="Remove Choir Rule"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteRuleConfirm(null)} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button onClick={() => handleDeleteRule(deleteRuleConfirm.id)} disabled={isSaving} className="btn-danger shadow-red-500/30">{isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : 'Yes, Remove'}</button>
          </>
        }
      >
        <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
          Are you sure you want to remove <strong>{deleteRuleConfirm?.title}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

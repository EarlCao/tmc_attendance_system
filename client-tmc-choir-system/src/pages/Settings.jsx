import { useState } from 'react'
import {
  Plus, Trash2, Pencil, Loader2,
  Download, Star, BookOpen, HardDrive,
} from 'lucide-react'
import { useRules } from '../hooks/useRules'
import { useCategories } from '../hooks/useCategories'
import { getStatusColor } from '../lib/utils'
import { backupAPI } from '../lib/api'
import Modal from '../components/common/Modal'
import EmptyState from '../components/common/EmptyState'

// ─── Section tabs ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'rules',      label: 'Choir Rules',         icon: BookOpen },
  { id: 'categories', label: 'Rating Categories',    icon: Star },
  { id: 'backup',     label: 'Backup & Recovery',    icon: HardDrive },
]

const RULE_CATEGORIES = ['General', 'Attendance', 'Conduct', 'Membership', 'Auditions', 'Performances', 'Officers']

export default function Settings() {
  const { rules, loading: rulesLoading, createRule, updateRule, deleteRule } = useRules()
  const { categories, loading: catsLoading, createCategory, updateCategory, deleteCategory } = useCategories()

  const [activeTab, setActiveTab] = useState('rules')

  // ── Rule modal state ──────────────────────────────────────────────────────
  const [ruleModal, setRuleModal]               = useState(false)
  const [editingRule, setEditingRule]           = useState(null)
  const [ruleForm, setRuleForm]                 = useState({ title: '', category: 'General', description: '', status: 'active' })
  const [deleteRuleConfirm, setDeleteRuleConfirm] = useState(null)
  const [ruleError, setRuleError]               = useState('')

  // ── Category modal state ──────────────────────────────────────────────────
  const [catModal, setCatModal]                 = useState(false)
  const [editingCat, setEditingCat]             = useState(null)
  const [catForm, setCatForm]                   = useState({ name: '', description: '', percentage: '' })
  const [deleteCatConfirm, setDeleteCatConfirm] = useState(null)
  const [catError, setCatError]                 = useState('')

  // ── Backup state ──────────────────────────────────────────────────────────
  const [backupLoading, setBackupLoading]       = useState(false)
  const [backupMsg, setBackupMsg]               = useState('')

  const [isSaving, setIsSaving] = useState(false)

  const loading = rulesLoading || catsLoading

  // ── Rule helpers ──────────────────────────────────────────────────────────
  function openRuleModal(rule = null) {
    setRuleError('')
    if (rule) {
      setEditingRule(rule)
      setRuleForm({
        title: rule.title || '',
        category: rule.category || 'General',
        description: rule.description || rule.content || '',
        status: rule.status || 'active',
      })
    } else {
      setEditingRule(null)
      setRuleForm({ title: '', category: 'General', description: '', status: 'active' })
    }
    setRuleModal(true)
  }

  function closeRuleModal() {
    setRuleModal(false)
    setRuleError('')
  }

  async function handleSaveRule() {
    setRuleError('')
    if (!ruleForm.title.trim()) { setRuleError('Rule title is required.'); return }
    if (!ruleForm.description.trim()) { setRuleError('Rule details are required.'); return }
    setIsSaving(true)
    try {
      if (editingRule) {
        await updateRule(editingRule.id, ruleForm)
      } else {
        await createRule(ruleForm)
      }
      closeRuleModal()
    } catch (err) {
      setRuleError(err?.response?.data?.message || err?.message || 'Failed to save rule.')
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

  // ── Category helpers ──────────────────────────────────────────────────────
  function openCatModal(cat = null) {
    setCatError('')
    if (cat) {
      setEditingCat(cat)
      setCatForm({
        name: cat.name || '',
        description: cat.description || '',
        percentage: cat.percentage != null ? String(cat.percentage) : '',
      })
    } else {
      setEditingCat(null)
      setCatForm({ name: '', description: '', percentage: '' })
    }
    setCatModal(true)
  }

  function closeCatModal() {
    setCatModal(false)
    setCatError('')
  }

  async function handleSaveCat() {
    setCatError('')
    if (!catForm.name.trim()) { setCatError('Category name is required.'); return }
    const pct = parseFloat(catForm.percentage)
    if (catForm.percentage !== '' && (isNaN(pct) || pct < 0 || pct > 100)) {
      setCatError('Percentage must be between 0 and 100.')
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        name: catForm.name.trim(),
        description: catForm.description.trim() || '',
        percentage: catForm.percentage !== '' ? pct : 0,
      }
      if (editingCat) {
        await updateCategory(editingCat.id, payload)
      } else {
        await createCategory(payload)
      }
      closeCatModal()
    } catch (err) {
      setCatError(err?.response?.data?.message || err?.message || 'Failed to save category.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteCat(id) {
    setIsSaving(true)
    try {
      await deleteCategory(id)
      setDeleteCatConfirm(null)
    } catch (err) {
      setCatError(err?.response?.data?.message || 'Failed to delete category.')
      setDeleteCatConfirm(null)
    } finally {
      setIsSaving(false)
    }
  }

  // ── Backup helpers ────────────────────────────────────────────────────────
  async function handleExportBackup() {
    setBackupLoading(true)
    setBackupMsg('')
    try {
      const res = await backupAPI.exportBackup()
      const blob = new Blob([JSON.stringify(JSON.parse(await res.data.text()), null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tmc-choir-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setBackupMsg('Backup exported successfully.')
    } catch {
      setBackupMsg('Export failed. Please try again.')
    } finally {
      setBackupLoading(false)
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
      {/* Header */}
      <div className="card p-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">System setup</p>
        <h2 className="mt-1 text-2xl font-black text-slate-800 tracking-tight">Settings</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">Manage choir rules, audition rating categories, and data backups.</p>

        {/* Tabs */}
        <div className="mt-5 flex items-center gap-1 border-b border-slate-100">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={[
                'flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-t-lg transition-colors border-b-2 -mb-px',
                activeTab === id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/60'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
              ].join(' ')}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: Choir Rules ─────────────────────────────────────────────── */}
      {activeTab === 'rules' && (
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-[15px] font-black text-slate-800">Choir Rules & Regulations</h3>
              <p className="mt-1 text-[13px] font-medium text-slate-500">Lifetime choir policies, not tied to any semester.</p>
            </div>
            <button onClick={() => openRuleModal()} className="btn-primary shadow-blue-500/30">
              <Plus size={16} /> Add Rule
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {rules.length > 0 ? rules.map((rule) => (
              <div key={rule.id} className="rounded-2xl border border-slate-100 p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[14px] font-black text-slate-800">{rule.title}</h4>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{rule.category}</span>
                    </div>
                    <p className="mt-2 text-[13px] font-medium text-slate-600 leading-relaxed">{rule.description}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 shadow-sm ${getStatusColor(rule.status)}`}>
                    {rule.status}
                  </span>
                </div>
                <div className="mt-4 flex justify-end gap-2 border-t border-slate-50 pt-3">
                  <button
                    onClick={() => openRuleModal(rule)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteRuleConfirm(rule)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full">
                <EmptyState title="No rules added yet" description="Click 'Add Rule' to create the first choir rule or regulation." />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Rating Categories ───────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-[15px] font-black text-slate-800">Judge Rating Categories</h3>
              <p className="mt-1 text-[13px] font-medium text-slate-500">
                Define what criteria judges score during auditions (e.g. Vocal Quality, Pitch Accuracy).
              </p>
            </div>
            <button onClick={() => openCatModal()} className="btn-primary shadow-blue-500/30">
              <Plus size={16} /> Add Category
            </button>
          </div>

          <div className="mt-5">
            {categories.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-5 py-3 text-left font-bold text-slate-500">Category Name</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500">Description</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500">Weight (%)</th>
                      <th className="px-5 py-3 text-right font-bold text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-blue-600/5 transition-colors group">
                        <td className="px-5 py-4 font-black text-slate-800">{cat.name}</td>
                        <td className="px-5 py-4 font-medium text-slate-500 max-w-xs">
                          {cat.description || <span className="text-slate-300 italic">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-[12px] font-bold text-blue-700 ring-1 ring-blue-100">
                            {cat.percentage ?? 0}%
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openCatModal(cat)}
                              className="p-2 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteCatConfirm(cat)}
                              className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No rating categories yet"
                description="Add categories like Vocal Quality, Pitch Accuracy, or Stage Presence that judges will score during auditions."
              />
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Backup & Recovery ───────────────────────────────────────── */}
      {activeTab === 'backup' && (
        <div className="card p-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-[15px] font-black text-slate-800">Backup & Recovery</h3>
            <p className="mt-1 text-[13px] font-medium text-slate-500">
              Export a full JSON backup of all system data — members, semesters, attendance, auditions, officers, judges, categories, and rules.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {/* Export card */}
            <div className="rounded-2xl border border-slate-100 p-6 bg-white shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Download size={22} />
              </div>
              <h4 className="text-[14px] font-black text-slate-800">Export Backup</h4>
              <p className="mt-2 text-[13px] font-medium text-slate-500 leading-relaxed">
                Downloads a complete <span className="font-bold text-slate-700">.json</span> file of all your data. Store it somewhere safe — you can use it to restore the system if needed.
              </p>
              {backupMsg && (
                <p className={`mt-3 text-[12px] font-semibold ${backupMsg.includes('failed') ? 'text-red-500' : 'text-green-600'}`}>
                  {backupMsg}
                </p>
              )}
              <button
                onClick={handleExportBackup}
                disabled={backupLoading}
                className="btn-primary mt-5 w-full justify-center shadow-blue-500/30"
              >
                {backupLoading
                  ? <><Loader2 className="animate-spin w-4 h-4" /> Exporting...</>
                  : <><Download size={16} /> Download Backup</>
                }
              </button>
            </div>

            {/* Recovery info card */}
            <div className="rounded-2xl border border-amber-100 p-6 bg-amber-50/40">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <HardDrive size={22} />
              </div>
              <h4 className="text-[14px] font-black text-slate-800">Recovery</h4>
              <p className="mt-2 text-[13px] font-medium text-slate-500 leading-relaxed">
                To restore from a backup, contact your system administrator or use the database import tools provided with your deployment. The exported JSON file contains all table data needed for a full restore.
              </p>
              <div className="mt-4 rounded-xl bg-amber-100/60 px-4 py-3 text-[12px] font-medium text-amber-700 leading-relaxed">
                <strong>Tip:</strong> Export a backup regularly — before major updates, at the end of each semester, or whenever you make bulk changes.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Rule Add/Edit Modal ───────────────────────────────────────────── */}
      <Modal
        open={ruleModal}
        onClose={closeRuleModal}
        title={editingRule ? 'Edit Choir Rule' : 'Add Choir Rule'}
        size="md"
        footer={
          <>
            <button onClick={closeRuleModal} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveRule} disabled={isSaving} className="btn-primary shadow-blue-500/40">
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save Rule'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {ruleError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] font-medium text-red-600">
              {ruleError}
            </div>
          )}
          <div>
            <label className="label">Rule Title *</label>
            <input
              className="input bg-white"
              value={ruleForm.title}
              onChange={e => { setRuleError(''); setRuleForm(p => ({ ...p, title: e.target.value })) }}
              placeholder="e.g. Attendance Requirement"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input bg-white" value={ruleForm.category} onChange={e => setRuleForm(p => ({ ...p, category: e.target.value }))}>
                {RULE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
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
            <label className="label">Rule / Regulation Details *</label>
            <textarea
              className="input bg-white min-h-32 resize-y"
              value={ruleForm.description}
              onChange={e => { setRuleError(''); setRuleForm(p => ({ ...p, description: e.target.value })) }}
              placeholder="Write the rule, policy, or regulation here"
            />
          </div>
        </div>
      </Modal>

      {/* ── Rule Delete Modal ─────────────────────────────────────────────── */}
      <Modal
        open={!!deleteRuleConfirm}
        onClose={() => setDeleteRuleConfirm(null)}
        title="Remove Choir Rule"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteRuleConfirm(null)} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button onClick={() => handleDeleteRule(deleteRuleConfirm.id)} disabled={isSaving} className="btn-danger shadow-red-500/30">
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Yes, Remove'}
            </button>
          </>
        }
      >
        <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
          Are you sure you want to remove <strong>{deleteRuleConfirm?.title}</strong>? This action cannot be undone.
        </p>
      </Modal>

      {/* ── Category Add/Edit Modal ───────────────────────────────────────── */}
      <Modal
        open={catModal}
        onClose={closeCatModal}
        title={editingCat ? 'Edit Rating Category' : 'Add Rating Category'}
        size="md"
        footer={
          <>
            <button onClick={closeCatModal} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveCat} disabled={isSaving} className="btn-primary shadow-blue-500/40">
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save Category'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {catError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] font-medium text-red-600">
              {catError}
            </div>
          )}
          <div>
            <label className="label">Category Name *</label>
            <input
              className="input bg-white"
              value={catForm.name}
              onChange={e => { setCatError(''); setCatForm(p => ({ ...p, name: e.target.value })) }}
              placeholder="e.g. Vocal Quality, Pitch Accuracy, Stage Presence"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <input
              className="input bg-white"
              value={catForm.description}
              onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of what this criterion measures"
            />
          </div>
          <div>
            <label className="label">Weight / Percentage</label>
            <div className="relative">
              <input
                className="input bg-white pr-8"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={catForm.percentage}
                onChange={e => { setCatError(''); setCatForm(p => ({ ...p, percentage: e.target.value })) }}
                placeholder="e.g. 20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate-400">%</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">How much this criterion contributes to the overall score.</p>
          </div>
        </div>
      </Modal>

      {/* ── Category Delete Modal ─────────────────────────────────────────── */}
      <Modal
        open={!!deleteCatConfirm}
        onClose={() => setDeleteCatConfirm(null)}
        title="Remove Rating Category"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteCatConfirm(null)} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button onClick={() => handleDeleteCat(deleteCatConfirm.id)} disabled={isSaving} className="btn-danger shadow-red-500/30">
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Yes, Remove'}
            </button>
          </>
        }
      >
        <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
          Are you sure you want to remove <strong>{deleteCatConfirm?.name}</strong>?
          Categories with existing evaluation scores cannot be deleted.
        </p>
      </Modal>
    </div>
  )
}

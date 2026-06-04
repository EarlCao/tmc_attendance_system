import { useState } from 'react'
import { Pencil, Plus, Trash2, Loader2 } from 'lucide-react'
import { useOfficers } from '../hooks/useOfficers'
import { useMembers } from '../hooks/useMembers'
import { getStatusColor } from '../lib/utils'
import Modal from '../components/common/Modal'
import EmptyState from '../components/common/EmptyState'

export default function Officers() {
  const { officers, loading: oLoading, createOfficer, updateOfficer, deleteOfficer } = useOfficers()
  const { members, loading: mLoading } = useMembers()

  const [officerModal, setOfficerModal] = useState(false)
  const [editingOfficer, setEditingOfficer] = useState(null)
  const [deleteOfficerConfirm, setDeleteOfficerConfirm] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [officerForm, setOfficerForm] = useState({
    memberId: '',
    position: '',
    duties: '',
    status: 'active',
  })

  const loading = oLoading || mLoading

  function getMemberName(member) {
    if (!member) return 'Unknown Member'
    return member.fullName || 'Unknown Member'
  }

  function openOfficerModal(officer) {
    setFormError('')
    if (officer) {
      setEditingOfficer(officer)
      setOfficerForm({
        memberId: officer.memberId ? String(officer.memberId) : '',
        position: officer.position || '',
        duties: officer.duties || '',
        status: officer.status?.toLowerCase() || 'active',
      })
    } else {
      setEditingOfficer(null)
      setOfficerForm({
        memberId: members[0]?.id ? String(members[0].id) : '',
        position: '',
        duties: '',
        status: 'active',
      })
    }
    setOfficerModal(true)
  }

  async function handleSaveOfficer() {
    setFormError('')

    // Validate required fields
    if (!officerForm.memberId) {
      setFormError('Please select a member.')
      return
    }
    if (!officerForm.position.trim()) {
      setFormError('Please enter a position.')
      return
    }

    // Prevent duplicate: same member already an officer (skip check when editing same record)
    const isDuplicate = officers.some(
      (o) =>
        String(o.memberId) === String(officerForm.memberId) &&
        (!editingOfficer || o.id !== editingOfficer.id)
    )
    if (isDuplicate) {
      const memberName = getMemberName(members.find((m) => String(m.id) === String(officerForm.memberId)))
      setFormError(`${memberName} is already an officer.`)
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        memberId: parseInt(officerForm.memberId),
        position: officerForm.position.trim(),
        duties: officerForm.duties || '',
        status: officerForm.status,
      }
      if (editingOfficer) {
        await updateOfficer(editingOfficer.id, payload)
      } else {
        await createOfficer(payload)
      }
      setOfficerModal(false)
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save officer. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteOfficer(id) {
    setIsSaving(true)
    try {
      await deleteOfficer(id)
      setDeleteOfficerConfirm(null)
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
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Choir leadership</p>
            <h2 className="mt-1 text-2xl font-black text-slate-800 tracking-tight">Officers</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Manage choir officers and their positions.</p>
          </div>
          <button onClick={() => openOfficerModal()} className="btn-primary shadow-blue-500/30">
            <Plus size={16} /> Add Officer
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {officers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-left font-bold text-slate-500">Officer</th>
                  <th className="px-5 py-4 text-left font-bold text-slate-500">Position</th>
                  <th className="px-5 py-4 text-left font-bold text-slate-500">Contact</th>
                  <th className="px-5 py-4 text-left font-bold text-slate-500">Status</th>
                  <th className="px-6 py-4 text-right font-bold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {officers.map((officer) => {
                  // Use embedded member from API response; fall back to members array lookup
                  const member = officer.member || members.find((m) => m.id === Number(officer.memberId))

                  return (
                    <tr key={officer.id} className="hover:bg-blue-600/25 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-800">{getMemberName(member)}</p>
                        {officer.duties && (
                          <p className="mt-1.5 text-[11px] font-medium text-slate-400 max-w-xs truncate">{officer.duties}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">{officer.position}</td>
                      <td className="px-5 py-4 font-medium text-slate-500">
                        <p>{member?.emailOrFacebook || member?.contactNo || 'No contact'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 shadow-sm ${getStatusColor(officer.status)}`}>
                          {officer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openOfficerModal(officer)} className="p-2 rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setDeleteOfficerConfirm(officer)} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No officers found" description="There are no officers assigned. Click 'Add Officer' to assign one." />
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={officerModal}
        onClose={() => { setOfficerModal(false); setFormError('') }}
        title={editingOfficer ? 'Edit Officer' : 'Add Officer'}
        size="md"
        footer={
          <>
            <button onClick={() => { setOfficerModal(false); setFormError('') }} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveOfficer} disabled={isSaving} className="btn-primary shadow-blue-500/40">
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save Officer'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] font-medium text-red-600">
              {formError}
            </div>
          )}
          <div>
            <label className="label">Member *</label>
            <select
              className="input bg-white"
              value={officerForm.memberId}
              onChange={e => {
                setFormError('')
                setOfficerForm(p => ({ ...p, memberId: e.target.value }))
              }}
            >
              <option value="">Select a member...</option>
              {members.map(m => (
                <option key={m.id} value={String(m.id)}>{getMemberName(m)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Position *</label>
            <input
              className="input bg-white"
              value={officerForm.position}
              onChange={e => {
                setFormError('')
                setOfficerForm(p => ({ ...p, position: e.target.value }))
              }}
              placeholder="e.g. President, Secretary, Treasurer"
            />
          </div>
          <div>
            <label className="label">Duties / Notes</label>
            <textarea
              className="input bg-white min-h-24 resize-y"
              value={officerForm.duties}
              onChange={e => setOfficerForm(p => ({ ...p, duties: e.target.value }))}
              placeholder="Responsibilities, assignments, reminders"
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input bg-white"
              value={officerForm.status}
              onChange={e => setOfficerForm(p => ({ ...p, status: e.target.value }))}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteOfficerConfirm}
        onClose={() => setDeleteOfficerConfirm(null)}
        title="Remove Officer"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteOfficerConfirm(null)} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button onClick={() => handleDeleteOfficer(deleteOfficerConfirm.id)} disabled={isSaving} className="btn-danger shadow-red-500/30">
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Yes, Remove'}
            </button>
          </>
        }
      >
        <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
          Are you sure you want to remove <strong>{getMemberName(deleteOfficerConfirm?.member)}</strong> as <strong>{deleteOfficerConfirm?.position}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

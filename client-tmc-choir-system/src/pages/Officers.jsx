import { useState } from 'react'
import { Pencil, Plus, Trash2, Loader2 } from 'lucide-react'
import { useOfficers } from '../hooks/useOfficers'
import { useSemesters } from '../hooks/useSemesters'
import { useMembers } from '../hooks/useMembers'
import { getStatusColor } from '../lib/utils'
import Modal from '../components/common/Modal'
import EmptyState from '../components/common/EmptyState'

export default function Officers() {
  const { semesters, activeSemester: currentSemester, loading: sLoading } = useSemesters()
  const { officers, loading: oLoading, createOfficer, updateOfficer, deleteOfficer } = useOfficers()
  const { members, loading: mLoading } = useMembers()

  const [officerModal, setOfficerModal] = useState(false)
  const [editingOfficer, setEditingOfficer] = useState(null)
  const [deleteOfficerConfirm, setDeleteOfficerConfirm] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const [officerForm, setOfficerForm] = useState({
    memberId: '',
    position: '',
    semesterId: '',
    duties: '',
    status: 'active',
  })

  const loading = sLoading || oLoading || mLoading

  function getMemberName(member) {
    if (!member) return 'Unknown Member'
    return `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown Member'
  }

  function openOfficerModal(officer) {
    if (officer) {
      setEditingOfficer(officer)
      setOfficerForm({
        memberId: officer.memberId || '',
        position: officer.position || '',
        semesterId: officer.semesterId || currentSemester?.id || semesters[0]?.id || '',
        duties: officer.duties || '',
        status: officer.status || 'active',
      })
    } else {
      setEditingOfficer(null)
      setOfficerForm({
        memberId: members[0]?.id || '',
        position: '',
        semesterId: currentSemester?.id || semesters[0]?.id || '',
        duties: '',
        status: 'active',
      })
    }
    setOfficerModal(true)
  }

  async function handleSaveOfficer() {
    if (!officerForm.memberId || !officerForm.position.trim()) return
    setIsSaving(true)
    try {
      if (editingOfficer) {
        await updateOfficer(editingOfficer.id, officerForm)
      } else {
        await createOfficer(officerForm)
      }
      setOfficerModal(false)
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
      <div className="card p-6 bg-gradient-to-r from-white to-slate-50/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Choir leadership</p>
            <h2 className="mt-1 text-2xl font-black text-slate-800 tracking-tight">Officers</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Manually add officers, keep their positions, and edit the list per semester.</p>
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
                  <th className="px-5 py-4 text-left font-bold text-slate-500">Semester</th>
                  <th className="px-5 py-4 text-left font-bold text-slate-500">Contact</th>
                  <th className="px-5 py-4 text-left font-bold text-slate-500">Status</th>
                  <th className="px-6 py-4 text-right font-bold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {officers.map((officer) => {
                  const semester = semesters.find((item) => item.id === Number(officer.semesterId))
                  const member = members.find((item) => item.id === Number(officer.memberId))

                  return (
                    <tr key={officer.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-800">{getMemberName(member)}</p>
                        {officer.duties && (
                          <p className="mt-1.5 text-[11px] font-medium text-slate-400 max-w-xs truncate">{officer.duties}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">{officer.position}</td>
                      <td className="px-5 py-4 font-medium text-slate-500">{semester?.name ?? 'No semester'}</td>
                      <td className="px-5 py-4 font-medium text-slate-500">
                        <p>{member?.email || 'No email'}</p>
                        <p>{member?.contactNumber || 'No phone'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 shadow-sm ${getStatusColor(officer.status)}`}>
                          {officer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openOfficerModal(officer)} className="rounded-xl p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
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

      <Modal
        open={officerModal}
        onClose={() => setOfficerModal(false)}
        title={editingOfficer ? 'Edit Officer' : 'Add Officer'}
        size="md"
        footer={
          <>
            <button onClick={() => setOfficerModal(false)} disabled={isSaving} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveOfficer} disabled={isSaving} className="btn-primary shadow-blue-500/40">
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save Officer'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Member *</label>
            <select className="input bg-white" value={officerForm.memberId} onChange={e => setOfficerForm(p => ({ ...p, memberId: Number(e.target.value) }))}>
              <option value="">Select a member...</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{getMemberName(m)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Position *</label>
              <input className="input bg-white" value={officerForm.position} onChange={e => setOfficerForm(p => ({ ...p, position: e.target.value }))} placeholder="President" />
            </div>
            <div>
              <label className="label">Semester</label>
              <select className="input bg-white" value={officerForm.semesterId} onChange={e => setOfficerForm(p => ({ ...p, semesterId: Number(e.target.value) }))}>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>{semester.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Duties / Notes</label>
            <textarea className="input bg-white min-h-24 resize-y" value={officerForm.duties} onChange={e => setOfficerForm(p => ({ ...p, duties: e.target.value }))} placeholder="Responsibilities, assignments, reminders" />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input bg-white" value={officerForm.status} onChange={e => setOfficerForm(p => ({ ...p, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

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
          Are you sure you want to remove <strong>{getMemberName(members.find(m => m.id === deleteOfficerConfirm?.memberId))}</strong> as <strong>{deleteOfficerConfirm?.position}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { UserPlus, LayoutGrid, List, Pencil, Trash2, Phone, Mail, MapPin, Loader2 } from 'lucide-react'
import { useMembers } from '../hooks/useMembers'
import { useToast } from '../hooks/useToast'
import { getVoicePartColor, getStatusColor, cn } from '../lib/utils'
import SearchBar from '../components/common/SearchBar'
import Avatar from '../components/common/Avatar'
import Modal from '../components/common/Modal'
import EmptyState from '../components/common/EmptyState'
import Toast from '../components/common/Toast'

const VOICE_PARTS = ['Soprano', 'Alto', 'Tenor', 'Bass']
const COURSE_OPTIONS = ['BSIT', 'BSOA', 'BSCRIM', 'BSPOL', 'BSCOM', 'BEED', 'BSED']
const emptyForm = { firstName: '', lastName: '', email: '', voicePart: 'Soprano', course: '', yearLevel: '', religion: '', status: 'active', contactNumber: '', address: '' }

function validateMemberForm(form) {
  const errors = {}
  if (!form.firstName?.trim()) errors.firstName = 'First name is required.'
  if (!form.lastName?.trim()) errors.lastName = 'Last name is required.'
  if (!form.course) errors.course = 'Please select a course.'
  if (!form.voicePart) errors.voicePart = 'Please select a voice part.'
  if (!form.yearLevel) errors.yearLevel = 'Please select a year level.'
  if (!form.religion?.trim()) errors.religion = 'Religion is required.'
  return errors
}

function MemberForm({ form, setForm, errors = {} }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">First Name *</label>
          <input className={cn('input', errors.firstName && 'border-red-400 ring-1 ring-red-300/50')} value={form.firstName || ''} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="e.g. Maria" />
          {errors.firstName && <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.firstName}</p>}
        </div>
        <div>
          <label className="label">Last Name *</label>
          <input className={cn('input', errors.lastName && 'border-red-400 ring-1 ring-red-300/50')} value={form.lastName || ''} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="e.g. Santos" />
          {errors.lastName && <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.lastName}</p>}
        </div>
        <div className="col-span-2">
          <label className="label">Email Address</label>
          <input type="email" className="input" value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
        </div>
        <div>
          <label className="label">Voice Part *</label>
          <select className={cn('input', errors.voicePart && 'border-red-400 ring-1 ring-red-300/50')} value={form.voicePart} onChange={e => setForm(p => ({ ...p, voicePart: e.target.value }))}>
            {VOICE_PARTS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          {errors.voicePart && <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.voicePart}</p>}
        </div>
        <div>
          <label className="label">Course *</label>
          <select className={cn('input', errors.course && 'border-red-400 ring-1 ring-red-300/50')} value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))}>
            <option value="">Select course</option>
            {(form.course && !COURSE_OPTIONS.includes(form.course) ? [form.course, ...COURSE_OPTIONS] : COURSE_OPTIONS).map((course) => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
          {errors.course && <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.course}</p>}
        </div>
        <div>
          <label className="label">Year Level *</label>
          <select className={cn('input', errors.yearLevel && 'border-red-400 ring-1 ring-red-300/50')} value={form.yearLevel} onChange={e => setForm(p => ({ ...p, yearLevel: e.target.value }))}>
            <option value="">Select year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
          {errors.yearLevel && <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.yearLevel}</p>}
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="label">Religion *</label>
          <input className={cn('input', errors.religion && 'border-red-400 ring-1 ring-red-300/50')} value={form.religion || ''} onChange={e => setForm(p => ({ ...p, religion: e.target.value }))} placeholder="e.g. Roman Catholic" />
          {errors.religion && <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.religion}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.contactNumber || ''} onChange={e => setForm(p => ({ ...p, contactNumber: e.target.value }))} placeholder="09XXXXXXXXX" />
        </div>
        <div className="col-span-2">
          <label className="label">Address</label>
          <input className="input" value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="City, Province" />
        </div>
      </div>
    </div>
  )
}

export default function Members() {
  const { members: memberList, loading, createMember, updateMember, deleteMember } = useMembers()
  const { toasts, toast, dismiss } = useToast()
  const [search, setSearch]           = useState('')
  const [voiceFilter, setVoiceFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [view, setView]               = useState('table')
  const [addModal, setAddModal]       = useState(false)
  const [editModal, setEditModal]     = useState(null)
  const [profileDrawer, setProfileDrawer] = useState(null)
  const [form, setForm]               = useState(emptyForm)
  const [formErrors, setFormErrors]   = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isSaving, setIsSaving]       = useState(false)

  const filtered = useMemo(() =>
    memberList.filter((m) => {
      const matchSearch = (m.firstName + ' ' + m.lastName).toLowerCase().includes(search.toLowerCase()) ||
                          m.email.toLowerCase().includes(search.toLowerCase())
      const matchVoice  = voiceFilter === 'All' || m.voicePart === voiceFilter
      const matchStatus = statusFilter === 'All' || m.status === statusFilter
      return matchSearch && matchVoice && matchStatus
    }),
    [memberList, search, voiceFilter, statusFilter]
  )

  const stats = {
    total:    memberList.length,
    active:   memberList.filter(m => m.status === 'active').length,
    soprano:  memberList.filter(m => m.voicePart === 'Soprano').length,
    alto:     memberList.filter(m => m.voicePart === 'Alto').length,
    tenor:    memberList.filter(m => m.voicePart === 'Tenor').length,
    bass:     memberList.filter(m => m.voicePart === 'Bass').length,
  }

  function openAdd() { setForm(emptyForm); setFormErrors({}); setAddModal(true) }
  function openEdit(m) { setForm({ ...m }); setFormErrors({}); setEditModal(m) }

  async function handleAdd() {
    const errors = validateMemberForm(form)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setIsSaving(true)
    try {
      await createMember(form)
      setAddModal(false)
      toast('Member added successfully.')
    } catch (e) {
      console.error(e)
      toast('Failed to add member. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleEdit() {
    const errors = validateMemberForm(form)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setIsSaving(true)
    try {
      await updateMember(editModal.id, form)
      setEditModal(null)
      toast('Member updated successfully.')
    } catch (e) {
      console.error(e)
      toast('Failed to update member. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id) {
    const name = deleteConfirm ? `${deleteConfirm.firstName} ${deleteConfirm.lastName}` : 'Member'
    setIsSaving(true)
    try {
      await deleteMember(id)
      setDeleteConfirm(null)
      toast(`${name} has been removed.`)
    } catch (e) {
      console.error(e)
      toast('Failed to remove member. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <div className="page-shell flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
  }

  return (
    <div className="page-shell">
      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total',   value: stats.total,   color: 'bg-slate-100 text-slate-700 ring-slate-200' },
          { label: 'Active',  value: stats.active,  color: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
          { label: 'Soprano', value: stats.soprano, color: 'bg-pink-50 text-pink-800 ring-pink-200' },
          { label: 'Alto',    value: stats.alto,    color: 'bg-purple-50 text-purple-700 ring-purple-200' },
          { label: 'Tenor',   value: stats.tenor,   color: 'bg-blue-50 text-blue-700 ring-blue-200' },
          { label: 'Bass',    value: stats.bass,    color: 'bg-teal-50 text-teal-700 ring-teal-200' },
        ].map((s) => (
          <div key={s.label} className="card p-5 text-center flex flex-col items-center justify-center gap-2 hover:-translate-y-1">
            <p className="text-3xl font-black text-slate-800 tracking-tight">{s.value}</p>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ${s.color}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex flex-row items-center px-1 gap-4 overflow-x-auto">
          <SearchBar value={search} onChange={setSearch} placeholder="Search members..." className="w-60 flex-none" />
          <div className="flex gap-1 p-1 bg-slate-100/50 rounded-xl flex-none">
            {['All', ...VOICE_PARTS].map((v) => (
              <button
                key={v}
                onClick={() => setVoiceFilter(v)}
                className={cn('px-4 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200',
                  voiceFilter === v ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >{v}</button>
            ))}
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="flex-none rounded-xl border border-slate-200/80 bg-white/50 px-4 py-2 text-[13px] font-medium text-slate-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="ml-auto flex items-center gap-3 flex-none">
            <div className="flex gap-1 p-1 bg-slate-100/50 rounded-xl">
              <button onClick={() => setView('table')} className={cn('p-2 rounded-lg transition-all duration-200', view === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
                <List size={16} />
              </button>
              <button onClick={() => setView('cards')} className={cn('p-2 rounded-lg transition-all duration-200', view === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
                <LayoutGrid size={16} />
              </button>
            </div>
            <button onClick={openAdd} className="btn-primary">
              <UserPlus size={16} /> Add Member
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {view === 'table' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Voice Part</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-blue-600/25 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar name={m.firstName + ' ' + m.lastName} voicePart={m.voicePart} size="md" />
                      <div>
                        <button onClick={() => setProfileDrawer(m)} className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">{m.firstName} {m.lastName}</button>
                        <p className="text-[13px] text-slate-500">{m.email}</p>
                        <p className="text-[12px] text-slate-400 font-medium">{m.course}{m.yearLevel ? ` • Year ${m.yearLevel}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ${getVoicePartColor(m.voicePart)}`}>{m.voicePart}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-medium text-slate-600">{m.contactNumber || '-'}</p>
                    <p className="text-[12px] text-slate-400">{m.address || '-'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ${getStatusColor(m.status)}`}>
                      {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(m)} className="p-2 rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteConfirm(m)} className="p-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {filtered.length === 0 && <EmptyState title="No members found" description="Try adjusting your filters." />}
        </div>
      )}

      {/* Cards View */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((m) => (
            <div key={m.id} className="card p-6 flex flex-col group">
              <div className="flex items-start justify-between mb-4">
                <Avatar name={m.firstName + ' ' + m.lastName} voicePart={m.voicePart} size="lg" />
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ${getStatusColor(m.status)}`}>
                  {m.status}
                </span>
              </div>
              <button onClick={() => setProfileDrawer(m)} className="text-base font-bold text-slate-800 hover:text-blue-600 text-left transition-colors truncate">
                {m.firstName} {m.lastName}
              </button>
              <div className="mt-1">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ${getVoicePartColor(m.voicePart)}`}>{m.voicePart}</span>
              </div>
              <p className="mt-2 text-[12px] font-medium text-slate-500">{m.course}{m.yearLevel ? ` • Year ${m.yearLevel}` : ''}</p>
              
              <div className="mt-4 space-y-2 flex-1">
                <div className="flex items-center gap-2 text-[12px] text-slate-500 truncate"><Mail size={13} className="text-slate-400"/>{m.email}</div>
                {m.contactNumber && <div className="flex items-center gap-2 text-[12px] text-slate-500 truncate"><Phone size={13} className="text-slate-400"/>{m.contactNumber}</div>}
              </div>
              
              <div className="flex gap-2 mt-5 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(m)} className="btn-secondary flex-1 text-xs py-2 justify-center"><Pencil size={13}/>Edit</button>
                <button onClick={() => setDeleteConfirm(m)} className="p-2 rounded-xl border border-slate-200/50 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"><Trash2 size={15}/></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-full"><EmptyState title="No members found" description="Try adjusting your filters." /></div>}
        </div>
      )}

      {/* Profile Drawer */}
      {profileDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setProfileDrawer(null)} />
          <div className="relative w-full max-w-md bg-white/90 backdrop-blur-xl h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100/50 bg-white/50">
              <button onClick={() => setProfileDrawer(null)} className="mb-6 text-[13px] font-semibold text-slate-400 hover:text-slate-700 transition-colors">← Close Profile</button>
              <Avatar name={profileDrawer.firstName + ' ' + profileDrawer.lastName} voicePart={profileDrawer.voicePart} size="xl" />
              <h3 className="text-2xl font-black text-slate-800 mt-4">{profileDrawer.firstName} {profileDrawer.lastName}</h3>
              <div className="mt-2 flex gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ring-1 ${getVoicePartColor(profileDrawer.voicePart)}`}>{profileDrawer.voicePart}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ring-1 ${getStatusColor(profileDrawer.status)}`}>{profileDrawer.status}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-500">{profileDrawer.course}{profileDrawer.yearLevel ? ` • Year ${profileDrawer.yearLevel}` : ''}</p>
            </div>
            <div className="p-8 space-y-6 flex-1">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Contact Information</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[13px] font-medium text-slate-600"><Mail size={16} className="text-slate-400"/>{profileDrawer.email}</div>
                  <div className="flex items-center gap-3 text-[13px] font-medium text-slate-600"><Phone size={16} className="text-slate-400"/>{profileDrawer.contactNumber || 'No phone provided'}</div>
                  <div className="flex items-center gap-3 text-[13px] font-medium text-slate-600"><MapPin size={16} className="text-slate-400"/>{profileDrawer.address || 'No address provided'}</div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 mt-auto">
                <button onClick={() => { openEdit(profileDrawer); setProfileDrawer(null) }} className="btn-primary flex-1 justify-center py-2.5">Edit Details</button>
                <button
                  onClick={() => { setDeleteConfirm(profileDrawer); setProfileDrawer(null) }}
                  className="btn-danger py-2.5"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => { setAddModal(false); setFormErrors({}) }} title="Add New Member" size="md"
        footer={<><button onClick={() => { setAddModal(false); setFormErrors({}) }} className="btn-secondary" disabled={isSaving}>Cancel</button><button onClick={handleAdd} className="btn-primary" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Add Member'}</button></>}>
        <MemberForm form={form} setForm={setForm} errors={formErrors} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => { setEditModal(null); setFormErrors({}) }} title="Edit Member" size="md"
        footer={<><button onClick={() => { setEditModal(null); setFormErrors({}) }} className="btn-secondary" disabled={isSaving}>Cancel</button><button onClick={handleEdit} className="btn-primary" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Save Changes'}</button></>}>
        <MemberForm form={form} setForm={setForm} errors={formErrors} />
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove Member" size="sm"
        footer={
          <>
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary" disabled={isSaving}>Cancel</button>
            <button onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)} className="btn-danger" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Yes, Remove'}
            </button>
          </>
        }>
        <p className="text-[13px] text-slate-600 leading-relaxed">
          Are you sure you want to remove{' '}
          <strong className="text-slate-800">{deleteConfirm?.firstName} {deleteConfirm?.lastName}</strong>?
          {' '}This action cannot be undone.
        </p>
      </Modal>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

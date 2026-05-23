import { useState, useMemo } from 'react'
import { UserPlus, LayoutGrid, List, Pencil, Trash2, Phone, Mail, MapPin } from 'lucide-react'
import { members as initialMembers } from '../data/mockData'
import { getVoicePartColor, getStatusColor, cn } from '../lib/utils'
import SearchBar from '../components/common/SearchBar'
import Badge from '../components/common/Badge'
import Avatar from '../components/common/Avatar'
import Modal from '../components/common/Modal'
import StatCard from '../components/common/StatCard'
import EmptyState from '../components/common/EmptyState'

const VOICE_PARTS = ['Soprano', 'Alto', 'Tenor', 'Bass']
const COURSE_OPTIONS = ['BSIT', 'BSOA', 'BSCRIM', 'BSPOL', 'BSCOM', 'BEED', 'BSED']
const emptyForm = { name: '', voicePart: 'Soprano', course: '', yearLevel: '', email: '', phone: '', address: '', status: 'active' }

function MemberForm({ form, setForm }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Full Name *</label>
          <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Maria Santos" />
        </div>
        <div>
          <label className="label">Voice Part *</label>
          <select className="input" value={form.voicePart} onChange={e => setForm(p => ({ ...p, voicePart: e.target.value }))}>
            {VOICE_PARTS.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Course</label>
          <select className="input" value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))}>
            <option value="">Select course</option>
            {(form.course && !COURSE_OPTIONS.includes(form.course) ? [form.course, ...COURSE_OPTIONS] : COURSE_OPTIONS).map((course) => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Year Level</label>
          <select className="input" value={form.yearLevel} onChange={e => setForm(p => ({ ...p, yearLevel: e.target.value }))}>
            <option value="">Select year</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="label">Email/FB Acct</label>
          <input className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email or Facebook account" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="09XXXXXXXXX" />
        </div>
        <div className="col-span-2">
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="City, Province" />
        </div>
      </div>
    </div>
  )
}

export default function Members() {
  const [memberList, setMemberList] = useState(initialMembers)
  const [search, setSearch]         = useState('')
  const [voiceFilter, setVoiceFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [view, setView]             = useState('table') // 'table' | 'cards'
  const [addModal, setAddModal]     = useState(false)
  const [editModal, setEditModal]   = useState(null) // member obj
  const [profileDrawer, setProfileDrawer] = useState(null)
  const [form, setForm]             = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const filtered = useMemo(() =>
    memberList.filter((m) => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
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

  function openAdd() { setForm(emptyForm); setAddModal(true) }
  function openEdit(m) { setForm({ ...m }); setEditModal(m) }

  function handleAdd() {
    const newMember = { ...form, id: Date.now(), attendanceRate: 100, present: 0, late: 0, absent: 0, excused: 0, joinedDate: new Date().toISOString().slice(0,10) }
    setMemberList((prev) => [...prev, newMember])
    setAddModal(false)
  }

  function handleEdit() {
    setMemberList((prev) => prev.map((m) => m.id === editModal.id ? { ...m, ...form } : m))
    setEditModal(null)
  }

  function handleDelete(id) {
    setMemberList((prev) => prev.filter((m) => m.id !== id))
    setDeleteConfirm(null)
    if (profileDrawer?.id === id) setProfileDrawer(null)
  }

  return (
    <div className="page-shell">
      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',   value: stats.total,   color: 'bg-gray-100 text-gray-700' },
          { label: 'Active',  value: stats.active,  color: 'bg-green-100 text-green-700' },
          { label: 'Soprano', value: stats.soprano, color: 'bg-pink-100 text-pink-700' },
          { label: 'Alto',    value: stats.alto,    color: 'bg-purple-100 text-purple-700' },
          { label: 'Tenor',   value: stats.tenor,   color: 'bg-blue-100 text-blue-700' },
          { label: 'Bass',    value: stats.bass,    color: 'bg-green-100 text-green-700' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search members..." className="w-full sm:w-60" />
        <div className="flex gap-1">
          {['All', ...VOICE_PARTS].map((v) => (
            <button
              key={v}
              onClick={() => setVoiceFilter(v)}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                voiceFilter === v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              )}
            >{v}</button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input py-1.5 w-auto text-xs"
        >
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setView('table')} className={cn('p-2 rounded-lg border transition-colors', view === 'table' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-400')}>
            <List size={15} />
          </button>
          <button onClick={() => setView('cards')} className={cn('p-2 rounded-lg border transition-colors', view === 'cards' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-400')}>
            <LayoutGrid size={15} />
          </button>
          <button onClick={openAdd} className="btn-primary">
            <UserPlus size={14} /> Add Member
          </button>
        </div>
      </div>

      {/* Table View */}
      {view === 'table' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Member</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Voice Part</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Attendance</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} voicePart={m.voicePart} size="md" />
                      <div>
                        <button onClick={() => setProfileDrawer(m)} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">{m.name}</button>
                        <p className="text-xs text-gray-400">{m.email}</p>
                        <p className="text-xs text-gray-400">{m.course}{m.yearLevel ? ` • ${m.yearLevel}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getVoicePartColor(m.voicePart)}`}>{m.voicePart}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-600">{m.phone}</p>
                    <p className="text-xs text-gray-400">{m.address}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', m.attendanceRate >= 80 ? 'bg-green-500' : m.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500')}
                          style={{ width: `${m.attendanceRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{m.attendanceRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(m.status)}`}>
                      {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteConfirm(m)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="card p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between mb-3">
                <Avatar name={m.name} voicePart={m.voicePart} size="lg" />
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusColor(m.status)}`}>
                  {m.status}
                </span>
              </div>
              <button onClick={() => setProfileDrawer(m)} className="text-sm font-semibold text-gray-900 hover:text-blue-600 text-left transition-colors">{m.name}</button>
              <span className={`mt-1 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${getVoicePartColor(m.voicePart)}`}>{m.voicePart}</span>
              <p className="mt-1 text-[11px] text-gray-500">{m.course}{m.yearLevel ? ` • ${m.yearLevel}` : ''}</p>
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500"><Mail size={11}/>{m.email}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500"><Phone size={11}/>{m.phone}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500"><MapPin size={11}/>{m.address}</div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-gray-500">Attendance</span>
                  <span className={cn('text-xs font-bold', m.attendanceRate >= 80 ? 'text-green-600' : m.attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600')}>{m.attendanceRate}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', m.attendanceRate >= 80 ? 'bg-green-500' : m.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${m.attendanceRate}%` }} />
                </div>
              </div>
              <div className="flex gap-1 mt-3">
                <button onClick={() => openEdit(m)} className="btn-secondary flex-1 text-xs py-1.5 justify-center"><Pencil size={12}/>Edit</button>
                <button onClick={() => setDeleteConfirm(m)} className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 transition-colors"><Trash2 size={13}/></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-full"><EmptyState title="No members found" description="Try adjusting your filters." /></div>}
        </div>
      )}

      {/* Profile Drawer */}
      {profileDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setProfileDrawer(null)} />
          <div className="relative ml-auto w-80 bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <button onClick={() => setProfileDrawer(null)} className="mb-4 text-xs text-gray-400 hover:text-gray-700">Close</button>
              <Avatar name={profileDrawer.name} voicePart={profileDrawer.voicePart} size="xl" />
              <h3 className="text-lg font-bold text-gray-900 mt-3">{profileDrawer.name}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getVoicePartColor(profileDrawer.voicePart)}`}>{profileDrawer.voicePart}</span>
              <p className="mt-2 text-sm text-gray-500">{profileDrawer.course}{profileDrawer.yearLevel ? ` • ${profileDrawer.yearLevel}` : ''}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Mail size={14} className="text-gray-400"/>{profileDrawer.email}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={14} className="text-gray-400"/>{profileDrawer.phone}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin size={14} className="text-gray-400"/>{profileDrawer.address}</div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Attendance Stats</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Present', value: profileDrawer.present, color: 'text-green-600' },
                    { label: 'Late',    value: profileDrawer.late,    color: 'text-yellow-600' },
                    { label: 'Absent',  value: profileDrawer.absent,  color: 'text-red-600' },
                    { label: 'Excused', value: profileDrawer.excused, color: 'text-blue-600' },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-2 rounded-lg bg-gray-50">
                      <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Attendance Rate</span>
                    <span className="font-bold text-gray-900">{profileDrawer.attendanceRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', profileDrawer.attendanceRate >= 80 ? 'bg-green-500' : 'bg-yellow-500')} style={{ width: `${profileDrawer.attendanceRate}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { openEdit(profileDrawer); setProfileDrawer(null) }} className="btn-primary flex-1 justify-center text-xs">Edit Member</button>
                <button onClick={() => setDeleteConfirm(profileDrawer)} className="btn-danger text-xs px-3">Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Member" size="md"
        footer={<><button onClick={() => setAddModal(false)} className="btn-secondary">Cancel</button><button onClick={handleAdd} className="btn-primary">Add Member</button></>}>
        <MemberForm form={form} setForm={setForm} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Member" size="md"
        footer={<><button onClick={() => setEditModal(null)} className="btn-secondary">Cancel</button><button onClick={handleEdit} className="btn-primary">Save Changes</button></>}>
        <MemberForm form={form} setForm={setForm} />
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove Member" size="sm"
        footer={<><button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button><button onClick={() => handleDelete(deleteConfirm.id)} className="btn-danger">Yes, Remove</button></>}>
        <p className="text-sm text-gray-600">Are you sure you want to remove <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  )
}

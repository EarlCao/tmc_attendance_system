import { useState, useMemo } from 'react'
import { UserPlus, Pencil, Trash2, KeyRound, Loader2, UserCheck } from 'lucide-react'
import { useAccounts } from '../hooks/useAccounts'
import { useToast } from '../hooks/useToast'
import { useDebounce } from '../hooks/useDebounce'
import { getStatusColor, cn } from '../lib/utils'
import SearchBar from '../components/common/SearchBar'
import Avatar from '../components/common/Avatar'
import Modal from '../components/common/Modal'
import EmptyState from '../components/common/EmptyState'
import Toast from '../components/common/Toast'

const emptyForm = { username: '', password: '', role: 'admin', isActive: true }

function AccountForm({ form, setForm, isEdit = false }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="label">Username *</label>
          <input className="input" value={form.username || ''} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="e.g. admin.user" />
        </div>
        <div>
          <label className="label">{isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
          <input type="password" className="input" value={form.password || ''} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
        </div>
        <div>
          <label className="label">Role *</label>
          <select className="input" value={form.role || 'admin'} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
          <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Account is Active</label>
        </div>
      </div>
    </div>
  )
}

export default function Accounts() {
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts()
  const { toasts, toast, dismiss } = useToast()
  const [searchInput, setSearch] = useState('')
  const search = useDebounce(searchInput, 300)
  const [roleFilter, setRoleFilter] = useState('All')
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const filtered = useMemo(() =>
    accounts.filter((a) => {
      const matchSearch = a.username.toLowerCase().includes(search.toLowerCase()) ||
                          (a.member?.fullName && a.member.fullName.toLowerCase().includes(search.toLowerCase()))
      const matchRole = roleFilter === 'All' || a.role.toLowerCase() === roleFilter.toLowerCase()
      return matchSearch && matchRole
    }).sort((a, b) => a.username.localeCompare(b.username)),
    [accounts, search, roleFilter]
  )

  const stats = {
    total: accounts.length,
    admins: accounts.filter(a => a.role.toLowerCase() === 'admin').length,
    members: accounts.filter(a => a.role.toLowerCase() === 'member').length,
    active: accounts.filter(a => a.isActive).length,
  }

  function openAdd() { setForm(emptyForm); setAddModal(true) }
  function openEdit(a) { setForm({ username: a.username, role: a.role, isActive: a.isActive, password: '' }); setEditModal(a) }

  async function handleAdd() {
    if (!form.username || !form.password) {
      toast('Username and password are required', 'error')
      return
    }
    setIsSaving(true)
    try {
      await createAccount(form)
      setAddModal(false)
      toast('Account created successfully.')
    } catch (e) {
      toast(e.message || 'Failed to create account.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleEdit() {
    if (!form.username) {
      toast('Username is required', 'error')
      return
    }
    setIsSaving(true)
    try {
      await updateAccount(editModal.id, form)
      setEditModal(null)
      toast('Account updated successfully.')
    } catch (e) {
      toast(e.message || 'Failed to update account.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id) {
    setIsSaving(true)
    try {
      await deleteAccount(id)
      setDeleteConfirm(null)
      toast('Account removed.')
    } catch (e) {
      toast('Failed to remove account.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <div className="page-shell flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
  }

  return (
    <div className="page-shell">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 text-center flex flex-col items-center justify-center gap-2 hover:-translate-y-1">
          <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.total}</p>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 bg-slate-100 text-slate-700 ring-slate-200">Total</span>
        </div>
        <div className="card p-5 text-center flex flex-col items-center justify-center gap-2 hover:-translate-y-1">
          <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.admins}</p>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 bg-purple-50 text-purple-700 ring-purple-200">Admins</span>
        </div>
        <div className="card p-5 text-center flex flex-col items-center justify-center gap-2 hover:-translate-y-1">
          <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.members}</p>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 bg-blue-50 text-blue-700 ring-blue-200">Members</span>
        </div>
        <div className="card p-5 text-center flex flex-col items-center justify-center gap-2 hover:-translate-y-1">
          <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.active}</p>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 bg-emerald-50 text-emerald-700 ring-emerald-200">Active</span>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-row items-center px-1 gap-4 overflow-x-auto">
          <SearchBar value={searchInput} onChange={setSearch} placeholder="Search accounts..." className="w-60 flex-none" />
          <div className="flex gap-1 p-1 bg-slate-100/50 rounded-xl flex-none">
            {['All', 'Admin', 'Member'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={cn('px-4 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200',
                  roleFilter === r ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >{r}</button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3 flex-none">
            <button onClick={openAdd} className="btn-primary">
              <UserPlus size={16} /> Add Account
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Account</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-blue-600/25 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 shadow-md ring-2 ring-white text-white font-bold text-xs">
                        {a.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{a.username}</p>
                        {a.member && <p className="text-[12px] text-slate-500">Linked to: {a.member.fullName}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ${a.role.toLowerCase() === 'admin' ? 'bg-purple-50 text-purple-700 ring-purple-200' : 'bg-blue-50 text-blue-700 ring-blue-200'}`}>
                      {a.role.charAt(0).toUpperCase() + a.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ${a.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200'}`}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(a)} className="p-2 rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteConfirm(a)} className="p-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState title="No accounts found" description="Try adjusting your filters." />}
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Account" size="sm"
        footer={<><button onClick={() => setAddModal(false)} className="btn-secondary" disabled={isSaving}>Cancel</button><button onClick={handleAdd} className="btn-primary" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Create'}</button></>}>
        <AccountForm form={form} setForm={setForm} />
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Account" size="sm"
        footer={<><button onClick={() => setEditModal(null)} className="btn-secondary" disabled={isSaving}>Cancel</button><button onClick={handleEdit} className="btn-primary" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Save Changes'}</button></>}>
        <AccountForm form={form} setForm={setForm} isEdit />
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Account" size="sm"
        footer={
          <>
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary" disabled={isSaving}>Cancel</button>
            <button onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)} className="btn-danger" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Yes, Delete'}
            </button>
          </>
        }>
        <p className="text-[13px] text-slate-600 leading-relaxed">
          Are you sure you want to delete <strong className="text-slate-800">{deleteConfirm?.username}</strong>?
        </p>
      </Modal>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

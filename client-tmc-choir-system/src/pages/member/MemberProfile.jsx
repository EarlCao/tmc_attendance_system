import { usePortal } from '../../hooks/usePortal'
import { useEffect, useState } from 'react'
import { Loader2, KeyRound } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'

export default function MemberProfile() {
  const { profileData, loading, fetchProfile, updateProfile } = usePortal()
  const { toasts, toast, dismiss } = useToast()
  
  const [form, setForm] = useState({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (profileData?.user) {
      setForm(prev => ({ ...prev, username: profileData.user.username }))
    }
  }, [profileData])

  if (loading || !profileData) {
    return <div className="page-shell flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      toast('New password and confirm password do not match.', 'error')
      return
    }
    setIsSaving(true)
    try {
      await updateProfile({
        username: form.username,
        password: form.newPassword || undefined,
        currentPassword: form.currentPassword || undefined
      })
      toast('Profile credentials updated successfully!')
      setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    } catch (err) {
      toast(err.message || 'Failed to update credentials', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Member Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
              <p className="font-semibold text-slate-800">{profileData.fullName}</p>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Voice Type</label>
              <p className="font-semibold text-slate-800">{profileData.voiceType}</p>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</label>
              <p className="font-semibold text-slate-800">{profileData.status}</p>
            </div>
            {profileData.officers?.length > 0 && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Officer Position</label>
                <p className="font-semibold text-amber-600">{profileData.officers[0].position}</p>
              </div>
            )}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email</label>
              <p className="font-semibold text-slate-800">{profileData.emailOrFacebook || 'N/A'}</p>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contact No</label>
              <p className="font-semibold text-slate-800">{profileData.contactNo || 'N/A'}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100">Contact an admin to update your member information.</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="text-blue-500" size={20} />
            <h2 className="text-lg font-bold text-slate-800">Account Credentials</h2>
          </div>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input 
                className="input" 
                value={form.username} 
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))} 
                required 
              />
            </div>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-4">To change your password, you must enter your current password.</p>
              <div className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    value={form.currentPassword} 
                    onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))} 
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    value={form.newPassword} 
                    onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))} 
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    value={form.confirmPassword} 
                    onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} 
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
            <div className="pt-4 text-right">
              <button type="submit" className="btn-primary w-full justify-center" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

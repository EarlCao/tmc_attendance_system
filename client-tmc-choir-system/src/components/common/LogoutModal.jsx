import { AlertTriangle, LogOut } from 'lucide-react'
import Modal from './Modal'

export default function LogoutModal({ open, onClose, onConfirm }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Confirm Logout"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger">
            <LogOut size={16} />
            Log out
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center py-2 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
          <AlertTriangle size={26} className="text-red-500 dark:text-red-400" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Are you sure you want to log out?
        </p>
        <p className="mt-1.5 text-[13px] text-slate-400 dark:text-slate-500">
          You'll need to sign in again to access the system.
        </p>
      </div>
    </Modal>
  )
}

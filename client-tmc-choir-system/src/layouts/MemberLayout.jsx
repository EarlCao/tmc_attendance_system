import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import MemberSidebar from './MemberSidebar'
import Header from './Header'
import MemberMobileNav from './MemberMobileNav'
import WelcomeModal from '../components/common/WelcomeModal'
import TestingNoticeModal from '../components/common/TestingNoticeModal'
import { useAuth } from '../context/AuthContext'

export default function MemberLayout() {
  const { user, justLoggedIn, clearWelcome } = useAuth()
  const [showNotice, setShowNotice] = useState(false)

  const handleWelcomeClose = () => {
    clearWelcome()
    setShowNotice(true)
  }

  return (
    <div className="flex h-screen bg-slate-50/50 dark:bg-slate-900 transition-colors duration-300">
      <MemberSidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-slate-100/[0.04] bg-[length:16px_16px] dark:bg-grid-slate-800/[0.04] pointer-events-none" />
        <Header />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 z-10 scroll-smooth">
          <Outlet />
        </main>
        <MemberMobileNav />
      </div>

      <WelcomeModal
        open={justLoggedIn}
        onClose={handleWelcomeClose}
        user={user}
      />

      <TestingNoticeModal
        open={showNotice}
        onClose={() => setShowNotice(false)}
      />
    </div>
  )
}

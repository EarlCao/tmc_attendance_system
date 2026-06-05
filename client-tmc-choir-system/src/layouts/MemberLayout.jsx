import { Outlet } from 'react-router-dom'
import MemberSidebar from './MemberSidebar'
import Header from './Header'
import MemberMobileNav from './MemberMobileNav'

export default function MemberLayout() {
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
    </div>
  )
}

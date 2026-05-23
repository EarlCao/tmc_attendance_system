import Sidebar from './Sidebar'
import Header from './Header'
import MobileNav from './MobileNav'

export default function MainLayout({ children, currentSemester }) {
  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header currentSemester={currentSemester} />
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-20 sm:px-6 md:pb-6 lg:px-8">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  )
}

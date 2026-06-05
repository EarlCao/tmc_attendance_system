import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { CalendarDays, Lock, UserCheck } from 'lucide-react'

// Layouts and Auth
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import ProtectedRoute from './components/common/ProtectedRoute'

// Pages
import Dashboard from './pages/Dashboard'
import Attendance from './pages/Attendance'
import Members from './pages/Members'
import Auditions from './pages/Auditions'
import Absences from './pages/Absences'
import Semesters from './pages/Semesters'
import Judges from './pages/Judges'
import Officers from './pages/Officers'
import Reports from './pages/Reports'
import SettingsPage from './pages/Settings'

// Context
import { SemesterProvider, useSemesterContext } from './context/SemesterContext'

function PlaceholderPage({ icon: Icon, title, description }) {
  return (
    <div className="card p-10 text-center bg-white shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
        <Icon size={32} />
      </div>
      <h2 className="text-xl font-black text-slate-800">{title}</h2>
      <p className="mt-3 max-w-md text-[14px] font-medium text-slate-500 leading-relaxed">{description}</p>
    </div>
  )
}

function RequireActiveSemester({ currentSemester, children }) {
  if (currentSemester) return children

  return (
    <div className="page-shell flex items-center justify-center min-h-[80vh]">
      <div className="card p-10 text-center max-w-lg bg-white shadow-lg shadow-amber-500/5 border border-amber-100/50">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 shadow-inner">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-800">No ongoing semester</h2>
        <p className="mt-3 text-[14px] font-medium text-slate-500 leading-relaxed">
          This panel is locked because the previous semester has ended or no semester exists. Create a new active semester before adding or editing records.
        </p>
        <Link to="/semesters" className="btn-primary mt-8 justify-center shadow-blue-500/30 w-full sm:w-auto">
          <CalendarDays size={16} /> Go to Semesters
        </Link>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { activeSemester: currentSemester } = useSemesterContext()

  return (
    <MainLayout currentSemester={currentSemester}>
      <Routes>
        <Route path="/" element={<Dashboard currentSemester={currentSemester} />} />
        <Route path="/semesters" element={<Semesters />} />
        <Route path="/attendance" element={<RequireActiveSemester currentSemester={currentSemester}><Attendance /></RequireActiveSemester>} />
        <Route path="/members" element={<RequireActiveSemester currentSemester={currentSemester}><Members /></RequireActiveSemester>} />
        <Route path="/auditions" element={<RequireActiveSemester currentSemester={currentSemester}><Auditions /></RequireActiveSemester>} />
        <Route path="/absences" element={<RequireActiveSemester currentSemester={currentSemester}><Absences /></RequireActiveSemester>} />
        <Route path="/judges" element={<RequireActiveSemester currentSemester={currentSemester}><Judges /></RequireActiveSemester>} />
        <Route path="/officers" element={<RequireActiveSemester currentSemester={currentSemester}><Officers /></RequireActiveSemester>} />
        <Route
          path="/elections"
          element={
            <RequireActiveSemester currentSemester={currentSemester}>
              <div className="page-shell">
                <PlaceholderPage
                  icon={UserCheck}
                  title="Officer Elections"
                  description="Election setup, voting windows, and result summaries can be managed here. Coming soon in a future update."
                />
              </div>
            </RequireActiveSemester>
          }
        />
        <Route path="/reports" element={<RequireActiveSemester currentSemester={currentSemester}><Reports /></RequireActiveSemester>} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="*"
          element={
            <div className="page-shell">
              <PlaceholderPage
                icon={CalendarDays}
                title="Page not found"
                description="Choose a section from the sidebar to continue."
              />
            </div>
          }
        />
      </Routes>
    </MainLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <SemesterProvider>
                    <AppRoutes />
                  </SemesterProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

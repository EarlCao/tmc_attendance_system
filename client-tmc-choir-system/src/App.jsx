import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { BarChart3, CalendarDays, Settings, UserCheck } from 'lucide-react'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Attendance from './pages/Attendance'
import Absences from './pages/Absences'
import Members from './pages/Members'
import Auditions from './pages/Auditions'
import { activeSemester, judges, semesters } from './data/mockData'
import { formatDateShort, getStatusColor } from './lib/utils'

function PlaceholderPage({ icon: Icon, title, description }) {
  return (
    <div className="card p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon size={22} />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{description}</p>
    </div>
  )
}

function Semesters() {
  return (
    <div className="page-shell">
      <div className="grid gap-4">
        {semesters.map((semester) => (
          <div key={semester.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{semester.name}</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDateShort(semester.startDate)} to {formatDateShort(semester.endDate)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500">{semester.totalSessions} sessions</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(semester.status)}`}>
                  {semester.status === 'active' ? 'Active' : 'Archived'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Judges() {
  return (
    <div className="page-shell grid gap-4 lg:grid-cols-3">
      {judges.map((judge) => (
        <div key={judge.id} className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{judge.name}</h2>
              <p className="mt-1 text-xs text-gray-500">{judge.title}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(judge.status)}`}>
              {judge.status}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-xs text-gray-500">
            <p>{judge.specialization}</p>
            <p>{judge.email}</p>
            <p>{judge.contact}</p>
          </div>
          <div className="mt-4 border-t border-gray-50 pt-3 text-xs font-medium text-gray-700">
            {judge.ratingsGiven} ratings submitted
          </div>
        </div>
      ))}
    </div>
  )
}

function Reports() {
  return (
    <PlaceholderPage
      icon={BarChart3}
      title="Reports"
      description={`Attendance and audition summaries are ready to be connected for ${activeSemester?.name ?? 'the active semester'}.`}
    />
  )
}

function SettingsPage() {
  return (
    <PlaceholderPage
      icon={Settings}
      title="Settings"
      description="System preferences, roles, and choir profile settings can be configured here."
    />
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/semesters" element={<Semesters />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/absences" element={<Absences />} />
          <Route path="/members" element={<Members />} />
          <Route path="/auditions" element={<Auditions />} />
          <Route path="/judges" element={<Judges />} />
          <Route
            path="/officers"
            element={
              <PlaceholderPage
                icon={UserCheck}
                title="Officers"
                description="Officer records, terms, and responsibilities are ready for backend connection."
              />
            }
          />
          <Route
            path="/elections"
            element={
              <PlaceholderPage
                icon={UserCheck}
                title="Officer Elections"
                description="Election setup, voting windows, and result summaries can be managed here."
              />
            }
          />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="*"
            element={
              <PlaceholderPage
                icon={CalendarDays}
                title="Page not found"
                description="Choose a section from the sidebar to continue."
              />
            }
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  )
}

import { useRules } from '../../hooks/useRules'
import { Loader2, BookOpen } from 'lucide-react'
import EmptyState from '../../components/common/EmptyState'

export default function MemberRules() {
  const { rules, loading } = useRules()

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-4 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Choir Rules & Regulations</h2>
            <p className="mt-1 text-[13px] font-medium text-slate-500">
              Please review and follow these guidelines.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {rules.filter(rule => rule.status?.toLowerCase() === 'active').length > 0 ? rules.filter(rule => rule.status?.toLowerCase() === 'active').map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-slate-100 p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[14px] font-black text-slate-800">{rule.title}</h4>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{rule.category}</span>
                  </div>
                  <p className="mt-2 text-[13px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{rule.description}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full">
              <EmptyState title="No rules available" description="There are currently no rules published." />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

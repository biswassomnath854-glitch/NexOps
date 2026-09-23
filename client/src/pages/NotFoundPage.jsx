import { Link } from 'react-router-dom'
import { FileQuestion, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-xs">
        <FileQuestion className="w-8 h-8" />
      </div>

      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-3">
        Error 404
      </span>

      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-slate-500 max-w-md mb-8">
        The workspace resource or page URL you requested could not be located in this
        organization realm.
      </p>

      <Link to={ROUTES.DASHBOARD}>
        <Button variant="primary" size="md" leftIcon={ArrowLeft}>
          Return to Workspace Dashboard
        </Button>
      </Link>
    </div>
  )
}

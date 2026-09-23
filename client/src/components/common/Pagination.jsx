import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/forms/Select'

export function Pagination({
  totalItems = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  if (totalItems <= 0) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  // Generate page numbers with windowing
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i)
      }

      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-slate-200/80 bg-white rounded-b-xl text-xs text-slate-600">
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-slate-900">{startItem}</strong> to{' '}
          <strong className="text-slate-900">{endItem}</strong> of{' '}
          <strong className="text-slate-900">{totalItems}</strong> records
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-400">Rows:</span>
            <Select
              value={pageSize.toString()}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              options={pageSizeOptions.map((opt) => ({
                value: opt.toString(),
                label: opt.toString(),
              }))}
              className="w-18 py-1 text-xs"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentPage <= 1}
          className="p-1.5 h-8 w-8"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                  ...
                </span>
              )
            }

            const isCurrent = page === currentPage
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange(page)}
                className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-medium transition-colors ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="p-1.5 h-8 w-8"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

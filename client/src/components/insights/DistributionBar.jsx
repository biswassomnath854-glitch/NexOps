import { cn } from '@/utils/cn'

/**
 * Segmented horizontal distribution bar.
 * Proportionally renders segments (e.g. status, priority, or workload breakdown).
 * Includes accessible text labels, tooltips, and a clean legend.
 *
 * @param {Array<{ label: string, value: number, color: string, key?: string }>} segments
 * @param {number} total - total count (or calculated from sum of values)
 * @param {boolean} showLegend - whether to display the itemized breakdown underneath
 * @param {string} height - height class for the bar (default 'h-3')
 */
export function DistributionBar({
  segments = [],
  total,
  showLegend = true,
  height = 'h-3',
  className,
}) {
  const calculatedTotal = total ?? segments.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)

  return (
    <div className={cn('space-y-3', className)}>
      {/* Segmented bar */}
      <div
        className={cn(
          'w-full flex rounded-full overflow-hidden bg-slate-100 p-0.5 border border-slate-200/60 shadow-inner',
          height
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={calculatedTotal}
        aria-valuenow={calculatedTotal}
      >
        {calculatedTotal > 0 ? (
          segments.map((seg, idx) => {
            const val = Number(seg.value) || 0
            if (val <= 0) return null
            const pct = Math.max(1, (val / calculatedTotal) * 100)

            return (
              <div
                key={seg.key || seg.label || idx}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 relative group"
                style={{
                  width: `${pct}%`,
                  backgroundColor: seg.color,
                }}
                title={`${seg.label}: ${val} (${((val / calculatedTotal) * 100).toFixed(1)}%)`}
              />
            )
          })
        ) : (
          <div className="w-full h-full bg-slate-200 rounded-full" />
        )}
      </div>

      {/* Accessible itemized legend */}
      {showLegend && segments.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          {segments.map((seg, idx) => {
            const val = Number(seg.value) || 0
            const pct = calculatedTotal > 0 ? ((val / calculatedTotal) * 100).toFixed(1) : '0'

            return (
              <div
                key={seg.key || seg.label || idx}
                className="flex items-center gap-2 text-slate-600"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: seg.color }}
                  aria-hidden="true"
                />
                <span className="font-medium text-slate-700">{seg.label}</span>
                <span className="font-mono text-slate-900 font-semibold tabular-nums">
                  {val}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({pct}%)
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

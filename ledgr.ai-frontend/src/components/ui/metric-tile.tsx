import * as React from 'react'
import { cn } from '../../lib/utils'

export interface MetricTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: React.ReactNode
  hint?: string
  variant?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'neutral'
  loading?: boolean
  compact?: boolean
}

const variantClasses: Record<NonNullable<MetricTileProps['variant']>, string> = {
  indigo: 'bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent border-neutral-700/40',
  emerald: 'bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border-neutral-700/40',
  rose: 'bg-gradient-to-br from-rose-500/10 via-transparent to-transparent border-neutral-700/40',
  amber: 'bg-gradient-to-br from-amber-500/10 via-transparent to-transparent border-neutral-700/40',
  neutral: 'bg-neutral-800/40 border-neutral-700/40'
}

export const MetricTile = React.forwardRef<HTMLDivElement, MetricTileProps>(function MetricTile(
  { label, value, hint, variant='neutral', loading=false, compact=false, className, ...rest }, ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col justify-center rounded-sm border px-3 py-2 transition-colors',
        compact ? 'gap-0.5' : 'gap-1',
        variantClasses[variant],
        loading && 'animate-pulse',
        className
      )}
      {...rest}
    >
      <span className="text-[10px] uppercase tracking-wide text-neutral-500 flex items-center gap-1">
        {label}
        {hint && <span className="text-[9px] text-neutral-600 dark:text-neutral-500" title={hint}>?</span>}
      </span>
      <span className="text-sm font-medium text-neutral-200 tabular-nums">
        {loading ? <span className="inline-block h-3 w-12 rounded bg-neutral-700/60" /> : value}
      </span>
    </div>
  )
})

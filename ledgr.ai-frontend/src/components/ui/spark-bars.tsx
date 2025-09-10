import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

export interface SparkBarsProps {
  values: number[];
  className?: string;
  highlightLast?: boolean;
  minBarHeight?: number; // px minimum
  animate?: boolean;
  positiveGradientClass?: string; // tailwind gradient classes
  negativeGradientClass?: string;
  'aria-label'?: string;
}

// Reusable, accessible mini bar sparkline for small numeric sequences.
export const SparkBars: React.FC<SparkBarsProps> = ({
  values,
  className,
  highlightLast = true,
  minBarHeight = 8,
  animate = true,
  positiveGradientClass = 'bg-gradient-to-t from-emerald-500/60 to-emerald-400/30',
  negativeGradientClass = 'bg-gradient-to-t from-red-500/60 to-red-400/30',
  'aria-label': ariaLabel
}) => {
  const [mounted, setMounted] = useState(!animate);
  useEffect(() => { if (animate) { const t = requestAnimationFrame(()=> setMounted(true)); return () => cancelAnimationFrame(t); } }, [animate]);
  if (!values || values.length === 0) return null;

  const absValues = values.map(v => Math.abs(v));
  const max = Math.max(...absValues);
  const min = Math.min(...absValues);
  const range = Math.max(1, max - min);

  return (
    <div
      className={cn('flex gap-0.5 items-end h-8', className)}
      aria-label={ariaLabel || 'spark bars'}
      role="img"
    >
      {values.map((v, idx) => {
        const normalized = ((Math.abs(v) - min) / range) * 100;
        const height = Math.max(minBarHeight, normalized);
        const isNegative = v < 0;
        return (
          <div
            key={idx}
            className={cn(
              'flex-1 rounded-sm transition-all ease-out',
              animate && 'duration-500',
              isNegative ? negativeGradientClass : positiveGradientClass,
              highlightLast && idx === values.length - 1 && 'ring-1 ring-neutral-200/10'
            )}
            style={{
              height: mounted ? height + '%' : 4,
              transitionDelay: animate ? `${idx * 40}ms` : undefined
            }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
};

SparkBars.displayName = 'SparkBars';

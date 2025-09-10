import * as React from 'react';
import { cn } from '../../lib/utils';

// Lightweight shadcn-style Card primitives adapted to existing neutral styling.
// Keeps current dark backgrounds while allowing composition and future data injection.

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean; // Optional tighter padding variant
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, inset = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative rounded-md border border-neutral-800/60 bg-neutral-800/80 backdrop-blur-sm shadow-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400/40',
        inset ? 'p-3' : 'p-4',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1 mb-2', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-sm font-medium tracking-tight text-neutral-200', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-xs text-neutral-400 leading-snug', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm text-neutral-300 space-y-2', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-2 mt-2 border-t border-neutral-700/50 text-xs text-neutral-400', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

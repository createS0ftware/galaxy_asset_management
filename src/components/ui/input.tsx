import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none',
        'placeholder:text-muted-foreground/60 selection:bg-primary selection:text-primary-foreground',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
        'file:text-foreground aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

/** shadcn-style native select (appearance-none + chevron) */
function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className="relative w-full">
      <select
        data-slot="select"
        className={cn(
          'flex h-9 w-full appearance-none rounded-md border border-input bg-card px-3 pr-8 text-sm shadow-xs outline-none transition-[color,box-shadow]',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export { Input, Select };

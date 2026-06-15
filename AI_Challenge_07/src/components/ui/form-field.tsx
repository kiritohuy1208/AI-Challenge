import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface FormFieldProps {
  id: string
  label: string
  error?: string
  required?: boolean
  description?: string
  className?: string
  children: ReactNode
}

export function FormField({
  id,
  label,
  error,
  required = false,
  description,
  className,
  children,
}: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined
  const descriptionId = description ? `${id}-description` : undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        )}
      </label>

      {description && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {children}

      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export const fieldInputClassName =
  'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20'

export const fieldSelectClassName = fieldInputClassName

import { CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface SubmitSuccessProps {
  onStartNew: () => void
}

export function SubmitSuccess({ onStartNew }: SubmitSuccessProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-12 text-center sm:px-6 sm:py-16"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="size-9" aria-hidden />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Claim submitted successfully
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Your claim has been received. The full submission payload was logged to the
          browser console for review.
        </p>
      </div>

      <Button type="button" onClick={onStartNew} className="w-full sm:w-auto">
        Submit another claim
      </Button>
    </div>
  )
}

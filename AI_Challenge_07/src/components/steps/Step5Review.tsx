import type { ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  CLAIM_TYPE_OPTIONS,
} from '@/schemas/wizardSchemas'
import {
  getDependentById,
  getVisibleDocumentEntries,
  isDocumentRequired,
} from '@/data/mockData'
import { cn } from '@/lib/utils'
import type { ClaimType, WizardFormValues, WizardStep } from '@/types'
import { formatDisplayDate } from '@/utils/formatDisplay'
import { formatFileSize } from '@/utils/fileValidation'

interface ReviewSectionProps {
  title: string
  step: WizardStep
  onEdit: (step: WizardStep) => void
  children: ReactNode
}

function ReviewSection({ title, step, onEdit, children }: ReviewSectionProps) {
  return (
    <section
      aria-labelledby={`review-section-${step}`}
      className="rounded-lg border border-border bg-muted/20"
    >
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 id={`review-section-${step}`} className="text-sm font-semibold text-foreground">
          {title}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEdit(step)}
          className="w-full sm:w-auto"
          aria-label={`Edit ${title}`}
        >
          <Pencil aria-hidden />
          Edit
        </Button>
      </div>
      <dl className="divide-y divide-border px-4">{children}</dl>
    </section>
  )
}

function ReviewRow({
  label,
  value,
  className,
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid gap-1 py-3 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-4 sm:py-3.5',
        className,
      )}
    >
      <dt className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</dt>
      <dd className="text-sm text-foreground break-words">{value}</dd>
    </div>
  )
}

export function Step5Review() {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext<WizardFormValues>()

  const values = watch()
  const claimType = values.claimType as ClaimType

  const claimTypeLabel =
    CLAIM_TYPE_OPTIONS.find((option) => option.value === claimType)?.label ?? '—'

  const dependent =
    values.isClaimForDependent && values.dependentId
      ? getDependentById(values.dependentId)
      : null

  const documentEntries = claimType
    ? getVisibleDocumentEntries(claimType, values.isMajorDental)
    : []

  const goToStep = (step: WizardStep) => {
    setValue('currentStep', step, { shouldDirty: true })
  }

  return (
    <div className="space-y-4">
      <ReviewSection title="Claim type" step={1} onEdit={goToStep}>
        <ReviewRow label="Type" value={claimTypeLabel} />
      </ReviewSection>

      <ReviewSection title="Member & policy" step={2} onEdit={goToStep}>
        <ReviewRow label="Member name" value={values.memberName || '—'} />
        <ReviewRow label="Policy number" value={values.policyNumber || '—'} />
        <ReviewRow label="Member ID" value={values.memberId || '—'} />
        <ReviewRow label="Date of birth" value={formatDisplayDate(values.dateOfBirth)} />
        <ReviewRow
          label="Claim for dependent"
          value={values.isClaimForDependent ? 'Yes' : 'No'}
        />
        {values.isClaimForDependent && (
          <ReviewRow
            label="Dependent"
            value={
              dependent
                ? `${dependent.name} (${dependent.relationship})`
                : '—'
            }
          />
        )}
      </ReviewSection>

      <ReviewSection title="Diagnosis & treatment" step={3} onEdit={goToStep}>
        <ReviewRow label="Diagnosis" value={values.diagnosisDescription || '—'} />
        <ReviewRow
          label="ICD-10 code"
          value={
            values.icd10Code
              ? `${values.icd10Code} — ${values.icd10Description}`
              : '—'
          }
        />
        <ReviewRow label="Provider / hospital" value={values.providerName || '—'} />

        {(claimType === 'OUTPATIENT' || claimType === 'DENTAL') && (
          <ReviewRow
            label="Treatment date"
            value={formatDisplayDate(values.treatmentDate)}
          />
        )}

        {claimType === 'INPATIENT' && (
          <>
            <ReviewRow
              label="Admission date"
              value={formatDisplayDate(values.admissionDate)}
            />
            <ReviewRow
              label="Discharge date"
              value={formatDisplayDate(values.dischargeDate)}
            />
            <ReviewRow
              label="Length of stay"
              value={
                values.lengthOfStay != null ? `${values.lengthOfStay} day(s)` : '—'
              }
            />
            <ReviewRow label="Admission reason" value={values.admissionReason || '—'} />
          </>
        )}

        {claimType === 'DENTAL' && (
          <ReviewRow
            label="Major dental procedure"
            value={values.isMajorDental ? 'Yes' : 'No'}
          />
        )}
      </ReviewSection>

      <ReviewSection title="Documents" step={4} onEdit={goToStep}>
        {documentEntries.length === 0 ? (
          <ReviewRow label="Documents" value="—" />
        ) : (
          documentEntries.map((entry) => {
            const upload = values.documents[entry.type]
            const required = isDocumentRequired(entry, values.isMajorDental)

            return (
              <ReviewRow
                key={entry.type}
                label={`${entry.label}${required ? '' : ' (optional)'}`}
                value={
                  upload?.fileName ? (
                    <span>
                      {upload.fileName}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({formatFileSize(upload.fileSize)})
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not uploaded</span>
                  )
                }
              />
            )
          })
        )}
      </ReviewSection>

      <div className="rounded-lg border border-border bg-card p-4">
        <label
          htmlFor="confirmationChecked"
          className={cn(
            'flex cursor-pointer items-start gap-3',
            errors.confirmationChecked && 'text-destructive',
          )}
        >
          <input
            id="confirmationChecked"
            type="checkbox"
            {...register('confirmationChecked')}
            className="mt-0.5 size-4 accent-primary"
            aria-invalid={errors.confirmationChecked ? true : undefined}
            aria-describedby={
              errors.confirmationChecked ? 'confirmationChecked-error' : undefined
            }
          />
          <span className="text-sm text-foreground">
            I confirm this information is accurate
            <span className="ml-0.5 text-destructive" aria-hidden>
              *
            </span>
          </span>
        </label>

        {errors.confirmationChecked && (
          <p
            id="confirmationChecked-error"
            role="alert"
            className="mt-2 text-xs text-destructive"
          >
            {errors.confirmationChecked.message}
          </p>
        )}
      </div>
    </div>
  )
}

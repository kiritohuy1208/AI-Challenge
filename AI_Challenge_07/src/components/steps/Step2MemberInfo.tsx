import { useFormContext } from 'react-hook-form'

import {
  fieldInputClassName,
  fieldSelectClassName,
  FormField,
} from '@/components/ui/form-field'
import { mockDependents } from '@/data/mockData'
import { cn } from '@/lib/utils'
import type { WizardFormValues } from '@/types'

export function Step2MemberInfo() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<WizardFormValues>()

  const isClaimForDependent = watch('isClaimForDependent')

  const handleDependentToggle = (forDependent: boolean) => {
    setValue('isClaimForDependent', forDependent, { shouldDirty: true })

    if (!forDependent) {
      setValue('dependentId', null, { shouldDirty: true })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="memberName"
          label="Member name"
          required
          error={errors.memberName?.message}
          className="sm:col-span-2"
        >
          <input
            {...register('memberName')}
            id="memberName"
            type="text"
            autoComplete="name"
            aria-invalid={errors.memberName ? true : undefined}
            className={fieldInputClassName}
          />
        </FormField>

        <FormField
          id="policyNumber"
          label="Policy number"
          required
          error={errors.policyNumber?.message}
        >
          <input
            {...register('policyNumber')}
            id="policyNumber"
            type="text"
            aria-invalid={errors.policyNumber ? true : undefined}
            className={fieldInputClassName}
          />
        </FormField>

        <FormField
          id="memberId"
          label="Member ID"
          required
          error={errors.memberId?.message}
        >
          <input
            {...register('memberId')}
            id="memberId"
            type="text"
            aria-invalid={errors.memberId ? true : undefined}
            className={fieldInputClassName}
          />
        </FormField>

        <FormField
          id="dateOfBirth"
          label="Date of birth"
          required
          error={errors.dateOfBirth?.message}
          className="sm:col-span-2 sm:max-w-xs"
        >
          <input
            {...register('dateOfBirth')}
            id="dateOfBirth"
            type="date"
            aria-invalid={errors.dateOfBirth ? true : undefined}
            className={fieldInputClassName}
          />
        </FormField>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium text-foreground">
          Is this claim for a dependent?
        </legend>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          {[
            { value: false, label: 'No — claim is for me' },
            { value: true, label: 'Yes — claim is for a dependent' },
          ].map(({ value, label }) => {
            const inputId = value ? 'claim-for-dependent-yes' : 'claim-for-dependent-no'
            const isSelected = isClaimForDependent === value

            return (
              <label
                key={label}
                htmlFor={inputId}
                className={cn(
                  'flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border hover:bg-muted/40',
                )}
              >
                <input
                  id={inputId}
                  type="radio"
                  name="isClaimForDependent"
                  checked={isSelected}
                  onChange={() => handleDependentToggle(value)}
                  className="size-4 accent-primary"
                />
                {label}
              </label>
            )
          })}
        </div>
      </fieldset>

      {isClaimForDependent && (
        <FormField
          id="dependentId"
          label="Select dependent"
          required
          error={errors.dependentId?.message}
          className="sm:max-w-md"
        >
          <select
            {...register('dependentId', {
              setValueAs: (value) => (value === '' ? null : value),
            })}
            id="dependentId"
            defaultValue=""
            aria-invalid={errors.dependentId ? true : undefined}
            className={fieldSelectClassName}
          >
            <option value="" disabled>
              Choose a dependent
            </option>
            {mockDependents.map((dependent) => (
              <option key={dependent.id} value={dependent.id}>
                {dependent.name} ({dependent.relationship})
              </option>
            ))}
          </select>
        </FormField>
      )}
    </div>
  )
}

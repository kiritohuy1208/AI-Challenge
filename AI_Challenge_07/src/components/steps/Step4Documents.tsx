import { useFormContext } from 'react-hook-form'

import { FileUpload } from '@/components/ui/FileUpload'
import {
  getVisibleDocumentEntries,
  isDocumentRequired,
} from '@/data/mockData'
import { cn } from '@/lib/utils'
import type { ClaimType, DocumentType, UploadedDocument, WizardFormValues } from '@/types'

export function Step4Documents() {
  const {
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<WizardFormValues>()

  const claimType = watch('claimType') as ClaimType | ''
  const isMajorDental = watch('isMajorDental')
  const documents = watch('documents') ?? {}

  if (!claimType) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a claim type in Step 1 to see required documents.
      </p>
    )
  }

  const documentEntries = getVisibleDocumentEntries(claimType, isMajorDental)

  const setDocument = (type: DocumentType, document: UploadedDocument) => {
    setValue(
      'documents',
      {
        ...documents,
        [type]: document,
      },
      { shouldDirty: true, shouldValidate: true },
    )
  }

  const removeDocument = (type: DocumentType) => {
    const nextDocuments = { ...documents }
    delete nextDocuments[type]
    setValue('documents', nextDocuments, { shouldDirty: true, shouldValidate: true })
  }

  const handleMajorDentalChange = (checked: boolean) => {
    setValue('isMajorDental', checked, { shouldDirty: true, shouldValidate: true })

    if (!checked) {
      const currentDocuments = getValues('documents') ?? {}

      if (currentDocuments.TREATMENT_PLAN) {
        const nextDocuments = { ...currentDocuments }
        delete nextDocuments.TREATMENT_PLAN
        setValue('documents', nextDocuments, { shouldDirty: true, shouldValidate: true })
      }
    }
  }

  const getDocumentError = (type: DocumentType): string | undefined => {
    const documentErrors = errors.documents

    if (!documentErrors || typeof documentErrors !== 'object') {
      return undefined
    }

    const typeError = (documentErrors as Record<string, { message?: string }>)[type]

    return typeError?.message
  }

  return (
    <div className="space-y-6">
      {claimType === 'DENTAL' && (
        <label
          htmlFor="isMajorDental"
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors',
            isMajorDental && 'border-primary bg-primary/5',
          )}
        >
          <input
            id="isMajorDental"
            type="checkbox"
            checked={isMajorDental}
            onChange={(event) => handleMajorDentalChange(event.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">
              This is a major dental procedure
            </span>
            <span className="block text-xs text-muted-foreground">
              Major procedures (e.g. crowns, implants, orthodontics) require a treatment plan.
            </span>
          </span>
        </label>
      )}

      <div className="space-y-5">
        {documentEntries.map((entry) => {
          const required = isDocumentRequired(entry, isMajorDental)

          return (
            <FileUpload
              key={entry.type}
              documentType={entry.type}
              label={entry.label}
              required={required}
              value={documents[entry.type]}
              error={getDocumentError(entry.type)}
              onUpload={(document) => setDocument(entry.type, document)}
              onRemove={() => removeDocument(entry.type)}
            />
          )
        })}
      </div>
    </div>
  )
}

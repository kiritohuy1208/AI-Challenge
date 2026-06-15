import { useEffect, useRef, useState } from 'react'
import { FileUp, Loader2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useDocumentUpload } from '@/context/DocumentUploadContext'
import { cn } from '@/lib/utils'
import type { DocumentType, UploadedDocument } from '@/types'
import {
  formatFileSize,
  simulateUploadProgress,
  validateUploadFile,
} from '@/utils/fileValidation'

interface FileUploadProps {
  documentType: DocumentType
  label: string
  required: boolean
  value?: UploadedDocument
  error?: string
  onUpload: (document: UploadedDocument) => void
  onRemove: () => void
}

export function FileUpload({
  documentType,
  label,
  required,
  value,
  error,
  onUpload,
  onRemove,
}: FileUploadProps) {
  const { setSlotUploading } = useDocumentUpload()
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const cancelUploadRef = useRef<(() => void) | null>(null)

  const displayError = error ?? localError
  const inputId = `file-upload-${documentType}`

  useEffect(() => {
    return () => {
      cancelUploadRef.current?.()
      setSlotUploading(documentType, false)
    }
  }, [documentType, setSlotUploading])

  const setUploading = (uploading: boolean) => {
    setIsUploading(uploading)
    setSlotUploading(documentType, uploading)
  }

  const startUpload = (file: File) => {
    const validation = validateUploadFile(file)

    if (!validation.valid) {
      setLocalError(validation.error ?? 'Invalid file')
      setUploading(false)
      return
    }

    setLocalError(null)
    setUploading(true)
    setUploadProgress(0)

    cancelUploadRef.current?.()
    cancelUploadRef.current = simulateUploadProgress(
      setUploadProgress,
      () => {
        setUploading(false)
        setUploadProgress(100)
        onUpload({
          file,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || file.name.split('.').pop() || 'unknown',
        })
      },
    )
  }

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]

    if (!file) {
      return
    }

    startUpload(file)
  }

  const handleRemove = () => {
    cancelUploadRef.current?.()
    cancelUploadRef.current = null
    setUploading(false)
    setUploadProgress(0)
    setLocalError(null)
    onRemove()

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const hasUploadedFile = Boolean(value?.fileName) && !isUploading

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
          {required ? (
            <span className="ml-1 text-destructive" aria-hidden>
              *
            </span>
          ) : (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (optional)
            </span>
          )}
        </label>
      </div>

      {hasUploadedFile ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{value?.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(value?.fileSize ?? 0)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            aria-label={`Remove ${label}`}
          >
            <Trash2 aria-hidden />
            Remove
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed p-6 transition-colors',
            isUploading
              ? 'border-primary/40 bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-muted/20',
            displayError && 'border-destructive/50',
          )}
          onDragOver={(event) => {
            event.preventDefault()
          }}
          onDrop={(event) => {
            event.preventDefault()

            if (!isUploading) {
              handleFiles(event.dataTransfer.files)
            }
          }}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => handleFiles(event.target.files)}
          />

          <label
            htmlFor={inputId}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-2 text-center',
              isUploading && 'cursor-wait',
            )}
          >
            {isUploading ? (
              <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
            ) : (
              <FileUp className="size-8 text-muted-foreground" aria-hidden />
            )}

            <span className="text-sm font-medium text-foreground">
              {isUploading ? 'Uploading…' : 'Click to upload or drag and drop'}
            </span>
            <span className="text-xs text-muted-foreground">
              PDF, JPG, or PNG up to 10 MB
            </span>
          </label>

          {isUploading && (
            <div className="mt-4 space-y-1">
              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={uploadProgress}
                aria-label={`Uploading ${label}`}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          )}
        </div>
      )}

      {displayError && (
        <p role="alert" className="text-xs text-destructive">
          {displayError}
        </p>
      )}
    </div>
  )
}

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface DocumentUploadContextValue {
  isAnyUploading: boolean
  setSlotUploading: (slotId: string, uploading: boolean) => void
}

const DocumentUploadContext = createContext<DocumentUploadContextValue | null>(null)

export function DocumentUploadProvider({ children }: { children: ReactNode }) {
  const [uploadingSlots, setUploadingSlots] = useState<Set<string>>(() => new Set())

  const setSlotUploading = useCallback((slotId: string, uploading: boolean) => {
    setUploadingSlots((previous) => {
      const next = new Set(previous)

      if (uploading) {
        next.add(slotId)
      } else {
        next.delete(slotId)
      }

      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      isAnyUploading: uploadingSlots.size > 0,
      setSlotUploading,
    }),
    [setSlotUploading, uploadingSlots],
  )

  return (
    <DocumentUploadContext.Provider value={value}>{children}</DocumentUploadContext.Provider>
  )
}

export function useDocumentUpload() {
  const context = useContext(DocumentUploadContext)

  if (!context) {
    throw new Error('useDocumentUpload must be used within DocumentUploadProvider')
  }

  return context
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
])

export const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png'])

export const UPLOAD_SIMULATION_MS = 1500

export interface FileValidationResult {
  valid: boolean
  error?: string
}

export function validateUploadFile(file: File): FileValidationResult {
  const extension = getFileExtension(file.name)

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return {
      valid: false,
      error: 'Only PDF, JPG, and PNG files are allowed',
    }
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: 'Only PDF, JPG, and PNG files are allowed',
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File must be 10 MB or smaller',
    }
  }

  return { valid: true }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.')

  if (index === -1) {
    return ''
  }

  return fileName.slice(index).toLowerCase()
}

export function simulateUploadProgress(
  onProgress: (value: number) => void,
  onComplete: () => void,
  durationMs: number = UPLOAD_SIMULATION_MS,
): () => void {
  const startedAt = performance.now()
  let frameId = 0

  const tick = (now: number) => {
    const elapsed = now - startedAt
    const progress = Math.min(100, Math.round((elapsed / durationMs) * 100))

    onProgress(progress)

    if (progress >= 100) {
      onComplete()
      return
    }

    frameId = requestAnimationFrame(tick)
  }

  frameId = requestAnimationFrame(tick)

  return () => cancelAnimationFrame(frameId)
}

import axios from 'axios'

export type FieldErrors = Record<string, string>

export type ParsedApiError = {
  message: string
  fieldErrors: FieldErrors
}

type Issue = {
  path?: string
  message?: string
}

function toUserFriendlyMessage(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('trim is not a function') || normalized.includes('is not a function')) {
    return 'No se pudo procesar el formulario. Verificá los datos e intentá nuevamente.'
  }

  return message
}

function normalizeFieldErrors(details: unknown): FieldErrors {
  const fieldErrors: FieldErrors = {}

  if (!details) {
    return fieldErrors
  }

  if (Array.isArray(details)) {
    for (const issue of details as Issue[]) {
      const path = issue.path?.trim()
      if (!path || !issue.message || fieldErrors[path]) {
        continue
      }
      fieldErrors[path] = issue.message
    }
    return fieldErrors
  }

  if (typeof details === 'object') {
    const maybeDetails = details as {
      fields?: Record<string, string[] | string>
      issues?: Issue[]
    }

    if (maybeDetails.fields && typeof maybeDetails.fields === 'object') {
      for (const [field, value] of Object.entries(maybeDetails.fields)) {
        if (fieldErrors[field]) {
          continue
        }

        if (Array.isArray(value) && value.length > 0) {
          fieldErrors[field] = String(value[0])
        } else if (typeof value === 'string' && value.trim()) {
          fieldErrors[field] = value
        }
      }
    }

    if (Array.isArray(maybeDetails.issues)) {
      for (const issue of maybeDetails.issues) {
        const path = issue.path?.trim()
        if (!path || !issue.message || fieldErrors[path]) {
          continue
        }
        fieldErrors[path] = issue.message
      }
    }
  }

  return fieldErrors
}

export function parseApiError(error: unknown): ParsedApiError {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error && error.message.trim()) {
      return {
        message: toUserFriendlyMessage(error.message),
        fieldErrors: {},
      }
    }

    return {
      message: 'Error inesperado de red o servidor',
      fieldErrors: {},
    }
  }

  if (!error.response) {
    return {
      message: 'No se pudo conectar con el servidor. Verificá que el backend esté activo.',
      fieldErrors: {},
    }
  }

  const payload = error.response?.data as {
    message?: string
    error?: string
    details?: unknown
  }

  const message = payload?.message || payload?.error || error.message || 'No se pudo completar la operación'
  const fieldErrors = normalizeFieldErrors(payload?.details)

  return {
    message: toUserFriendlyMessage(message),
    fieldErrors,
  }
}

export class HttpError extends Error {
  status: number
  details?: unknown
  code?: string

  constructor(status: number, message: string, details?: unknown, code?: string) {
    super(message)
    this.status = status
    this.details = details
    this.code = code
  }
}

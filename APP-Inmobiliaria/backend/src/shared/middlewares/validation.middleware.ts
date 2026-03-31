import { NextFunction, Request, Response } from 'express'
import { z, ZodType } from 'zod'
import { HttpError } from '../errors/http.error.js'

type ValidationSource = 'body' | 'sanitizedInput'

type ValidateOptions = {
  source?: ValidationSource
}

export function validateBody<T>(
  schema: ZodType<T>,
  options?: ValidateOptions,
) {
  const source = options?.source ?? 'sanitizedInput'

  return (req: Request, _res: Response, next: NextFunction) => {
    const input = source === 'sanitizedInput' ? req.body?.sanitizedInput : req.body
    const result = schema.safeParse(input)

    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))

      const fields = issues.reduce<Record<string, string[]>>((acc, issue) => {
        const key = issue.path || 'general'
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(issue.message)
        return acc
      }, {})

      const details = {
        code: 'VALIDATION_ERROR',
        issues,
        fields,
      }

      return next(new HttpError(400, 'Datos inválidos', details, 'VALIDATION_ERROR'))
    }

    if (source === 'sanitizedInput') {
      req.body.sanitizedInput = result.data
    } else {
      req.body = result.data
    }

    next()
  }
}

import { NextFunction, Request, Response } from 'express'

type SanitizedInput = Record<string, unknown>

function buildSanitizer(fields: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const sanitizedInput: SanitizedInput = {}

    for (const field of fields) {
      const value = req.body?.[field]
      if (value !== undefined) {
        sanitizedInput[field] = value
      }
    }

    req.body.sanitizedInput = sanitizedInput
    next()
  }
}

export const sanitizeAgenteInput = buildSanitizer([
  'id',
  'nombre',
  'apellido',
  'email',
  'telefono',
  'fechaIngreso',
])

export const sanitizeClienteInput = buildSanitizer([
  'id',
  'nombre',
  'apellido',
  'email',
  'telefono',
  'tipo_documento',
  'nro_doc',
  'password',
])

export const sanitizeImagenInput = buildSanitizer([
  'propiedad',
  'base64',
  'filename',
])

export const sanitizeInmobiliariaInput = buildSanitizer([
  'nombre',
  'direccion',
  'telefono',
])

export const sanitizePropiedadInput = buildSanitizer([
  'direccion',
  'precio',
  'estado',
  'hora_desde',
  'hora_hasta',
  'descripcion',
  'tipoPropiedad',
  'inmobiliaria',
])

export const sanitizeSeniaInput = buildSanitizer([
  'importe',
  'propiedad',
  'cliente',
])

export const sanitizeTipoDocumentacionInput = buildSanitizer([
  'nombre',
  'descripcion',
  'fechaVencimiento',
])

export const sanitizeTipoPropiedadInput = buildSanitizer([
  'nombre',
  'estado',
])

export const sanitizeVisitaInput = buildSanitizer([
  'fecha_hora',
  'propiedad',
  'cliente',
])
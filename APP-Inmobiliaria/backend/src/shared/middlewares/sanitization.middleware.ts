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

// `id` no va en la lista a propósito: llega por la URL. Si se aceptara del
// cuerpo, un PUT con {"id": 999} terminaría en `em.assign` intentando reasignar
// la clave primaria.
export const sanitizeAgenteInput = buildSanitizer([
  'nombre',
  'apellido',
  'mail',
  'telefono',
  'tipo_doc',
  'nro_doc',
  'contrasenia',
  'fecha_ingreso',
  'inmobiliaria',
])

/** Mismo criterio que arriba: `id` viene de la URL, no del cuerpo. */
export const sanitizeClienteInput = buildSanitizer([
  'nombre',
  'apellido',
  'mail',
  'telefono',
  'tipo_doc',
  'nro_doc',
  'contrasenia',
])

export const sanitizeImagenInput = buildSanitizer([
  'propiedad',
  'base64',
  'filename',
])

export const sanitizeInmobiliariaInput = buildSanitizer([
  'descripcion',
  'direccion',
  'telefono',
])

export const sanitizePropiedadInput = buildSanitizer([
  'direccion',
  'superficie',
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
  'estado',
])

export const sanitizeAlquilerInput = buildSanitizer([
  'propiedad',
  'cliente',
  'fecha_inicio',
  'fecha_fin',
  'monto_mensual',
  'estado',
])

/** Para los endpoints PATCH /:clave/estado, que solo aceptan el estado. */
export const sanitizeEstadoInput = buildSanitizer([
  'estado',
])

/** Cierre de la seña: fechas del contrato y cómo se cobró el saldo. */
export const sanitizeConcretarInput = buildSanitizer([
  'fecha_inicio',
  'fecha_fin',
  'medioPago',
])

export const sanitizeDocumentacionClienteInput = buildSanitizer([
  'documentacion',
  'cliente',
  'estado',
  'observaciones',
])

export const sanitizePagoInput = buildSanitizer([
  'senia',
  'numeroTarjeta',
  'titular',
  'vencimiento',
  'cvv',
])

export const sanitizeDocumentacionInput = buildSanitizer([
  'descripcion',
  'fecha_vencimiento',
  'path',
  // Archivo subido como base64 en el JSON, igual que las imágenes de propiedades.
  'base64',
  'filename',
])

export const sanitizeTipoPropiedadInput = buildSanitizer([
  'descripcion',
])

export const sanitizeVisitaInput = buildSanitizer([
  'fecha_hora',
  'propiedad',
  'cliente',
])

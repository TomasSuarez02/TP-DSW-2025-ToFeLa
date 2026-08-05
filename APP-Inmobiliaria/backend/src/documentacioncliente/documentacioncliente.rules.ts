import { EntityManager } from '@mikro-orm/core'
import { DocumentacionCliente } from './documentacioncliente.entity.js'
import { HttpError } from '../shared/errors/http.error.js'

/**
 * Exige que el cliente tenga su documentación en regla para poder firmar.
 * Es la razón de ser del plazo que la seña le da a la propiedad: durante esos
 * días el agente revisa los papeles. Lanza 409 con el detalle si algo falta.
 */
export async function exigirDocumentacionAprobada(
  em: EntityManager,
  clienteId: number,
): Promise<DocumentacionCliente[]> {
  const presentadas = await em.find(
    DocumentacionCliente,
    { cliente: clienteId },
    { populate: ['documentacion'] },
  )

  if (presentadas.length === 0) {
    throw new HttpError(
      409,
      'El cliente todavía no presentó documentación',
      [{ path: 'documentacion', message: 'El cliente todavía no presentó documentación' }],
      'BUSINESS_RULE_ERROR',
    )
  }

  const sinAprobar = presentadas.filter((dc) => dc.estado !== 'aprobada')
  if (sinAprobar.length > 0) {
    const detalle = sinAprobar
      .map((dc) => `${dc.documentacion.descripcion} (${dc.estado})`)
      .join(', ')
    throw new HttpError(
      409,
      `Hay documentación sin aprobar: ${detalle}`,
      [{ path: 'documentacion', message: `Hay documentación sin aprobar: ${detalle}` }],
      'BUSINESS_RULE_ERROR',
    )
  }

  const hoy = new Date()
  const vencidas = presentadas.filter((dc) => new Date(dc.documentacion.fecha_vencimiento) < hoy)
  if (vencidas.length > 0) {
    const detalle = vencidas.map((dc) => dc.documentacion.descripcion).join(', ')
    throw new HttpError(
      409,
      `Hay documentación vencida: ${detalle}`,
      [{ path: 'documentacion', message: `Hay documentación vencida: ${detalle}` }],
      'BUSINESS_RULE_ERROR',
    )
  }

  return presentadas
}

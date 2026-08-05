import apiClient from '../utils/apiClient'
import type { DocumentacionCliente, EstadoDocumentacionCliente } from '../types/senia'

/**
 * Documentación que presentan los clientes y su revisión por parte del agente.
 * Es la condición para concretar un alquiler: ver docs/api-senias.md
 */

/** Todas las presentaciones (vista del agente). */
export async function obtenerDocumentacionClientes(): Promise<DocumentacionCliente[]> {
  const res = await apiClient.get('/documentacionclientes')
  return (res.data?.data ?? []) as DocumentacionCliente[]
}

/** Documentación del cliente autenticado. */
export async function obtenerMiDocumentacion(): Promise<DocumentacionCliente[]> {
  const res = await apiClient.get('/documentacionclientes/mis-documentaciones')
  return (res.data?.data ?? []) as DocumentacionCliente[]
}

/**
 * Registra que un cliente presentó un documento.
 * Un agente puede darlo por aprobado en el mismo acto (lo cargó porque ya vio
 * el papel); si no se aclara, queda pendiente de revisión.
 */
export async function presentarDocumentacion(
  documentacionId: number,
  clienteId: number,
  estado?: EstadoDocumentacionCliente,
): Promise<DocumentacionCliente> {
  const res = await apiClient.post('/documentacionclientes', {
    documentacion: documentacionId,
    cliente: clienteId,
    ...(estado ? { estado } : {}),
  })
  return (res.data?.data ?? res.data) as DocumentacionCliente
}

/** El agente aprueba o rechaza un documento presentado. */
export async function revisarDocumentacion(
  documentacionId: number,
  clienteId: number,
  estado: EstadoDocumentacionCliente,
  observaciones?: string,
): Promise<DocumentacionCliente> {
  const res = await apiClient.patch(
    `/documentacionclientes/${documentacionId}/${clienteId}/revisar`,
    { estado, ...(observaciones ? { observaciones } : {}) },
  )
  return (res.data?.data ?? res.data) as DocumentacionCliente
}

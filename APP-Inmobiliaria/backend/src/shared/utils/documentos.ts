/**
 * Carpeta donde viven los papeles que presentan los clientes.
 *
 * A diferencia de las fotos de propiedades, no se sirve por `express.static`:
 * son documentos personales (recibos de sueldo, garantías, DNI) y se bajan solo
 * por la ruta `GET /documentaciones/:id/archivo`, que valida quién pide.
 */
export const CARPETA_DOCUMENTOS = 'documentos'

import type { ReactNode } from 'react'

export interface Columna<T> {
  /** Identificador estable de la columna; es la key de React. */
  id: string
  encabezado: string
  celda: (fila: T) => ReactNode
  /** Números y montos: a la derecha, para poder compararlos verticalmente. */
  alinear?: 'izquierda' | 'derecha'
  /**
   * La columna que identifica la fila. En mobile pasa a ser el título de la
   * tarjeta en vez de un par etiqueta/valor más. Se marca una sola.
   */
  principal?: boolean
  /** Dato de apoyo que en una tarjeta de 375px sólo agrega ruido. */
  ocultarEnMobile?: boolean
}

/**
 * Tabla en desktop, tarjetas en mobile — el mismo dato, no dos componentes.
 *
 * El panel mostraba grillas de tarjetas también en escritorio, así que
 * comparar diez señas obligaba a leer diez bloques en vez de recorrer una
 * columna. Abajo de `md` la tabla no entra (nueve columnas en 375px), y ahí
 * cada fila se dibuja como tarjeta con las etiquetas del encabezado.
 */
export default function Tabla<T>({
  datos,
  columnas,
  claveFila,
  acciones,
  onFilaClick,
  etiquetaAcciones = 'Acciones',
}: {
  datos: T[]
  columnas: Columna<T>[]
  claveFila: (fila: T) => string | number
  /** Botones por fila. Van en su propia columna, alineados a la derecha. */
  acciones?: (fila: T) => ReactNode
  onFilaClick?: (fila: T) => void
  etiquetaAcciones?: string
}) {
  const visiblesEnMobile = columnas.filter((c) => !c.ocultarEnMobile)
  const principal = columnas.find((c) => c.principal)

  return (
    <>
      {/* --- Escritorio ------------------------------------------------- */}
      <div className="hidden overflow-hidden rounded-card border border-arena-200 bg-white shadow-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-arena-200 bg-arena-50">
                {columnas.map((col) => (
                  <th
                    key={col.id}
                    scope="col"
                    className={`px-4 py-3 text-xs font-semibold tracking-[0.08em] text-tinta-500 uppercase ${
                      col.alinear === 'derecha' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.encabezado}
                  </th>
                ))}
                {acciones && (
                  <th scope="col" className="px-4 py-3 text-right">
                    <span className="sr-only">{etiquetaAcciones}</span>
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {datos.map((fila) => (
                <tr
                  key={claveFila(fila)}
                  onClick={onFilaClick ? () => onFilaClick(fila) : undefined}
                  /* La fila responde cambiando de superficie, no saltando:
                     en una tabla de trabajo el movimiento distrae. */
                  className={`border-b border-arena-200 transition-colors last:border-0 hover:bg-arena-50 ${
                    onFilaClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columnas.map((col) => (
                    <td
                      key={col.id}
                      className={`px-4 py-3.5 align-middle text-tinta-700 ${
                        col.alinear === 'derecha' ? 'text-right tabular-nums' : 'text-left'
                      }`}
                    >
                      {col.celda(fila)}
                    </td>
                  ))}
                  {acciones && (
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end gap-2">{acciones(fila)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Mobile ----------------------------------------------------- */}
      <ul className="flex flex-col gap-3 md:hidden">
        {datos.map((fila) => (
          <li
            key={claveFila(fila)}
            onClick={onFilaClick ? () => onFilaClick(fila) : undefined}
            className="rounded-card border border-arena-200 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover"
          >
            {principal && (
              <div className="mb-3 border-b border-arena-200 pb-3 text-tinta-900">
                {principal.celda(fila)}
              </div>
            )}

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {visiblesEnMobile
                .filter((col) => !col.principal)
                .map((col) => (
                  <div key={col.id} className="contents">
                    <dt className="text-xs font-semibold tracking-[0.06em] text-tinta-500 uppercase">
                      {col.encabezado}
                    </dt>
                    <dd className="text-right text-tinta-700">{col.celda(fila)}</dd>
                  </div>
                ))}
            </dl>

            {acciones && (
              <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-arena-200 pt-3">
                {acciones(fila)}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

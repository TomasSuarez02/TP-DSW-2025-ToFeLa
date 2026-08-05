import { useCallback, useEffect, useRef, useState } from 'react'
import type { DependencyList } from 'react'
import { parseApiError } from '../utils/apiErrors'

export interface Recurso<T> {
  datos: T
  cargando: boolean
  error: string | null
  recargar: () => Promise<void>
  /** Para ajustar la lista después de un alta o baja, sin volver a pedirla. */
  setDatos: (datos: T) => void
}

/**
 * Carga un recurso remoto y expone los tres estados que la vista necesita.
 *
 * Cada pantalla del panel repetía el mismo bloque: un useState de datos, otro
 * de loading, un useCallback con try/catch/finally y un useEffect que lo
 * dispara. El error, además, casi siempre terminaba en `console.error` y la
 * pantalla se quedaba vacía sin explicar nada. Acá el error se parsea con el
 * mismo criterio que el resto de la app y llega a la vista.
 *
 *   const { datos: senias, cargando, error, recargar } =
 *     useRecurso(() => obtenerSenias(), [isAgent], [])
 *
 * Las respuestas viejas se descartan: si `recargar` se dispara dos veces, la
 * primera en volver ya no puede pisar a la última.
 */
export function useRecurso<T>(cargar: () => Promise<T>, deps: DependencyList, inicial: T): Recurso<T> {
  const [datos, setDatos] = useState<T>(inicial)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // La función cambia de identidad en cada render; lo que decide cuándo
  // recargar son las deps que declara quien llama, no la referencia.
  const cargarRef = useRef(cargar)
  cargarRef.current = cargar

  const peticion = useRef(0)
  const montado = useRef(true)
  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  const recargar = useCallback(async () => {
    const propia = ++peticion.current
    setCargando(true)
    setError(null)
    try {
      const resultado = await cargarRef.current()
      if (!montado.current || propia !== peticion.current) return
      setDatos(resultado)
    } catch (e) {
      if (!montado.current || propia !== peticion.current) return
      setError(parseApiError(e).message)
    } finally {
      if (montado.current && propia === peticion.current) setCargando(false)
    }
  }, [])

  useEffect(() => {
    void recargar()
    // Las deps las declara quien llama; el spread es intencional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recargar, ...deps])

  return { datos, cargando, error, recargar, setDatos }
}

import { useCallback, useRef, useState } from 'react'
import { parseApiError } from '../utils/apiErrors'
import type { FieldErrors } from '../utils/apiErrors'

export interface FormularioApi {
  enviando: boolean
  /** Error general: lo que no pertenece a ningún campo. */
  error: string | null
  erroresCampo: FieldErrors
  /** Devuelve true si salió bien. Nunca lanza. */
  enviar: (accion: () => Promise<void>) => Promise<boolean>
  /** Errores propios de la validación de cliente, antes de llamar a la API. */
  setErroresCampo: (errores: FieldErrors) => void
  setError: (mensaje: string | null) => void
  /** Al escribir en un campo, su error deja de ser cierto. */
  limpiarCampo: (nombre: string) => void
  limpiar: () => void
}

/**
 * Envío de formulario contra la API: estado de envío y errores ya parseados.
 *
 * Resuelve dos cosas que estaban sueltas en cada pantalla. La primera, el
 * doble submit: los formularios del panel se podían disparar dos veces con
 * doble clic y creaban el registro duplicado. La segunda, los errores por
 * campo, que `parseApiError` ya sabe extraer del backend pero que cada
 * pantalla cableaba a mano —o directamente tiraba a un alert().
 *
 *   const form = useFormularioApi()
 *   const ok = await form.enviar(async () => { await crearSenia(payload) })
 *   if (ok) { notificar('Seña creada'); cerrar() }
 */
export function useFormularioApi(): FormularioApi {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [erroresCampo, setErroresCampo] = useState<FieldErrors>({})

  // El estado llega tarde para frenar el segundo clic: entre el primero y el
  // re-render hay una ventana en la que `enviando` todavía es false.
  const enCurso = useRef(false)

  const enviar = useCallback(async (accion: () => Promise<void>) => {
    if (enCurso.current) return false
    enCurso.current = true
    setEnviando(true)
    setError(null)
    setErroresCampo({})
    try {
      await accion()
      return true
    } catch (e) {
      const { message, fieldErrors } = parseApiError(e)
      setError(message)
      setErroresCampo(fieldErrors)
      return false
    } finally {
      enCurso.current = false
      setEnviando(false)
    }
  }, [])

  const limpiarCampo = useCallback((nombre: string) => {
    setError(null)
    setErroresCampo((previos) => {
      if (!previos[nombre]) return previos
      const siguientes = { ...previos }
      delete siguientes[nombre]
      return siguientes
    })
  }, [])

  const limpiar = useCallback(() => {
    setError(null)
    setErroresCampo({})
  }, [])

  return {
    enviando,
    error,
    erroresCampo,
    enviar,
    setErroresCampo,
    setError,
    limpiarCampo,
    limpiar,
  }
}

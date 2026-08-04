import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'
import type { Rol } from './session'
import { EVENTO_SESION, guardarSesion, leerSesion, limpiarSesion } from './session'

/**
 * Única fuente de verdad del estado de sesión.
 *
 * Al montar lee el token de localStorage y descarta el que ya venció, así una
 * sesión vieja no hace que la app arranque como si el usuario siguiera logueado.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState(() => leerSesion())

  const sincronizar = useCallback(() => setSesion(leerSesion()), [])

  // Cambios hechos desde otro punto de la app (apiClient ante un 401) o desde otra pestaña
  useEffect(() => {
    window.addEventListener(EVENTO_SESION, sincronizar)
    window.addEventListener('storage', sincronizar)
    return () => {
      window.removeEventListener(EVENTO_SESION, sincronizar)
      window.removeEventListener('storage', sincronizar)
    }
  }, [sincronizar])

  // Cierra la sesión sola en el momento exacto en que el token vence,
  // sin esperar a que el usuario recargue la página
  useEffect(() => {
    if (!sesion?.expiraEn) return

    const restante = sesion.expiraEn - Date.now()
    if (restante <= 0) {
      limpiarSesion()
      setSesion(null)
      return
    }

    const timer = window.setTimeout(() => {
      limpiarSesion()
      setSesion(null)
    }, restante)

    return () => window.clearTimeout(timer)
  }, [sesion])

  const login = useCallback((token: string, rol?: Rol) => {
    const nueva = guardarSesion(token, rol)
    setSesion(nueva)
    return nueva !== null
  }, [])

  const logout = useCallback(() => {
    limpiarSesion()
    setSesion(null)
  }, [])

  const value: AuthContextValue = {
    sesion,
    isLoggedIn: sesion !== null,
    rol: sesion?.rol ?? null,
    userId: sesion?.userId ?? null,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

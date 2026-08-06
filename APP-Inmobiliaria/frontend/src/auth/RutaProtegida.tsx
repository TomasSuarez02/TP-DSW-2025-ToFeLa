import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import type { Rol } from './session'

/**
 * Envuelve una ruta que no debería verse sin sesión.
 *
 * Es solo la capa de usabilidad: evita que alguien llegue al panel escribiendo
 * la URL y vea el cascarón vacío. Lo que realmente protege los datos son los
 * middlewares `authenticateToken` / `soloAgente` del backend, porque cualquiera
 * puede saltearse esto pegándole directo a la API.
 */
export function RutaProtegida({
  children,
  rol,
}: {
  children: ReactNode
  /** Si se indica, además de estar logueado hay que tener este rol. */
  rol?: Rol
}) {
  const { isLoggedIn, rol: rolActual } = useAuth()
  const location = useLocation()

  // `state` guarda a dónde quería ir, para volver ahí después del login.
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  }

  // Un cliente que entra al panel del agente va a lo suyo, no al login: ya
  // tiene sesión, mandarlo a loguearse de nuevo no resuelve nada.
  if (rol && rolActual !== rol) {
    return <Navigate to={rolActual === 'cliente' ? '/mi-cuenta/senias' : '/'} replace />
  }

  return <>{children}</>
}

/**
 * Manejo de la sesión del usuario en el navegador.
 *
 * El token se guarda en localStorage, por lo que sobrevive a recargas y a
 * cerrar el navegador. Por eso NUNCA se confía en la sola presencia del token:
 * antes de considerar una sesión válida se decodifica el JWT y se compara su
 * campo `exp` contra la hora actual.
 */

const CLAVE_TOKEN = 'accessToken'
const CLAVE_ROL = 'role'

/** Evento propio que se emite cada vez que la sesión cambia (login/logout/expiración) */
export const EVENTO_SESION = 'sesion-cambiada'

export type Rol = 'cliente' | 'agente'

/** Campos que el backend firma dentro del JWT (ver auth.controller.ts) */
export interface TokenPayload {
  sub: number | string
  email?: string
  role?: Rol
  /** Fecha de expiración en segundos desde epoch */
  exp?: number
  iat?: number
}

export interface Sesion {
  token: string
  userId: number | null
  email: string | null
  rol: Rol | null
  /** Expiración en milisegundos desde epoch, o null si el token no la declara */
  expiraEn: number | null
}

/**
 * Decodifica el payload de un JWT sin verificar la firma.
 * La verificación real la hace el backend; acá solo se leen los claims para
 * decidir qué mostrar en la UI.
 */
export function decodificarToken(token: string): TokenPayload | null {
  try {
    const partes = token.split('.')
    if (partes.length < 2) return null

    let base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4 !== 0) base64 += '='

    return JSON.parse(atob(base64)) as TokenPayload
  } catch {
    return null
  }
}

/** Un token sin `exp` se considera inválido: no se puede saber hasta cuándo vale */
export function tokenExpirado(payload: TokenPayload): boolean {
  if (!payload.exp) return true
  return payload.exp * 1000 <= Date.now()
}

function notificarCambio() {
  window.dispatchEvent(new Event(EVENTO_SESION))
}

/**
 * Devuelve la sesión vigente o null.
 * Si el token guardado está vencido o corrupto lo borra, para que el usuario
 * no quede viendo la UI de "logueado" con un token que el backend va a rechazar.
 */
export function leerSesion(): Sesion | null {
  const token = localStorage.getItem(CLAVE_TOKEN)
  if (!token) return null

  const payload = decodificarToken(token)
  if (!payload || tokenExpirado(payload)) {
    limpiarSesion()
    return null
  }

  const userId = Number(payload.sub)

  return {
    token,
    userId: Number.isFinite(userId) && userId > 0 ? userId : null,
    email: payload.email ?? null,
    rol: payload.role ?? (localStorage.getItem(CLAVE_ROL) as Rol | null),
    expiraEn: payload.exp ? payload.exp * 1000 : null,
  }
}

/** Guarda el token recibido del login. Devuelve la sesión resultante, o null si el token no sirve. */
export function guardarSesion(token: string, rol?: Rol): Sesion | null {
  const payload = decodificarToken(token)
  if (!payload || tokenExpirado(payload)) return null

  localStorage.setItem(CLAVE_TOKEN, token)
  const rolFinal = payload.role ?? rol
  if (rolFinal) localStorage.setItem(CLAVE_ROL, rolFinal)

  notificarCambio()
  return leerSesion()
}

export function limpiarSesion() {
  const habia = localStorage.getItem(CLAVE_TOKEN) !== null
  localStorage.removeItem(CLAVE_TOKEN)
  localStorage.removeItem(CLAVE_ROL)
  if (habia) notificarCambio()
}

/**
 * Token listo para mandar en el header Authorization, o null si no hay sesión
 * válida. Pensado para código fuera de React (ver utils/apiClient.ts).
 */
export function obtenerTokenValido(): string | null {
  return leerSesion()?.token ?? null
}

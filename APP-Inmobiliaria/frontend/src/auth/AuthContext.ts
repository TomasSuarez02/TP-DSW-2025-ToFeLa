import { createContext } from 'react'
import type { Rol, Sesion } from './session'

export interface AuthContextValue {
  sesion: Sesion | null
  isLoggedIn: boolean
  rol: Rol | null
  userId: number | null
  /** Guarda el token del login. Devuelve false si el token es inválido o ya venció. */
  login: (token: string, rol?: Rol) => boolean
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

import axios from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'
import type { ParsedApiError } from './apiErrors'
import { parseApiError } from './apiErrors'
import { limpiarSesion, obtenerTokenValido } from '../auth/session'

/**
 * Instancia de axios configurada con URL base e interceptores
 * para normalizar automáticamente errores de API
 */
const apiClient: AxiosInstance = axios.create({
  // El host estaba fijo en el código, así que cualquier despliegue que no
  // fuera localhost obligaba a editar el fuente. El fallback mantiene el
  // comportamiento actual para quien clona el repo y corre `npm run dev`.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
})

/**
 * Tipo extendido de AxiosError que incluye error parseado
 */
export interface ApiErrorResponse extends AxiosError {
  parsedError?: ParsedApiError
}

/**
 * Interceptor de request que adjunta el token de sesión.
 * Usa obtenerTokenValido para no mandar un token ya vencido: si expiró,
 * la sesión se limpia y la request sale como anónima.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = obtenerTokenValido()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

/**
 * Interceptor de respuesta que normaliza errores de API
 * Cuando hay un error en una request, se parsea automáticamente
 * usando parseApiError y se agrega a error.parsedError
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // El backend rechazó el token: la sesión local ya no vale
    if (error.response?.status === 401) {
      limpiarSesion()
    }

    const parsedError = parseApiError(error)
    ;(error as ApiErrorResponse).parsedError = parsedError
    return Promise.reject(error)
  },
)

export default apiClient

import axios from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'
import type { ParsedApiError } from './apiErrors'
import { parseApiError } from './apiErrors'

/**
 * Instancia de axios configurada con URL base e interceptores
 * para normalizar automáticamente errores de API
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
})

/**
 * Tipo extendido de AxiosError que incluye error parseado
 */
export interface ApiErrorResponse extends AxiosError {
  parsedError?: ParsedApiError
}

/**
 * Interceptor de respuesta que normaliza errores de API
 * Cuando hay un error en una request, se parsea automáticamente
 * usando parseApiError y se agrega a error.parsedError
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const parsedError = parseApiError(error)
    ;(error as ApiErrorResponse).parsedError = parsedError
    return Promise.reject(error)
  },
)

export default apiClient

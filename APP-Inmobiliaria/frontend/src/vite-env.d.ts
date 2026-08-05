/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API, con el prefijo /api incluido. Ver .env.example */
  readonly VITE_API_URL?: string
  /** 'true' simula los pagos en el navegador, sin llamar al backend. */
  readonly VITE_USE_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

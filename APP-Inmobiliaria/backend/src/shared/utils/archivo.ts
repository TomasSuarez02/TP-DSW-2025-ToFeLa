import fs from 'fs'
import path from 'path'
import { HttpError } from '../errors/http.error.js'

/**
 * Guardado de archivos subidos como base64 en el cuerpo JSON.
 * Es el mismo transporte que usan las imágenes de propiedades, pero acá el
 * nombre se sanea: el de `imagenes/` se toma tal cual viene del cliente, lo que
 * permite escribir fuera del directorio (`../../algo`).
 */

const EXTENSIONES_PERMITIDAS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp']

/** Deja un nombre seguro: sin rutas, sin espacios raros y con extensión válida. */
export function nombreSeguro(filename: string): string {
  const base = path.basename(String(filename ?? '')).trim()
  const ext = path.extname(base).toLowerCase()

  if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
    throw new HttpError(
      400,
      `Formato no permitido. Se aceptan: ${EXTENSIONES_PERMITIDAS.join(', ')}`,
      [{ path: 'filename', message: 'Formato de archivo no permitido' }],
      'VALIDATION_ERROR',
    )
  }

  const slug = path
    .basename(base, ext)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)

  return `${Date.now()}-${slug || 'archivo'}${ext}`
}

/**
 * Escribe el base64 en `uploads/<carpeta>/` y devuelve el nombre final.
 * Acepta tanto un data-URL (`data:application/pdf;base64,...`) como el crudo.
 */
export function guardarBase64(carpeta: string, filename: string, base64: string): string {
  const nombre = nombreSeguro(filename)
  const dir = path.join(process.cwd(), 'uploads', carpeta)
  fs.mkdirSync(dir, { recursive: true })

  const datos = String(base64).replace(/^data:[^;]+;base64,/, '')
  if (!datos) {
    throw new HttpError(
      400,
      'El archivo está vacío',
      [{ path: 'base64', message: 'El archivo está vacío' }],
      'VALIDATION_ERROR',
    )
  }

  fs.writeFileSync(path.join(dir, nombre), datos, 'base64')
  return nombre
}

/** Borra el archivo si existe. No falla si ya no está. */
export function borrarArchivo(carpeta: string, nombre?: string | null): void {
  if (!nombre) return
  const ruta = path.join(process.cwd(), 'uploads', carpeta, path.basename(nombre))
  if (fs.existsSync(ruta)) fs.unlinkSync(ruta)
}

/** Ruta absoluta para servir el archivo, validando que no se escape del directorio. */
export function rutaAbsoluta(carpeta: string, nombre: string): string {
  const dir = path.join(process.cwd(), 'uploads', carpeta)
  const ruta = path.join(dir, path.basename(nombre))
  if (!ruta.startsWith(dir)) {
    throw new HttpError(404, 'Archivo no encontrado', [], 'NOT_FOUND')
  }
  return ruta
}

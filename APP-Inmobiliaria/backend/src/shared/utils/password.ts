import bcrypt from 'bcryptjs'

/**
 * Hashing de contraseñas.
 *
 * Se usa `bcryptjs` y no `bcrypt` porque es JavaScript puro: `bcrypt` obliga a
 * compilar un módulo nativo en cada máquina donde se clone el repo. A esta
 * escala la diferencia de velocidad no se nota.
 */

const RONDAS = 10

/** Prefijo de todo hash bcrypt ($2a$, $2b$, $2y$). */
const PREFIJO_BCRYPT = /^\$2[aby]?\$/

export async function hashPassword(plana: string): Promise<string> {
  return bcrypt.hash(plana, RONDAS)
}

/**
 * Compara la contraseña con el hash guardado.
 *
 * Si lo guardado no parece un hash es una fila vieja en texto plano: se compara
 * literal para no dejar afuera a nadie que todavía no pasó por la migración.
 * Cuando `scripts/hashear-passwords.ts` haya corrido, esta rama deja de usarse.
 */
export async function verificarPassword(plana: string, guardada: string): Promise<boolean> {
  if (!PREFIJO_BCRYPT.test(guardada)) {
    return String(guardada) === String(plana)
  }
  return bcrypt.compare(plana, guardada)
}

/** True si el valor ya está hasheado; lo usa la migración para ser idempotente. */
export function yaEstaHasheada(valor: string): boolean {
  return PREFIJO_BCRYPT.test(valor)
}

/**
 * Copia del input con la contraseña hasheada, o el input tal cual si no vino.
 *
 * Esa distinción importa en los updates: un PATCH que solo cambia el teléfono no
 * trae `contrasenia`, y hashear un valor ausente (o volver a hashear el hash
 * guardado) dejaría al usuario sin poder entrar.
 */
export async function conPasswordHasheada<T extends Record<string, unknown>>(
  input: T,
): Promise<T> {
  const plana = input?.contrasenia
  if (typeof plana !== 'string' || plana.length === 0) return input

  return { ...input, contrasenia: await hashPassword(plana) }
}

/**
 * Pasarela de pago simulada. No hay entidad emisora real: el resultado se decide
 * por el número de tarjeta. Las mismas reglas están implementadas en el frontend
 * (frontend/src/utils/tarjeta.ts) y documentadas en docs/api-senias.md
 */

export function soloDigitos(valor: unknown): string {
  return String(valor ?? '').replace(/\D/g, '')
}

/** Algoritmo de Luhn: valida el dígito verificador del número de tarjeta. */
export function esLuhnValido(numero: string): boolean {
  const digitos = soloDigitos(numero)
  if (digitos.length < 13) return false

  let suma = 0
  let duplicar = false

  for (let i = digitos.length - 1; i >= 0; i--) {
    let digito = Number(digitos[i])
    if (duplicar) {
      digito *= 2
      if (digito > 9) digito -= 9
    }
    suma += digito
    duplicar = !duplicar
  }

  return suma % 10 === 0
}

/** Regla de la pasarela simulada: rechaza las tarjetas terminadas en 0000. */
export function tarjetaEsAprobada(numeroTarjeta: string): boolean {
  return !soloDigitos(numeroTarjeta).endsWith('0000')
}

/** Lo único del número de tarjeta que se persiste. */
export function ultimosCuatro(numeroTarjeta: string): string {
  return soloDigitos(numeroTarjeta).slice(-4)
}

export function generarReferencia(): string {
  return `MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

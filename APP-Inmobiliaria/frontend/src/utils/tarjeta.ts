import type { DatosTarjeta } from '../types/senia'
import type { FieldErrors } from './apiErrors'

/** Tarjeta de prueba que siempre aprueba. */
export const TARJETA_APROBADA = '4111 1111 1111 1111'

/**
 * Tarjeta de prueba que la pasarela rechaza. Termina en 0000 pero es válida por
 * Luhn, si no el formulario la frenaría antes de llegar a la pasarela.
 */
export const TARJETA_RECHAZADA = '4111 1111 1117 0000'

export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** Formatea el número en grupos de 4 mientras se escribe. */
export function formatearNumeroTarjeta(valor: string): string {
  return soloDigitos(valor).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}

/** Formatea el vencimiento como MM/AA mientras se escribe. */
export function formatearVencimiento(valor: string): string {
  const digitos = soloDigitos(valor).slice(0, 4)
  if (digitos.length <= 2) return digitos
  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`
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

function vencimientoEsFuturo(vencimiento: string): boolean {
  const [mes, anio] = vencimiento.split('/')
  const mesNum = Number(mes)
  const anioNum = Number(anio)
  if (!mesNum || mesNum < 1 || mesNum > 12 || Number.isNaN(anioNum)) return false

  // El último día del mes de vencimiento: día 0 del mes siguiente.
  const finDeMes = new Date(2000 + anioNum, mesNum, 0, 23, 59, 59)
  return finDeMes.getTime() > Date.now()
}

/** Valida los campos de la tarjeta. Devuelve un mapa vacío si está todo bien. */
export function validarTarjeta(datos: DatosTarjeta): FieldErrors {
  const errores: FieldErrors = {}
  const numero = soloDigitos(datos.numeroTarjeta)

  if (!numero) {
    errores.numeroTarjeta = 'Ingresá el número de tarjeta'
  } else if (numero.length !== 16) {
    errores.numeroTarjeta = 'El número debe tener 16 dígitos'
  } else if (!esLuhnValido(numero)) {
    errores.numeroTarjeta = 'El número de tarjeta no es válido'
  }

  if (!datos.titular.trim()) {
    errores.titular = 'Ingresá el nombre del titular'
  } else if (datos.titular.trim().length < 5) {
    errores.titular = 'Ingresá el nombre completo como figura en la tarjeta'
  }

  if (!/^\d{2}\/\d{2}$/.test(datos.vencimiento)) {
    errores.vencimiento = 'Usá el formato MM/AA'
  } else if (!vencimientoEsFuturo(datos.vencimiento)) {
    errores.vencimiento = 'La tarjeta está vencida'
  }

  if (!/^\d{3}$/.test(datos.cvv)) {
    errores.cvv = 'El código de seguridad tiene 3 dígitos'
  }

  return errores
}

/**
 * Regla de la pasarela simulada: rechaza las tarjetas terminadas en 0000.
 * El backend aplica la misma regla (ver docs/api-senias.md).
 */
export function tarjetaEsAprobada(numeroTarjeta: string): boolean {
  return !soloDigitos(numeroTarjeta).endsWith('0000')
}

export function ultimosCuatro(numeroTarjeta: string): string {
  return soloDigitos(numeroTarjeta).slice(-4)
}

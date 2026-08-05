// Tiene que ser lo primero que corra: el resto del módulo (y cualquiera que lo
// importe) lee process.env, así que el .env ya tiene que estar cargado.
import 'dotenv/config'

/**
 * Configuración del backend, leída del entorno.
 *
 * Es el único lugar del proyecto que toca `process.env`. No es sólo prolijidad:
 * varios módulos guardan su valor en una `const` de nivel de módulo, así que si
 * dotenv se cargara después el valor quedaría vacío. Importando todo desde acá
 * el orden queda garantizado sin depender de cómo se resuelva el grafo de
 * imports.
 */

/** Valor que traía el default viejo. Se rechaza explícitamente: está en el historial de git. */
const SECRETO_INSEGURO = 'secret'

function exigirJwtSecret(): string {
  const valor = process.env.JWT_SECRET?.trim()

  if (!valor || valor === SECRETO_INSEGURO) {
    const motivo = valor
      ? `JWT_SECRET tiene el valor de ejemplo "${SECRETO_INSEGURO}", que es público.`
      : 'Falta la variable de entorno JWT_SECRET.'

    // Un default silencioso haría que todo "funcione" mientras cualquiera puede
    // firmar un token de agente. Mejor no arrancar.
    throw new Error(
      `\n${motivo}\n\n` +
        `Con un secreto adivinable, cualquiera puede firmar un token con rol de\n` +
        `agente y acceder a toda la API. El servidor no arranca sin uno propio.\n\n` +
        `Para configurarlo:\n` +
        `  1. Generá un secreto:\n` +
        `     node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"\n` +
        `  2. Copiá .env.example a .env y pegá el valor en JWT_SECRET.\n`,
    )
  }

  return valor
}

export const JWT_SECRET = exigirJwtSecret()

/** Base local de docker-compose (servicio `mysql-app`). */
export const DATABASE_URL =
  process.env.DATABASE_URL?.trim() || 'mysql://dsw:dsw@127.0.0.1:3307/app-inmobiliaria'

export const PORT = Number(process.env.PORT) || 3000

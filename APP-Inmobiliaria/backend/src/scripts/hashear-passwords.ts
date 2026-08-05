import { MikroORM } from '@mikro-orm/core'
import { MySqlDriver } from '@mikro-orm/mysql'
import { DATABASE_URL } from '../shared/config.js'
import { hashPassword, yaEstaHasheada } from '../shared/utils/password.js'

/**
 * Migración de una sola vez: pasa a bcrypt las contraseñas que quedaron en
 * texto plano en la tabla `usuario`.
 *
 * Es idempotente — saltea las que ya empiezan con el prefijo de bcrypt — así
 * que correrlo dos veces no rompe nada.
 *
 *   pnpm build && pnpm migrate:passwords
 *
 * Va por SQL directo y no por el EntityManager para no arrastrar `app.ts`, que
 * levanta el servidor al importarse.
 */

type FilaUsuario = { id: number; contrasenia: string }

const orm = await MikroORM.init<MySqlDriver>({
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  dbName: 'app-inmobiliaria',
  driver: MySqlDriver,
  clientUrl: DATABASE_URL,
  debug: false,
})

try {
  const conexion = orm.em.getConnection()
  const usuarios: FilaUsuario[] = await conexion.execute('select id, contrasenia from usuario')

  let migrados = 0
  let salteados = 0

  for (const usuario of usuarios) {
    if (yaEstaHasheada(usuario.contrasenia)) {
      salteados++
      continue
    }

    const hash = await hashPassword(usuario.contrasenia)
    await conexion.execute('update usuario set contrasenia = ? where id = ?', [hash, usuario.id])
    migrados++
  }

  console.log(`Listo: ${migrados} contraseñas hasheadas, ${salteados} ya lo estaban.`)
} finally {
  await orm.close(true)
}

import { MikroORM } from '@mikro-orm/core'
import { SqlHighlighter } from '@mikro-orm/sql-highlighter'
import { MySqlDriver } from '@mikro-orm/mysql'
import { DATABASE_URL } from '../config.js'

export const orm = await MikroORM.init<MySqlDriver>({
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  dbName: 'app-inmobiliaria',
  driver: MySqlDriver,
  clientUrl: DATABASE_URL,
  highlighter: new SqlHighlighter(),
  debug: true,
  schemaGenerator: {
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
    ignoreSchema: [],
  },
})


export const syncSchema = async () => {
  const generator = orm.getSchemaGenerator()
  await generator.updateSchema()
}

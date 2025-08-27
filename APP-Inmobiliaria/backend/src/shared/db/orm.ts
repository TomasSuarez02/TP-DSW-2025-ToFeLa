import { MikroORM } from '@mikro-orm/core'
<<<<<<< Updated upstream
import { SqlHighlighter } from '@mikro-orm/sql-highlighter'
=======
import { MongoHighlighter } from '@mikro-orm/mongo-highlighter'
>>>>>>> Stashed changes

export const orm = await MikroORM.init({
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
<<<<<<< Updated upstream
  dbName: 'app',
  clientUrl: 'mysql://dsw:dsw@localhost:3306/app',
  highlighter: new SqlHighlighter(),
  debug: true,
  //generamos nuestro schema
  schemaGenerator: {
    //NUNCA en produccion
    disableForeignKeys: true, //desactiva las llaves foraneas durante el proceso de creacion de base de datos
    createForeignKeyConstraints: true, //crea las llaves foraneas
    ignoreSchema: [], //mantener el schema de la base de datos, que no la borre, aunque no la vamos a utilizar
=======
  dbName: 'hc4gmo',
  type: 'mongo',
  clientUrl: 'mongodb://localhost:27017',
  highlighter: new MongoHighlighter(),
  debug: true,
  schemaGenerator: {
    //never in production
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
    ignoreSchema: [],
>>>>>>> Stashed changes
  },
})

export const syncSchema = async () => {
<<<<<<< Updated upstream
  //usamos el schema generator que nos brinda typeorm
=======
>>>>>>> Stashed changes
  const generator = orm.getSchemaGenerator()
  /*   
  await generator.dropSchema()
  await generator.createSchema()
  */
<<<<<<< Updated upstream
 //esta funcion genera la base dde datos, y si existe va a generar cambios
  await generator.updateSchema()
}
=======
  await generator.updateSchema()
}
>>>>>>> Stashed changes

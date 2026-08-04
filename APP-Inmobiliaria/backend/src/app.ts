import 'reflect-metadata'
import express from 'express'
import cors from 'cors'
import path from 'path' 
import { clienteRouter } from './cliente/cliente.routes.js'
import { tipopropiedadRouter } from './tipopropiedad/tipopropiedad.routes.js'
import { inmobiliariaRouter } from './inmobiliaria/inmobiliaria.routes.js'
import { documentacionRouter } from './documentacion/documentacion.routes.js'
import { propiedadRouter } from './propiedad/propiedad.routes.js'
import { agenteInmobiliarioRouter } from './agenteinmobiliario/agenteinmobiliario.routes.js'
import { orm, syncSchema } from './shared/db/orm.js'
import { seedEstados } from './shared/db/seed.js'
import { RequestContext } from '@mikro-orm/core'
import authRouter from "./auth/auth.routes.js";
import { imagenRouter } from './imagenes/imagen.routes.js'
import { visitaRouter } from './visita/visita.routes.js'
import { seniaRouter } from './senia/senia.routes.js'
import { pagoRouter } from './pago/pago.routes.js'
import { alquilerRouter } from './alquiler/alquiler.routes.js'
import { HttpError } from './shared/errors/http.error.js'
import { ormErrorHandler } from './shared/middlewares/orm-error.middleware.js'


const app = express()

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))


app.use(express.json({ limit: '10mb' }))

app.use('/images', express.static(path.join(process.cwd(), 'uploads/images')))

app.use((req, res, next) => {
  RequestContext.create(orm.em, next)
})

app.use('/api/clientes', clienteRouter)
app.use('/api/tipopropiedades', tipopropiedadRouter)
app.use('/api/inmobiliarias', inmobiliariaRouter)
app.use('/api/documentaciones', documentacionRouter)
app.use('/api/propiedades', propiedadRouter)
app.use('/api/agentesinmobiliarios', agenteInmobiliarioRouter)
app.use('/api/imagenes', imagenRouter)
app.use("/api/auth", authRouter);
app.use('/api/visitas', visitaRouter)
app.use('/api/senias', seniaRouter)
app.use('/api/pagos', pagoRouter)
app.use('/api/alquileres', alquilerRouter)

// Middleware para estandarizar excepciones de ORM
app.use(ormErrorHandler)

app.use((_, res) => {
  return res.status(404).send({ message: 'Recurso no encontrado' })
})

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({
      code: error.code || 'SERVER_ERROR',
      message: error.message,
      details: error.details,
    })
  }

  if (error instanceof Error) {
    return res.status(500).json({
      code: 'SERVER_ERROR',
      message: error.message,
    })
  }

  return res.status(500).json({
    code: 'SERVER_ERROR',
    message: 'Error inesperado del servidor',
  })
})

await syncSchema()
await seedEstados(orm)


app.listen(3000, () => {
  console.log('Server runnning on http://localhost:3000/')
})

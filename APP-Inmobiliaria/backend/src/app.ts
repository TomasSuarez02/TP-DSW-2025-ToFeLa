import 'reflect-metadata'
import express from 'express'
import cors from 'cors'
import path from 'path' // ✅ Agregar import de path
import { clienteRouter } from './cliente/cliente.routes.js'
import { tipopropiedadRouter } from './tipopropiedad/tipopropiedad.routes.js'
import { inmobiliariaRouter } from './inmobiliaria/inmobiliaria.routes.js'
import { tipoDocumentacionRouter } from './tipodocumentacion/tipodocumentacion.routes.js'
import { propiedadRouter } from './propiedad/propiedad.routes.js'
import { agenteInmobiliarioRouter } from './agenteinmobiliario/agenteinmobiliario.routes.js'
import { orm, syncSchema } from './shared/db/orm.js'
import { RequestContext } from '@mikro-orm/core'
import authRouter from "./auth/auth.routes.js";
import { imagenRouter } from './imagenes/imagen.routes.js'
import { visitaRouter } from './visita/visita.routes.js'
import { seniaRouter } from './senia/senia.routes.js'


const app = express()

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// ✅ Aumentar límite para imágenes base64
app.use(express.json({ limit: '10mb' }))

// ✅ Servir archivos estáticos ANTES de las rutas de API
app.use('/images', express.static(path.join(process.cwd(), 'uploads/images')))

//luego de los middlewares base
app.use((req, res, next) => {
  RequestContext.create(orm.em, next)
})

//antes de las rutas y middlewares de negocio
app.use('/api/clientes', clienteRouter)
app.use('/api/tipopropiedades', tipopropiedadRouter)
app.use('/api/inmobiliarias', inmobiliariaRouter)
app.use('/api/tipodocumentaciones', tipoDocumentacionRouter)
app.use('/api/propiedades', propiedadRouter)
app.use('/api/agentesinmobiliarios', agenteInmobiliarioRouter)
app.use('/api/imagenes', imagenRouter)
app.use("/api/auth", authRouter);
app.use('/api/visitas', visitaRouter)
app.use('/api/senias', seniaRouter)

app.use((_, res) => {
  return res.status(404).send({ message: 'Resource not found' })
})

await syncSchema() //never in production


app.listen(3000, () => {
  console.log('Server runnning on http://localhost:3000/')
})

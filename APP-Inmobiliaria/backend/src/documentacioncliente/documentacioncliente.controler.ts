import { NextFunction, Request, Response } from 'express'
import { orm } from '../shared/db/orm.js'
import { DocumentacionCliente, type EstadoDocumentacionCliente } from './documentacioncliente.entity.js'
import { Documentacion } from '../documentacion/documentacion.entity.js'
import { Cliente } from '../cliente/cliente.entity.js'
import { HttpError } from '../shared/errors/http.error.js'
import { borrarArchivo } from '../shared/utils/archivo.js'
import { CARPETA_DOCUMENTOS } from '../shared/utils/documentos.js'

const em = orm.em

const POPULATE_DC = ['documentacion', 'cliente'] as const satisfies readonly string[]

type AuthRequest = Request & { user?: { sub?: number; role?: string } }

function usuarioAutenticado(req: Request) {
  return (req as AuthRequest).user ?? {}
}

/** La PK es compuesta (documentacion, cliente) y viaja como dos params. */
async function buscarPorPar(documentacionId: string, clienteId: string) {
  const documentacion = Number(documentacionId)
  const cliente = Number(clienteId)
  if (!Number.isInteger(documentacion) || !Number.isInteger(cliente)) {
    throw new HttpError(
      400,
      'La documentación o el cliente son inválidos',
      [{ path: 'general', message: 'La documentación o el cliente son inválidos' }],
      'VALIDATION_ERROR',
    )
  }

  return em.findOneOrFail(DocumentacionCliente, { documentacion, cliente }, { populate: [...POPULATE_DC] })
}

/** Todas las presentaciones, para que el agente revise. */
async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    // Un cliente que pegue acá vería los papeles de todos: para lo suyo está
    // `findByClient`.
    const { role } = usuarioAutenticado(req)
    if (role !== 'agente') {
      throw new HttpError(
        403,
        'Solo un agente puede ver la documentación de todos los clientes',
        [{ path: 'general', message: 'Solo un agente puede ver la documentación de todos los clientes' }],
        'AUTH_ERROR',
      )
    }

    const presentadas = await em.find(DocumentacionCliente, {}, { populate: [...POPULATE_DC] })
    res.status(200).json({ message: 'found all documentacion cliente', data: presentadas })
  } catch (error) {
    next(error)
  }
}

/** Documentación del cliente autenticado. */
async function findByClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { sub: clientId } = usuarioAutenticado(req)
    if (!clientId) {
      return res.status(401).json({ message: 'No autorizado', data: [] })
    }

    const presentadas = await em.find(
      DocumentacionCliente,
      { cliente: clientId },
      { populate: [...POPULATE_DC] },
    )
    res.status(200).json({ message: 'found client documentacion', data: presentadas })
  } catch (error) {
    next(error)
  }
}

/** Registra que un cliente presentó un documento. Queda `pendiente` de revisión. */
async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const { sub: usuarioId, role } = usuarioAutenticado(req)
    const { documentacion, cliente, estado } = req.body.sanitizedInput

    // Un cliente solo puede presentar documentación a su propio nombre.
    if (role === 'cliente' && Number(cliente) !== usuarioId) {
      throw new HttpError(
        403,
        'Solo podés presentar documentación a tu nombre',
        [{ path: 'cliente', message: 'Solo podés presentar documentación a tu nombre' }],
        'AUTH_ERROR',
      )
    }

    const documentacionEntity = await em.findOneOrFail(Documentacion, { id: Number(documentacion) })
    const clienteEntity = await em.findOneOrFail(Cliente, { id: Number(cliente) })

    const yaPresentada = await em.findOne(DocumentacionCliente, {
      documentacion: documentacionEntity.id,
      cliente: clienteEntity.id,
    })
    if (yaPresentada) {
      throw new HttpError(
        409,
        'El cliente ya presentó esa documentación',
        [{ path: 'documentacion', message: 'El cliente ya presentó esa documentación' }],
        'BUSINESS_RULE_ERROR',
      )
    }

    // Solo un agente puede darla por aprobada de entrada: si la carga él,
    // es porque ya vio el papel.
    const estadoInicial =
      role === 'agente' && estado ? (estado as EstadoDocumentacionCliente) : 'pendiente'

    const presentada = em.create(DocumentacionCliente, {
      documentacion: documentacionEntity,
      cliente: clienteEntity,
      estado: estadoInicial,
      fecha_carga: new Date(),
    })

    await em.flush()
    await em.populate(presentada, [...POPULATE_DC])

    res.status(201).json({ message: 'documentacion presentada', data: presentada })
  } catch (error) {
    next(error)
  }
}

/** El agente aprueba o rechaza el documento presentado. */
async function revisar(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = usuarioAutenticado(req)
    if (role !== 'agente') {
      throw new HttpError(
        403,
        'Solo un agente puede revisar documentación',
        [{ path: 'general', message: 'Solo un agente puede revisar documentación' }],
        'AUTH_ERROR',
      )
    }

    const { estado, observaciones } = req.body.sanitizedInput
    const presentada = await buscarPorPar(req.params.documentacion, req.params.cliente)

    presentada.estado = estado as EstadoDocumentacionCliente
    presentada.observaciones = observaciones ?? null
    await em.flush()

    res.status(200).json({ message: 'documentacion revisada', data: presentada })
  } catch (error) {
    next(error)
  }
}

/**
 * Retira un papel presentado. En esta app cada `Documentacion` se crea junto con
 * su presentación (un papel = un cliente), así que si al sacar el vínculo el
 * documento queda sin dueño se lo borra también, con su archivo: si no, quedan
 * filas y PDFs huérfanos que nadie puede ver ni limpiar.
 */
async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const { sub, role } = usuarioAutenticado(req)
    const presentada = await buscarPorPar(req.params.documentacion, req.params.cliente)

    // Mismo criterio que en `documentacion.remove`: el cliente retira lo suyo
    // mientras esté sin aprobar; lo aprobado solo lo saca el agente.
    if (role !== 'agente') {
      if (presentada.cliente.id !== sub) {
        throw new HttpError(
          403,
          'No podés eliminar documentación de otro cliente',
          [{ path: 'general', message: 'No podés eliminar documentación de otro cliente' }],
          'AUTH_ERROR',
        )
      }
      if (presentada.estado === 'aprobada') {
        throw new HttpError(
          409,
          'La documentación ya fue aprobada: pedile al agente que la dé de baja',
          [{ path: 'estado', message: 'La documentación ya fue aprobada' }],
          'BUSINESS_RULE_ERROR',
        )
      }
    }

    const documentacion = presentada.documentacion
    await em.removeAndFlush(presentada)

    const otrosDuenios = await em.count(DocumentacionCliente, { documentacion: documentacion.id })
    if (otrosDuenios === 0) {
      borrarArchivo(CARPETA_DOCUMENTOS, documentacion.path)
      await em.removeAndFlush(documentacion)
    }

    res.status(200).json({ message: 'documentacion cliente deleted', data: presentada })
  } catch (error) {
    next(error)
  }
}

export { findAll, findByClient, add, revisar, remove }

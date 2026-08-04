import { z } from 'zod'
import { ESTADOS_SENIA } from '../../senia/senia.rules.js'
import { ESTADOS_PROPIEDAD } from '../../estadopropiedad/estadopropiedad.entity.js'
import { ESTADOS_ALQUILER } from '../../estadoalquiler/estadoalquiler.entity.js'

const phoneRegex = /^[0-9+()\-\s]{6,20}$/
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/

export const authLoginSchema = z.object({
  mail: z.string().trim().email('El email es inválido'),
  contrasenia: z.string().trim().min(1, 'La contraseña es obligatoria'),
})

const clienteBaseSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio'),
  apellido: z.string().trim().min(2, 'El apellido es obligatorio'),
  mail: z.string().trim().email('El email es inválido'),
  telefono: z
    .string()
    .trim()
    .regex(phoneRegex, 'El teléfono es inválido'),
  tipo_doc: z.string().trim().min(2, 'El tipo de documento es obligatorio'),
  nro_doc: z.coerce.number().int().positive('El número de documento es inválido'),
  contrasenia: z.string().trim().min(4, 'La contraseña debe tener al menos 4 caracteres'),
})

export const clienteCreateSchema = clienteBaseSchema

export const clienteUpdateSchema = clienteBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  })

const seniaEstadoValues = z.enum(ESTADOS_SENIA)

const seniaBaseSchema = z.object({
  importe: z.coerce.number().positive('El importe debe ser mayor a cero'),
  propiedad: z.coerce.number().int().positive('La propiedad es inválida'),
  cliente: z.coerce.number().int().positive('El cliente es inválido'),
  estado: seniaEstadoValues.optional(),
})

export const seniaCreateSchema = seniaBaseSchema

export const seniaUpdateSchema = seniaBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  })

/** El cliente autenticado no manda su id: sale del token. */
export const seniaClienteCreateSchema = seniaBaseSchema.pick({
  importe: true,
  propiedad: true,
})

/** Estados a los que un agente puede mover una seña a mano. */
export const seniaEstadoSchema = z.object({
  estado: z.enum(['confirmada', 'vencida', 'cancelada'], {
    message: 'El estado es inválido',
  }),
})

export const pagoCreateSchema = z.object({
  senia: z.string().trim().min(1, 'La seña es inválida'),
  numeroTarjeta: z
    .string()
    .trim()
    .regex(/^[\d\s]{13,23}$/, 'El número de tarjeta es inválido'),
  titular: z.string().trim().min(5, 'El titular es obligatorio'),
  vencimiento: z
    .string()
    .trim()
    .regex(/^\d{2}\/\d{2}$/, 'El vencimiento debe tener formato MM/AA'),
  cvv: z.string().trim().regex(/^\d{3}$/, 'El código de seguridad tiene 3 dígitos'),
})

const visitaBaseSchema = z.object({
  fecha_hora: z.coerce.date({ message: 'La fecha y hora son inválidas' }),
  propiedad: z.coerce.number().int().positive('La propiedad es inválida'),
  cliente: z.coerce.number().int().positive('El cliente es inválido'),
})

export const visitaCreateSchema = visitaBaseSchema

export const visitaUpdateSchema = visitaBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  })

const alquilerBaseSchema = z.object({
  propiedad: z.coerce.number().int().positive('La propiedad es inválida'),
  cliente: z.coerce.number().int().positive('El cliente es inválido'),
  fecha_inicio: z.coerce.date({ message: 'La fecha de inicio es inválida' }),
  fecha_fin: z.coerce.date({ message: 'La fecha de fin es inválida' }),
  monto_mensual: z.coerce.number().positive('El monto mensual debe ser mayor a cero'),
  estado: z.enum(ESTADOS_ALQUILER).optional(),
})

export const alquilerCreateSchema = alquilerBaseSchema

export const alquilerUpdateSchema = alquilerBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  })

export const alquilerEstadoSchema = z.object({
  estado: z.enum(ESTADOS_ALQUILER, { message: 'El estado es inválido' }),
})

const propiedadBaseSchema = z.object({
  direccion: z.string().trim().min(5, 'La dirección es obligatoria'),
  superficie: z.string().trim().optional(),
  precio: z.coerce.number().positive('El precio debe ser mayor a cero'),
  estado: z.enum(ESTADOS_PROPIEDAD, { message: 'El estado es inválido' }),
  hora_desde: z.string().trim().regex(timeRegex, 'La hora de inicio es inválida'),
  hora_hasta: z.string().trim().regex(timeRegex, 'La hora de fin es inválida'),
  descripcion: z.string().trim().optional(),
  tipoPropiedad: z.coerce.number().int().positive('El tipo de propiedad es inválido'),
  inmobiliaria: z.coerce.number().int().positive('La inmobiliaria es inválida').optional(),
})

export const propiedadCreateSchema = propiedadBaseSchema

export const propiedadUpdateSchema = propiedadBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  })

const inmobiliariaBaseSchema = z.object({
  descripcion: z.string().trim().min(2, 'La descripción es obligatoria'),
  direccion: z.string().trim().min(5, 'La dirección es obligatoria'),
  telefono: z
    .string()
    .trim()
    .regex(phoneRegex, 'El teléfono es inválido'),
})

export const inmobiliariaCreateSchema = inmobiliariaBaseSchema

export const inmobiliariaUpdateSchema = inmobiliariaBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  })

const agenteBaseSchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre es obligatorio'),
  apellido: z.string().trim().min(2, 'Apellido es obligatorio'),
  mail: z.string().trim().email('Email invalido'),
  telefono: z
    .string()
    .trim()
    .regex(phoneRegex, 'Telefono invalido'),
  tipo_doc: z.string().trim().min(2, 'El tipo de documento es obligatorio'),
  nro_doc: z.coerce.number().int().positive('El número de documento es inválido'),
  contrasenia: z.string().trim().min(4, 'La contraseña debe tener al menos 4 caracteres'),
  fecha_ingreso: z.coerce.date({ message: 'Fecha de ingreso invalida' }),
  inmobiliaria: z.coerce.number().int().positive('La inmobiliaria es inválida').optional(),
})

export const agenteCreateSchema = agenteBaseSchema

export const agenteUpdateSchema = agenteBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  })

const tipoPropiedadBaseSchema = z.object({
  descripcion: z.string().trim().min(2, 'La descripción es obligatoria'),
})

export const tipoPropiedadCreateSchema = tipoPropiedadBaseSchema

export const tipoPropiedadUpdateSchema = tipoPropiedadBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  })

const documentacionBaseSchema = z.object({
  descripcion: z.string().trim().min(2, 'La descripción es obligatoria'),
  fecha_vencimiento: z.coerce.date({ message: 'La fecha de vencimiento es inválida' }),
  path: z.string().trim().optional(),
})

export const documentacionCreateSchema = documentacionBaseSchema

export const documentacionUpdateSchema = documentacionBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  })

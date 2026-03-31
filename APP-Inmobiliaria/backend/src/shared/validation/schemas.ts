import { z } from 'zod'

const phoneRegex = /^[0-9+()\-\s]{6,20}$/
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/
const propiedadEstadoSchema = z.enum(['disponible', 'reservada', 'alquilada'])

export const authLoginSchema = z.object({
  email: z.string().trim().email('El email es inválido'),
  password: z.string().trim().min(1, 'La contraseña es obligatoria'),
})

const clienteBaseSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio'),
  apellido: z.string().trim().min(2, 'El apellido es obligatorio'),
  email: z.string().trim().email('El email es inválido'),
  telefono: z
    .string()
    .trim()
    .regex(phoneRegex, 'El teléfono es inválido'),
  tipo_documento: z.string().trim().min(2, 'El tipo de documento es obligatorio'),
  nro_doc: z.coerce.number().int().positive('El número de documento es inválido'),
  password: z.string().trim().min(4, 'La contraseña debe tener al menos 4 caracteres'),
})

export const clienteCreateSchema = clienteBaseSchema

export const clienteUpdateSchema = clienteBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  })

const seniaBaseSchema = z.object({
  importe: z.coerce.number().positive('El importe debe ser mayor a cero'),
  propiedad: z.coerce.number().int().positive('La propiedad es inválida'),
  cliente: z.coerce.number().int().positive('El cliente es inválido'),
})

export const seniaCreateSchema = seniaBaseSchema

export const seniaUpdateSchema = seniaBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
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

const propiedadBaseSchema = z.object({
  direccion: z.string().trim().min(5, 'La dirección es obligatoria'),
  precio: z.coerce.number().positive('El precio debe ser mayor a cero'),
  estado: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(propiedadEstadoSchema),
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
  nombre: z.string().trim().min(2, 'El nombre es obligatorio'),
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
  email: z.string().trim().email('Email invalido'),
  telefono: z
    .string()
    .trim()
    .regex(phoneRegex, 'Telefono invalido'),
  fechaIngreso: z.coerce.date({ message: 'Fecha de ingreso invalida' }),
})

export const agenteCreateSchema = agenteBaseSchema

export const agenteUpdateSchema = agenteBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  })

const tipoPropiedadBaseSchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre es obligatorio'),
  estado: z.string().trim().min(2, 'Estado es obligatorio'),
})

export const tipoPropiedadCreateSchema = tipoPropiedadBaseSchema

export const tipoPropiedadUpdateSchema = tipoPropiedadBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  })

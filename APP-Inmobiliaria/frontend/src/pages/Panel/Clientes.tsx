import { useMemo, useState } from 'react'
import { EnvelopeIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import apiClient from '../../utils/apiClient'
import Modal from '../../components/Modal'
import Badge from '../../components/ui/Badge'
import Campo from '../../components/ui/Campo'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EstadoVista from '../../components/ui/EstadoVista'
import Tabla, { type Columna } from '../../components/ui/Tabla'
import { useRecurso } from '../../hooks/useRecurso'
import { useFormularioApi } from '../../hooks/useFormularioApi'
import { useNotificacion } from '../../hooks/useNotificacion'

interface Documentacion {
  id: number
  descripcion?: string
}

interface Cliente {
  id: number
  nombre: string
  apellido: string
  mail: string
  telefono: string
  tipo_doc: string
  nro_doc: string
  documentaciones?: Documentacion[]
}

/**
 * `tipo_doc` es una columna de texto en `usuario`, no una tabla de referencia.
 * La pantalla pedía /tipodocumentaciones, que no existe en el backend: cada
 * carga disparaba un 404 y caía en esta misma lista, escrita más abajo a mano.
 */
const TIPOS_DOC = ['DNI', 'Pasaporte', 'Otro'] as const

const FORM_VACIO = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  tipo_documento: 'DNI',
  nro_doc: '',
  password: '',
}

/** El formulario declaraba `noValidate` y no traía validación de JS. */
function validar(datos: typeof FORM_VACIO, editando: boolean): Record<string, string> {
  const errores: Record<string, string> = {}

  if (!datos.nombre.trim()) errores.nombre = 'Ingresá el nombre.'
  if (!datos.apellido.trim()) errores.apellido = 'Ingresá el apellido.'
  if (!datos.email.trim()) errores.email = 'Ingresá el correo electrónico.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim()))
    errores.email = 'Revisá el correo: parece incompleto.'
  if (!datos.telefono.trim()) errores.telefono = 'Ingresá un teléfono.'
  if (!datos.tipo_documento) errores.tipo_documento = 'Elegí el tipo de documento.'
  if (!datos.nro_doc.trim()) errores.nro_doc = 'Ingresá el número de documento.'
  else if (!/^\d{6,10}$/.test(datos.nro_doc.trim()))
    errores.nro_doc = 'Va sin puntos ni espacios.'

  if (!editando) {
    if (!datos.password) errores.password = 'Elegí una contraseña inicial.'
    else if (datos.password.length < 8) errores.password = 'Tiene que tener al menos 8 caracteres.'
  }

  return errores
}

export default function Clientes() {
  const { notificar } = useNotificacion()

  const {
    datos: clientes,
    cargando,
    error,
    recargar,
  } = useRecurso<Cliente[]>(async () => (await apiClient.get('/clientes')).data?.data ?? [], [], [])

  const [filtroDoc, setFiltroDoc] = useState('todos')
  const [formAbierto, setFormAbierto] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState(FORM_VACIO)
  const [aEliminar, setAEliminar] = useState<Cliente | null>(null)
  const form = useFormularioApi()

  const filtrados = useMemo(
    () =>
      filtroDoc === 'todos'
        ? clientes
        : clientes.filter((c) => (c.tipo_doc ?? '').toLowerCase() === filtroDoc.toLowerCase()),
    [clientes, filtroDoc],
  )

  const cambiar = (campo: keyof typeof FORM_VACIO, valor: string) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }))
    form.limpiarCampo(campo)
  }

  const cerrarFormulario = () => {
    setFormAbierto(false)
    setEditando(null)
    setFormData(FORM_VACIO)
    form.limpiar()
  }

  const abrirEdicion = (c: Cliente) => {
    setEditando(c)
    setFormData({
      nombre: c.nombre ?? '',
      apellido: c.apellido ?? '',
      email: c.mail ?? '',
      telefono: c.telefono ?? '',
      tipo_documento: c.tipo_doc ?? 'DNI',
      nro_doc: String(c.nro_doc ?? ''),
      password: '',
    })
    form.limpiar()
    setFormAbierto(true)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()

    const errores = validar(formData, editando !== null)
    if (Object.keys(errores).length > 0) {
      form.setErroresCampo(errores)
      return
    }

    const ok = await form.enviar(async () => {
      const base = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        mail: formData.email.trim(),
        telefono: formData.telefono.trim(),
        tipo_doc: formData.tipo_documento,
        nro_doc: formData.nro_doc.trim(),
      }

      // Al editar, una contraseña vacía significa "dejala como está".
      const payload = formData.password.trim() ? { ...base, contrasenia: formData.password } : base

      if (editando) await apiClient.put(`/clientes/${editando.id}`, payload)
      else await apiClient.post('/clientes', payload)
    })

    if (!ok) return

    notificar(editando ? 'Cliente actualizado' : 'Cliente creado')
    cerrarFormulario()
    await recargar()
  }

  const eliminar = async (cliente: Cliente) => {
    try {
      await apiClient.delete(`/clientes/${cliente.id}`)
    } catch {
      throw new Error('No se pudo eliminar: el cliente tiene señas, visitas o alquileres asociados.')
    }
    setAEliminar(null)
    notificar('Cliente eliminado')
    await recargar()
  }

  const columnas: Columna<Cliente>[] = [
    {
      id: 'cliente',
      encabezado: 'Cliente',
      principal: true,
      celda: (c) => (
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-terra-100 text-sm font-semibold text-terra-800"
          >
            {(c.nombre?.[0] ?? '?').toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-tinta-900">
              {c.nombre} {c.apellido}
            </p>
            <p className="truncate text-xs text-tinta-500">#{c.id}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'contacto',
      encabezado: 'Contacto',
      celda: (c) => (
        <div className="min-w-0">
          <a
            href={`mailto:${c.mail}`}
            className="inline-flex items-center gap-1.5 text-tinta-700 transition-colors hover:text-terra-700"
          >
            <EnvelopeIcon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{c.mail}</span>
          </a>
          <p className="truncate text-xs text-tinta-500">{c.telefono || '—'}</p>
        </div>
      ),
    },
    {
      id: 'documento',
      encabezado: 'Documento',
      celda: (c) => (
        <span className="inline-flex items-center gap-2">
          <Badge tono="arena">{(c.tipo_doc || '—').toUpperCase()}</Badge>
          <span className="text-tinta-700 tabular-nums">{c.nro_doc}</span>
        </span>
      ),
    },
    {
      id: 'documentacion',
      encabezado: 'Papeles',
      alinear: 'derecha',
      ocultarEnMobile: true,
      celda: (c) => (
        <span className="text-tinta-500">
          {c.documentaciones?.length ? `${c.documentaciones.length} presentados` : '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl text-tinta-900">Clientes</h1>
          <p className="mt-0.5 text-sm text-tinta-500">
            {clientes.length} {clientes.length === 1 ? 'cliente registrado' : 'clientes registrados'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="filtro-doc" className="sr-only">
            Filtrar por tipo de documento
          </label>
          <select
            id="filtro-doc"
            value={filtroDoc}
            onChange={(e) => setFiltroDoc(e.target.value)}
            className="rounded-lg border border-arena-300 bg-white px-3 py-2 text-sm text-tinta-900"
          >
            <option value="todos">Todos los documentos</option>
            {TIPOS_DOC.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button type="button" onClick={() => setFormAbierto(true)} className="accion accion-primaria">
            <PlusIcon className="size-5" aria-hidden="true" />
            Nuevo cliente
          </button>
        </div>
      </div>

      <EstadoVista
        cargando={cargando}
        error={error}
        vacio={filtrados.length === 0}
        onReintentar={recargar}
        mensajeVacio={clientes.length === 0 ? 'Todavía no hay clientes' : 'Ningún cliente con ese documento'}
        detalleVacio={
          clientes.length === 0
            ? 'Cargá el primero para poder tomarle una seña.'
            : 'Probá con otro tipo de documento.'
        }
        accionVacio={
          clientes.length === 0 && (
            <button type="button" onClick={() => setFormAbierto(true)} className="accion accion-primaria accion-sm">
              <PlusIcon className="size-4" aria-hidden="true" />
              Nuevo cliente
            </button>
          )
        }
      >
        <Tabla
          datos={filtrados}
          columnas={columnas}
          claveFila={(c) => c.id}
          acciones={(c) => (
            <>
              <button type="button" onClick={() => abrirEdicion(c)} className="accion accion-fantasma accion-sm">
                <PencilSquareIcon className="size-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Editar</span>
              </button>
              <button
                type="button"
                onClick={() => setAEliminar(c)}
                className="accion accion-fantasma accion-sm text-alerta-700 hover:bg-alerta-50"
              >
                <TrashIcon className="size-4" aria-hidden="true" />
                <span className="sr-only">
                  Eliminar a {c.nombre} {c.apellido}
                </span>
              </button>
            </>
          )}
        />
      </EstadoVista>

      <Modal
        open={formAbierto}
        onClose={cerrarFormulario}
        ancho="lg"
        titulo={editando ? 'Editar cliente' : 'Nuevo cliente'}
        descripcion={
          editando ? 'Dejá la contraseña vacía para no cambiarla.' : 'Queda habilitado para reservar propiedades.'
        }
        pie={
          <>
            <button type="button" onClick={cerrarFormulario} className="accion accion-fantasma">
              Cancelar
            </button>
            <button type="submit" form="form-cliente" disabled={form.enviando} className="accion accion-primaria">
              {form.enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </>
        }
      >
        <form id="form-cliente" onSubmit={guardar} noValidate className="space-y-4">
          {form.error && (
            <p
              role="alert"
              className="rounded-lg border border-alerta-700/20 bg-alerta-50 px-4 py-3 text-sm text-alerta-700"
            >
              {form.error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombre" error={form.erroresCampo.nombre} requerido>
              {(props) => (
                <input
                  {...props}
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => cambiar('nombre', e.target.value)}
                />
              )}
            </Campo>

            <Campo etiqueta="Apellido" error={form.erroresCampo.apellido} requerido>
              {(props) => (
                <input
                  {...props}
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => cambiar('apellido', e.target.value)}
                />
              )}
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Correo electrónico" error={form.erroresCampo.email} requerido>
              {(props) => (
                <input
                  {...props}
                  type="email"
                  value={formData.email}
                  onChange={(e) => cambiar('email', e.target.value)}
                />
              )}
            </Campo>

            <Campo etiqueta="Teléfono" error={form.erroresCampo.telefono} requerido>
              {(props) => (
                <input
                  {...props}
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => cambiar('telefono', e.target.value)}
                />
              )}
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <Campo etiqueta="Tipo de documento" error={form.erroresCampo.tipo_documento} requerido>
              {(props) => (
                <select
                  {...props}
                  value={formData.tipo_documento}
                  onChange={(e) => cambiar('tipo_documento', e.target.value)}
                >
                  {TIPOS_DOC.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            <Campo etiqueta="Número de documento" error={form.erroresCampo.nro_doc} requerido>
              {(props) => (
                <input
                  {...props}
                  type="text"
                  inputMode="numeric"
                  value={formData.nro_doc}
                  onChange={(e) => cambiar('nro_doc', e.target.value)}
                />
              )}
            </Campo>
          </div>

          <Campo
            etiqueta={editando ? 'Nueva contraseña' : 'Contraseña'}
            ayuda={editando ? 'Sólo si querés cambiarla. Al menos 8 caracteres.' : 'Al menos 8 caracteres.'}
            error={form.erroresCampo.password}
            requerido={!editando}
          >
            {(props) => (
              <input
                {...props}
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => cambiar('password', e.target.value)}
              />
            )}
          </Campo>
        </form>
      </Modal>

      <ConfirmDialog
        open={aEliminar !== null}
        titulo="Eliminar cliente"
        descripcion="Se borra la cuenta del cliente. No se puede deshacer."
        detalle={aEliminar ? `${aEliminar.nombre} ${aEliminar.apellido} · ${aEliminar.mail}` : undefined}
        textoConfirmar="Eliminar"
        onConfirmar={() => (aEliminar ? eliminar(aEliminar) : undefined)}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  )
}

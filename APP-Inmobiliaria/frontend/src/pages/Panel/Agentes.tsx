import { useState } from 'react'
import { EnvelopeIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../auth/useAuth'
import {
  actualizarAgente,
  crearAgente,
  eliminarAgente,
  obtenerAgentes,
  type Agente,
} from '../../services/agentesInmobiliarios'
import Modal from '../../components/Modal'
import Badge from '../../components/ui/Badge'
import Campo from '../../components/ui/Campo'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EstadoVista from '../../components/ui/EstadoVista'
import Tabla, { type Columna } from '../../components/ui/Tabla'
import { useRecurso } from '../../hooks/useRecurso'
import { useFormularioApi } from '../../hooks/useFormularioApi'
import { useNotificacion } from '../../hooks/useNotificacion'
import { formatearFecha } from '../../utils/formato'

const TIPOS_DOC = ['DNI', 'Pasaporte', 'Otro'] as const

const formVacio = () => ({
  nombre: '',
  apellido: '',
  mail: '',
  telefono: '',
  tipo_doc: 'DNI',
  nro_doc: '',
  fecha_ingreso: new Date().toISOString().slice(0, 10),
  contrasenia: '',
})

function validar(datos: ReturnType<typeof formVacio>, editando: boolean): Record<string, string> {
  const errores: Record<string, string> = {}

  if (!datos.nombre.trim()) errores.nombre = 'Ingresá el nombre.'
  if (!datos.apellido.trim()) errores.apellido = 'Ingresá el apellido.'
  if (!datos.mail.trim()) errores.mail = 'Ingresá el correo electrónico.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.mail.trim()))
    errores.mail = 'Revisá el correo: parece incompleto.'
  if (!datos.telefono.trim()) errores.telefono = 'Ingresá un teléfono.'
  if (!datos.tipo_doc) errores.tipo_doc = 'Elegí el tipo de documento.'
  if (!datos.nro_doc.trim()) errores.nro_doc = 'Ingresá el número de documento.'
  else if (!/^\d{6,10}$/.test(datos.nro_doc.trim())) errores.nro_doc = 'Va sin puntos ni espacios.'
  if (!datos.fecha_ingreso) errores.fecha_ingreso = 'Indicá la fecha de ingreso.'

  // Al editar, una contraseña vacía significa "dejala como está".
  if (!editando) {
    if (!datos.contrasenia) errores.contrasenia = 'Elegí una contraseña inicial.'
    else if (datos.contrasenia.length < 8) errores.contrasenia = 'Tiene que tener al menos 8 caracteres.'
  } else if (datos.contrasenia && datos.contrasenia.length < 8) {
    errores.contrasenia = 'Tiene que tener al menos 8 caracteres.'
  }

  return errores
}

/**
 * Alta de agentes del backoffice.
 *
 * No hay registro público para este rol: la única forma de crear un agente es
 * que otro agente ya logueado lo cargue acá.
 */
export default function Agentes() {
  const { userId } = useAuth()
  const { notificar } = useNotificacion()

  const {
    datos: agentes,
    cargando,
    error,
    recargar,
  } = useRecurso<Agente[]>(() => obtenerAgentes(), [], [])

  const [formAbierto, setFormAbierto] = useState(false)
  const [editando, setEditando] = useState<Agente | null>(null)
  const [formData, setFormData] = useState(formVacio)
  const [aEliminar, setAEliminar] = useState<Agente | null>(null)
  const form = useFormularioApi()

  const cambiar = (campo: keyof ReturnType<typeof formVacio>, valor: string) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }))
    form.limpiarCampo(campo)
  }

  const cerrarFormulario = () => {
    setFormAbierto(false)
    setEditando(null)
    setFormData(formVacio())
    form.limpiar()
  }

  const abrirEdicion = (a: Agente) => {
    setEditando(a)
    setFormData({
      nombre: a.nombre,
      apellido: a.apellido,
      mail: a.mail,
      telefono: a.telefono,
      tipo_doc: a.tipo_doc || 'DNI',
      nro_doc: String(a.nro_doc),
      fecha_ingreso: a.fecha_ingreso ? a.fecha_ingreso.slice(0, 10) : '',
      contrasenia: '',
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
      if (editando) await actualizarAgente(editando.id, formData)
      else await crearAgente(formData)
    })

    if (!ok) return

    notificar(editando ? 'Agente actualizado' : 'Agente creado')
    cerrarFormulario()
    await recargar()
  }

  const eliminar = async (agente: Agente) => {
    await eliminarAgente(agente.id)
    setAEliminar(null)
    notificar('Agente eliminado')
    await recargar()
  }

  const columnas: Columna<Agente>[] = [
    {
      id: 'agente',
      encabezado: 'Agente',
      principal: true,
      celda: (a) => (
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-salvia-100 text-sm font-semibold text-salvia-700"
          >
            {(a.nombre?.[0] ?? '?').toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-medium text-tinta-900">
              {a.nombre} {a.apellido}
              {a.id === userId && <Badge tono="terra">Vos</Badge>}
            </p>
            <p className="truncate text-xs text-tinta-500">
              {(a.tipo_doc || '—').toUpperCase()} {a.nro_doc}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'contacto',
      encabezado: 'Contacto',
      celda: (a) => (
        <div className="min-w-0">
          <a
            href={`mailto:${a.mail}`}
            className="inline-flex items-center gap-1.5 text-tinta-700 transition-colors hover:text-terra-700"
          >
            <EnvelopeIcon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{a.mail}</span>
          </a>
          <p className="truncate text-xs text-tinta-500">{a.telefono || '—'}</p>
        </div>
      ),
    },
    {
      id: 'ingreso',
      encabezado: 'Ingreso',
      alinear: 'derecha',
      ocultarEnMobile: true,
      celda: (a) => <span className="text-tinta-700">{formatearFecha(a.fecha_ingreso)}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl text-tinta-900">Agentes</h1>
          <p className="mt-0.5 text-sm text-tinta-500">
            Altas y bajas del personal con acceso al panel.
          </p>
        </div>

        <button type="button" onClick={() => setFormAbierto(true)} className="accion accion-primaria">
          <PlusIcon className="size-5" aria-hidden="true" />
          Nuevo agente
        </button>
      </div>

      <EstadoVista
        cargando={cargando}
        error={error}
        vacio={agentes.length === 0}
        onReintentar={recargar}
        mensajeVacio="Todavía no hay agentes"
        detalleVacio="Cargá al primero para que pueda entrar al panel."
        accionVacio={
          <button type="button" onClick={() => setFormAbierto(true)} className="accion accion-primaria accion-sm">
            <PlusIcon className="size-4" aria-hidden="true" />
            Nuevo agente
          </button>
        }
      >
        <Tabla
          datos={agentes}
          columnas={columnas}
          claveFila={(a) => a.id}
          acciones={(a) => (
            <>
              <button type="button" onClick={() => abrirEdicion(a)} className="accion accion-fantasma accion-sm">
                <PencilSquareIcon className="size-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Editar</span>
              </button>
              <button
                type="button"
                onClick={() => setAEliminar(a)}
                disabled={a.id === userId}
                title={a.id === userId ? 'No podés eliminar tu propia cuenta' : undefined}
                className="accion accion-fantasma accion-sm text-alerta-700 hover:bg-alerta-50"
              >
                <TrashIcon className="size-4" aria-hidden="true" />
                <span className="sr-only">
                  Eliminar a {a.nombre} {a.apellido}
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
        titulo={editando ? 'Editar agente' : 'Nuevo agente'}
        descripcion={
          editando
            ? 'Dejá la contraseña vacía para no cambiarla.'
            : 'Va a poder entrar al panel con este correo y contraseña.'
        }
        pie={
          <>
            <button type="button" onClick={cerrarFormulario} className="accion accion-fantasma">
              Cancelar
            </button>
            <button type="submit" form="form-agente" disabled={form.enviando} className="accion accion-primaria">
              {form.enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear agente'}
            </button>
          </>
        }
      >
        <form id="form-agente" onSubmit={guardar} noValidate className="space-y-4">
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
                <input {...props} type="text" value={formData.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
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
            <Campo etiqueta="Correo electrónico" error={form.erroresCampo.mail} requerido>
              {(props) => (
                <input {...props} type="email" value={formData.mail} onChange={(e) => cambiar('mail', e.target.value)} />
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

          <div className="grid gap-4 sm:grid-cols-3">
            <Campo etiqueta="Tipo de documento" error={form.erroresCampo.tipo_doc} requerido>
              {(props) => (
                <select {...props} value={formData.tipo_doc} onChange={(e) => cambiar('tipo_doc', e.target.value)}>
                  {TIPOS_DOC.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            <Campo etiqueta="Número" error={form.erroresCampo.nro_doc} requerido>
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

            <Campo etiqueta="Fecha de ingreso" error={form.erroresCampo.fecha_ingreso} requerido>
              {(props) => (
                <input
                  {...props}
                  type="date"
                  value={formData.fecha_ingreso}
                  onChange={(e) => cambiar('fecha_ingreso', e.target.value)}
                />
              )}
            </Campo>
          </div>

          <Campo
            etiqueta={editando ? 'Nueva contraseña' : 'Contraseña'}
            ayuda={editando ? 'Sólo si querés cambiarla. Al menos 8 caracteres.' : 'Al menos 8 caracteres.'}
            error={form.erroresCampo.contrasenia}
            requerido={!editando}
          >
            {(props) => (
              <input
                {...props}
                type="password"
                autoComplete="new-password"
                value={formData.contrasenia}
                onChange={(e) => cambiar('contrasenia', e.target.value)}
              />
            )}
          </Campo>
        </form>
      </Modal>

      <ConfirmDialog
        open={aEliminar !== null}
        titulo="Eliminar agente"
        descripcion="Pierde el acceso al panel. No se puede deshacer."
        detalle={aEliminar ? `${aEliminar.nombre} ${aEliminar.apellido} · ${aEliminar.mail}` : undefined}
        textoConfirmar="Eliminar"
        onConfirmar={() => (aEliminar ? eliminar(aEliminar) : undefined)}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  )
}

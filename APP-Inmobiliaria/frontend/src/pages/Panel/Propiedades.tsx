import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ClockIcon,
  HomeModernIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import apiClient from '../../utils/apiClient'
import { formatearFecha, formatearMoneda } from '../../utils/formato'
import { tonoEstadoPropiedad } from '../../lib/estados'
import { useRecurso } from '../../hooks/useRecurso'
import { useFormularioApi } from '../../hooks/useFormularioApi'
import { useNotificacion } from '../../hooks/useNotificacion'
import Modal from '../../components/Modal'
import Badge from '../../components/ui/Badge'
import Campo from '../../components/ui/Campo'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EstadoVista from '../../components/ui/EstadoVista'
import Tabla, { type Columna } from '../../components/ui/Tabla'

/** Quién tiene tomada la propiedad. Solo viene si el pedido lo hace un agente. */
export interface Ocupacion {
  origen: 'senia' | 'alquiler'
  cliente: { id?: number; nombre: string }
  desde: string
  hasta: string | null
}

export interface Propiedad {
  id: number
  direccion: string
  precio: number
  estado: string
  hora_desde?: string
  hora_hasta?: string
  descripcion?: string
  tipoPropiedad?: { id: number; descripcion: string }
  imagenes?: { id: number; path: string }[]
  ocupacion?: Ocupacion | null
}

/** El backend la expone como `descripcion`, igual que el resto de las tablas de referencia. */
interface TipoPropiedad {
  id: number
  descripcion: string
}

export interface Cliente {
  id: number
  nombre: string
  apellido: string
}

const ESTADOS = ['disponible', 'señada', 'alquilada'] as const

const FORM_VACIO = {
  direccion: '',
  precio: '',
  estado: 'disponible',
  descripcion: '',
  hora_desde: '',
  hora_hasta: '',
  tipoPropiedad: '',
}

/** El formulario tenía `noValidate` y ninguna validación de JS detrás. */
function validar(datos: typeof FORM_VACIO): Record<string, string> {
  const errores: Record<string, string> = {}

  if (!datos.direccion.trim()) errores.direccion = 'Ingresá la dirección.'
  const precio = Number(datos.precio)
  if (!datos.precio.trim()) errores.precio = 'Ingresá el precio del alquiler.'
  else if (!Number.isFinite(precio) || precio <= 0) errores.precio = 'Tiene que ser un número mayor a cero.'
  if (!datos.tipoPropiedad) errores.tipoPropiedad = 'Elegí el tipo de propiedad.'
  if (!datos.hora_desde) errores.hora_desde = 'Indicá desde qué hora se puede visitar.'
  if (!datos.hora_hasta) errores.hora_hasta = 'Indicá hasta qué hora se puede visitar.'
  else if (datos.hora_desde && datos.hora_hasta <= datos.hora_desde)
    errores.hora_hasta = 'Tiene que ser posterior a la hora de inicio.'

  return errores
}

/** Recorta los segundos que devuelve MySQL para una columna `time`. */
function hora(valor?: string): string {
  return valor ? valor.slice(0, 5) : '—'
}

export default function Propiedades() {
  const { notificar } = useNotificacion()

  const {
    datos: propiedades,
    cargando,
    error,
    recargar,
  } = useRecurso<Propiedad[]>(
    // El token va sí o sí: sin él el backend no devuelve la ocupación.
    async () => (await apiClient.get('/propiedades')).data.data ?? [],
    [],
    [],
  )

  const { datos: tipos } = useRecurso<TipoPropiedad[]>(
    async () => (await apiClient.get('/tipopropiedades')).data.data ?? [],
    [],
    [],
  )

  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos')

  // --- Alta y edición ---
  const [formAbierto, setFormAbierto] = useState(false)
  const [editando, setEditando] = useState<Propiedad | null>(null)
  const [formData, setFormData] = useState(FORM_VACIO)
  const [imagenes, setImagenes] = useState<File[]>([])
  const form = useFormularioApi()

  // --- Diálogos ---
  const [aEliminar, setAEliminar] = useState<Propiedad | null>(null)
  const [aSenar, setASenar] = useState<Propiedad | null>(null)

  const propiedadesFiltradas = useMemo(
    () =>
      estadoFiltro === 'todos'
        ? propiedades
        : propiedades.filter((p) => p.estado?.toLowerCase() === estadoFiltro),
    [propiedades, estadoFiltro],
  )

  // Las vistas previas se creaban con URL.createObjectURL() dentro del render y
  // se "liberaban" creando otra URL nueva para revocarla, que no libera nada.
  const previews = useMemo(() => imagenes.map((img) => URL.createObjectURL(img)), [imagenes])
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews])

  const cambiar = (campo: keyof typeof FORM_VACIO, valor: string) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }))
    form.limpiarCampo(campo)
  }

  const cerrarFormulario = () => {
    setFormAbierto(false)
    setEditando(null)
    setFormData(FORM_VACIO)
    setImagenes([])
    form.limpiar()
  }

  const abrirEdicion = (p: Propiedad) => {
    setEditando(p)
    setFormData({
      direccion: p.direccion ?? '',
      precio: String(p.precio ?? ''),
      estado: p.estado ?? 'disponible',
      descripcion: p.descripcion ?? '',
      hora_desde: hora(p.hora_desde) === '—' ? '' : hora(p.hora_desde),
      hora_hasta: hora(p.hora_hasta) === '—' ? '' : hora(p.hora_hasta),
      tipoPropiedad: p.tipoPropiedad?.id ? String(p.tipoPropiedad.id) : '',
    })
    setImagenes([])
    form.limpiar()
    setFormAbierto(true)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()

    const errores = validar(formData)
    if (Object.keys(errores).length > 0) {
      form.setErroresCampo(errores)
      return
    }

    const ok = await form.enviar(async () => {
      const payload = {
        direccion: formData.direccion.trim(),
        precio: Number(formData.precio),
        estado: formData.estado,
        descripcion: formData.descripcion.trim() || undefined,
        hora_desde: formData.hora_desde,
        hora_hasta: formData.hora_hasta,
        tipoPropiedad: Number(formData.tipoPropiedad),
      }

      if (editando) {
        await apiClient.put(`/propiedades/${editando.id}`, payload)
        return
      }

      const res = await apiClient.post('/propiedades', payload)
      const propiedadId: number = res.data.data.id

      for (const img of imagenes) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error(`No se pudo leer ${img.name}`))
          reader.readAsDataURL(img)
        })

        await apiClient.post('/imagenes', {
          propiedad: propiedadId,
          base64,
          filename: `${Date.now()}-${img.name}`,
        })
      }
    })

    if (!ok) return

    notificar(editando ? 'Propiedad actualizada' : 'Propiedad creada')
    cerrarFormulario()
    await recargar()
  }

  const eliminar = useCallback(
    async (p: Propiedad) => {
      try {
        await apiClient.delete(`/propiedades/${p.id}`)
      } catch {
        // El backend rechaza el borrado si hay señas o visitas colgando. Antes
        // el motivo se adivinaba desde un alert() con el texto fijo.
        throw new Error('No se pudo eliminar: la propiedad tiene señas o visitas asociadas.')
      }
      setAEliminar(null)
      notificar('Propiedad eliminada')
      await recargar()
    },
    [notificar, recargar],
  )

  const columnas: Columna<Propiedad>[] = [
    {
      id: 'propiedad',
      encabezado: 'Propiedad',
      principal: true,
      celda: (p) => (
        <div className="flex items-center gap-3">
          {p.imagenes?.[0] ? (
            <img
              // Antes era http://localhost:3000 escrito a mano: fuera de la
              // máquina del desarrollador, todas las miniaturas rompían.
              src={p.imagenes[0].path}
              alt=""
              className="size-11 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-arena-100">
              <HomeModernIcon className="size-5 text-arena-400" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-tinta-900">{p.direccion}</p>
            <p className="truncate text-xs text-tinta-500">
              {p.tipoPropiedad?.descripcion ?? 'Sin tipo'} · #{p.id}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'precio',
      encabezado: 'Precio',
      alinear: 'derecha',
      celda: (p) => <span className="font-medium text-terra-600">{formatearMoneda(p.precio)}</span>,
    },
    {
      id: 'estado',
      encabezado: 'Estado',
      celda: (p) => (
        <div className="flex flex-col items-start gap-1">
          <Badge tono={tonoEstadoPropiedad(p.estado)}>{p.estado}</Badge>
          {p.estado?.toLowerCase() !== 'disponible' &&
            (p.ocupacion ? (
              <span className="text-xs text-tinta-500">
                {p.ocupacion.cliente.nombre} · desde el {formatearFecha(p.ocupacion.desde)}
              </span>
            ) : (
              <span className="text-xs text-ambar-700">Sin seña ni alquiler que lo respalde</span>
            ))}
        </div>
      ),
    },
    {
      id: 'visitas',
      encabezado: 'Visitas',
      ocultarEnMobile: true,
      celda: (p) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-tinta-500">
          <ClockIcon className="size-4" aria-hidden="true" />
          {hora(p.hora_desde)} a {hora(p.hora_hasta)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl text-tinta-900">Propiedades</h1>
          <p className="mt-0.5 text-sm text-tinta-500">
            {propiedades.length} {propiedades.length === 1 ? 'propiedad cargada' : 'propiedades cargadas'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="filtro-estado" className="sr-only">
            Filtrar por estado
          </label>
          <select
            id="filtro-estado"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="rounded-lg border border-arena-300 bg-white px-3 py-2 text-sm text-tinta-900"
          >
            <option value="todos">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e[0].toUpperCase() + e.slice(1)}
              </option>
            ))}
          </select>

          <button type="button" onClick={() => setFormAbierto(true)} className="accion accion-primaria">
            <PlusIcon className="size-5" aria-hidden="true" />
            Nueva propiedad
          </button>
        </div>
      </div>

      <EstadoVista
        cargando={cargando}
        error={error}
        vacio={propiedadesFiltradas.length === 0}
        onReintentar={recargar}
        mensajeVacio={
          propiedades.length === 0 ? 'Todavía no hay propiedades' : 'Ninguna propiedad con ese estado'
        }
        detalleVacio={
          propiedades.length === 0
            ? 'Cargá la primera para que aparezca en el listado de alquiler.'
            : 'Probá con otro filtro.'
        }
        accionVacio={
          propiedades.length === 0 && (
            <button type="button" onClick={() => setFormAbierto(true)} className="accion accion-primaria accion-sm">
              <PlusIcon className="size-4" aria-hidden="true" />
              Nueva propiedad
            </button>
          )
        }
      >
        <Tabla
          datos={propiedadesFiltradas}
          columnas={columnas}
          claveFila={(p) => p.id}
          acciones={(p) => (
            <>
              <button
                type="button"
                onClick={() => setASenar(p)}
                disabled={p.estado?.toLowerCase() !== 'disponible'}
                title={
                  p.estado?.toLowerCase() !== 'disponible'
                    ? 'Solo se puede señar una propiedad disponible'
                    : undefined
                }
                className="accion accion-secundaria accion-sm"
              >
                Señar
              </button>
              <button
                type="button"
                onClick={() => abrirEdicion(p)}
                className="accion accion-fantasma accion-sm"
              >
                <PencilSquareIcon className="size-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Editar</span>
              </button>
              <button
                type="button"
                onClick={() => setAEliminar(p)}
                className="accion accion-fantasma accion-sm text-alerta-700 hover:bg-alerta-50"
              >
                <TrashIcon className="size-4" aria-hidden="true" />
                <span className="sr-only">Eliminar {p.direccion}</span>
              </button>
            </>
          )}
        />
      </EstadoVista>

      {/* --- Alta y edición ------------------------------------------------ */}
      <Modal
        open={formAbierto}
        onClose={cerrarFormulario}
        ancho="lg"
        titulo={editando ? 'Editar propiedad' : 'Nueva propiedad'}
        descripcion={
          editando ? `Cambios sobre ${editando.direccion}.` : 'Los datos que se publican en el listado.'
        }
        pie={
          <>
            <button type="button" onClick={cerrarFormulario} className="accion accion-fantasma">
              Cancelar
            </button>
            <button
              type="submit"
              form="form-propiedad"
              disabled={form.enviando}
              className="accion accion-primaria"
            >
              {form.enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear propiedad'}
            </button>
          </>
        }
      >
        <form id="form-propiedad" onSubmit={guardar} noValidate className="space-y-4">
          {form.error && (
            <p
              role="alert"
              className="rounded-lg border border-alerta-700/20 bg-alerta-50 px-4 py-3 text-sm text-alerta-700"
            >
              {form.error}
            </p>
          )}

          <Campo etiqueta="Dirección" error={form.erroresCampo.direccion} requerido>
            {(props) => (
              <input
                {...props}
                type="text"
                placeholder="Córdoba 1234"
                value={formData.direccion}
                onChange={(e) => cambiar('direccion', e.target.value)}
              />
            )}
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Precio mensual" error={form.erroresCampo.precio} requerido>
              {(props) => (
                <input
                  {...props}
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.precio}
                  onChange={(e) => cambiar('precio', e.target.value)}
                />
              )}
            </Campo>

            <Campo etiqueta="Tipo de propiedad" error={form.erroresCampo.tipoPropiedad} requerido>
              {(props) => (
                <select
                  {...props}
                  value={formData.tipoPropiedad}
                  onChange={(e) => cambiar('tipoPropiedad', e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {/* Acá se leía `t.nombre`, que no existe en la respuesta:
                      la lista se dibujaba con todas las opciones en blanco. */}
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.descripcion}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Campo etiqueta="Estado" error={form.erroresCampo.estado}>
              {(props) => (
                <select {...props} value={formData.estado} onChange={(e) => cambiar('estado', e.target.value)}>
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>
                      {e[0].toUpperCase() + e.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            <Campo etiqueta="Visitas desde" error={form.erroresCampo.hora_desde} requerido>
              {(props) => (
                <input
                  {...props}
                  type="time"
                  value={formData.hora_desde}
                  onChange={(e) => cambiar('hora_desde', e.target.value)}
                />
              )}
            </Campo>

            <Campo etiqueta="Visitas hasta" error={form.erroresCampo.hora_hasta} requerido>
              {(props) => (
                <input
                  {...props}
                  type="time"
                  value={formData.hora_hasta}
                  onChange={(e) => cambiar('hora_hasta', e.target.value)}
                />
              )}
            </Campo>
          </div>

          <Campo etiqueta="Descripción" error={form.erroresCampo.descripcion}>
            {(props) => (
              <textarea
                {...props}
                rows={3}
                placeholder="Qué tiene la propiedad y qué la distingue."
                value={formData.descripcion}
                onChange={(e) => cambiar('descripcion', e.target.value)}
                className={`${props.className} resize-y`}
              />
            )}
          </Campo>

          {/* Las imágenes se suben con el alta. En la edición el backend no
              expone un endpoint para reemplazarlas, así que no se ofrece. */}
          {!editando && (
            <Campo etiqueta="Imágenes" ayuda="Se publican en el orden en que las elegís.">
              {(props) => (
                <input
                  {...props}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setImagenes(e.target.files ? Array.from(e.target.files) : [])}
                  className={`${props.className} file:me-3 file:rounded-md file:border-0 file:bg-arena-200 file:px-3 file:py-1.5 file:text-sm file:text-tinta-900`}
                />
              )}
            </Campo>
          )}

          {previews.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {previews.map((src, i) => (
                <li key={src}>
                  <img
                    src={src}
                    alt={`Vista previa ${i + 1}`}
                    className="size-20 rounded-lg border border-arena-200 object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </form>
      </Modal>

      {aSenar && (
        <DialogoSenar
          propiedad={aSenar}
          onCerrar={() => setASenar(null)}
          onListo={async () => {
            setASenar(null)
            await recargar()
          }}
        />
      )}

      <ConfirmDialog
        open={aEliminar !== null}
        titulo="Eliminar propiedad"
        descripcion="La propiedad deja de estar publicada. No se puede deshacer."
        detalle={aEliminar?.direccion}
        textoConfirmar="Eliminar"
        onConfirmar={() => (aEliminar ? eliminar(aEliminar) : undefined)}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  )
}

/**
 * Señar una propiedad a nombre de un cliente.
 *
 * Reemplaza a un `<div className="fixed inset-0">` escrito a mano, sin rol,
 * sin foco atrapado y sin Esc, con el select de clientes cargándose recién al
 * abrirlo. Los clientes se piden acá, cuando el diálogo existe.
 */
function DialogoSenar({
  propiedad,
  onCerrar,
  onListo,
}: {
  propiedad: Propiedad
  onCerrar: () => void
  onListo: () => Promise<void>
}) {
  const { notificar } = useNotificacion()
  const form = useFormularioApi()
  const [clienteId, setClienteId] = useState('')
  const [importe, setImporte] = useState('')

  const { datos: clientes, cargando } = useRecurso<Cliente[]>(
    async () => (await apiClient.get('/clientes')).data.data ?? [],
    [],
    [],
  )

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()

    const errores: Record<string, string> = {}
    if (!clienteId) errores.cliente = 'Elegí a nombre de quién queda la seña.'
    const monto = Number(importe)
    if (!importe.trim()) errores.importe = 'Ingresá el importe de la seña.'
    else if (!Number.isFinite(monto) || monto <= 0) errores.importe = 'Tiene que ser mayor a cero.'
    else if (monto > propiedad.precio)
      errores.importe = `No puede superar el precio de la propiedad (${formatearMoneda(propiedad.precio)}).`

    if (Object.keys(errores).length > 0) {
      form.setErroresCampo(errores)
      return
    }

    const ok = await form.enviar(async () => {
      await apiClient.post('/senias', {
        propiedad: propiedad.id,
        cliente: Number(clienteId),
        importe: monto,
      })
      // Acá había un PUT que ponía la propiedad en 'señada'. El backend no lo
      // hace al crear la seña: la retiene recién cuando se confirma o se cobra
      // (ver senia.controler.ts). Adelantarlo dejaba propiedades marcadas como
      // señadas sin una seña confirmada detrás, que es justo el caso que la
      // pantalla marcaba como "estado puesto manualmente".
    })

    if (!ok) return

    notificar('Seña creada', 'exito', 'Queda pendiente de pago hasta que se confirme.')
    await onListo()
  }

  return (
    <Modal
      open
      onClose={onCerrar}
      titulo="Señar propiedad"
      descripcion="La seña nace pendiente de pago; la propiedad se retiene cuando se confirma."
      pie={
        <>
          <button type="button" onClick={onCerrar} className="accion accion-fantasma">
            Cancelar
          </button>
          <button type="submit" form="form-senar" disabled={form.enviando} className="accion accion-primaria">
            {form.enviando ? 'Creando…' : 'Crear seña'}
          </button>
        </>
      }
    >
      <form id="form-senar" onSubmit={enviar} noValidate className="space-y-4">
        {form.error && (
          <p
            role="alert"
            className="rounded-lg border border-alerta-700/20 bg-alerta-50 px-4 py-3 text-sm text-alerta-700"
          >
            {form.error}
          </p>
        )}

        <div className="rounded-lg border border-arena-200 bg-arena-50 px-4 py-3">
          <p className="text-sm font-medium text-tinta-900">{propiedad.direccion}</p>
          <p className="text-xs text-tinta-500">{formatearMoneda(propiedad.precio)} por mes</p>
        </div>

        <Campo etiqueta="Cliente" error={form.erroresCampo.cliente} requerido>
          {(props) => (
            <select
              {...props}
              value={clienteId}
              onChange={(e) => {
                setClienteId(e.target.value)
                form.limpiarCampo('cliente')
              }}
              disabled={cargando || clientes.length === 0}
            >
              <option value="">
                {cargando ? 'Cargando clientes…' : clientes.length === 0 ? 'No hay clientes' : 'Elegí un cliente'}
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido}
                </option>
              ))}
            </select>
          )}
        </Campo>

        <Campo
          etiqueta="Importe"
          ayuda={`Como referencia, el 20% son ${formatearMoneda(Math.round(propiedad.precio * 0.2))}.`}
          error={form.erroresCampo.importe}
          requerido
        >
          {(props) => (
            <input
              {...props}
              type="number"
              min="0"
              step="1000"
              value={importe}
              onChange={(e) => {
                setImporte(e.target.value)
                form.limpiarCampo('importe')
              }}
            />
          )}
        </Campo>
      </form>
    </Modal>
  )
}

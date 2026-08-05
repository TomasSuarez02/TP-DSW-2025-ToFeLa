import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ClockIcon,
  HomeModernIcon,
  TagIcon,
} from '@heroicons/react/24/outline'
import Footer from '../../components/Footer.tsx'
import Header from '../../components/Header.tsx'
import Modal from '../../components/Modal.tsx'
import Gallery from './Gallery.tsx'
import type { Propiedades } from './Card.tsx'
import apiClient from '../../utils/apiClient'
import { crearSenia } from '../../services/senias'
import { parseApiError } from '../../utils/apiErrors'
import { useAuth } from '../../auth/useAuth'
import {
  SENIA_DIAS_VENCIMIENTO,
  SENIA_PORCENTAJE,
  calcularSaldo,
  calcularSeniaMinima,
  formatearMoneda,
} from '../../config/senia'

/** Un dato de la ficha. Sin valor no se dibuja: una fila con "—" no informa nada. */
function Dato({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono: typeof HomeModernIcon
  etiqueta: string
  valor?: string | null
}) {
  if (!valor) return null
  return (
    <div className="flex items-start gap-3">
      <Icono className="mt-0.5 size-5 shrink-0 text-terra-600" aria-hidden="true" />
      <div>
        <dt className="text-xs tracking-wider text-tinta-500 uppercase">{etiqueta}</dt>
        <dd className="mt-0.5 text-tinta-900">{valor}</dd>
      </div>
    </div>
  )
}

/** Los horarios llegan como '09:00:00'; en pantalla sobran los segundos. */
function hhmm(hora?: string | null) {
  return hora ? hora.slice(0, 5) : null
}

export default function Page({ propiedad }: { propiedad?: Propiedades }) {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { sesion, rol: userRole, userId, isLoggedIn } = useAuth()

  const [prop, setProp] = useState<Propiedades | null>(propiedad ?? null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<boolean>(false)
  const [showSeniaModal, setShowSeniaModal] = useState<boolean>(false)
  const [loggedClient, setLoggedClient] = useState<{
    id: number
    nombre?: string
    apellido?: string
    email?: string
  } | null>(null)
  const [seniaImporte, setSeniaImporte] = useState<number>(0)
  const [seniaError, setSeniaError] = useState<string | null>(null)
  const [creandoSenia, setCreandoSenia] = useState<boolean>(false)
  const [horaDesde, setHoraDesde] = useState<string>('')
  const [horaHasta, setHoraHasta] = useState<string>('')
  const [slotSel, setSlotSel] = useState('')
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [visitError, setVisitError] = useState<string | null>(null)
  const [agendando, setAgendando] = useState<boolean>(false)
  const [visitaOk, setVisitaOk] = useState<boolean>(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    apiClient
      .get(`/propiedades/${id}`)
      .then(res => {
        const payload = res.data?.data ?? res.data
        setProp(payload)
        setHoraDesde(payload.hora_desde)
        setHoraHasta(payload.hora_hasta)
      })
      .catch(err => {
        console.error('Error fetching propiedad', err)
        setError('No se pudo cargar la propiedad')
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (userRole !== 'cliente' || !userId) {
      setLoggedClient(null)
      return
    }

    apiClient
      .get(`/clientes/${userId}`)
      .then(res => {
        const clientPayload = res.data?.data ?? res.data
        setLoggedClient({
          id: clientPayload.id,
          nombre: clientPayload.nombre,
          apellido: clientPayload.apellido,
          email: clientPayload.email,
        })
      })
      .catch(err => {
        console.warn('Error fetching client data', err)
        setLoggedClient({ id: userId, email: sesion?.email ?? '' })
      })
  }, [userRole, userId, sesion?.email])

  useEffect(() => {
    if (!prop?.precio) return
    setSeniaImporte(calcularSeniaMinima(prop.precio))
  }, [prop])

  const slots =
    !horaDesde || !horaHasta
      ? []
      : (() => {
          const [h1, m1] = horaDesde.split(':').map(Number)
          const [h2, m2] = horaHasta.split(':').map(Number)
          const from = h1 * 60 + m1
          const to = h2 * 60 + m2

          const arr: string[] = []
          for (let t = from; t + 60 <= to; t += 60) {
            const hh = String(Math.floor(t / 60)).padStart(2, '0')
            const mm = String(t % 60).padStart(2, '0')
            arr.push(`${hh}:${mm}`)
          }
          return arr
        })()

  const cerrarVisita = useCallback(() => {
    setOpen(false)
    setSlotSel('')
    setVisitError(null)
    setVisitaOk(false)
  }, [])

  /**
   * Antes el resultado de agendar salía por `alert()`: un cartel del sistema
   * operativo, sin relación con la página, que el usuario tenía que descartar
   * antes de ver qué había pasado. Ahora el diálogo se responde a sí mismo.
   */
  const agendarVisita = useCallback(() => {
    if (!prop?.id || !userId || !slotSel) return

    const [y, mo, d] = fecha.split('-').map(Number)
    const [hh, mm] = slotSel.split(':').map(Number)
    if (new Date(y, mo - 1, d, hh, mm, 0) < new Date()) {
      setVisitError('Ese horario ya pasó. Elegí una fecha u horario posterior.')
      return
    }

    setVisitError(null)
    setAgendando(true)

    apiClient
      .post('/visitas', { propiedad: prop.id, fecha_hora: `${fecha} ${slotSel}:00`, cliente: userId })
      .then(() => setVisitaOk(true))
      .catch((err: unknown) => {
        console.error('Error agendando visita', err)
        const parsedError =
          typeof err === 'object' &&
          err !== null &&
          'parsedError' in err &&
          typeof (err as { parsedError?: unknown }).parsedError === 'object' &&
          (err as { parsedError?: unknown }).parsedError !== null
            ? (err as { parsedError: { message?: string; fieldErrors?: Record<string, string> } })
                .parsedError
            : null

        const parsed = parsedError ?? {
          message: 'No pudimos agendar la visita. Intentá de nuevo en un momento.',
          fieldErrors: {} as Record<string, string>,
        }
        setVisitError(
          parsed.fieldErrors?.fecha_hora ??
            parsed.message ??
            'No pudimos agendar la visita. Intentá de nuevo en un momento.',
        )
      })
      .finally(() => setAgendando(false))
  }, [prop?.id, userId, slotSel, fecha])

  const disponible = prop?.estado?.toLowerCase() === 'disponible'
  const puedeSeniar = userRole === 'cliente' && loggedClient !== null && disponible

  // --- Estados de pantalla -------------------------------------------------

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-arena-50 py-8 sm:py-12">
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
            <div className="h-4 w-40 animate-pulse rounded-full bg-arena-200" />
            <div className="mt-6 h-10 w-2/3 max-w-lg animate-pulse rounded-lg bg-arena-200" />
            {/* Misma proporción y mismo reparto que la galería real, para
                que al llegar los datos la página no dé un salto. */}
            <div
              className="mt-8 grid aspect-4/3 grid-cols-4 grid-rows-2 gap-2 sm:aspect-2/1 sm:gap-3"
              aria-hidden="true"
            >
              <div className="col-span-4 row-span-2 animate-pulse rounded-card bg-arena-100 sm:col-span-2" />
              <div className="hidden animate-pulse rounded-card bg-arena-100 sm:block" />
              <div className="hidden animate-pulse rounded-card bg-arena-100 sm:block" />
              <div className="hidden animate-pulse rounded-card bg-arena-100 sm:block" />
              <div className="hidden animate-pulse rounded-card bg-arena-100 sm:block" />
            </div>
            <p className="sr-only" role="status">
              Cargando la propiedad
            </p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (error || !prop) {
    return (
      <>
        <Header />
        <main className="grid min-h-[70vh] place-items-center bg-arena-50 px-4 py-16">
          <div className="max-w-md text-center">
            <h1 className="font-display text-3xl text-tinta-900">
              {error ? 'No pudimos cargar la propiedad' : 'Esta propiedad ya no está publicada'}
            </h1>
            <p className="mt-3 leading-relaxed text-tinta-500">
              {error
                ? 'Puede ser un problema de conexión. Probá de nuevo en un momento.'
                : 'Puede haberse alquilado o dado de baja. Mirá el resto del catálogo.'}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {error && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="accion accion-primaria"
                >
                  Reintentar
                </button>
              )}
              <Link to="/Rent" className="accion accion-secundaria">
                Ver todas las propiedades
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // --- Ficha ---------------------------------------------------------------

  const horario =
    hhmm(horaDesde) && hhmm(horaHasta) ? `${hhmm(horaDesde)} a ${hhmm(horaHasta)} h` : null

  /* El bloque de precio y acciones vive en dos lugares: pegado en la
     columna derecha en desktop, y en una barra fija abajo en mobile,
     donde el pulgar llega y el scroll no lo esconde. Es el mismo
     contenido, así que es el mismo componente. */
  const acciones = (
    <>
      {isLoggedIn ? (
        <button type="button" onClick={() => setOpen(true)} className="accion accion-primaria w-full">
          Agendar visita
        </button>
      ) : (
        <Link to="/login" className="accion accion-primaria w-full">
          Iniciá sesión para agendar
        </Link>
      )}

      {puedeSeniar && (
        <button
          type="button"
          onClick={() => setShowSeniaModal(true)}
          className="accion accion-secundaria w-full"
        >
          Señar esta propiedad
        </button>
      )}
    </>
  )

  return (
    <>
      <Header />

      <main className="bg-arena-50">
        <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <Link
            to="/Rent"
            className="inline-flex items-center gap-2 text-sm text-tinta-500 transition-colors hover:text-terra-600"
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Volver a las propiedades
          </Link>

          <header className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <h1 className="font-display text-3xl leading-tight text-balance text-tinta-900 sm:text-4xl lg:text-5xl">
                {prop.direccion}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {prop.tipoPropiedad && (
                  <span className="rounded-full bg-terra-100 px-3 py-1 text-xs font-semibold tracking-wider text-terra-800 uppercase">
                    {prop.tipoPropiedad.descripcion}
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase ${
                    disponible ? 'bg-salvia-100 text-salvia-700' : 'bg-arena-200 text-tinta-700'
                  }`}
                >
                  {prop.estado}
                </span>
              </div>
            </div>
          </header>

          <div className="mt-8">
            <Gallery imagenes={prop.imagenes ?? []} direccion={prop.direccion} />
          </div>

          <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
            {/* Lectura: la descripción manda, los datos la acompañan. */}
            <div>
              <section>
                <h2 className="font-display text-2xl text-tinta-900">Sobre esta propiedad</h2>
                <p className="mt-4 max-w-[68ch] leading-[1.75] whitespace-pre-wrap text-tinta-700">
                  {prop.descripcion || 'La inmobiliaria todavía no cargó una descripción para esta propiedad. Podés agendar una visita para conocerla en persona.'}
                </p>
              </section>

              <section className="mt-10 border-t border-arena-200 pt-8">
                <h2 className="font-display text-2xl text-tinta-900">Datos</h2>
                <dl className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Dato
                    icono={HomeModernIcon}
                    etiqueta="Tipo"
                    valor={prop.tipoPropiedad?.descripcion}
                  />
                  <Dato icono={TagIcon} etiqueta="Estado" valor={prop.estado} />
                  <Dato icono={ClockIcon} etiqueta="Horario de visitas" valor={horario} />
                  <Dato
                    icono={BuildingOffice2Icon}
                    etiqueta="Inmobiliaria"
                    valor={prop.inmobiliaria?.descripcion}
                  />
                </dl>
              </section>
            </div>

            {/* Decisión: precio, seña y acciones, siempre a la vista. */}
            <aside className="hidden lg:block">
              <div className="sticky top-28 rounded-card border border-arena-200 bg-white p-6 shadow-card">
                <p className="text-xs tracking-wider text-tinta-500 uppercase">Alquiler mensual</p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-4xl text-terra-600 tabular-nums">
                    {formatearMoneda(prop.precio)}
                  </span>
                  <span className="text-sm text-tinta-500">por mes</span>
                </p>

                {disponible && (
                  <div className="mt-5 rounded-lg bg-arena-50 px-4 py-3">
                    <p className="text-sm text-tinta-700">
                      Reservala con una seña de{' '}
                      <strong className="font-semibold text-tinta-900 tabular-nums">
                        {formatearMoneda(seniaImporte)}
                      </strong>{' '}
                      <span className="text-tinta-500">
                        ({Math.round(SENIA_PORCENTAJE * 100)}% del alquiler)
                      </span>
                    </p>
                  </div>
                )}

                <div className="mt-5 space-y-2.5">{acciones}</div>

                {horario && (
                  <p className="mt-4 text-center text-xs text-tinta-500">
                    Se puede visitar de {hhmm(horaDesde)} a {hhmm(horaHasta)} h
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Barra fija de mobile: el precio y la acción no deberían depender
          de que el usuario recuerde dónde quedaron tres pantallas arriba. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-arena-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-bar backdrop-blur lg:hidden">
        <div className="flex items-center gap-4">
          <div className="min-w-0">
            <p className="font-display text-xl leading-none text-terra-600 tabular-nums">
              {formatearMoneda(prop.precio)}
            </p>
            <p className="mt-1 text-xs text-tinta-500">por mes</p>
          </div>
          <div className="ms-auto flex shrink-0 gap-2">
            {isLoggedIn ? (
              <button type="button" onClick={() => setOpen(true)} className="accion accion-primaria">
                Agendar visita
              </button>
            ) : (
              <Link to="/login" className="accion accion-primaria">
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* --- Agendar visita ---------------------------------------------- */}
      <Modal
        open={open}
        onClose={cerrarVisita}
        ancho="md"
        titulo={visitaOk ? 'Visita agendada' : 'Agendar una visita'}
        descripcion={visitaOk ? undefined : prop.direccion}
        pie={
          visitaOk ? (
            <button type="button" onClick={cerrarVisita} className="accion accion-primaria">
              Listo
            </button>
          ) : (
            <>
              <button type="button" onClick={cerrarVisita} className="accion accion-fantasma">
                Cancelar
              </button>
              <button
                type="button"
                onClick={agendarVisita}
                disabled={!slotSel || agendando}
                className="accion accion-primaria"
              >
                {agendando ? 'Agendando…' : 'Confirmar visita'}
              </button>
            </>
          )
        }
      >
        {visitaOk ? (
          <div className="py-2 text-center">
            <CheckCircleIcon className="mx-auto size-12 text-salvia-500" aria-hidden="true" />
            <p className="mt-4 leading-relaxed text-tinta-700">
              Te esperamos el{' '}
              <strong className="font-semibold text-tinta-900">
                {new Date(`${fecha}T${slotSel}`).toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </strong>{' '}
              a las <strong className="font-semibold text-tinta-900">{slotSel} h</strong> en{' '}
              {prop.direccion}.
            </p>
            <p className="mt-2 text-sm text-tinta-500">
              La vas a encontrar en Mis Señas junto con el resto de tu actividad.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label htmlFor="visit-date" className="block text-sm font-semibold text-tinta-900">
                Fecha
              </label>
              <input
                id="visit-date"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={fecha}
                onChange={e => {
                  setFecha(e.target.value)
                  setVisitError(null)
                }}
                className="mt-2 w-full rounded-lg border border-arena-300 bg-white px-3.5 py-2.5 text-tinta-900 transition-colors hover:border-arena-400"
              />
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-tinta-900">Horario</legend>

              {slots.length === 0 ? (
                <p className="mt-2 rounded-lg bg-arena-100 px-4 py-3 text-sm text-tinta-500">
                  Esta propiedad todavía no tiene horarios de visita cargados. Escribinos desde
                  Contacto y lo coordinamos.
                </p>
              ) : (
                /* Chips en vez de un <select>: los horarios son pocos y se
                   comparan de un vistazo, sin abrir nada. */
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {slots.map(s => {
                    const elegido = slotSel === s
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={elegido}
                        onClick={() => {
                          setSlotSel(s)
                          setVisitError(null)
                        }}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium tabular-nums transition-colors ${
                          elegido
                            ? 'border-terra-600 bg-terra-600 text-white'
                            : 'border-arena-300 bg-white text-tinta-700 hover:border-arena-400 hover:bg-arena-50'
                        }`}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              )}
            </fieldset>

            {visitError && (
              <p role="alert" className="rounded-lg bg-alerta-50 px-4 py-3 text-sm text-alerta-700">
                {visitError}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* --- Señar --------------------------------------------------------- */}
      {loggedClient && (
        <Modal
          open={showSeniaModal}
          onClose={() => {
            setShowSeniaModal(false)
            setSeniaError(null)
          }}
          titulo="Confirmar la seña"
          descripcion={`Vas a reservar ${prop.direccion} a tu nombre.`}
          pie={
            <>
              <button
                type="button"
                disabled={creandoSenia}
                onClick={() => {
                  setShowSeniaModal(false)
                  setSeniaError(null)
                }}
                className="accion accion-fantasma"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={creandoSenia}
                onClick={async () => {
                  setSeniaError(null)
                  if (!prop?.id || !loggedClient?.id) {
                    setSeniaError('No se puede crear la seña sin propiedad o cliente.')
                    return
                  }

                  setCreandoSenia(true)
                  try {
                    const senia = await crearSenia(prop.id, seniaImporte)
                    setShowSeniaModal(false)
                    navigate(`/checkout/${senia.clave}`)
                  } catch (error) {
                    console.error('Error creating seña', error)
                    setSeniaError(parseApiError(error).message)
                  } finally {
                    setCreandoSenia(false)
                  }
                }}
                className="accion accion-primaria"
              >
                {creandoSenia ? 'Creando…' : 'Continuar al pago'}
              </button>
            </>
          }
        >
          <dl className="divide-y divide-arena-200 rounded-lg border border-arena-200">
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-tinta-500">Alquiler mensual</dt>
              <dd className="text-tinta-900 tabular-nums">{formatearMoneda(prop.precio)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 bg-arena-50 px-4 py-3">
              <dt className="text-sm font-semibold text-tinta-900">
                Seña ({Math.round(SENIA_PORCENTAJE * 100)}%)
              </dt>
              <dd className="font-display text-xl text-terra-600 tabular-nums">
                {formatearMoneda(seniaImporte)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-tinta-500">Saldo del primer mes</dt>
              <dd className="text-tinta-900 tabular-nums">
                {formatearMoneda(calcularSaldo(prop.precio, seniaImporte))}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-sm leading-relaxed text-tinta-500">
            Al confirmar pasás al pago. Una vez aprobado, la propiedad queda reservada a tu nombre
            durante{' '}
            <strong className="font-semibold text-tinta-700">
              {SENIA_DIAS_VENCIMIENTO} días corridos
            </strong>{' '}
            para que presentes la documentación y el saldo en la inmobiliaria.
          </p>

          {seniaError && (
            <p role="alert" className="mt-4 rounded-lg bg-alerta-50 px-4 py-3 text-sm text-alerta-700">
              {seniaError}
            </p>
          )}
        </Modal>
      )}

      <Footer />

      {/* La barra fija se apoya sobre el borde inferior de la ventana, así
          que al final del scroll tapaba la última franja del pie. Este
          espacio le devuelve el lugar. */}
      <div className="h-20 bg-arena-50 lg:hidden" aria-hidden="true" />
    </>
  )
}

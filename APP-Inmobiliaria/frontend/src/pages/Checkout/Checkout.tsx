import { useCallback, useEffect, useState } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { obtenerSenia } from '../../services/senias'
import { procesarPago } from '../../services/pagos'
import {
  validarTarjeta,
  formatearNumeroTarjeta,
  formatearVencimiento,
  soloDigitos,
  TARJETA_APROBADA,
  TARJETA_RECHAZADA,
} from '../../utils/tarjeta'
import { parseApiError, type FieldErrors } from '../../utils/apiErrors'
import { SENIA_DIAS_VENCIMIENTO, SENIA_PORCENTAJE, calcularSeniaMinima } from '../../config/senia'
import { formatearFecha, formatearMoneda } from '../../utils/formato'
import { refObjeto, type DatosTarjeta, type PropiedadRef, type Senia } from '../../types/senia'
import {
  CLASE_CONTROL,
  CLASE_CONTROL_ERROR,
  CLASE_CONTROL_NORMAL,
} from '../../components/ui/Campo'

type Estado = 'cargando' | 'formulario' | 'procesando' | 'aprobado' | 'rechazado'

const TARJETA_INICIAL: DatosTarjeta = {
  numeroTarjeta: '',
  titular: '',
  vencimiento: '',
  cvv: '',
}

export default function Checkout() {
  const { clave } = useParams<{ clave: string }>()
  const navigate = useNavigate()

  const [senia, setSenia] = useState<Senia | null>(null)
  const [estado, setEstado] = useState<Estado>('cargando')
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [tarjeta, setTarjeta] = useState<DatosTarjeta>(TARJETA_INICIAL)
  const [errores, setErrores] = useState<FieldErrors>({})
  const [mensajeRechazo, setMensajeRechazo] = useState<string | null>(null)
  const [vencimientoReserva, setVencimientoReserva] = useState<string | null>(null)

  useEffect(() => {
    if (!clave) return
    obtenerSenia(clave)
      .then((data) => {
        setSenia(data)
        setEstado(data.estado === 'confirmada' ? 'aprobado' : 'formulario')
        setVencimientoReserva(data.fechaVencimiento ?? null)
      })
      .catch((error) => {
        console.error('Error cargando la seña', error)
        setErrorCarga(parseApiError(error).message)
      })
  }, [clave])

  const actualizarCampo = useCallback((campo: keyof DatosTarjeta, valor: string) => {
    setTarjeta((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => {
      if (!prev[campo]) return prev
      const siguiente = { ...prev }
      delete siguiente[campo]
      return siguiente
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!senia) return

    const erroresValidacion = validarTarjeta(tarjeta)
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion)
      return
    }

    setErrores({})
    setMensajeRechazo(null)
    setEstado('procesando')

    try {
      const resultado = await procesarPago(senia, tarjeta)
      if (resultado.aprobado) {
        setVencimientoReserva(resultado.fechaVencimiento ?? null)
        setEstado('aprobado')
      } else {
        setMensajeRechazo(resultado.mensaje ?? 'El pago fue rechazado')
        setEstado('rechazado')
      }
    } catch (error) {
      console.error('Error procesando el pago', error)
      setMensajeRechazo(parseApiError(error).message)
      setEstado('rechazado')
    }
  }

  const propiedad = refObjeto<PropiedadRef>(senia?.propiedad)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-arena-50 py-10">
        <div className="container mx-auto max-w-4xl px-4">
          {estado === 'cargando' && !errorCarga && (
            <p className="rounded-card border border-arena-200 bg-white p-10 text-center text-lg text-tinta-500 shadow-card">
              Cargando datos de la seña...
            </p>
          )}

          {errorCarga && (
            <div className="rounded-card border border-arena-200 bg-white p-10 text-center shadow-card">
              <p className="text-lg text-alerta-700">{errorCarga}</p>
              <button
                type="button"
                onClick={() => navigate('/mi-cuenta/senias')}
                className="accion accion-primaria mt-6"
              >
                Volver a mis señas
              </button>
            </div>
          )}

          {senia && !errorCarga && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <ResumenSenia senia={senia} propiedad={propiedad} vencimiento={vencimientoReserva} />

              <div className="lg:col-span-3">
                {(estado === 'formulario' || estado === 'procesando' || estado === 'rechazado') && (
                  <FormularioPago
                    tarjeta={tarjeta}
                    errores={errores}
                    procesando={estado === 'procesando'}
                    mensajeRechazo={estado === 'rechazado' ? mensajeRechazo : null}
                    onCambio={actualizarCampo}
                    onSubmit={handleSubmit}
                    onCancelar={() => navigate('/mi-cuenta/senias')}
                  />
                )}

                {estado === 'aprobado' && (
                  <PagoAprobado
                    senia={senia}
                    vencimiento={vencimientoReserva}
                    onVerSenias={() => navigate('/mi-cuenta/senias')}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function ResumenSenia({
  senia,
  propiedad,
  vencimiento,
}: {
  senia: Senia
  propiedad?: PropiedadRef
  vencimiento: string | null
}) {
  const esPorcentajeEstandar =
    propiedad?.precio !== undefined && senia.importe === calcularSeniaMinima(propiedad.precio)

  return (
    <aside className="lg:col-span-2">
      <div className="sticky top-24 space-y-4 rounded-card border border-arena-200 bg-white p-6 shadow-card">
        <h2 className="font-display text-xl text-tinta-900">Resumen de la seña</h2>

        <div className="border-t border-arena-200 pt-4">
          <p className="text-xs font-semibold tracking-[0.08em] text-tinta-500 uppercase">Propiedad</p>
          <p className="text-lg font-medium text-tinta-900">
            {propiedad?.direccion ?? `Propiedad #${senia.propiedad ?? '—'}`}
          </p>
        </div>

        {propiedad?.precio !== undefined && (
          <div className="border-t border-arena-200 pt-4">
            <p className="text-xs font-semibold tracking-[0.08em] text-tinta-500 uppercase">Precio de la propiedad</p>
            <p className="text-lg text-tinta-900 tabular-nums">{formatearMoneda(propiedad.precio)}</p>
          </div>
        )}

        <div className="border-t border-arena-200 pt-4">
          <p className="text-xs font-semibold tracking-[0.08em] text-tinta-500 uppercase">
            {/* El porcentaje solo se anuncia si el importe efectivamente lo es: las señas
                cargadas a mano por un agente pueden tener cualquier importe. */}
            {esPorcentajeEstandar ? `Seña (${Math.round(SENIA_PORCENTAJE * 100)}% del valor)` : 'Seña'}
          </p>
          <p className="font-display text-3xl text-terra-600 tabular-nums">{formatearMoneda(senia.importe)}</p>
        </div>

        <div className="rounded-lg border border-arena-200 bg-arena-50 p-4 text-sm leading-relaxed text-tinta-700">
          {vencimiento ? (
            <>
              La propiedad queda reservada hasta el <strong>{formatearFecha(vencimiento)}</strong>.
            </>
          ) : (
            <>
              Una vez aprobado el pago, la propiedad queda reservada a tu nombre durante{' '}
              <strong>{SENIA_DIAS_VENCIMIENTO} días corridos</strong> para que presentes la
              documentación y el saldo restante en la inmobiliaria.
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

function FormularioPago({
  tarjeta,
  errores,
  procesando,
  mensajeRechazo,
  onCambio,
  onSubmit,
  onCancelar,
}: {
  tarjeta: DatosTarjeta
  errores: FieldErrors
  procesando: boolean
  mensajeRechazo: string | null
  onCambio: (campo: keyof DatosTarjeta, valor: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancelar: () => void
}) {
  const claseInput = (campo: keyof DatosTarjeta) =>
    `${CLASE_CONTROL} ${errores[campo] ? CLASE_CONTROL_ERROR : CLASE_CONTROL_NORMAL}`

  return (
    <div className="rounded-card border border-arena-200 bg-white p-6 shadow-card">
      <h1 className="font-display text-2xl text-tinta-900">Pagar la seña</h1>
      <p className="mt-1 text-sm text-tinta-500">
        Entorno de prueba: no se procesa ningún pago real.
      </p>

      <div className="mt-4 rounded-lg border border-ambar-700/20 bg-ambar-50 p-4 text-sm text-ambar-700">
        <p className="font-semibold">Tarjetas de prueba</p>
        <ul className="mt-1 space-y-1">
          <li>
            <code className="font-mono">{TARJETA_APROBADA}</code> — pago aprobado
          </li>
          <li>
            <code className="font-mono">{TARJETA_RECHAZADA}</code> — pago rechazado
          </li>
        </ul>
        <p className="mt-2 text-xs">
          Vencimiento: cualquier fecha futura. Código de seguridad: 3 dígitos.
        </p>
      </div>

      {mensajeRechazo && (
        <div role="alert" className="mt-4 rounded-lg border border-alerta-700/20 bg-alerta-50 px-4 py-3 text-sm text-alerta-700">
          {mensajeRechazo}. Revisá los datos o probá con otra tarjeta.
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <div>
          <label htmlFor="numeroTarjeta" className="mb-1.5 block text-sm font-medium text-tinta-900">
            Número de tarjeta
          </label>
          <input
            id="numeroTarjeta"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4111 1111 1111 1111"
            value={tarjeta.numeroTarjeta}
            onChange={(e) => onCambio('numeroTarjeta', formatearNumeroTarjeta(e.target.value))}
            className={claseInput('numeroTarjeta')}
            disabled={procesando}
          />
          {errores.numeroTarjeta && <p className="mt-1.5 text-xs font-medium text-alerta-700">{errores.numeroTarjeta}</p>}
        </div>

        <div>
          <label htmlFor="titular" className="mb-1.5 block text-sm font-medium text-tinta-900">
            Titular de la tarjeta
          </label>
          <input
            id="titular"
            autoComplete="cc-name"
            placeholder="Como figura en la tarjeta"
            value={tarjeta.titular}
            onChange={(e) => onCambio('titular', e.target.value.toUpperCase())}
            className={claseInput('titular')}
            disabled={procesando}
          />
          {errores.titular && <p className="mt-1.5 text-xs font-medium text-alerta-700">{errores.titular}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="vencimiento" className="mb-1.5 block text-sm font-medium text-tinta-900">
              Vencimiento
            </label>
            <input
              id="vencimiento"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/AA"
              value={tarjeta.vencimiento}
              onChange={(e) => onCambio('vencimiento', formatearVencimiento(e.target.value))}
              className={claseInput('vencimiento')}
              disabled={procesando}
            />
            {errores.vencimiento && <p className="mt-1.5 text-xs font-medium text-alerta-700">{errores.vencimiento}</p>}
          </div>

          <div>
            <label htmlFor="cvv" className="mb-1.5 block text-sm font-medium text-tinta-900">
              Código de seguridad
            </label>
            <input
              id="cvv"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              value={tarjeta.cvv}
              onChange={(e) => onCambio('cvv', soloDigitos(e.target.value).slice(0, 3))}
              className={claseInput('cvv')}
              disabled={procesando}
            />
            {errores.cvv && <p className="mt-1.5 text-xs font-medium text-alerta-700">{errores.cvv}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            className="accion accion-secundaria"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={procesando}
            className="accion accion-primaria"
          >
            {procesando && (
              <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none" />
            )}
            {procesando ? 'Procesando...' : 'Pagar seña'}
          </button>
        </div>
      </form>
    </div>
  )
}

function PagoAprobado({
  senia,
  vencimiento,
  onVerSenias,
}: {
  senia: Senia
  vencimiento: string | null
  onVerSenias: () => void
}) {
  return (
    <div className="rounded-card border border-arena-200 bg-white p-8 text-center shadow-card">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-salvia-100">
        <CheckCircleIcon className="size-9 text-salvia-700" aria-hidden="true" />
      </div>
      <h1 className="mt-4 font-display text-2xl text-tinta-900">¡Seña confirmada!</h1>
      <p className="mt-2 text-tinta-700">
        Registramos el pago de <strong>{formatearMoneda(senia.importe)}</strong>.
      </p>

      {vencimiento && (
        <p className="mt-2 text-tinta-700">
          La propiedad queda reservada a tu nombre hasta el{' '}
          <strong>{formatearFecha(vencimiento)}</strong>.
        </p>
      )}

      {senia.pago?.ultimosCuatro && (
        <p className="mt-4 text-sm text-tinta-500">
          Tarjeta terminada en {senia.pago.ultimosCuatro}
          {senia.pago.referencia && ` · Referencia ${senia.pago.referencia}`}
        </p>
      )}

      <div className="mt-6 rounded-lg border border-arena-200 bg-arena-50 p-4 text-left text-sm leading-relaxed text-tinta-700">
        <p className="font-semibold text-tinta-900">Próximo paso</p>
        <p className="mt-1">
          Acercate a la inmobiliaria con la documentación requerida y el saldo restante antes de
          esa fecha. Un agente confirmará el alquiler.
        </p>
      </div>

      <button
        type="button"
        onClick={onVerSenias}
        className="accion accion-primaria mt-6"
      >
        Ver mis señas
      </button>
    </div>
  )
}

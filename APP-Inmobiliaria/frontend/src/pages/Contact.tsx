import { useState } from 'react'
import { CheckCircleIcon, PhoneIcon } from '@heroicons/react/24/outline'
import Header from '../components/Header.tsx'
import Footer from '../components/Footer.tsx'
import Campo from '../components/ui/Campo'

const DATOS_INICIALES = {
  nombre: '',
  apellido: '',
  celular: '',
  email: '',
  mensaje: '',
}

function validar(datos: typeof DATOS_INICIALES): Record<string, string> {
  const errores: Record<string, string> = {}

  if (!datos.nombre.trim()) errores.nombre = 'Ingresá tu nombre.'
  if (!datos.apellido.trim()) errores.apellido = 'Ingresá tu apellido.'
  if (!datos.celular.trim()) errores.celular = 'Ingresá un teléfono de contacto.'
  if (!datos.email.trim()) errores.email = 'Ingresá tu correo electrónico.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim()))
    errores.email = 'Revisá el correo: parece incompleto.'
  if (!datos.mensaje.trim()) errores.mensaje = 'Contanos en qué te podemos ayudar.'

  return errores
}

export default function Contact() {
  const [datos, setDatos] = useState(DATOS_INICIALES)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviado, setEnviado] = useState(false)

  const cambiar = (campo: keyof typeof DATOS_INICIALES, valor: string) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => {
      if (!prev[campo]) return prev
      const siguiente = { ...prev }
      delete siguiente[campo]
      return siguiente
    })
  }

  const enviar = (e: React.FormEvent) => {
    // El formulario no tenía onSubmit: el botón recargaba la página con los
    // datos colgados de la URL. Todavía no hay endpoint de contacto en el
    // backend, así que por ahora la consulta se confirma del lado del cliente.
    e.preventDefault()

    const encontrados = validar(datos)
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados)
      return
    }

    setEnviado(true)
  }

  return (
    <>
      <Header />

      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-arena-50 px-4 py-12 md:min-h-[calc(100dvh-5rem)]">
        <div className="w-full max-w-lg rounded-card border border-arena-200 bg-white p-7 shadow-card sm:p-9">
          {enviado ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-salvia-100">
                <CheckCircleIcon className="size-7 text-salvia-700" aria-hidden="true" />
              </span>
              <h1 className="font-display text-2xl text-tinta-900">Recibimos tu consulta</h1>
              <p className="max-w-sm text-sm leading-relaxed text-tinta-500">
                Te vamos a escribir a <strong className="text-tinta-900">{datos.email}</strong> en
                las próximas 48 horas hábiles.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDatos(DATOS_INICIALES)
                  setEnviado(false)
                }}
                className="accion accion-secundaria accion-sm mt-2"
              >
                Enviar otra consulta
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center">
                <span className="grid size-14 place-items-center rounded-full bg-terra-100">
                  <PhoneIcon className="size-7 text-terra-800" aria-hidden="true" />
                </span>
                <h1 className="mt-4 font-display text-2xl leading-snug text-tinta-900">
                  Contactate con nosotros
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-tinta-500">
                  Dejanos tus datos y te respondemos a la brevedad.
                </p>
              </div>

              <form onSubmit={enviar} noValidate className="mt-7 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Los campos sólo tenían placeholder: al escribir, la etiqueta
                      desaparecía, y para un lector de pantalla no existía. */}
                  <Campo etiqueta="Nombre" error={errores.nombre} requerido>
                    {(props) => (
                      <input
                        {...props}
                        type="text"
                        autoComplete="given-name"
                        value={datos.nombre}
                        onChange={(e) => cambiar('nombre', e.target.value)}
                      />
                    )}
                  </Campo>

                  <Campo etiqueta="Apellido" error={errores.apellido} requerido>
                    {(props) => (
                      <input
                        {...props}
                        type="text"
                        autoComplete="family-name"
                        value={datos.apellido}
                        onChange={(e) => cambiar('apellido', e.target.value)}
                      />
                    )}
                  </Campo>
                </div>

                <Campo etiqueta="Celular" error={errores.celular} requerido>
                  {(props) => (
                    <input
                      {...props}
                      type="tel"
                      autoComplete="tel"
                      placeholder="341 555 0000"
                      value={datos.celular}
                      onChange={(e) => cambiar('celular', e.target.value)}
                    />
                  )}
                </Campo>

                <Campo etiqueta="Correo electrónico" error={errores.email} requerido>
                  {(props) => (
                    <input
                      {...props}
                      type="email"
                      autoComplete="email"
                      placeholder="ejemplo@email.com"
                      value={datos.email}
                      onChange={(e) => cambiar('email', e.target.value)}
                    />
                  )}
                </Campo>

                <Campo etiqueta="Mensaje" error={errores.mensaje} requerido>
                  {(props) => (
                    <textarea
                      {...props}
                      rows={4}
                      placeholder="Contanos qué estás buscando."
                      value={datos.mensaje}
                      onChange={(e) => cambiar('mensaje', e.target.value)}
                      className={`${props.className} resize-y`}
                    />
                  )}
                </Campo>

                <button type="submit" className="accion accion-primaria w-full">
                  Enviar consulta
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}

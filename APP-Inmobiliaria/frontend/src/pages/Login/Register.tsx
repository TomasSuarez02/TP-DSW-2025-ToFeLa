import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../components/Header.tsx'
import Footer from '../../components/Footer.tsx'
import IlustracionCasa from '../../components/IlustracionCasa.tsx'
import Campo from '../../components/ui/Campo'
import apiClient from '../../utils/apiClient'
import { useFormularioApi } from '../../hooks/useFormularioApi'
import { useNotificacion } from '../../hooks/useNotificacion'

const DATOS_INICIALES = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  tipo_documento: 'DNI',
  nro_doc: '',
  password: '',
}

/** Lo que el navegador ya puede saber antes de molestar al backend. */
function validar(user: typeof DATOS_INICIALES): Record<string, string> {
  const errores: Record<string, string> = {}

  if (!user.nombre.trim()) errores.nombre = 'Ingresá tu nombre.'
  if (!user.apellido.trim()) errores.apellido = 'Ingresá tu apellido.'
  if (!user.email.trim()) errores.email = 'Ingresá tu correo electrónico.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim()))
    errores.email = 'Revisá el correo: parece incompleto.'
  if (!user.telefono.trim()) errores.telefono = 'Ingresá un teléfono de contacto.'
  if (!user.nro_doc.trim()) errores.nro_doc = 'Ingresá tu número de documento.'
  else if (!/^\d{6,10}$/.test(user.nro_doc.trim()))
    errores.nro_doc = 'El documento va sin puntos ni espacios.'
  if (!user.password) errores.password = 'Elegí una contraseña.'
  else if (user.password.length < 8) errores.password = 'Tiene que tener al menos 8 caracteres.'

  return errores
}

export function Register() {
  const [user, setUser] = useState(DATOS_INICIALES)
  const navigate = useNavigate()
  const { notificar } = useNotificacion()
  const form = useFormularioApi()

  const handleFieldChange = (name: keyof typeof DATOS_INICIALES, value: string) => {
    setUser((prev) => ({ ...prev, [name]: value }))
    form.limpiarCampo(name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errores = validar(user)
    if (Object.keys(errores).length > 0) {
      form.setErroresCampo(errores)
      return
    }

    const ok = await form.enviar(async () => {
      await apiClient.post('/clientes', {
        nombre: user.nombre.trim(),
        apellido: user.apellido.trim(),
        mail: user.email.trim(),
        telefono: user.telefono.trim(),
        tipo_doc: user.tipo_documento,
        nro_doc: user.nro_doc.trim(),
        contrasenia: user.password,
      })
    })

    if (!ok) return

    // El registro no devuelve token: antes esto mandaba a la home, donde el
    // usuario recién creado seguía siendo un anónimo y no entendía por qué.
    notificar('Cuenta creada', 'exito', 'Ya podés iniciar sesión con tu correo.')
    navigate('/login', { replace: true })
  }

  return (
    <>
      <Header />

      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-arena-50 px-4 py-10 md:min-h-[calc(100dvh-5rem)]">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-card border border-arena-200 bg-white shadow-card lg:grid-cols-[1.25fr_0.75fr]">
          <div className="p-7 sm:p-10">
            <h1 className="font-display text-2xl leading-snug text-tinta-900">Crear una cuenta</h1>
            <p className="mt-1.5 text-sm text-tinta-500">
              Con una cuenta podés reservar una propiedad y presentar tu documentación.
            </p>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
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
                      autoComplete="given-name"
                      value={user.nombre}
                      onChange={(e) => handleFieldChange('nombre', e.target.value)}
                      disabled={form.enviando}
                    />
                  )}
                </Campo>

                <Campo etiqueta="Apellido" error={form.erroresCampo.apellido} requerido>
                  {(props) => (
                    <input
                      {...props}
                      type="text"
                      autoComplete="family-name"
                      value={user.apellido}
                      onChange={(e) => handleFieldChange('apellido', e.target.value)}
                      disabled={form.enviando}
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
                      autoComplete="email"
                      placeholder="ejemplo@email.com"
                      value={user.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      disabled={form.enviando}
                    />
                  )}
                </Campo>

                <Campo etiqueta="Teléfono" error={form.erroresCampo.telefono} requerido>
                  {(props) => (
                    <input
                      {...props}
                      type="tel"
                      autoComplete="tel"
                      placeholder="341 555 0000"
                      value={user.telefono}
                      onChange={(e) => handleFieldChange('telefono', e.target.value)}
                      disabled={form.enviando}
                    />
                  )}
                </Campo>
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <Campo etiqueta="Tipo de documento" error={form.erroresCampo.tipo_documento}>
                  {(props) => (
                    <select
                      {...props}
                      value={user.tipo_documento}
                      onChange={(e) => handleFieldChange('tipo_documento', e.target.value)}
                      disabled={form.enviando}
                    >
                      <option value="DNI">DNI</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="Otro">Otro</option>
                    </select>
                  )}
                </Campo>

                <Campo
                  etiqueta="Número de documento"
                  error={form.erroresCampo.nro_doc}
                  requerido
                >
                  {(props) => (
                    <input
                      {...props}
                      type="text"
                      inputMode="numeric"
                      placeholder="30123456"
                      value={user.nro_doc}
                      onChange={(e) => handleFieldChange('nro_doc', e.target.value)}
                      disabled={form.enviando}
                    />
                  )}
                </Campo>
              </div>

              {/* La contraseña iba como tercer hijo de una grilla de dos
                  columnas, así que caía sola en una fila nueva sin motivo. */}
              <Campo
                etiqueta="Contraseña"
                ayuda="Al menos 8 caracteres."
                error={form.erroresCampo.password}
                requerido
              >
                {(props) => (
                  <input
                    {...props}
                    type="password"
                    autoComplete="new-password"
                    value={user.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    disabled={form.enviando}
                  />
                )}
              </Campo>

              <button type="submit" disabled={form.enviando} className="accion accion-primaria w-full">
                {form.enviando ? 'Creando la cuenta…' : 'Registrarme'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-tinta-500">
              ¿Ya tenés cuenta?{' '}
              <Link to="/login" className="font-medium text-terra-600 underline-offset-2 hover:underline">
                Iniciá sesión
              </Link>
            </p>
          </div>

          <div className="hidden items-center justify-center bg-terra-50 p-8 lg:flex">
            <div className="rounded-card border border-arena-200 bg-white p-6 shadow-card">
              <IlustracionCasa className="size-24" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import apiClient from '../../utils/apiClient'
import Header from '../../components/Header.tsx'
import Footer from '../../components/Footer.tsx'
import IlustracionCasa from '../../components/IlustracionCasa.tsx'
import Campo from '../../components/ui/Campo'
import { useFormularioApi } from '../../hooks/useFormularioApi'
import { useAuth } from '../../auth/useAuth'

export type UserInput = {
  email: string
  password: string
}

export default function Login() {
  const [user, setUser] = useState<UserInput>({ email: '', password: '' })
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const form = useFormularioApi()

  const handleFieldChange = (name: keyof UserInput, value: string) => {
    setUser((prev) => ({ ...prev, [name]: value }))
    form.limpiarCampo(name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación de cliente: sin esto, un formulario vacío viaja al backend
    // para que conteste lo que el navegador ya sabía.
    const errores: Record<string, string> = {}
    if (!user.email.trim()) errores.email = 'Ingresá tu correo electrónico.'
    if (!user.password) errores.password = 'Ingresá tu contraseña.'
    if (Object.keys(errores).length > 0) {
      form.setErroresCampo(errores)
      return
    }

    // `enviar` frena el doble submit y parsea el error del backend: antes esto
    // leía `error.parsedError` a mano, con un `any` y su eslint-disable.
    await form.enviar(async () => {
      const res = await apiClient.post('/auth/login', {
        mail: user.email.trim(),
        contrasenia: user.password,
      })

      if (!login(res.data.accessToken, res.data.role)) {
        throw new Error('La sesión no pudo iniciarse. Intentá de nuevo.')
      }

      // RutaProtegida guarda en el state a dónde quería ir el usuario antes de
      // que lo mandáramos a loguearse. Hasta ahora nadie lo leía y siempre
      // caía en la home.
      const desde = (location.state as { desde?: string } | null)?.desde
      navigate(desde ?? (res.data.role === 'agente' ? '/panel' : '/'), { replace: true })
    })

  }

  return (
    <>
      <Header />

      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-arena-50 px-4 py-10 md:min-h-[calc(100dvh-5rem)]">
        <div className="grid w-full max-w-3xl overflow-hidden rounded-card border border-arena-200 bg-white shadow-card md:grid-cols-[1.1fr_0.9fr]">
          <div className="p-7 sm:p-10">
            <h1 className="font-display text-2xl leading-snug text-tinta-900">Iniciar sesión</h1>
            <p className="mt-1.5 text-sm text-tinta-500">
              Entrá para ver tus reservas y tu documentación.
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

              <Campo etiqueta="Contraseña" error={form.erroresCampo.password} requerido>
                {(props) => (
                  <input
                    {...props}
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={user.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    disabled={form.enviando}
                  />
                )}
              </Campo>

              <button type="submit" disabled={form.enviando} className="accion accion-primaria w-full">
                {form.enviando ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-tinta-500">
              ¿No tenés cuenta?{' '}
              <Link to="/register" className="font-medium text-terra-600 underline-offset-2 hover:underline">
                Registrate
              </Link>
            </p>
          </div>

          {/* Panel lateral: en mobile no aporta y se come la pantalla completa
              antes de llegar al formulario, así que ahí no se dibuja. */}
          <div className="hidden items-center justify-center bg-terra-50 p-8 md:flex">
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

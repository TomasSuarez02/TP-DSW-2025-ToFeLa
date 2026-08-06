import { Link, useLocation } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { useAuth } from '../auth/useAuth'

/**
 * Lo que se ve cuando la URL no existe.
 *
 * Hasta ahora el router no tenía comodín: una dirección mal escrita —o un link
 * viejo a `/Rent/visit`, que se dio de baja— dejaba la ventana con el Header
 * ausente y el cuerpo en blanco, sin un solo elemento para volver. En blanco no
 * se distingue "no existe" de "se rompió", así que la persona recarga.
 *
 * Las salidas son las que sirven según quién esté mirando: el catálogo siempre,
 * y el panel o la cuenta sólo si hay sesión para entrar ahí.
 */
export default function NoEncontrado() {
  const { pathname } = useLocation()
  const { isLoggedIn, rol } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center px-4 py-20 sm:px-6">
        <div className="mx-auto w-full max-w-lg rounded-card border border-arena-200 bg-white p-8 text-center shadow-card sm:p-10">
          <p className="font-display text-6xl text-arena-300 tabular-nums">404</p>

          <h1 className="mt-4 font-display text-2xl text-tinta-900 sm:text-3xl">
            Esta página no existe
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-tinta-700">
            No encontramos nada en{' '}
            {/* La ruta va en <code> y cortada: pegar la URL entera sin límite
                desborda la tarjeta en pantallas angostas. */}
            <code className="rounded bg-arena-100 px-1.5 py-0.5 text-xs break-all text-tinta-900">
              {pathname.length > 60 ? `${pathname.slice(0, 60)}…` : pathname}
            </code>
            . Puede que el link esté viejo o que la dirección tenga un error de tipeo.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/Rent" className="accion accion-primaria">
              Ver propiedades
            </Link>

            {isLoggedIn && (
              <Link
                to={rol === 'agente' ? '/panel' : '/mi-cuenta/senias'}
                className="accion accion-secundaria"
              >
                {rol === 'agente' ? 'Ir al panel' : 'Ir a mi cuenta'}
              </Link>
            )}
          </div>

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-terra-700 underline-offset-4 hover:underline"
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Volver al inicio
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

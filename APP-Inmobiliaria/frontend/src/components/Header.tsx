import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../auth/useAuth'
import type { Rol } from '../auth/session'

interface Enlace {
  a: string
  texto: string
}

/**
 * Qué ve cada uno. Antes esto era una lista de etiquetas y una cadena de `if`
 * más abajo que traducía cada etiqueta a su URL —dos veces, una para
 * escritorio y otra para mobile—, así que agregar un link pedía tocar tres
 * lugares y ya había entradas muertas ("Propiedades") que nunca se mostraban.
 */
function enlacesSegunRol(rol: Rol | null): Enlace[] {
  if (rol === 'agente') return [{ a: '/panel', texto: 'Panel' }]

  const publicos: Enlace[] = [
    { a: '/Rent', texto: 'Alquilar' },
    { a: '/contact', texto: 'Contacto' },
  ]

  if (rol === 'cliente') return [...publicos, { a: '/mi-cuenta/senias', texto: 'Mi cuenta' }]
  return publicos
}

export default function Header() {
  const [abierto, setAbierto] = useState(false)
  const { isLoggedIn, rol, logout } = useAuth()
  const navigate = useNavigate()

  const enlaces = enlacesSegunRol(rol)

  const cerrarSesion = () => {
    logout()
    setAbierto(false)
    // window.location.href recargaba la app entera para cambiar de pantalla:
    // se perdía el estado del router y el usuario veía un flash en blanco.
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-arena-200 bg-white/95 backdrop-blur">
      <div className="container mx-auto max-w-screen-xl px-4">
        <div className="grid min-h-16 grid-cols-[1fr_auto_1fr] items-center md:min-h-20">

          {/* IZQUIERDA */}
          <div className="flex items-center gap-4 justify-self-start">
            <button
              type="button"
              aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={abierto}
              className="-ms-2 grid size-10 place-items-center rounded-lg text-tinta-700 transition-colors hover:bg-arena-100 hover:text-tinta-900 md:hidden"
              onClick={() => setAbierto((v) => !v)}
            >
              {abierto ? (
                <XMarkIcon className="size-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="size-6" aria-hidden="true" />
              )}
            </button>

            <nav className="hidden gap-6 md:flex">
              {enlaces.map(({ a, texto }) => (
                <Link
                  key={a}
                  to={a}
                  className="text-tinta-700 tracking-wide transition-colors hover:text-terra-700"
                >
                  {texto}
                </Link>
              ))}
            </nav>
          </div>

          {/* CENTRO: el logo era un <a href> y recargaba el sitio para volver al inicio. */}
          <Link
            to="/"
            className="justify-self-center font-display text-2xl tracking-wider text-tinta-900 md:text-3xl"
          >
            ROSARIO NOVA
          </Link>

          {/* DERECHA */}
          <div className="hidden justify-self-end md:block">
            {!isLoggedIn ? (
              <Link
                to="/login"
                className="text-tinta-700 tracking-wide transition-colors hover:text-terra-700"
              >
                Iniciar sesión
              </Link>
            ) : (
              <button
                type="button"
                onClick={cerrarSesion}
                className="cursor-pointer text-sm text-tinta-500 tracking-wide transition-colors hover:text-terra-700"
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </div>

        {abierto && (
          <nav className="flex flex-col gap-1 border-t border-arena-200 pt-2 pb-3 md:hidden">
            {enlaces.map(({ a, texto }) => (
              <Link
                key={a}
                to={a}
                onClick={() => setAbierto(false)}
                className="rounded-lg px-2 py-2 text-tinta-700 tracking-wide transition-colors hover:bg-arena-100 hover:text-tinta-900"
              >
                {texto}
              </Link>
            ))}

            {!isLoggedIn ? (
              <Link
                to="/login"
                onClick={() => setAbierto(false)}
                className="rounded-lg px-2 py-2 text-tinta-700 tracking-wide transition-colors hover:bg-arena-100 hover:text-tinta-900"
              >
                Iniciar sesión
              </Link>
            ) : (
              <button
                type="button"
                onClick={cerrarSesion}
                className="cursor-pointer rounded-lg px-2 py-2 text-start text-tinta-700 tracking-wide transition-colors hover:bg-arena-100 hover:text-tinta-900"
              >
                Cerrar sesión
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

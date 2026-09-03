import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bars3Icon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../auth/useAuth'
import type { Rol } from '../auth/session'
import { SECCIONES_CLIENTE } from '../pages/Panel/secciones'

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

  return publicos
}

export default function Header() {
  const [abierto, setAbierto] = useState(false)
  const [cuentaAbierta, setCuentaAbierta] = useState(false)
  const cuentaRef = useRef<HTMLDivElement>(null)
  const cierreHoverRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { isLoggedIn, rol, logout } = useAuth()
  const navigate = useNavigate()

  const enlaces = enlacesSegunRol(rol)

  const cerrarSesion = () => {
    logout()
    setAbierto(false)
    setCuentaAbierta(false)
    // window.location.href recargaba la app entera para cambiar de pantalla:
    // se perdía el estado del router y el usuario veía un flash en blanco.
    navigate('/login')
  }

  useEffect(() => {
    if (!cuentaAbierta) return
    const alClickearFuera = (e: MouseEvent) => {
      if (!cuentaRef.current?.contains(e.target as Node)) setCuentaAbierta(false)
    }
    document.addEventListener('mousedown', alClickearFuera)
    return () => document.removeEventListener('mousedown', alClickearFuera)
  }, [cuentaAbierta])

  const abrirCuentaConHover = () => {
    if (cierreHoverRef.current) clearTimeout(cierreHoverRef.current)
    setCuentaAbierta(true)
  }

  // Pequeño margen antes de cerrar: sin esto, el mouse se corta al pasar
  // del botón al panel (quedan separados por el margen) y el menú se cierra solo.
  const cerrarCuentaConHover = () => {
    cierreHoverRef.current = setTimeout(() => setCuentaAbierta(false), 150)
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
          <div className="hidden items-center gap-4 justify-self-end md:flex">
            {!isLoggedIn ? (
              <Link
                to="/login"
                className="text-tinta-700 tracking-wide transition-colors hover:text-terra-700"
              >
                Iniciar sesión
              </Link>
            ) : (
              <>
                {rol === 'cliente' && (
                  <div
                    className="relative"
                    ref={cuentaRef}
                    onMouseEnter={abrirCuentaConHover}
                    onMouseLeave={cerrarCuentaConHover}
                  >
                    <button
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={cuentaAbierta}
                      onClick={() => setCuentaAbierta((v) => !v)}
                      className="flex cursor-pointer items-center gap-1 text-tinta-700 tracking-wide transition-colors hover:text-terra-700"
                    >
                      Mi cuenta
                      <ChevronDownIcon
                        className={`size-4 transition-transform ${cuentaAbierta ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>

                    {cuentaAbierta && (
                      <div className="absolute end-0 top-full z-50 mt-2 w-48 rounded-lg border border-arena-200 bg-white py-1 shadow-lg">
                        {SECCIONES_CLIENTE.map(({ to, nombre, icono: Icono }) => (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setCuentaAbierta(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-tinta-700 transition-colors hover:bg-arena-100 hover:text-tinta-900"
                          >
                            <Icono className="size-4" aria-hidden="true" />
                            {nombre}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                  onClick={cerrarSesion}
                  className="grid size-9 cursor-pointer place-items-center rounded-lg text-tinta-500 transition-colors hover:bg-arena-100 hover:text-terra-700"
                >
                  <XMarkIcon className="size-5" aria-hidden="true" />
                </button>
              </>
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
              <>
                {rol === 'cliente' && (
                  <div className="flex flex-col gap-1">
                    <span className="px-2 py-1 text-sm font-medium text-tinta-500 tracking-wide">
                      Mi cuenta
                    </span>
                    {SECCIONES_CLIENTE.map(({ to, nombre, icono: Icono }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setAbierto(false)}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-tinta-700 tracking-wide transition-colors hover:bg-arena-100 hover:text-tinta-900"
                      >
                        <Icono className="size-4" aria-hidden="true" />
                        {nombre}
                      </Link>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={cerrarSesion}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-start text-tinta-700 tracking-wide transition-colors hover:bg-arena-100 hover:text-tinta-900"
                >
                  <XMarkIcon className="size-5" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

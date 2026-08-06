import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Header from '../../components/Header'
import ErrorBoundary from '../../components/ErrorBoundary'
import { useAuth } from '../../auth/useAuth'
import type { Seccion } from './secciones'

/**
 * Cáscara del panel: navegación fija, sesión abajo y la sección en el medio.
 *
 * Antes la navegación era un `useState('propiedades')` con un switch: la
 * sección no estaba en la URL, así que no se podía compartir un link, el botón
 * "atrás" salía del panel y recargar te devolvía siempre al principio. Ahora
 * cada sección es una ruta y esto sólo dibuja el marco alrededor del <Outlet>.
 *
 * El mismo marco sirve al agente y al cliente; lo único que cambia es la lista
 * de secciones. Antes eran dos personalidades dentro del mismo archivo,
 * decididas por un prop `isAgent`, con un sidebar para uno y pestañas para el
 * otro.
 */
export default function PanelLayout({
  titulo,
  subtitulo,
  secciones,
}: {
  titulo: string
  subtitulo: string
  secciones: Seccion[]
}) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const location = useLocation()

  return (
    <>
      <Header />

      <div className="min-h-screen bg-arena-50">
        <div className="mx-auto flex max-w-screen-2xl">
          {/* --- Navegación fija (escritorio) --------------------------------
              Blanca y con borde contra el fondo arena: el sidebar es una
              superficie de tarjeta, no una franja de color. */}
          <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 flex-col border-e border-arena-200 bg-white lg:flex md:top-20 md:h-[calc(100dvh-5rem)]">
            <Marca titulo={titulo} subtitulo={subtitulo} />
            <Navegacion secciones={secciones} />
            <BloqueUsuario />
          </aside>

          {/* --- Contenido ------------------------------------------------- */}
          <main className="min-w-0 flex-1">
            {/* Cabecera pegajosa de mobile: superficie flotante, para que el
                contenido pase por debajo sin confundirse con ella. */}
            <div className="sticky top-16 z-30 flex items-center gap-3 border-b border-arena-200 bg-white/95 px-4 py-3 shadow-card-hover backdrop-blur md:top-20 lg:hidden">
              <button
                type="button"
                onClick={() => setMenuAbierto(true)}
                aria-label="Abrir menú del panel"
                className="-ms-2 grid size-10 place-items-center rounded-lg text-tinta-700 transition-colors hover:bg-arena-100 hover:text-tinta-900"
              >
                <Bars3Icon className="size-6" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="truncate font-display text-lg leading-tight text-tinta-900">{titulo}</p>
                <p className="truncate text-xs text-tinta-500">{seccionActual(secciones, location.pathname)}</p>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* La clave reinicia el límite al cambiar de sección: un error en
                  Propiedades no puede dejar el panel entero inutilizable. */}
              <ErrorBoundary clave={location.pathname}>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>

      {/* --- Drawer (mobile) ---------------------------------------------
          El sidebar era `w-64` sin breakpoints: en 375px se comía dos tercios
          de la pantalla y el contenido quedaba en una columna de 110px. */}
      <Dialog open={menuAbierto} onClose={setMenuAbierto} className="relative z-100 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-tinta-900/50 backdrop-blur-[2px] duration-300 ease-[var(--ease-salida)] data-closed:opacity-0"
        />

        <DialogPanel
          transition
          className="fixed inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-dialog duration-300 ease-[var(--ease-salida)] data-closed:-translate-x-full"
        >
          <div className="flex items-start justify-between gap-2 border-b border-arena-200 px-5 py-5">
            <div>
              <DialogTitle className="font-display text-xl leading-tight text-tinta-900">
                {titulo}
              </DialogTitle>
              <p className="mt-0.5 text-sm text-tinta-500">{subtitulo}</p>
            </div>
            <button
              type="button"
              onClick={() => setMenuAbierto(false)}
              aria-label="Cerrar menú"
              className="-me-2 grid size-9 shrink-0 place-items-center rounded-full text-tinta-500 transition-colors hover:bg-arena-100 hover:text-tinta-900"
            >
              <XMarkIcon className="size-5" aria-hidden="true" />
            </button>
          </div>

          <Navegacion secciones={secciones} onNavegar={() => setMenuAbierto(false)} />
          <BloqueUsuario />
        </DialogPanel>
      </Dialog>
    </>
  )
}

function Marca({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <div className="border-b border-arena-200 px-6 py-5">
      <p className="font-display text-xl leading-tight text-tinta-900">{titulo}</p>
      <p className="mt-0.5 text-sm text-tinta-500">{subtitulo}</p>
    </div>
  )
}

function Navegacion({ secciones, onNavegar }: { secciones: Seccion[]; onNavegar?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto p-3">
      <ul className="flex flex-col gap-0.5">
        {secciones.map(({ to, nombre, icono: Icono }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={onNavegar}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-terra-50 font-semibold text-tinta-900'
                    : 'text-tinta-700 hover:bg-arena-100 hover:text-tinta-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Indicador de 2px: antes era `border-r-3`, que no existe en
                      Tailwind, así que la sección activa no se marcaba. */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-terra-600"
                    />
                  )}
                  <Icono
                    className={`size-5 shrink-0 ${isActive ? 'text-terra-600' : 'text-tinta-500'}`}
                    aria-hidden="true"
                  />
                  {nombre}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Quién está usando el panel. Antes decía "A / Admin", escrito a mano. */
function BloqueUsuario() {
  const { sesion, rol } = useAuth()

  // El JWT no siempre trae el email; cuando falta, el rol es lo único cierto.
  const etiquetaRol = rol === 'agente' ? 'Agente inmobiliario' : rol === 'cliente' ? 'Cliente' : 'Sesión activa'
  const nombre = sesion?.email?.split('@')[0] ?? etiquetaRol
  const inicial = (nombre.trim()[0] ?? '?').toUpperCase()

  return (
    <div className="flex items-center gap-3 border-t border-arena-200 bg-arena-50 px-5 py-4">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-terra-100 text-sm font-semibold text-terra-800"
      >
        {inicial}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-tinta-900">{nombre}</p>
        <p className="truncate text-xs text-tinta-500">{etiquetaRol}</p>
      </div>
    </div>
  )
}

function seccionActual(secciones: Seccion[], pathname: string): string {
  return secciones.find((s) => pathname.toLowerCase().startsWith(s.to))?.nombre ?? 'Sistema de gestión'
}

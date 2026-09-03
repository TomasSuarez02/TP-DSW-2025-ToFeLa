import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'


/**
 * Pie del sitio.
 *
 * Era el único lugar del proyecto que usaba clases de DaisyUI (`footer`,
 * `footer-title`, `link link-hover`) sobre un marrón hardcodeado que no
 * pertenece a la paleta. Ahora es tinta sobre arena, como el resto.
 */
export default function Footer() {
  const { isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()

  const cerrarSesion = () => {
    logout()
    navigate('/login')
  }

  return (
    <footer className="mt-auto bg-tinta-900 text-arena-200">
      <div className="container mx-auto grid max-w-screen-xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="font-display text-2xl tracking-wider text-white">ROSARIO NOVA</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-arena-300">
            Alquileres en Rosario. Publicamos lo que está disponible de verdad, con el precio a la
            vista y sin intermediarios de más.
          </p>
        </div>

        <nav aria-labelledby="pie-servicios">
          <h2
            id="pie-servicios"
            className="text-xs font-semibold tracking-[0.12em] text-arena-400 uppercase"
          >
            Servicios
          </h2>
          <ul className="mt-4 flex flex-row gap-2.5 text-sm">
            <li>
              <Link to="/Rent" className="transition-colors hover:text-white">
                Alquilar
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition-colors hover:text-white">
                Contacto
              </Link>
            </li>
            <li>
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={cerrarSesion}
                  className="cursor-pointer transition-colors hover:text-white"
                >
                  Cerrar sesión
                </button>
              ) : (
                <Link to="/login" className="transition-colors hover:text-white">
                  Iniciar sesión
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto max-w-screen-xl px-4 py-5">
          <p className="text-xs text-arena-400">
            © {new Date().getFullYear()} Rosario Nova. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

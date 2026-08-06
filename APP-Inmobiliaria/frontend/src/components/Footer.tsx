import { Link } from 'react-router-dom'

/**
 * Las tres redes. Los `href` apuntan a las plataformas porque la inmobiliaria
 * todavía no tiene perfiles: cuando existan, se reemplazan acá y nada más.
 *
 * Antes cada ícono era un `<a>` sin `href`: no es un link para el navegador
 * —no se puede tabular ni activar con Enter— y un lector de pantalla anunciaba
 * tres elementos sin nombre, porque el SVG era todo el contenido.
 */
const REDES = [
  {
    nombre: 'X',
    url: 'https://x.com',
    path: 'M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z',
  },
  {
    nombre: 'YouTube',
    url: 'https://youtube.com',
    path: 'M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z',
  },
  {
    nombre: 'Facebook',
    url: 'https://facebook.com',
    path: 'M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z',
  },
]

/**
 * Pie del sitio.
 *
 * Era el único lugar del proyecto que usaba clases de DaisyUI (`footer`,
 * `footer-title`, `link link-hover`) sobre un marrón hardcodeado que no
 * pertenece a la paleta. Ahora es tinta sobre arena, como el resto.
 */
export default function Footer() {
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
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
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
              <Link to="/login" className="transition-colors hover:text-white">
                Iniciar sesión
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-semibold tracking-[0.12em] text-arena-400 uppercase">
            Seguinos
          </h2>
          <ul className="mt-4 flex gap-3">
            {REDES.map(({ nombre, url, path }) => (
              <li key={nombre}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="grid size-10 place-items-center rounded-full bg-white/8 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="size-5 fill-current"
                    aria-hidden="true"
                  >
                    <path d={path} />
                  </svg>
                  <span className="sr-only">{nombre}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
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

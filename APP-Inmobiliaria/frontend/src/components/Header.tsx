import { useState } from "react";
import { Link } from 'react-router-dom';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const leftLinks = ["Alquilar", "Contacto"];

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white backdrop-blur">
      <div className="container mx-auto max-w-screen-xl px-4">
        {/* Barra principal */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center min-h-16 md:min-h-20">

          {/* IZQUIERDA */}
          <div className="flex items-center gap-4 justify-self-start">
            {/* Botón (solo en mobile) */}
            <button
              aria-label="Abrir menú"
              aria-expanded={open}
              className="md:hidden size-10 -ms-2 grid place-items-center rounded-md hover:bg-black/5"
              onClick={() => setOpen(v => !v)}
            >
              <span className="text-2xl leading-none text-black">≡</span>
            </button>

            {/* Links normales (solo en desktop) */}
            <nav className="hidden md:flex gap-6 text-sm">
              {leftLinks.map(label => (
                <Link
                  key={label}
                  to={label === "Alquilar" ? "/Rent" : "/Contact"}
                  className="tracking-wide text-neutral-900 hover:opacity-80"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* CENTRO */}
          <a
            href="/"
            className="justify-self-center text-xl md:text-2xl tracking-wider font-['Playfair_Display'] text-neutral-900"
          >
            LONDON HOUSE
          </a>

          {/* DERECHA: auth (solo en desktop) */}
          <div className="hidden md:block justify-self-end">
            {!isLoggedIn ? (
              <Link
                to="/login"
                className="text-sm tracking-wide text-neutral-900 hover:opacity-80"
              >
                Iniciar Sesión
              </Link>
            ) : (
              <button
                onClick={() => setIsLoggedIn(false)}
                className="text-sm tracking-wide text-neutral-900 hover:opacity-80"
              >
                Cerrar Sesión
              </button>
            )}
          </div>

        </div>

        {/* MENÚ MÓVIL */}
        {open && (
          <nav className="md:hidden flex flex-col gap-1 pt-2 pb-3 border-t border-black/5">
            {leftLinks.map(label => (
              <Link
                key={label}
                to={label === "Alquilar" ? "/Rent" : "/Contact"}
                onClick={() => setOpen(false)}
                className="px-2 py-2 text-[15px] tracking-wide text-neutral-900 hover:bg-black/5 rounded"
              >
                {label}
              </Link>
            ))}

            {/* Auth SOLO en el menú móvil */}
            {!isLoggedIn ? (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="px-2 py-2 text-[15px] tracking-wide text-neutral-900 hover:bg-black/5 rounded"
              >
                Iniciar Sesión
              </Link>
            ) : (
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setOpen(false);
                }}
                className="px-2 py-2 text-[15px] tracking-wide text-neutral-900 hover:bg-black/5 rounded"
              >
                Cerrar Sesión
              </button>
            )}
          </nav>
        )}

      </div>
    </header>
  );
}
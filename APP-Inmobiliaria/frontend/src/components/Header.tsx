import { useState } from 'react'

export default function Header() {
  const [open, setOpen] = useState(false)

  const leftLinks = ['Comprar', 'Vender', 'Alquilar', 'Dejar']
  const rightLinks = ['Acerca de', 'El conocimiento', 'Contacto']

  return (
    <header className="sticky top-0 z-50 bg-[#F3EEE7] border-b border-black/5">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-center justify-between h-16 md:h-20">
          {/* Menú móvil */}
          <button
            className="md:hidden px-2 py-1 leading-none text-black"
            aria-label="Abrir menú"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="block text-2xl leading-none">≡</span>
          </button>

          {/* Marca */}
          <a
            href="/"
            className="text-xl md:text-2xl tracking-wider font-['Playfair_Display'] text-[#111] mx-auto md:mx-0"
          >
            LONDON HOUSE
          </a>

          {/* Links */}
          <nav className="hidden md:flex gap-6 text-sm">
            {leftLinks.map((label) => (
              <a key={label} href="#" className="text-[#1A1A1A] hover:opacity-80 tracking-wide">
                {label}
              </a>
            ))}
          </nav>
          <nav className="hidden md:flex gap-6 text-sm">
            {rightLinks.map((label) => (
              <a key={label} href="#" className="text-[#1A1A1A] hover:opacity-80 tracking-wide">
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Panel móvil apilado */}
        {open && (
          <nav className="md:hidden flex flex-col gap-1 pt-2 border-t border-black/5 pb-3">
            {[...leftLinks, ...rightLinks].map((label) => (
              <a
                key={label}
                href="#"
                onClick={() => setOpen(false)}
                className="px-1 py-2 text-[15px] tracking-wide text-[#1A1A1A] hover:bg-black/5 rounded"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}

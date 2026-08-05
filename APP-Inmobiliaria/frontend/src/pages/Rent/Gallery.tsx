import { useCallback, useEffect, useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import notFound from '../../assets/notFound.webp'

type Imagen = { id: number; path: string }

/**
 * Galería de la ficha de propiedad.
 *
 * Antes las imágenes se apilaban como bloques de 500px, una debajo de la
 * otra: con seis fotos la descripción y el precio quedaban a tres pantallas
 * de scroll. Acá la primera foto manda y el resto arma un mosaico al lado,
 * que es la forma en que ya se leen las fichas de propiedades.
 */
export default function Gallery({ imagenes, direccion }: { imagenes: Imagen[]; direccion: string }) {
  const [visor, setVisor] = useState<number | null>(null)
  const total = imagenes.length

  const alt = (i: number) =>
    total > 1 ? `${direccion} — foto ${i + 1} de ${total}` : `Fachada de ${direccion}`

  const mover = useCallback(
    (paso: number) => setVisor(actual => (actual === null ? null : (actual + paso + total) % total)),
    [total],
  )

  // Las flechas son la forma natural de recorrer un visor de fotos, y
  // Headless UI sólo se ocupa de Esc.
  useEffect(() => {
    if (visor === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') mover(1)
      if (e.key === 'ArrowLeft') mover(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visor, mover])

  if (total === 0) {
    return (
      <div className="overflow-hidden rounded-card bg-arena-100">
        <img
          src={notFound}
          alt=""
          className="aspect-16/10 w-full object-cover opacity-60 sm:aspect-21/9"
        />
        <p className="border-t border-arena-200 px-5 py-3 text-center text-sm text-tinta-500">
          Esta propiedad todavía no tiene fotos publicadas.
        </p>
      </div>
    )
  }

  const principal = imagenes[0]
  const secundarias = imagenes.slice(1, 5)

  return (
    <>
      {/* La proporción vive en el contenedor, no en la foto: así las dos
          filas del mosaico tienen alto definido (grid-rows-2 reparte en
          fracciones) y las celdas chicas no colapsan cuando la imagen
          que traen es más apaisada o más alta de lo previsto. */}
      <div
        className={`grid aspect-4/3 grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-card sm:gap-3 ${
          secundarias.length > 0 ? 'sm:aspect-2/1' : 'sm:aspect-16/9'
        }`}
      >
        <button
          type="button"
          onClick={() => setVisor(0)}
          className={`group relative col-span-4 row-span-2 overflow-hidden bg-arena-100 ${
            secundarias.length > 0 ? 'sm:col-span-2' : ''
          }`}
        >
          <img
            src={principal.path}
            alt={alt(0)}
            className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-salida)] group-hover:scale-[1.02]"
          />
          <span className="absolute inset-0 bg-tinta-900/0 transition-colors duration-300 group-hover:bg-tinta-900/8" />
        </button>

        {secundarias.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setVisor(i + 1)}
            className={`group relative hidden overflow-hidden bg-arena-100 sm:block ${
              secundarias.length === 1 ? 'sm:col-span-2 sm:row-span-2' : ''
            } ${secundarias.length === 2 ? 'sm:col-span-2' : ''} ${
              secundarias.length === 3 && i === 0 ? 'sm:col-span-2' : ''
            }`}
          >
            <img
              src={img.path}
              alt={alt(i + 1)}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-salida)] group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-tinta-900/0 transition-colors duration-300 group-hover:bg-tinta-900/8" />
          </button>
        ))}
      </div>

      {total > 1 && (
        <button
          type="button"
          onClick={() => setVisor(0)}
          className="accion accion-secundaria mt-3 w-full sm:w-auto"
        >
          <Squares2X2Icon className="size-4.5" aria-hidden="true" />
          Ver las {total} fotos
        </button>
      )}

      {/* --- Visor ------------------------------------------------ */}
      <Dialog open={visor !== null} onClose={() => setVisor(null)} className="relative z-100">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-tinta-900/94 duration-300 ease-[var(--ease-salida)] data-closed:opacity-0"
        />

        <DialogPanel
          transition
          className="fixed inset-0 flex flex-col duration-300 ease-[var(--ease-salida)] data-closed:scale-[0.98] data-closed:opacity-0"
        >
          <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <p className="text-sm text-arena-200 tabular-nums">
              {(visor ?? 0) + 1} / {total}
            </p>
            <button
              type="button"
              onClick={() => setVisor(null)}
              aria-label="Cerrar el visor"
              className="grid size-10 place-items-center rounded-full text-arena-100 transition-colors hover:bg-white/12"
            >
              <XMarkIcon className="size-6" aria-hidden="true" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center gap-2 px-2 pb-4 sm:gap-4 sm:px-6">
            {total > 1 && (
              <button
                type="button"
                onClick={() => mover(-1)}
                aria-label="Foto anterior"
                className="grid size-11 shrink-0 place-items-center rounded-full text-arena-100 transition-colors hover:bg-white/12"
              >
                <ArrowLeftIcon className="size-5" aria-hidden="true" />
              </button>
            )}

            {/* La foto va en su propia caja flexible: si `flex-1` cayera
                sobre la imagen, en un flex horizontal le estiraría el ancho
                y la sacaría de proporción. */}
            <div className="grid min-h-0 min-w-0 flex-1 place-items-center">
              <img
                src={imagenes[visor ?? 0].path}
                alt={alt(visor ?? 0)}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            </div>

            {total > 1 && (
              <button
                type="button"
                onClick={() => mover(1)}
                aria-label="Foto siguiente"
                className="grid size-11 shrink-0 place-items-center rounded-full text-arena-100 transition-colors hover:bg-white/12"
              >
                <ArrowRightIcon className="size-5" aria-hidden="true" />
              </button>
            )}
          </div>

          {total > 1 && (
            <div className="shrink-0 overflow-x-auto px-4 pb-5 sm:px-6">
              <div className="mx-auto flex w-max gap-2">
                {imagenes.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setVisor(i)}
                    aria-label={`Ver la foto ${i + 1}`}
                    aria-current={visor === i}
                    className={`size-16 shrink-0 overflow-hidden rounded-md transition-opacity ${
                      visor === i
                        ? 'opacity-100 outline-2 outline-offset-2 outline-arena-100'
                        : 'opacity-45 hover:opacity-80'
                    }`}
                  >
                    <img src={img.path} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogPanel>
      </Dialog>
    </>
  )
}

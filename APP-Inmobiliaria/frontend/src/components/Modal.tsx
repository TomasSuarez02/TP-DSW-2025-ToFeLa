import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'

type Ancho = 'sm' | 'md' | 'lg' | 'xl'

const anchos: Record<Ancho, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  /** Para formularios de alta con campos en dos columnas. */
  lg: 'max-w-2xl',
  /** Para mostrar un documento: necesita ancho de página, no de formulario. */
  xl: 'max-w-4xl',
}

/**
 * Diálogo del sistema.
 *
 * Antes cada modal era un `<div className="fixed inset-0">` escrito a mano,
 * montado *dentro* del aside pegajoso: sin rol, sin Esc, sin foco atrapado y
 * heredando el stacking context de su contenedor. Headless UI —que ya era
 * dependencia del proyecto— resuelve el comportamiento; acá solamente vive
 * la piel de Arena & Salvia.
 */
export default function Modal({
  open,
  onClose,
  titulo,
  descripcion,
  ancho = 'sm',
  children,
  pie,
}: {
  open: boolean
  onClose: () => void
  titulo: string
  /** Bajada opcional bajo el título. Contexto, no instrucciones de uso. */
  descripcion?: string
  ancho?: Ancho
  children: ReactNode
  /** Acciones. Van al pie, sobre superficie hundida, para separarlas del contenido. */
  pie?: ReactNode
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-100">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-tinta-900/50 backdrop-blur-[2px] duration-300 ease-[var(--ease-salida)] data-closed:opacity-0"
      />

      <div className="fixed inset-0 grid place-items-end overflow-y-auto p-0 sm:place-items-center sm:p-6">
        <DialogPanel
          transition
          className={`w-full ${anchos[ancho]} overflow-hidden rounded-t-2xl bg-white shadow-dialog duration-300 ease-[var(--ease-salida)] data-closed:translate-y-4 data-closed:opacity-0 sm:rounded-card`}
        >
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
            <div>
              <DialogTitle className="font-sans text-xl leading-snug text-tinta-900">
                {titulo}
              </DialogTitle>
              {descripcion && (
                <p className="mt-1.5 text-lg leading-relaxed text-tinta-500">{descripcion}</p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-me-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-tinta-500 transition-colors hover:bg-arena-100 hover:text-tinta-900"
            >
              <XMarkIcon className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="px-6 pb-6">{children}</div>

          {pie && (
            <div className="flex flex-col-reverse gap-2 border-t border-arena-200 bg-arena-50 px-6 py-4 sm:flex-row sm:justify-end">
              {pie}
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

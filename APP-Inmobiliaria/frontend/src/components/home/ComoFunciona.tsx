import { CalendarDaysIcon, DocumentCheckIcon, KeyIcon } from '@heroicons/react/24/outline'

/**
 * Los tres pasos que separan a alguien de la llave.
 *
 * No es relleno de portada: es el recorrido que la aplicación implementa de
 * verdad —visita, seña, documentación— contado en el orden en que ocurre. Sirve
 * sobre todo para lo que no se ve en una foto: que la seña retiene la unidad y
 * que los papeles se revisan antes de la firma, no el día de la firma.
 */
const PASOS = [
  {
    icono: CalendarDaysIcon,
    titulo: 'Elegí y visitá',
    texto:
      'Mirás el catálogo con el precio y el estado de cada unidad, y coordinás la visita en el horario que la propiedad tiene abierto.',
  },
  {
    icono: KeyIcon,
    titulo: 'Reservá con una seña',
    texto:
      'Pagás la seña desde tu cuenta y la propiedad queda retenida a tu nombre hasta la fecha acordada. Deja de figurar como disponible.',
  },
  {
    icono: DocumentCheckIcon,
    titulo: 'Firmá con todo listo',
    texto:
      'Subís la documentación cuando la tengas y un agente la revisa antes de la firma. El día del contrato no tenés que traer nada.',
  },
]

export default function ComoFunciona() {
  return (
    <section className="border-t border-arena-200 bg-white">
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 sm:py-20 xl:px-8">
        <h2 className="max-w-2xl font-display text-3xl text-tinta-900 sm:text-4xl">
          Del aviso a la llave, sin idas y vueltas
        </h2>

        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
            <li key={titulo} className="relative">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-terra-50 text-terra-700">
                  <Icono className="size-5" aria-hidden="true" />
                </span>
                <span
                  className="font-display text-2xl text-arena-300 tabular-nums"
                  aria-hidden="true"
                >
                  0{i + 1}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-semibold text-tinta-900">{titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tinta-700">{texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

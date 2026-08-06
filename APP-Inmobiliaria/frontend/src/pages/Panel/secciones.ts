import {
  BuildingOffice2Icon,
  CalendarDaysIcon,
  DocumentTextIcon,
  IdentificationIcon,
  UserGroupIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, SVGProps } from 'react'

export interface Seccion {
  /** Ruta absoluta: el destino de un <NavLink>, no un id de useState. */
  to: string
  nombre: string
  icono: ComponentType<SVGProps<SVGSVGElement>>
}

/**
 * La navegación del panel. Los emojis de antes ('🏠', '💰') se dibujaban con
 * la fuente del sistema operativo: cada usuario veía un ícono distinto y en
 * ninguno combinaba con la paleta. Heroicons son trazo, heredan currentColor
 * y pesan lo mismo entre sí.
 */
export const SECCIONES_AGENTE: Seccion[] = [
  { to: '/panel/propiedades', nombre: 'Propiedades', icono: BuildingOffice2Icon },
  { to: '/panel/clientes', nombre: 'Clientes', icono: UserGroupIcon },
  { to: '/panel/visitas', nombre: 'Visitas', icono: CalendarDaysIcon },
  { to: '/panel/senias', nombre: 'Señas', icono: BanknotesIcon },
  { to: '/panel/documentacion', nombre: 'Documentación', icono: DocumentTextIcon },
  { to: '/panel/agentes', nombre: 'Agentes', icono: IdentificationIcon },
]

export const SECCIONES_CLIENTE: Seccion[] = [
  { to: '/mi-cuenta/senias', nombre: 'Mis señas', icono: BanknotesIcon },
  { to: '/mi-cuenta/documentos', nombre: 'Mi documentación', icono: DocumentTextIcon },
]

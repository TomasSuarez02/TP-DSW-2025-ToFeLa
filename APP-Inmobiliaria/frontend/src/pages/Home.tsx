import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import Header from '../components/Header'
import ComoFunciona from '../components/home/ComoFunciona'
import Destacadas from '../components/home/Destacadas'
import Hero, { type TipoDisponible } from '../components/home/Hero'
import { useRecurso } from '../hooks/useRecurso'
import apiClient from '../utils/apiClient'
import type { Propiedades } from './Rent/Card'

/** Cuántas tarjetas muestra la portada. Tres columnas llenas en escritorio. */
const CANTIDAD_DESTACADAS = 6

/**
 * La portada.
 *
 * Era Header + una imagen rota + Footer, con un comentario "…resto de
 * secciones…" en el medio. Ahora responde las tres preguntas que trae quien
 * llega: qué se alquila (el buscador y las últimas publicadas), cómo es el
 * trámite (los tres pasos) y con quién se habla si hace falta.
 *
 * Una sola llamada a la API alimenta todo: el select de tipos del buscador, las
 * tarjetas destacadas y el conteo de disponibles salen de la misma lista. Pedir
 * lo mismo tres veces para tres piezas de la misma pantalla es lo que hace que
 * una portada tarde en aparecer.
 */
export default function Home() {
  const {
    datos: propiedades,
    cargando,
    error,
  } = useRecurso<Propiedades[]>(
    async () => (await apiClient.get('/propiedades')).data?.data ?? [],
    [],
    [],
  )

  const disponibles = useMemo(
    () => propiedades.filter((p) => String(p.estado).toLowerCase() === 'disponible'),
    [propiedades],
  )

  // El backend devuelve por id ascendente y no hay fecha de alta en la
  // propiedad: el id es lo más parecido a "orden de publicación" que tenemos.
  const destacadas = useMemo(
    () => [...disponibles].sort((a, b) => b.id - a.id).slice(0, CANTIDAD_DESTACADAS),
    [disponibles],
  )

  /* Los tipos del buscador salen de lo que hay publicado. Ofrecer "Local
     comercial" cuando no hay ninguno sólo sirve para mandar a un vacío. */
  const tipos = useMemo<TipoDisponible[]>(() => {
    const porId = new Map<number, string>()
    for (const p of disponibles) {
      if (p.tipoPropiedad) porId.set(p.tipoPropiedad.id, p.tipoPropiedad.descripcion)
    }
    return [...porId.entries()]
      .map(([id, descripcion]) => ({ id, descripcion }))
      .sort((a, b) => a.descripcion.localeCompare(b.descripcion, 'es'))
  }, [disponibles])

  return (
    <>
      <Header />

      <main>
        <Hero tipos={tipos} totalDisponibles={disponibles.length} cargando={cargando} />

        <Destacadas
          propiedades={destacadas}
          total={disponibles.length}
          cargando={cargando}
          error={error}
        />

        <ComoFunciona />

        <section className="border-t border-arena-200 bg-arena-50">
          <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 xl:px-8">
            <div className="flex flex-col gap-6 rounded-card border border-arena-200 bg-white p-8 shadow-card sm:p-10 md:flex-row md:items-center md:justify-between">
              <div className="max-w-prose">
                <h2 className="font-display text-2xl text-tinta-900 sm:text-3xl">
                  ¿Tenés una propiedad para alquilar?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-tinta-700">
                  La publicamos con fotos, precio y horarios de visita, y nos ocupamos de las
                  visitas, la seña y los papeles hasta la firma.
                </p>
              </div>

              <Link to="/contact" className="accion accion-primaria shrink-0">
                Hablar con un agente
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

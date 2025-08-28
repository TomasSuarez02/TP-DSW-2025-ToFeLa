// src/components/Hero.tsx
export default function Hero() {
  return (
    <section className="relative">
      <img
        src="src/assets/hero.jpg"
        alt="Interior elegante"
        className="w-full h-[50vh] md:h-[65vh] lg:h-[80vh] object-cover"
      />

      <a
        href="#listado"
        className="
          absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2
          btn btn-ghost text-white
          bg-black/30 hover:bg-black/40
          text-sm md:text-base
        "
      >
        Ver el listado
      </a>
    </section>
  )
}

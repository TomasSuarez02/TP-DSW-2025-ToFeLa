/**
 * La casita de Login y Registro. Estaba escrita dos veces, con los mismos
 * hexes copiados en cada archivo; ahora vive una sola vez y pinta con tokens.
 */
export default function IlustracionCasa({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 180" className={className} aria-hidden="true">
      <rect width="180" height="180" fill="var(--color-terra-100)" />

      {/* Sombra proyectada: es lo que despega la casa del fondo plano. */}
      <polygon
        points="60,110 150,110 150,135 60,135"
        fill="var(--color-arena-400)"
        opacity="0.5"
        transform="translate(20,35) skewX(-32)"
      />

      <polygon points="30,90 90,45 150,90 150,150 30,150" fill="#fff" />
      <rect x="80" y="115" width="20" height="35" fill="var(--color-terra-100)" />
      <rect x="120" y="65" width="10" height="20" fill="#fff" />
    </svg>
  )
}

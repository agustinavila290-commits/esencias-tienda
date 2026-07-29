// Selector de cantidad reutilizado por el carrito y la página de producto.
// No permite bajar de 1 (para eso está la acción "Eliminar") ni superar el
// stock disponible.
export default function QuantitySelector({ cantidad, onCambiar, max, nombreProducto, size = 'md' }) {
  const enMinimo = cantidad <= 1
  const enMaximo = cantidad >= max
  const dims = size === 'sm' ? 'w-7 h-7 text-base' : 'w-9 h-9 text-lg'

  return (
    <div className="inline-flex items-center gap-1.5 bg-surface-elevated rounded-xl border border-border-soft px-1 py-0.5">
      <button
        type="button"
        onClick={() => onCambiar(cantidad - 1)}
        disabled={enMinimo}
        aria-label={`Disminuir cantidad de ${nombreProducto}`}
        className={`${dims} flex items-center justify-center text-text-secondary hover:text-brand-primary-700 font-bold leading-none transition-colors disabled:opacity-30 disabled:hover:text-text-secondary`}
      >
        −
      </button>
      <span className="w-6 text-center font-bold text-sm text-text-primary tabular-nums" aria-live="polite" aria-atomic="true">
        {cantidad}
      </span>
      <button
        type="button"
        onClick={() => onCambiar(cantidad + 1)}
        disabled={enMaximo}
        aria-label={`Aumentar cantidad de ${nombreProducto}`}
        className={`${dims} flex items-center justify-center text-text-secondary hover:text-brand-primary-700 font-bold leading-none transition-colors disabled:opacity-30 disabled:hover:text-text-secondary`}
      >
        +
      </button>
    </div>
  )
}

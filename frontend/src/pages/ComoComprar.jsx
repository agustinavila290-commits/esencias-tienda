import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

const PASOS = [
  { icono: '🛍️', titulo: 'Elegí tus productos', texto: 'Navegá el catálogo, filtrá por categoría o buscá lo que necesitás, y agregalo al carrito.' },
  { icono: '🛒', titulo: 'Revisá tu carrito', texto: 'Ajustá cantidades y completá tus datos de contacto (nombre, email, teléfono, dirección de envío).' },
  { icono: '⏱️', titulo: 'Confirmá tu pedido', texto: 'Al confirmar, reservamos el stock por 1 hora mientras coordinás el pago. Te damos un código y un enlace para seguir el estado del pedido.' },
  { icono: '💳', titulo: 'Pagá por WhatsApp o Mercado Pago', texto: 'Coordinás la compra con nosotros por WhatsApp (transferencia o efectivo), o pagás directo online con Mercado Pago.' },
  { icono: '✅', titulo: 'Confirmamos tu pedido', texto: 'Con el pago coordinado, confirmamos el pedido y ahí sí se descuenta el stock real. Con Mercado Pago esto pasa automáticamente al aprobarse el pago.' },
  { icono: '📦', titulo: 'Preparamos y enviamos', texto: 'Preparamos tu pedido y coordinamos el envío o la entrega según lo hablado por WhatsApp.' },
]

export default function ComoComprar() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-10">
      <Seo
        title="Cómo comprar"
        description="Paso a paso de cómo comprar en Esencias de la naturaleza: catálogo, carrito, reserva, pago y seguimiento."
        path="/como-comprar"
      />
      <Link to="/" className="text-brand-primary-600 hover:text-brand-primary-800 text-sm flex items-center gap-1.5 mb-6 transition-colors">
        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/></svg>
        Volver a la tienda
      </Link>

      <h1 className="font-display text-3xl font-bold text-brand-primary-800 mb-6">Cómo comprar</h1>

      <ol className="space-y-4">
        {PASOS.map((paso, i) => (
          <li key={paso.titulo} className="bg-surface rounded-2xl border border-brand-primary-100 shadow-sm p-4 flex gap-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-brand-primary-50 flex items-center justify-center text-xl">
              {paso.icono}
            </div>
            <div>
              <p className="text-xs font-bold text-brand-primary-400 uppercase tracking-wide mb-0.5">Paso {i + 1}</p>
              <p className="font-semibold text-text-primary">{paso.titulo}</p>
              <p className="text-text-secondary text-sm mt-1 leading-relaxed">{paso.texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link to="/" className="btn-primary flex-1 text-center">Ir al catálogo</Link>
        <Link to="/preguntas-frecuentes" className="flex-1 text-center py-3 rounded-xl border border-brand-primary-200 text-brand-primary-700 font-semibold hover:bg-brand-primary-50 transition-colors">
          Ver preguntas frecuentes
        </Link>
      </div>
    </div>
  )
}

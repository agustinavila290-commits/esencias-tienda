import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { WHATSAPP_NUMBER } from '../config'

const PREGUNTAS = [
  {
    pregunta: '¿Cómo hago un pedido?',
    respuesta: 'Elegís tus productos en el catálogo, los agregás al carrito y confirmás. Eso crea una reserva de stock por 1 hora mientras coordinás el pago por WhatsApp o pagás online con Mercado Pago.',
  },
  {
    pregunta: '¿Cuánto dura la reserva de mi pedido?',
    respuesta: 'Una hora desde que confirmás el carrito. Si en ese tiempo no se coordina el pago, la reserva vence automáticamente y el stock vuelve a estar disponible para otros clientes.',
  },
  {
    pregunta: '¿Cuándo se descuenta el stock?',
    respuesta: 'Recién cuando el pedido se confirma (manualmente al coordinar por WhatsApp, o automáticamente cuando Mercado Pago aprueba el pago). Mientras el pedido está "pendiente" el stock solo está reservado, no descontado.',
  },
  {
    pregunta: '¿Qué medios de pago aceptan?',
    respuesta: 'WhatsApp (transferencia o efectivo, coordinando con nosotros) y Mercado Pago (tarjeta, débito o dinero en cuenta, pago online). Más detalle en la página de envíos y pagos.',
  },
  {
    pregunta: '¿Puedo seguir el estado de mi pedido?',
    respuesta: 'Sí, al crear el pedido te damos un enlace de seguimiento con tu código y un token propio del pedido — ahí ves el estado, el total y cuánto falta para que venza la reserva.',
  },
  {
    pregunta: '¿Hacen envíos?',
    respuesta: 'Sí, a todo el país. El costo y el tiempo estimado se informan al coordinar el pedido por WhatsApp. Más detalle en Envíos y pagos.',
  },
]

const JSON_LD_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PREGUNTAS.map(({ pregunta, respuesta }) => ({
    '@type': 'Question',
    name: pregunta,
    acceptedAnswer: { '@type': 'Answer', text: respuesta },
  })),
}

export default function PreguntasFrecuentes() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-10">
      <Seo
        title="Preguntas frecuentes"
        description="Respuestas sobre cómo comprar, la reserva de stock, medios de pago y envíos."
        path="/preguntas-frecuentes"
        jsonLd={JSON_LD_FAQ}
      />
      <Link to="/" className="text-brand-primary-600 hover:text-brand-primary-800 text-sm flex items-center gap-1.5 mb-6 transition-colors">
        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/></svg>
        Volver a la tienda
      </Link>

      <h1 className="font-display text-3xl font-bold text-brand-primary-800 mb-6">Preguntas frecuentes</h1>

      <div className="space-y-3">
        {PREGUNTAS.map(({ pregunta, respuesta }) => (
          <details key={pregunta} className="bg-surface rounded-2xl border border-brand-primary-100 shadow-sm p-4 group">
            <summary className="font-semibold text-text-primary cursor-pointer list-none flex items-center justify-between gap-3">
              {pregunta}
              <span className="text-brand-primary-400 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
            </summary>
            <p className="text-text-secondary text-sm mt-3 leading-relaxed">{respuesta}</p>
          </details>
        ))}
      </div>

      <div className="bg-gradient-to-br from-brand-primary-700 to-brand-primary-600 rounded-2xl p-6 text-white text-center mt-8">
        <p className="font-semibold mb-1">¿No encontraste tu respuesta?</p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank" rel="noopener noreferrer"
          className="bg-surface text-brand-primary-700 font-semibold px-6 py-2.5 rounded-xl text-sm inline-block hover:bg-brand-primary-50 transition-colors mt-3"
        >
          💬 Escribinos por WhatsApp
        </a>
      </div>
    </div>
  )
}

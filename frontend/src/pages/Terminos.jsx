import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

function Pendiente({ children }) {
  return (
    <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 text-xs font-semibold">
      {children} — PENDIENTE DE COMPLETAR
    </span>
  )
}

export default function Terminos() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-10">
      <Seo title="Términos y condiciones" path="/terminos" noindex />
      <Link to="/" className="text-tierra-600 hover:text-tierra-800 text-sm flex items-center gap-1.5 mb-6 transition-colors">
        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/></svg>
        Volver a la tienda
      </Link>

      <h1 className="font-display text-3xl font-bold text-tierra-800 mb-2">Términos y condiciones</h1>
      <p className="text-xs text-gray-400 mb-6">Última actualización: <Pendiente>fecha</Pendiente></p>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 mb-6">
        Esta página tiene una estructura general de términos y condiciones para un
        comercio online. Los datos marcados como <strong>PENDIENTE DE COMPLETAR</strong> son
        datos legales/comerciales reales (razón social, CUIT, domicilio, etc.) que
        tiene que cargar el titular del negocio — no se inventaron acá.
      </div>

      <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">1. Quiénes somos</h2>
          <p>
            Esencias de la naturaleza es operado por <Pendiente>razón social / nombre del titular</Pendiente>,
            CUIT <Pendiente>número de CUIT</Pendiente>, con domicilio en <Pendiente>domicilio legal</Pendiente>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">2. Productos y precios</h2>
          <p>
            Los precios se muestran en pesos argentinos (ARS) e incluyen los impuestos
            correspondientes. Los precios pueden cambiar sin previo aviso; el precio
            válido para cada compra es el vigente al momento de confirmar el pedido.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">3. Reserva de stock y vencimiento</h2>
          <p>
            Al confirmar un pedido se reserva el stock por 1 hora. Si no se coordina o
            aprueba el pago dentro de ese plazo, la reserva vence automáticamente y el
            stock queda disponible para otros clientes. El stock real solo se
            descuenta cuando el pedido se confirma (manualmente o por la aprobación
            del pago en Mercado Pago).
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">4. Medios de pago</h2>
          <p>
            Se acepta coordinación por WhatsApp (transferencia o efectivo) y pago
            online a través de Mercado Pago. Ver más detalle en{' '}
            <Link to="/envios" className="text-tierra-600 underline">Envíos y pagos</Link>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">5. Envíos, cambios y devoluciones</h2>
          <p>
            Ver la política vigente en{' '}
            <Link to="/envios" className="text-tierra-600 underline">Envíos y pagos</Link>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">6. Ley aplicable y jurisdicción</h2>
          <p>
            Estos términos se rigen por las leyes de la República Argentina. Ante
            cualquier conflicto, las partes se someten a la jurisdicción de{' '}
            <Pendiente>jurisdicción / tribunales competentes</Pendiente>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">7. Contacto</h2>
          <p>
            Consultas sobre estos términos: ver la página de{' '}
            <Link to="/contacto" className="text-tierra-600 underline">Contacto</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}

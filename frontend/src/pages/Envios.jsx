import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

function Seccion({ icono, titulo, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-tierra-100 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        {typeof icono === 'string'
          ? <span className="text-2xl">{icono}</span>
          : icono}
        <h2 className="font-display text-xl font-bold text-tierra-800">{titulo}</h2>
      </div>
      {children}
    </div>
  )
}

export default function Envios() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-10">
      <Seo
        title="Envíos y medios de pago"
        description="Conocé cómo realizamos los envíos y qué medios de pago aceptamos: WhatsApp, transferencia, Mercado Pago y efectivo."
        path="/envios"
      />
      <Link to="/" className="text-tierra-600 hover:text-tierra-800 text-sm flex items-center gap-1.5 mb-6 transition-colors">
        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/></svg>
        Volver a la tienda
      </Link>

      <h1 className="font-display text-3xl font-bold text-tierra-800 mb-6">Envíos y medios de pago</h1>

      <div className="space-y-5">
        <Seccion icono={<img src="/iconos/svg/04_envios.svg" alt="" className="w-8 h-8" />} titulo="Envíos">
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>Realizamos envíos a todo el país a través de correo y servicios de mensajería.</p>
            <div className="space-y-2">
              {[
                { label: 'Envío estándar', detalle: '5 a 10 días hábiles · Costo según destino' },
                { label: 'Correo Argentino', detalle: 'Disponible para todo el país' },
                { label: 'Retiro en persona', detalle: 'Coordinamos por WhatsApp · Sin costo adicional' },
              ].map(({ label, detalle }) => (
                <div key={label} className="flex items-start gap-2 bg-tierra-50 rounded-xl p-3">
                  <span className="text-tierra-500 font-semibold flex-shrink-0 mt-0.5">→</span>
                  <div>
                    <p className="font-medium text-gray-800">{label}</p>
                    <p className="text-gray-500 text-xs">{detalle}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 pt-1">
              * El costo de envío se informa al coordinar el pedido por WhatsApp.
            </p>
          </div>
        </Seccion>

        <Seccion icono={<img src="/iconos/svg/05_pago.svg" alt="" className="w-8 h-8" />} titulo="Medios de pago">
          <div className="space-y-3 text-sm text-gray-600">
            <div className="grid grid-cols-1 gap-2">
              {[
                { icon: '💬', name: 'WhatsApp + transferencia', detalle: 'Coordinás la compra por WhatsApp y pagás por transferencia bancaria o Mercado Pago.' },
                { icon: '💳', name: 'Mercado Pago (online)', detalle: 'Tarjeta de crédito, débito, dinero en cuenta MP. Pago seguro directo en la tienda.' },
                { icon: '💵', name: 'Efectivo', detalle: 'Disponible solo para retiro en persona. Coordinamos previamente.' },
              ].map(({ icon, name, detalle }) => (
                <div key={name} className="flex items-start gap-3 bg-tierra-50 rounded-xl p-3">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{name}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{detalle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Seccion>

        <Seccion icono="↩️" titulo="Cambios y devoluciones">
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>Trabajamos con mucho cuidado para que tus productos lleguen en perfectas condiciones.</p>
            <p>Si recibís un producto dañado o incorrecto, contactanos dentro de las <strong>48 hs</strong> de recibido el paquete y lo resolvemos.</p>
            <p className="text-xs text-gray-400">Por la naturaleza artesanal de los productos, no se aceptan cambios por preferencia de aroma.</p>
          </div>
        </Seccion>

        <div className="bg-gradient-to-br from-tierra-700 to-tierra-600 rounded-2xl p-6 text-white text-center">
          <p className="font-semibold mb-1">¿Tenés alguna duda?</p>
          <p className="text-tierra-200 text-sm mb-4">Escribinos y te respondemos a la brevedad.</p>
          <Link to="/" className="bg-white text-tierra-700 font-semibold px-6 py-2.5 rounded-xl text-sm inline-block hover:bg-tierra-50 transition-colors">
            Ir a la tienda
          </Link>
        </div>
      </div>
    </div>
  )
}

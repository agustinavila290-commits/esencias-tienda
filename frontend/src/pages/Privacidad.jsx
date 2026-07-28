import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

/*
 * DATOS PENDIENTES DE COMPLETAR POR EL TITULAR DEL NEGOCIO (no visibles para
 * el cliente final a propósito — ver deploy/DATOS_PENDIENTES.md):
 *   - Razón social / nombre del titular y CUIT
 *   - Email de contacto específico para temas de privacidad
 *   - Plazo de conservación de datos de pedidos y cuentas
 *   - Fecha de última actualización real de este texto
 */
export default function Privacidad() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-10">
      <Seo title="Política de privacidad" path="/privacidad" noindex />
      <Link to="/" className="text-tierra-600 hover:text-tierra-800 text-sm flex items-center gap-1.5 mb-6 transition-colors">
        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/></svg>
        Volver a la tienda
      </Link>

      <h1 className="font-display text-3xl font-bold text-tierra-800 mb-6">Política de privacidad</h1>

      <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">1. Responsable</h2>
          <p>
            El responsable del tratamiento de tus datos es Esencias de la naturaleza.
            Podés contactarnos desde la página de{' '}
            <Link to="/contacto" className="text-tierra-600 underline">Contacto</Link>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">2. Qué datos pedimos</h2>
          <p className="mb-2">Según cómo uses el sitio, podemos pedirte:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Al hacer un pedido: nombre, email, teléfono y dirección de envío (todos opcionales excepto lo necesario para coordinar la entrega).</li>
            <li>Si creás una cuenta: nombre, apellido, email y contraseña (o tu cuenta de Google si iniciás sesión así).</li>
            <li>Datos técnicos automáticos: dirección IP (para limitar intentos de acceso sospechosos) y fecha/hora de tus acciones.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">3. Para qué los usamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Procesar y coordinar tu pedido (WhatsApp / Mercado Pago).</li>
            <li>Permitirte consultar el estado de tu pedido de forma segura.</li>
            <li>Recuperar tu contraseña si la olvidaste (por email).</li>
            <li>Prevenir abuso (límites de intentos en login, registro y creación de pedidos).</li>
          </ul>
          <p className="mt-2">No vendemos ni compartimos tus datos con terceros para fines publicitarios.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">4. Con quién los compartimos</h2>
          <p>
            Con Mercado Pago, únicamente si elegís pagar por esa vía (ellos procesan
            el pago bajo su propia política de privacidad). No compartimos tus datos
            con nadie más salvo obligación legal.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">5. Tus derechos</h2>
          <p>
            Podés pedir acceder, corregir o eliminar tus datos escribiéndonos desde la
            página de <Link to="/contacto" className="text-tierra-600 underline">Contacto</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

function Pendiente({ children }) {
  return (
    <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 text-xs font-semibold">
      {children} — PENDIENTE DE COMPLETAR
    </span>
  )
}

export default function Privacidad() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-10">
      <Seo title="Política de privacidad" path="/privacidad" noindex />
      <Link to="/" className="text-tierra-600 hover:text-tierra-800 text-sm flex items-center gap-1.5 mb-6 transition-colors">
        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/></svg>
        Volver a la tienda
      </Link>

      <h1 className="font-display text-3xl font-bold text-tierra-800 mb-2">Política de privacidad</h1>
      <p className="text-xs text-gray-400 mb-6">Última actualización: <Pendiente>fecha</Pendiente></p>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 mb-6">
        Esta página describe, en base al código real de la tienda, qué datos se
        piden y para qué se usan. Los datos marcados como{' '}
        <strong>PENDIENTE DE COMPLETAR</strong> (responsable legal, contacto de
        privacidad, plazos de conservación) los tiene que definir el titular del
        negocio.
      </div>

      <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">1. Responsable</h2>
          <p>
            El responsable del tratamiento de tus datos es{' '}
            <Pendiente>razón social / nombre del titular</Pendiente>, CUIT{' '}
            <Pendiente>número de CUIT</Pendiente>.
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
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">5. Cuánto tiempo los conservamos</h2>
          <p>
            <Pendiente>plazo de conservación de datos de pedidos y cuentas</Pendiente>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-tierra-800 mb-2">6. Tus derechos</h2>
          <p>
            Podés pedir acceder, corregir o eliminar tus datos escribiéndonos por{' '}
            <Link to="/contacto" className="text-tierra-600 underline">Contacto</Link>
            {' '}o a <Pendiente>email de contacto para temas de privacidad</Pendiente>.
          </p>
        </section>
      </div>
    </div>
  )
}

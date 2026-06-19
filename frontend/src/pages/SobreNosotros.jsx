import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function SobreNosotros() {
  useEffect(() => {
    document.title = 'Sobre nosotros — Esencias de la naturaleza'
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-10">
      <Link to="/" className="text-tierra-600 hover:text-tierra-800 text-sm flex items-center gap-1.5 mb-6 transition-colors">
        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/></svg>
        Volver a la tienda
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-tierra-900 to-tierra-700 rounded-3xl p-8 mb-8 text-white">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <img src="/logo.jpg" alt="Logo" className="w-20 h-20 object-cover rounded-full border-2 border-white/20 shadow-lg mb-4" />
        <h1 className="font-display text-3xl font-bold mb-2">Nuestra historia</h1>
        <p className="text-tierra-200 text-sm leading-relaxed max-w-sm">
          Cada sahumerio que elaboramos lleva el cuidado y la intención de conectar tu espacio con la naturaleza.
        </p>
      </div>

      {/* Contenido */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-tierra-100 shadow-sm">
          <h2 className="font-display text-xl font-bold text-tierra-800 mb-3">¿Quiénes somos?</h2>
          <p className="text-gray-600 leading-relaxed text-sm">
            Esencias de la naturaleza nació del amor por los aromas naturales y la búsqueda de equilibrio en el hogar.
            Somos un emprendimiento artesanal argentino dedicado a la elaboración de sahumerios, inciensos y accesorios
            elaborados con ingredientes naturales seleccionados con cuidado.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-tierra-100 shadow-sm">
          <h2 className="font-display text-xl font-bold text-tierra-800 mb-3">Nuestro proceso</h2>
          <div className="space-y-3">
            {[
              { icon: '🌿', titulo: 'Ingredientes naturales', texto: 'Seleccionamos hierbas, resinas y esencias de origen natural, sin colorantes ni conservantes artificiales.' },
              { icon: '🤲', titulo: 'Elaboración artesanal', texto: 'Cada pieza es elaborada a mano en pequeños lotes, garantizando calidad y atención al detalle.' },
              { icon: '💫', titulo: 'Intención y cuidado', texto: 'Ponemos intención en cada creación para que llegue a tu hogar cargada de energía positiva.' },
            ].map(({ icon, titulo, texto }) => (
              <div key={titulo} className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{titulo}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-tierra-50 rounded-2xl p-6 border border-tierra-100">
          <h2 className="font-display text-xl font-bold text-tierra-800 mb-3">Contacto directo</h2>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            Nos encanta conocer a nuestros clientes y escuchar sus necesidades.
            Podés escribirnos directamente por WhatsApp para consultas personalizadas.
          </p>
          <a
            href="/"
            className="btn-primary inline-flex text-sm py-2.5 px-5"
          >
            Ver productos
          </a>
        </div>
      </div>
    </div>
  )
}

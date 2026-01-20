import { Heart, Users, Award, MapPin } from 'lucide-react';

export default function About() {
  return (
    <section id="nosotros" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#D91E7A] to-[#6B4199] bg-clip-text text-transparent">
                Quiénes Somos
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Tu aliado comercial de confianza en el corazón de Asunción
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Don Negro Comercial es una empresa familiar con años de experiencia en el
              mercado paraguayo. Nos especializamos en ofrecer productos de calidad para
              tu hogar, oficina y estilo de vida.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Nuestra misión es brindarte la mejor experiencia de compra, con atención
              personalizada, precios competitivos y productos que superan tus expectativas.
              Estamos ubicados en el Asunción Supercentro, donde te esperamos para ayudarte
              a encontrar exactamente lo que necesitas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl shadow-md p-6 hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-pink-200">
              <div className="absolute -top-3 -left-3 w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg transform rotate-3">
                <Heart className="text-white" size={28} />
              </div>
              <div className="pt-6">
                <h3 className="text-xl font-bold text-pink-700 mb-2">Atención Personalizada</h3>
                <p className="text-gray-700">
                  Cada cliente es único y merece un trato especial. Nuestro equipo está
                  siempre dispuesto a ayudarte.
                </p>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-md p-6 hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-orange-200">
              <div className="absolute -top-3 -left-3 w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg transform -rotate-3">
                <Award className="text-white" size={28} />
              </div>
              <div className="pt-6">
                <h3 className="text-xl font-bold text-orange-700 mb-2">Calidad Garantizada</h3>
                <p className="text-gray-700">
                  Todos nuestros productos cuentan con garantía y respaldo de las mejores
                  marcas del mercado.
                </p>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-md p-6 hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-blue-200">
              <div className="absolute -top-3 -left-3 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg transform rotate-3">
                <Users className="text-white" size={28} />
              </div>
              <div className="pt-6">
                <h3 className="text-xl font-bold text-blue-700 mb-2">Experiencia</h3>
                <p className="text-gray-700">
                  Años de trayectoria nos respaldan. Conocemos las necesidades de nuestros
                  clientes.
                </p>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-6 hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-green-200">
              <div className="absolute -top-3 -left-3 w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg transform -rotate-3">
                <MapPin className="text-white" size={28} />
              </div>
              <div className="pt-6">
                <h3 className="text-xl font-bold text-green-700 mb-2">Ubicación Estratégica</h3>
                <p className="text-gray-700">
                  Fácil acceso en el Asunción Supercentro. Estacionamiento disponible y
                  excelente ubicación.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

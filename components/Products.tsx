import { Laptop, Refrigerator, Sofa, Shirt, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const products = [
  {
    icon: Laptop,
    title: 'Electrónica y Computación',
    description: 'Laptops, computadoras, accesorios informáticos y tecnología de última generación.',
    color: 'from-pink-500 to-purple-500',
  },
  {
    icon: Refrigerator,
    title: 'Electrodomésticos',
    description: 'Electrodomésticos eficientes para tu cocina y hogar. Calidad garantizada.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Sofa,
    title: 'Muebles del Hogar',
    description: 'Muebles modernos y funcionales para cada ambiente de tu casa.',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: Shirt,
    title: 'Indumentaria Deportiva',
    description: 'Ropa y calzado deportivo de las mejores marcas para tu estilo de vida activo.',
    color: 'from-red-500 to-pink-500',
  },
  {
    icon: Wind,
    title: 'Aire Acondicionado',
    description: 'Sistemas de climatización para tu confort. Instalación y mantenimiento incluido.',
    color: 'from-purple-500 to-violet-500',
  },
];

export default function Products() {
  return (
    <section id="productos" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#D91E7A] to-[#6B4199] bg-clip-text text-transparent">
              Nuestros Productos
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Amplia variedad de productos para satisfacer todas tus necesidades
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {products.map((product, index) => {
            const Icon = product.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-2 hover:border-[#D91E7A]"
              >
                <CardHeader>
                  <div
                    className={`w-16 h-16 rounded-lg bg-gradient-to-br ${product.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="text-white" size={32} />
                  </div>
                  <CardTitle className="text-xl font-bold text-[#2E3A52]">
                    {product.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{product.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

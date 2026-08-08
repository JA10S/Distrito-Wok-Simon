import React from 'react';

const menuData = {
  arroces: [
    { name: 'Arroz Costeño Wok', desc: 'Cerdo, pollo, chorizo y butifarra, coronado con jamón', price: '30K / 40K' },
    { name: 'Arroz Especial Wok', desc: 'Cerdo, pollo, camarón y chorizo', price: '27K / 37K' },
    { name: 'Arroz Valenciana Wok', desc: 'Cerdo, pollo, camarón, chorizo y butifarra', price: '25K / 33K' },
    { name: 'Arroz Currambero Wok', desc: 'Chorizo, butifarra, cerdo y pollo con chicharrón', price: '32K / 40K' },
    { name: 'Arroz Tres Carnes Wok', desc: 'Pollo, cerdo y res', price: '27K / 37K' },
    { name: 'Arroz Oriental Wok', desc: 'Camarón, pollo, cerdo y vegetales', price: '32K / 47K' },
    { name: 'Arroz Criollo Wok', desc: 'Pollo, cerdo, chorizo y huevo', price: '29K / 37K' },
    { name: 'Arroz Vegetal Wok', desc: 'Vegetales frescos salteados al wok', price: '29K / 37K' },
    { name: 'Arroz Pollo Wok', desc: 'Pollo jugoso salteado al wok con vegetales frescos', price: '26K / 35K' },
    { name: 'Arroz Cerdo Wok', desc: 'Cerdo sazonado con especias orientales', price: '26K / 35K' },
    { name: 'Arroz Camarón Wok', desc: 'Camarones frescos con vegetales', price: '31K / 40K' },
    { name: 'Arroz Carne Wok', desc: 'Carne de res jugosa con vegetales', price: '30K / 38K' },
    { name: 'Arroz Pollo y Carne', desc: 'Combinación de pollo y carne', price: '30K / 38K' },
    { name: 'Arroz Pollo y Cerdo', desc: 'Combinación de pollo y cerdo', price: '26K / 36K' },
    { name: 'Arroz Pollo y Camarón', desc: 'Combinación de pollo y camarón', price: '30K / 40K' },
    { name: 'Arroz Parrillada Wok', desc: 'Mezcla de carnes a la parrilla', price: '27K / 37K' },
    { name: 'Arroz Rey Colis Wok', desc: 'Nuestra especialidad premium', price: '37K / 47K' },
  ],
  corrientes: [
    { name: 'Punta de Anca', desc: 'Corte premium a la parrilla', price: '$35.000' },
    { name: 'Lomo al Trapo', desc: 'Lomo envuelto en sal cocido', price: '$38.000' },
    { name: 'Chuleta Valluna', desc: 'Chuleta empanizada antioqueña', price: '$28.000' },
    { name: 'Mojarra Frita', desc: 'Mojarra entera crujiente', price: '$30.000' },
    { name: 'Punta de Anca en Salsa', desc: 'Punta de anca en salsa de la casa', price: '$38.000' },
    { name: 'Pollo a la Plancha', desc: 'Pechuga de pollo saludable', price: '$25.000' },
    { name: 'Costillas BBQ', desc: 'Costillas bañadas en salsa BBQ', price: '$40.000' },
    { name: 'Trucha en Salsa', desc: 'Trucha en salsa de alcaparras', price: '$35.000' },
    { name: 'Sancocho', desc: 'Sancocho tradicional', price: '$12.000' },
  ],
  porciones: [
    { name: 'Patacones', desc: 'Plátano verde frito crujiente', price: '$8.000' },
    { name: 'Arroz Blanco', desc: 'Porción de arroz', price: '$4.000' },
    { name: 'Ensalada', desc: 'Ensalada fresca de la casa', price: '$8.000' },
    { name: 'Yuca Frita', desc: 'Yuca crujiente con suero', price: '$8.000' },
    { name: 'Papas Fritas', desc: 'Papas fritas doradas', price: '$8.000' },
    { name: 'Tostones', desc: 'Plátano maduro frito', price: '$8.000' },
    { name: 'Arepa', desc: 'Arepa con mantequilla', price: '$3.000' },
  ],
  bebidas: [
    { name: 'Coca-Cola 600ML', price: '$4.500' },
    { name: 'Coca-Cola 1.5LT', price: '$8.000' },
    { name: 'Gaseosa Cola 1.5LT', price: '$6.000' },
    { name: 'Gaseosa Manzana 1.5LT', price: '$6.000' },
    { name: 'Gaseosa Limón 1.5LT', price: '$6.000' },
    { name: 'Agua Brisa 600ML', price: '$2.000' },
    { name: 'Agua Manantial 600ML', price: '$3.500' },
    { name: 'Jugo Hit Naranja 400ML', price: '$4.000' },
    { name: 'Jugo Hit Mango 400ML', price: '$4.000' },
    { name: 'Jugo Hit Lulo 400ML', price: '$4.000' },
    { name: 'Jugo Vallevita 400ML', price: '$4.000' },
    { name: 'Sprite 400ML', price: '$4.000' },
    { name: 'Colombiana 400ML', price: '$4.000' },
    { name: 'Pony Malta 400ML', price: '$4.000' },
    { name: 'Agua Cristal 600ML', price: '$3.000' },
  ],
};

function MenuPage() {
  return (
    <div className="min-h-screen bg-negro">
      {/* Header */}
      <header className="bg-negro border-b border-dorado-oscuro/30 py-6">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-cormorant text-4xl md:text-5xl font-bold text-dorado-claro">
            Distrito <span className="text-rojo italic">Wok</span> Simón
          </h1>
          <p className="text-dorado-oscuro mt-2 tracking-widest text-sm">
            El verdadero sabor oriental
          </p>
        </div>
      </header>

      {/* Categorías */}
      <div className="bg-gray-900 border-b border-dorado-oscuro/30 py-3 sticky top-0 z-10">
        <div className="container mx-auto px-4 flex space-x-4 overflow-x-auto">
          <a href="#arroces" className="px-4 py-2 bg-dorado/10 border border-dorado/30 rounded-full text-dorado text-sm whitespace-nowrap hover:bg-dorado hover:text-negro transition">
            🍚 Arroces
          </a>
          <a href="#corrientes" className="px-4 py-2 bg-dorado/10 border border-dorado/30 rounded-full text-dorado text-sm whitespace-nowrap hover:bg-dorado hover:text-negro transition">
            🍖 Corrientes
          </a>
          <a href="#porciones" className="px-4 py-2 bg-dorado/10 border border-dorado/30 rounded-full text-dorado text-sm whitespace-nowrap hover:bg-dorado hover:text-negro transition">
            🍽️ Porciones
          </a>
          <a href="#bebidas" className="px-4 py-2 bg-dorado/10 border border-dorado/30 rounded-full text-dorado text-sm whitespace-nowrap hover:bg-dorado hover:text-negro transition">
            🥤 Bebidas
          </a>
        </div>
      </div>

      {/* Menú */}
      <main className="container mx-auto px-4 py-8">
        {/* Arroces */}
        <section id="arroces" className="mb-12">
          <h2 className="font-cormorant text-3xl font-semibold text-dorado text-center mb-2">
            🍚 Nuestros Arroces
          </h2>
          <p className="text-dorado-oscuro text-right italic mb-4 text-sm">
            precio · medio / entero
          </p>
          
          <div className="grid gap-3">
            {menuData.arroces.map((item, index) => (
              <div key={index} className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-cormorant text-lg font-bold text-dorado-claro">
                      {item.name}
                    </h3>
                    <p className="text-white text-xs italic mt-1">
                      {item.desc}
                    </p>
                  </div>
                  <div className="text-dorado font-semibold ml-4 text-sm">
                    {item.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Corrientes */}
        <section id="corrientes" className="mb-12">
          <h2 className="font-cormorant text-3xl font-semibold text-dorado text-center mb-2">
            🍖 Corrientes
          </h2>
          <p className="text-dorado-oscuro text-right italic mb-4 text-sm">
            platos principales
          </p>
          
          <div className="grid gap-3">
            {menuData.corrientes.map((item, index) => (
              <div key={index} className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-cormorant text-lg font-bold text-dorado-claro">
                      {item.name}
                    </h3>
                    <p className="text-white text-xs italic mt-1">
                      {item.desc}
                    </p>
                  </div>
                  <div className="text-dorado font-semibold ml-4 text-sm">
                    {item.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Porciones */}
        <section id="porciones" className="mb-12">
          <h2 className="font-cormorant text-3xl font-semibold text-dorado text-center mb-2">
            🍽️ Porciones
          </h2>
          <p className="text-dorado-oscuro text-right italic mb-4 text-sm">
            acompañamientos
          </p>
          
          <div className="grid gap-3">
            {menuData.porciones.map((item, index) => (
              <div key={index} className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <div className="flex justify-between items-center">
                  <h3 className="font-cormorant text-lg font-bold text-dorado-claro">
                    {item.name}
                  </h3>
                  <span className="text-dorado font-semibold text-sm">{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bebidas */}
        <section id="bebidas" className="mb-12">
          <h2 className="font-cormorant text-3xl font-semibold text-dorado text-center mb-2">
            🥤 Bebidas
          </h2>
          
          <div className="grid gap-3">
            {menuData.bebidas.map((item, index) => (
              <div key={index} className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <div className="flex justify-between items-center">
                  <h3 className="font-cormorant text-lg font-bold text-dorado-claro">
                    {item.name}
                  </h3>
                  <span className="text-dorado font-semibold text-sm">{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-negro border-t border-dorado-oscuro/30 py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block bg-rojo/80 text-dorado-claro px-6 py-3 rounded font-cormorant tracking-wider uppercase border border-dorado-oscuro">
            ¡Gracias por su visita!
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MenuPage;
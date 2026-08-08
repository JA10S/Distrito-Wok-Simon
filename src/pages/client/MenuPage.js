import React from 'react';

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

      {/* Menú */}
      <main className="container mx-auto px-4 py-8">
        {/* Sección de Arroces */}
        <section className="mb-12">
          <h2 className="font-cormorant text-3xl font-semibold text-dorado text-center mb-6">
            Nuestros Arroces
          </h2>
          <p className="text-dorado-oscuro text-right italic mb-4">
            precio · medio / entero
          </p>
          
          <div className="grid gap-4">
            {/* Ejemplo de plato */}
            <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-cormorant text-xl font-bold text-dorado-claro">
                    Arroz Costeño Wok
                  </h3>
                  <p className="text-white text-sm italic mt-1">
                    Cerdo, pollo, chorizo y butifarra, coronado con jamón
                  </p>
                </div>
                <div className="text-dorado font-semibold ml-4">
                  30K <span className="text-dorado-oscuro">/</span> 40K
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-cormorant text-xl font-bold text-dorado-claro">
                    Arroz Currambero Wok
                  </h3>
                  <p className="text-white text-sm italic mt-1">
                    Chorizo, butifarra, cerdo y pollo con chicharrón
                  </p>
                </div>
                <div className="text-dorado font-semibold ml-4">
                  37K <span className="text-dorado-oscuro">/</span> 47K
                </div>
              </div>
            </div>

            {/* Agregar más platos aquí */}
          </div>
        </section>

        {/* Sección de Bebidas */}
        <section className="mb-12">
          <h2 className="font-cormorant text-3xl font-semibold text-dorado text-center mb-6">
            Bebidas
          </h2>
          
          <div className="grid gap-4">
            <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
              <div className="flex justify-between items-center">
                <h3 className="font-cormorant text-xl font-bold text-dorado-claro">
                  Coca-Cola 600ML
                </h3>
                <span className="text-dorado font-semibold">$4,500</span>
              </div>
            </div>
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
import React from 'react';
import { useMenu } from '../../hooks/useMenu';

function MenuPage() {
  const { menu, loading, error } = useMenu();

  if (loading) {
    return (
      <div className="min-h-screen bg-negro flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🏮</div>
          <p className="text-dorado font-cormorant text-xl">Cargando menú...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-negro flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error al cargar el menú</p>
          <p className="text-dorado-oscuro text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-negro">
      {/* Header con diseño chino */}
      <header className="relative bg-negro border-b border-dorado-oscuro/30 py-8 overflow-hidden">
        {/* Faroles chinos decorativos */}
        <div className="absolute top-4 left-4 text-4xl animate-bounce" style={{ animationDuration: '3s' }}>🏮</div>
        <div className="absolute top-4 right-4 text-4xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '0.5s' }}>🏮</div>
        
        {/* Caracteres chinos decorativos */}
        <div className="text-center mb-4">
          <span className="text-dorado/60 text-sm tracking-[0.5em] font-light">
            道 場 名 店 ・ 風 味 東 方
          </span>
        </div>
        
        {/* Logo principal */}
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="font-cormorant text-5xl md:text-6xl font-bold">
            <span className="text-white">DISTRITO </span>
            <span className="text-dorado text-7xl md:text-8xl">WOK </span>
            <span className="text-white">SIMÓN</span>
          </h1>
          <p className="text-dorado-oscuro mt-2 tracking-[0.3em] text-sm uppercase">
            ★ Sabor que enamora ★
          </p>
        </div>

        {/* Decoración inferior */}
        <div className="flex justify-center mt-4 space-x-2">
          <span className="text-dorado/40">✦</span>
          <span className="text-rojo/60">◈</span>
          <span className="text-dorado/40">✦</span>
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
          <div className="text-center mb-6">
            <span className="text-dorado/40 text-2xl">福</span>
            <h2 className="font-cormorant text-3xl font-semibold text-dorado">
              🍚 Nuestros Arroces
            </h2>
            <p className="text-dorado-oscuro italic text-sm mt-1">
              precio · medio / entero
            </p>
            <div className="flex justify-center mt-2 space-x-2">
              <span className="text-dorado/30">—</span>
              <span className="text-rojo/50">◆</span>
              <span className="text-dorado/30">—</span>
            </div>
          </div>
          
          <div className="grid gap-3">
            {menu.arroces.filter(item => item.available !== false).map((item) => (
              <div key={item.id} className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20 hover:border-dorado/40 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-cormorant text-lg font-bold text-dorado-claro">
                      {item.name}
                    </h3>
                    <p className="text-white text-xs italic mt-1">
                      {item.description}
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
          <div className="text-center mb-6">
            <span className="text-dorado/40 text-2xl">禄</span>
            <h2 className="font-cormorant text-3xl font-semibold text-dorado">
              🍖 Corrientes
            </h2>
            <p className="text-dorado-oscuro italic text-sm mt-1">
              platos principales
            </p>
            <div className="flex justify-center mt-2 space-x-2">
              <span className="text-dorado/30">—</span>
              <span className="text-rojo/50">◆</span>
              <span className="text-dorado/30">—</span>
            </div>
          </div>
          
          <div className="grid gap-3">
            {menu.corrientes.filter(item => item.available !== false).map((item) => (
              <div key={item.id} className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20 hover:border-dorado/40 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-cormorant text-lg font-bold text-dorado-claro">
                      {item.name}
                    </h3>
                    <p className="text-white text-xs italic mt-1">
                      {item.description}
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
          <div className="text-center mb-6">
            <span className="text-dorado/40 text-2xl">寿</span>
            <h2 className="font-cormorant text-3xl font-semibold text-dorado">
              🍽️ Porciones
            </h2>
            <p className="text-dorado-oscuro italic text-sm mt-1">
              acompañamientos
            </p>
            <div className="flex justify-center mt-2 space-x-2">
              <span className="text-dorado/30">—</span>
              <span className="text-rojo/50">◆</span>
              <span className="text-dorado/30">—</span>
            </div>
          </div>
          
          <div className="grid gap-3">
            {menu.porciones.filter(item => item.available !== false).map((item) => (
              <div key={item.id} className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20 hover:border-dorado/40 transition">
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
          <div className="text-center mb-6">
            <span className="text-dorado/40 text-2xl">喜</span>
            <h2 className="font-cormorant text-3xl font-semibold text-dorado">
              🥤 Bebidas
            </h2>
            <div className="flex justify-center mt-2 space-x-2">
              <span className="text-dorado/30">—</span>
              <span className="text-rojo/50">◆</span>
              <span className="text-dorado/30">—</span>
            </div>
          </div>
          
          <div className="grid gap-3">
            {menu.bebidas.filter(item => item.available !== false).map((item) => (
              <div key={item.id} className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20 hover:border-dorado/40 transition">
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

      {/* Footer con diseño chino */}
      <footer className="bg-negro border-t border-dorado-oscuro/30 py-8">
        <div className="container mx-auto px-4 text-center">
          {/* Mensaje de agradecimiento */}
          <div className="mb-4">
            <span className="text-dorado/40 text-3xl">🙏</span>
          </div>
          <p className="text-dorado font-cormorant text-xl mb-2">
            ¡Gracias por su visita!
          </p>
          <p className="text-dorado-oscuro text-sm tracking-widest">
            謝謝 · XIE XIE
          </p>
          
          {/* Decoración */}
          <div className="flex justify-center mt-4 space-x-2">
            <span className="text-dorado/30">✦</span>
            <span className="text-rojo/50">◈</span>
            <span className="text-dorado/30">✦</span>
          </div>
          
          {/* Faroles */}
          <div className="flex justify-center mt-4 space-x-8">
            <span className="text-2xl">🏮</span>
            <span className="text-dorado/60 text-sm">福 禄 寿</span>
            <span className="text-2xl">🏮</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MenuPage;
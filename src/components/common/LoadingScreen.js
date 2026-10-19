import React from 'react';
import Logo from './Logo';

/**
 * Pantalla de carga con el logo del restaurante
 * (mismo estilo que la carga del menú público).
 */
export default function LoadingScreen({ message = 'Cargando...', fullScreen = true }) {
  const wrapper = fullScreen
    ? 'min-h-screen bg-surface flex items-center justify-center'
    : 'flex items-center justify-center py-14';

  return (
    <div className={wrapper}>
      <div className="text-center animate-fade-in">
        <Logo size={80} className="mx-auto glow animate-float" />
        <p className="text-dorado font-cormorant text-xl mt-4">{message}</p>
      </div>
    </div>
  );
}

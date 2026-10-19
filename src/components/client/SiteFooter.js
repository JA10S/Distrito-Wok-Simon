import React from 'react';
import Logo from '../common/Logo';
import { FaMapMarkerAlt, FaPhoneAlt, FaClock, FaHeart } from 'react-icons/fa';
import { DEFAULT_BLOCKS } from '../../utils/layoutUtils';

const DEFAULT_FOOTER = DEFAULT_BLOCKS.find((block) => block.id === 'footer');

function SiteFooter({ config }) {
  const data = { ...DEFAULT_FOOTER, ...(config || {}) };

  return (
    <footer className="bg-surface-footer border-t border-dorado-oscuro/30 py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
          {/* Logo */}
          <div className="flex flex-col items-center sm:items-start gap-3">
            <Logo size={64} />
            <p className="text-dorado-oscuro text-xs tracking-[0.3em] uppercase">
              {data.tagline}
            </p>
          </div>

          {/* Contacto */}
          <div className="space-y-2 text-sm">
            <p className="text-dorado font-cormorant text-lg mb-3">Contáctanos</p>
            <p className="text-dorado-claro flex items-center justify-center sm:justify-start gap-2">
              <FaMapMarkerAlt className="text-dorado shrink-0" aria-hidden="true" />
              {data.address}
            </p>
            <p className="text-dorado-claro flex items-center justify-center sm:justify-start gap-2">
              <FaPhoneAlt className="text-dorado shrink-0" aria-hidden="true" />
              {data.phone}
            </p>
            <p className="text-dorado-claro flex items-center justify-center sm:justify-start gap-2">
              <FaClock className="text-dorado shrink-0" aria-hidden="true" />
              {data.hours}
            </p>
          </div>

          {/* Mensaje */}
          <div className="text-center sm:text-right">
            <p className="text-dorado font-cormorant text-xl mb-2">{data.thanks}</p>
            <p className="text-dorado-oscuro text-sm tracking-widest mb-3">
              謝謝 · XIE XIE
            </p>
            <p className="text-dorado-oscuro text-xs flex items-center justify-center sm:justify-end gap-1">
              Hecho con <FaHeart className="text-rojo" aria-hidden="true" /> en Simón
            </p>
          </div>
        </div>

        {/* Decoración */}
        <div className="flex justify-center mt-8 space-x-8 items-center" aria-hidden="true">
          <span className="text-2xl">🏮</span>
          <span className="text-dorado/60 text-sm">福 禄 寿</span>
          <span className="text-2xl">🏮</span>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;

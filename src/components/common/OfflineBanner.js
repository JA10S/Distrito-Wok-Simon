import React, { useEffect, useState } from 'react';

/**
 * Aviso fijo cuando el dispositivo pierde la conexión.
 * Firestore se reconecta solo al volver la red; esto solo informa al usuario.
 */
function OfflineBanner() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine !== false
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-[100] bg-rojo text-white text-center py-2 px-4 text-sm font-inter shadow-lg"
    >
      ⚠️ Sin conexión — los datos no se actualizarán hasta que vuelva la red.
    </div>
  );
}

export default OfflineBanner;

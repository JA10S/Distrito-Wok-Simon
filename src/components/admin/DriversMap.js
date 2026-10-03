import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMapMarkerAlt, FaLocationArrow } from 'react-icons/fa';
import { isLocationStale } from '../../hooks/useDriverLocations';
import { timestampMs } from '../../utils/orderUtils';

const DARK_TILES =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

const GOLD = '#D4A843';
const GREY = '#9ca3af';

const makeIcon = (stale) =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;border:3px solid ${stale ? GREY : GOLD};background:${
      stale ? 'rgba(156,163,175,0.5)' : 'rgba(212,168,67,0.9)'
    };box-shadow:0 0 0 4px rgba(0,0,0,0.35)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

const formatAge = (timestamp) => {
  const ms = timestampMs(timestamp);
  if (!ms) return 'sin datos';
  const seconds = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (seconds < 60) return `hace ${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  return `hace ${Math.round(minutes / 60)} h`;
};

const mapsUrl = (driver) =>
  `https://www.google.com/maps?q=${driver.lat},${driver.lng}`;

const statusOf = (driver) => {
  if (driver.sharing === false) {
    return { key: 'off', label: 'Compartir apagado', pill: 'bg-surface-3 text-dorado-oscuro' };
  }
  if (isLocationStale(driver)) {
    return { key: 'stale', label: 'Sin señal', pill: 'bg-amber-500/10 text-amber-300 border border-amber-500/30' };
  }
  return { key: 'online', label: 'En línea', pill: 'bg-green-500/10 text-green-400 border border-green-500/40' };
};

// Ajusta la vista: encaja todos los marcadores o centra el enfocado
function MapController({ points, focus }) {
  const map = useMap();
  const lastCount = useRef(-1);

  useEffect(() => {
    if (focus) {
      map.setView([focus.lat, focus.lng], 15, { animate: true });
      return;
    }
    if (!points || points.length === 0) {
      lastCount.current = -1;
      return;
    }
    if (lastCount.current === points.length) return;
    lastCount.current = points.length;
    map.fitBounds(L.latLngBounds(points).pad(0.3), { animate: true });
  }, [map, points, focus]);

  return null;
}

function DriversMap({ drivers = [], deliveries = [] }) {
  const [focusId, setFocusId] = useState(null);

  const onMap = useMemo(
    () => (drivers || []).filter((d) => typeof d.lat === 'number' && d.sharing !== false),
    [drivers]
  );

  const positions = useMemo(
    () => onMap.map((d) => [d.lat, d.lng]),
    [onMap]
  );

  const focus = useMemo(
    () => onMap.find((d) => d.id === focusId) || null,
    [onMap, focusId]
  );

  const activeDelivery = (driverId) => {
    const delivery = (deliveries || []).find(
      (d) => d.status === 'delivering' && d.assignedTo === driverId
    );
    if (!delivery) return null;
    return `Pedido #${String(delivery.orderId || delivery.id).slice(-6).toUpperCase()}`;
  };

  if (!drivers || drivers.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-cormorant text-dorado mb-6">Repartidores en Tiempo Real</h2>
        <div className="bg-surface-2 rounded-xl border border-dorado-oscuro/25 p-10 text-center">
          <FaMapMarkerAlt className="mx-auto text-dorado-oscuro text-4xl mb-3" aria-hidden="true" />
          <p className="text-dorado-claro mb-1">Ningún repartidor ha compartido su ubicación</p>
          <p className="text-dorado-oscuro text-sm">
            Los domiciliarios la activan desde su panel con el botón “Compartir mi ubicación”.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-cormorant text-dorado mb-6">Repartidores en Tiempo Real</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mapa */}
        {onMap.length > 0 && (
        <div className="lg:col-span-2 bg-surface-2 rounded-xl border border-dorado-oscuro/25 overflow-hidden">
          <MapContainer
            center={[4.65, -74.05]}
            zoom={12}
            style={{ height: 480, width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer url={DARK_TILES} attribution={ATTRIBUTION} />
            <MapController points={positions} focus={focus} />
            {onMap.map((driver) => {
              const stale = isLocationStale(driver);
              const deliveryLabel = activeDelivery(driver.id);
              return (
                <Marker
                  key={driver.id}
                  position={[driver.lat, driver.lng]}
                  icon={makeIcon(stale)}
                >
                  <Popup>
                    <div style={{ minWidth: 190, fontFamily: 'Montserrat, sans-serif' }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {driver.driverName || driver.driverEmail || 'Repartidor'}
                      </div>
                      <div style={{ fontSize: 13 }}>
                        Última señal: {formatAge(driver.updatedAt)}
                      </div>
                      {typeof driver.accuracy === 'number' && (
                        <div style={{ fontSize: 13 }}>Precisión: ±{driver.accuracy} m</div>
                      )}
                      {deliveryLabel && <div style={{ fontSize: 13 }}>🛵 {deliveryLabel}</div>}
                      <a
                        href={mapsUrl(driver)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 13, color: '#D4A843' }}
                      >
                        Abrir en Google Maps
                      </a>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
        )}

        {/* Lista */}
        <div
          className={`${
            onMap.length > 0 ? 'lg:col-span-1' : 'lg:col-span-3'
          } bg-surface-2 rounded-xl border border-dorado-oscuro/25 p-4 max-h-[480px] overflow-y-auto`}
        >
          <div className="text-dorado-oscuro text-xs uppercase tracking-wider mb-3">
            {drivers.length} repartidor{drivers.length === 1 ? '' : 'es'}
          </div>

          {onMap.length === 0 && (
            <p className="text-dorado-oscuro text-sm mb-3">
              Nadie está compartiendo su ubicación en este momento.
            </p>
          )}

          <div className="space-y-3">
            {drivers.map((driver) => {
              const status = statusOf(driver);
              const deliveryLabel = activeDelivery(driver.id);
              const onTheMap = driver.sharing !== false && typeof driver.lat === 'number';
              return (
                <div
                  key={driver.id}
                  className="bg-surface-3 rounded-lg p-3 border border-dorado-oscuro/20"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="text-dorado-claro font-semibold truncate">
                        {driver.driverName || driver.driverEmail || 'Repartidor'}
                      </div>
                      <div className="text-dorado-oscuro text-xs truncate">
                        {driver.driverEmail}
                      </div>
                    </div>
                    <span className={`text-xs rounded-full px-2 py-0.5 shrink-0 ${status.pill}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="text-dorado-oscuro text-xs mt-2">
                    Última señal: {formatAge(driver.updatedAt)}
                    {typeof driver.accuracy === 'number' && ` · ±${driver.accuracy} m`}
                  </div>

                  {deliveryLabel && (
                    <div className="text-dorado text-xs mt-1">🛵 {deliveryLabel}</div>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    {onTheMap && (
                      <button
                        onClick={() => setFocusId(driver.id)}
                        className="text-dorado hover:text-dorado-claro text-xs flex items-center gap-1"
                        aria-label={`Centrar en ${driver.driverName || driver.driverEmail}`}
                      >
                        <FaLocationArrow aria-hidden="true" /> Centrar
                      </button>
                    )}
                    <a
                      href={mapsUrl(driver)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-dorado-oscuro hover:text-dorado text-xs"
                    >
                      Google Maps
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriversMap;

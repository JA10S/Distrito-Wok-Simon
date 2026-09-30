import React from 'react';
import { ORDER_STATUS_LABELS, isRecent, minutesAgo, timestampMs } from '../../utils/orderUtils';

function RecentCancelledOrders({ orders, onReactivate, canReactivate = true, title = 'Cancelados recientes (últimos 30 min)' }) {
  const recent = (orders || [])
    .filter((order) => isRecent(order.cancelledAt) || isRecent(order.createdAt))
    .sort((a, b) => {
      const aMs = timestampMs(a.cancelledAt) || timestampMs(a.createdAt);
      const bMs = timestampMs(b.cancelledAt) || timestampMs(b.createdAt);
      return bMs - aMs;
    });

  if (recent.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-cormorant text-dorado mb-4">{title}</h2>
      <div className="grid gap-4">
        {recent.map((order) => (
          <div key={order.id} className="bg-gray-900 rounded-lg p-4 border border-red-600/40">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="text-dorado-claro font-bold">
                    Pedido #{order.id.slice(-6).toUpperCase()}
                  </div>
                  <div className="text-dorado-oscuro text-sm">Mesa {order.tableNumber}</div>
                </div>

                <div className="mt-2 space-y-1">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="text-white text-sm">
                      {item.quantity}x {item.name}
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-xs text-red-400">
                  Cancelado hace {minutesAgo(order.cancelledAt) ?? minutesAgo(order.createdAt)} min
                  {order.cancelledFromStatus
                    ? ` · Estaba: ${ORDER_STATUS_LABELS[order.cancelledFromStatus] || order.cancelledFromStatus}`
                    : ''}
                  {order.cancelledByName ? ` · por ${order.cancelledByName}` : ''}
                </div>

                {order.cancelledReason && (
                  <div className="mt-1 text-xs text-yellow-400">
                    Motivo: {order.cancelledReason}
                  </div>
                )}
              </div>

              {canReactivate && onReactivate && (
                <button
                  onClick={() => onReactivate(order)}
                  className="ml-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm whitespace-nowrap"
                >
                  ♻️ Reactivar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentCancelledOrders;

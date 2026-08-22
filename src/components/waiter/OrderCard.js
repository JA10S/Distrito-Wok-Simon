import React from 'react';
import { useTimer } from '../../hooks/useTimer';

function OrderCard({ order, onStatusChange, onEdit }) {
  const preparationTimer = useTimer(order.preparingAt || order.createdAt);
  const orderTimer = useTimer(order.createdAt);

  const getOrderTimerColor = () => {
    const level = orderTimer.getWarningLevel();
    if (level === 'critical') return 'text-red-500';
    if (level === 'warning') return 'text-yellow-500';
    return 'text-green-500';
  };

  const getPreparationTimerColor = () => {
    if (preparationTimer.minutes > 20) return 'text-red-500';
    if (preparationTimer.minutes > 10) return 'text-yellow-500';
    return 'text-blue-500';
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="text-dorado-claro font-bold">
              Pedido #{order.id.slice(-6).toUpperCase()}
            </div>
            <div className="text-dorado-oscuro text-sm">
              Mesa {order.tableNumber}
            </div>
          </div>
          
          <div className="mt-2 space-y-1">
            {order.items?.map((item, i) => (
              <div key={i} className="text-white text-sm flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span className="text-dorado-oscuro">
                  ${(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Notas del pedido */}
          {order.notes && (
            <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-600/30 rounded">
              <div className="text-yellow-400 text-xs font-bold mb-1">📝 Notas:</div>
              <div className="text-yellow-200 text-sm">{order.notes}</div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-dorado-oscuro/30">
            <div className="text-dorado font-bold">
              Total: ${order.total?.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="text-right ml-4">
          <div className={`inline-block px-3 py-1 rounded-full text-sm mb-2 ${
            order.status === 'pending' ? 'bg-yellow-600' :
            order.status === 'preparing' ? 'bg-blue-600' :
            order.status === 'ready' ? 'bg-green-600' :
            'bg-gray-600'
          }`}>
            {order.status === 'pending' ? 'Pendiente' :
             order.status === 'preparing' ? 'Preparando' :
             order.status === 'ready' ? 'Listo' : order.status}
          </div>

          {/* Timer de preparación */}
          {order.status === 'preparing' && (
            <div className={`text-sm font-mono ${getPreparationTimerColor()}`}>
              🔥 {preparationTimer.format()}
            </div>
          )}

          {/* Timer general */}
          <div className={`text-xs ${getOrderTimerColor()} mb-2`}>
            ⏱ {orderTimer.format()}
          </div>
          
          <div className="space-y-2">
            {order.status === 'pending' && (
              <>
                <button
                  onClick={() => onEdit(order)}
                  className="w-full bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded text-sm"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => onStatusChange(order.id, 'preparing')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                >
                  Preparando
                </button>
              </>
            )}
            {order.status === 'preparing' && (
              <button
                onClick={() => onStatusChange(order.id, 'ready')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Listo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderCard;

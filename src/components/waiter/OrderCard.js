import React from 'react';
import { useTimer } from '../../hooks/useTimer';
import { ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../../utils/orderUtils';

function OrderCard({ order, onStatusChange, onEdit, onCancel, onCharge, canEdit = true, canUpdateStatus = true, canCancel = true, canCancelKitchen = false, canCharge = false }) {
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
    <div className="bg-surface-2 rounded-lg p-4 border border-dorado-oscuro/20">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="text-dorado-claro font-bold">
              Pedido #{order.id.slice(-6).toUpperCase()}
            </div>
            <div className="text-dorado-oscuro text-sm">
              {order.type && order.type !== 'table'
                ? ORDER_TYPE_LABELS[order.type] || order.type
                : `Mesa ${order.tableNumber}`}
            </div>
          </div>

          {order.type && order.type !== 'table' && order.customer && (
            <div className="text-dorado-oscuro text-sm mt-1">
              {order.customer.name} · {order.customer.phone}
              {order.type === 'delivery' && order.customer.address && (
                <span className="block">📍 {order.customer.address}</span>
              )}
              {order.preferredPayment && (
                <span className="block">
                  Pago preferido: {PAYMENT_METHOD_LABELS[order.preferredPayment] || order.preferredPayment}
                </span>
              )}
            </div>
          )}
          
          <div className="mt-2 space-y-1">
            {order.items?.map((item, i) => (
              <div key={i} className="text-ink text-sm flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span className="text-dorado-oscuro">
                  ${(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Notas del pedido */}
          {order.notes && (
            <div className="notes-box mt-2 p-2 rounded">
              <div className="notes-box-title text-xs font-bold mb-1">🗒️ Notas:</div>
              <div className="notes-box-text text-sm">{order.notes}</div>
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
            {order.status === 'pending' && canEdit && (
              <button
                onClick={() => onEdit(order)}
                className="w-full bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded text-sm"
              >
                ✏️ Editar
              </button>
            )}
            {order.status === 'pending' && canUpdateStatus && (
              <button
                onClick={() => onStatusChange(order.id, 'preparing')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Preparando
              </button>
            )}
            {order.status === 'preparing' && canUpdateStatus && (
              <button
                onClick={() => onStatusChange(order.id, 'ready')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Listo
              </button>
            )}
            {order.status === 'pending' && canCancel && onCancel && (
              <button
                onClick={() => onCancel(order)}
                className="w-full bg-rojo hover:bg-rojo-oscuro text-white font-bold py-2 px-4 rounded text-sm"
              >
                ✕ Cancelar
              </button>
            )}
            {order.status === 'preparing' && canCancelKitchen && onCancel && (
              <button
                onClick={() => onCancel(order)}
                className="w-full bg-rojo hover:bg-rojo-oscuro text-white font-bold py-2 px-4 rounded text-sm"
              >
                ✕ Cancelar en cocina
              </button>
            )}
            {order.status === 'ready' && canCancelKitchen && onCancel && (
              <button
                onClick={() => onCancel(order)}
                className="w-full bg-rojo hover:bg-rojo-oscuro text-white font-bold py-2 px-4 rounded text-sm"
              >
                ✕ Cancelar listo
              </button>
            )}
            {order.status === 'ready' && canCharge && order.type !== 'delivery' && onCharge && (
              <button
                onClick={() => onCharge(order)}
                className="w-full bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded text-sm"
              >
                💵 Cobrar
              </button>
            )}
            {order.status === 'ready' && (
              <div className="text-xs text-dorado-oscuro text-center">
                {order.type === 'delivery'
                  ? 'Saliendo a domicilio — pago al recibir'
                  : 'Esperando cobro en caja'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderCard;

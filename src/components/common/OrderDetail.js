import React from 'react';
import {
  formatPaymentDetail,
  getOrderLabel,
  timestampMs
} from '../../utils/orderUtils';

function formatDateTime(value) {
  const ms = timestampMs(value);
  if (!ms) return '—';
  return new Date(ms).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function OrderDetail({ order }) {
  const items = order.items || [];

  return (
    <div role="group" aria-label="Detalle del pedido" className="mt-3 rounded-lg border border-dorado-oscuro/30 bg-surface-3/40 p-4 space-y-3">
      <div className="space-y-1.5">
        {items.length === 0 ? (
          <p className="text-dorado-oscuro text-sm font-inter">Sin productos registrados</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="flex justify-between text-dorado-claro text-sm font-inter">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>${((item.price || 0) * (item.quantity || 0)).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>

      {order.notes && (
        <div className="notes-box p-2 rounded">
          <div className="notes-box-title text-xs font-bold mb-1">🗒️ Notas:</div>
          <div className="notes-box-text text-sm">{order.notes}</div>
        </div>
      )}

      <div className="border-t border-dorado-oscuro/30 pt-2 space-y-1.5">
        <div className="flex justify-between text-dorado-oscuro text-sm font-inter">
          <span>Subtotal:</span>
          <span>${(order.subtotal || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-dorado-oscuro text-sm font-inter">
          <span>IVA (incluido):</span>
          <span>${(order.tax || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-dorado font-bold font-inter">
          <span>Total:</span>
          <span>${(order.total || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-inter text-dorado-oscuro border-t border-dorado-oscuro/30 pt-2">
        <span>🕒 {formatDateTime(order.createdAt || order.paidAt)}</span>
        <span>{getOrderLabel(order)}</span>
        {order.paymentMethod && (
          <span>💳 {formatPaymentDetail(order.paymentMethod, order.paymentSplit)}</span>
        )}
        {order.customer?.name && <span>👤 {order.customer.name}</span>}
        {order.customer?.phone && <span>📱 {order.customer.phone}</span>}
        {order.type === 'delivery' && order.customer?.address && (
          <span>📍 {order.customer.address}</span>
        )}
        {order.cashierName && <span>Cajero: {order.cashierName}</span>}
      </div>
    </div>
  );
}

export default OrderDetail;

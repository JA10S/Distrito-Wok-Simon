// Servicio de notificaciones por WhatsApp
// Utiliza la API de WhatsApp Business

const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';
const WHATSAPP_TOKEN = process.env.REACT_APP_WHATSAPP_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.REACT_APP_WHATSAPP_PHONE_NUMBER_ID || '';

/**
 * Enviar mensaje de WhatsApp
 * @param {string} to - Número de teléfono del destinatario (formato: +57XXXXXXXXXX)
 * @param {string} templateName - Nombre de la plantilla
 * @param {Array} components - Componentes del mensaje
 * @returns {Object} - Respuesta del envío
 */
const sendWhatsAppMessage = async (to, templateName, components = []) => {
  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'es',
            },
            components: components,
          },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Enviar confirmación de pedido al cliente
 * @param {string} phone - Teléfono del cliente
 * @param {string} orderId - ID del pedido
 * @param {string} items - Descripción de los items
 * @param {string} total - Total del pedido
 * @param {string} estimatedTime - Tiempo estimado de entrega
 */
export const sendOrderConfirmation = async (
  phone,
  orderId,
  items,
  total,
  estimatedTime
) => {
  return sendWhatsAppMessage(phone, 'order_confirmation', [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: orderId },
        { type: 'text', text: items },
        { type: 'text', text: total },
        { type: 'text', text: estimatedTime },
      ],
    },
  ]);
};

/**
 * Enviar actualización de estado del pedido
 * @param {string} phone - Teléfono del cliente
 * @param {string} orderId - ID del pedido
 * @param {string} status - Nuevo estado
 * @param {string} message - Mensaje adicional
 */
export const sendOrderStatusUpdate = async (phone, orderId, status, message) => {
  return sendWhatsAppMessage(phone, 'order_status_update', [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: orderId },
        { type: 'text', text: status },
        { type: 'text', text: message },
      ],
    },
  ]);
};

/**
 * Enviar notificación de pedido listo para domicilio
 * @param {string} phone - Teléfono del domiciliario
 * @param {string} orderId - ID del pedido
 * @param {string} address - Dirección de entrega
 * @param {string} customerPhone - Teléfono del cliente
 */
export const sendDeliveryReady = async (phone, orderId, address, customerPhone) => {
  return sendWhatsAppMessage(phone, 'delivery_ready', [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: orderId },
        { type: 'text', text: address },
        { type: 'text', text: customerPhone },
      ],
    },
  ]);
};

/**
 * Enviar notificación de pedido entregado
 * @param {string} phone - Teléfono del cliente
 * @param {string} orderId - ID del pedido
 * @param {string} feedbackUrl - URL para dar feedback
 */
export const sendDeliveryComplete = async (phone, orderId, feedbackUrl) => {
  return sendWhatsAppMessage(phone, 'delivery_complete', [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: orderId },
        { type: 'text', text: feedbackUrl },
      ],
    },
  ]);
};

/**
 * Enviar recordatorio de pedido pendiente
 * @param {string} phone - Teléfono del cliente
 * @param {string} orderId - ID del pedido
 * @param {string} minutes - Minutos de espera
 */
export const sendOrderDelayNotification = async (phone, orderId, minutes) => {
  return sendWhatsAppMessage(phone, 'order_delay', [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: orderId },
        { type: 'text', text: minutes },
      ],
    },
  ]);
};

/**
 * Enviar mensaje de texto simple (no plantilla)
 * @param {string} to - Teléfono del destinatario
 * @param {string} message - Mensaje a enviar
 */
export const sendTextMessage = async (to, message) => {
  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message,
          },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    console.error('Error sending WhatsApp text message:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Formatear número de teléfono colombiano
 * @param {string} phone - Número de teléfono
 * @returns {string} - Número formateado
 */
export const formatColombianPhone = (phone) => {
  // Eliminar espacios, guiones y paréntesis
  let cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Si empieza con 0, reemplazar por +57
  if (cleaned.startsWith('0')) {
    cleaned = '+57' + cleaned.substring(1);
  }
  
  // Si no empieza con +57, agregarlo
  if (!cleaned.startsWith('+57')) {
    cleaned = '+57' + cleaned;
  }
  
  return cleaned;
};
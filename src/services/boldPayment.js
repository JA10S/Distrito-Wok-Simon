// Servicio de integración con Bold API
// Documentación: https://developers.bold.co/pagos-en-linea/api-link-de-pagos

const BOLD_API_URL = 'https://integrations.api.bold.co';
const BOLD_API_KEY = process.env.REACT_APP_BOLD_API_KEY || '';

/**
 * Crear link de pago en Bold
 * @param {Object} paymentData - Datos del pago
 * @returns {Object} - Link de pago creado
 */
export const createPaymentLink = async (paymentData) => {
  try {
    const {
      amount,
      description,
      reference,
      paymentMethods = ['CREDIT_CARD', 'PSE', 'NEQUI'],
      payerEmail,
      callbackUrl,
      imageUrl,
      expirationMinutes = 30,
    } = paymentData;

    // Calcular fecha de expiración en nanosegundos
    const expirationDate = Date.now() * 1e6 + expirationMinutes * 60 * 1e9;

    // Calcular IVA (19%)
    const baseAmount = Math.round(amount / 1.19);
    const taxAmount = amount - baseAmount;

    const requestBody = {
      amount_type: 'CLOSE',
      amount: {
        currency: 'COP',
        total_amount: amount,
        tip_amount: 0,
        taxes: [
          {
            type: 'VAT',
            base: baseAmount,
            value: taxAmount,
          },
        ],
      },
      reference: reference || `ORDER-${Date.now()}`,
      description: description || 'Pago en restaurante',
      expiration_date: expirationDate,
      payment_methods: paymentMethods,
    };

    if (payerEmail) {
      requestBody.payer_email = payerEmail;
    }

    if (callbackUrl) {
      requestBody.callback_url = callbackUrl;
    }

    if (imageUrl) {
      requestBody.image_url = imageUrl;
    }

    const response = await fetch(`${BOLD_API_URL}/online/link/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `x-api-key ${BOLD_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors[0].message || 'Error al crear link de pago');
    }

    return {
      success: true,
      paymentLink: data.payload.payment_link,
      url: data.payload.url,
    };
  } catch (error) {
    console.error('Error creating Bold payment link:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Consultar estado de un link de pago
 * @param {string} paymentLink - ID del link de pago (LNK_*)
 * @returns {Object} - Estado y datos del link
 */
export const getPaymentLinkStatus = async (paymentLink) => {
  try {
    const response = await fetch(`${BOLD_API_URL}/online/link/v1/${paymentLink}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `x-api-key ${BOLD_API_KEY}`,
      },
    });

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors[0].message || 'Error al consultar link de pago');
    }

    return {
      success: true,
      status: data.payload.status,
      total: data.payload.total,
      paymentMethod: data.payload.payment_method,
      transactionId: data.payload.transaction_id,
      reference: data.payload.reference,
    };
  } catch (error) {
    console.error('Error getting Bold payment link status:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Consultar métodos de pago disponibles
 * @returns {Object} - Métodos de pago y límites
 */
export const getPaymentMethods = async () => {
  try {
    const response = await fetch(`${BOLD_API_URL}/online/link/v1/payment_methods`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `x-api-key ${BOLD_API_KEY}`,
      },
    });

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors[0].message || 'Error al consultar métodos de pago');
    }

    return {
      success: true,
      methods: data.payload.payment_methods,
    };
  } catch (error) {
    console.error('Error getting Bold payment methods:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Verificar si un pago fue aprobado
 * @param {string} paymentLink - ID del link de pago
 * @returns {boolean} - true si el pago fue aprobado
 */
export const isPaymentApproved = async (paymentLink) => {
  const result = await getPaymentLinkStatus(paymentLink);
  return result.success && result.status === 'PAID';
};

/**
 * Formatear monto para mostrar
 * @param {number} amount - Monto en pesos
 * @returns {string} - Monto formateado
 */
export const formatAmount = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};
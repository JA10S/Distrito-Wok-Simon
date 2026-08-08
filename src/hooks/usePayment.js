import { useState, useCallback } from 'react';
import { createPaymentLink, getPaymentLinkStatus, formatAmount } from '../services/boldPayment';

/**
 * Hook para gestionar pagos con Bold
 * @returns {Object} - Funciones y estado de pagos
 */
export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentLink, setPaymentLink] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);

  /**
   * Crear un nuevo link de pago
   * @param {Object} paymentData - Datos del pago
   */
  const initiatePayment = useCallback(async (paymentData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createPaymentLink(paymentData);

      if (result.success) {
        setPaymentLink(result.paymentLink);
        setPaymentUrl(result.url);
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verificar el estado de un pago
   * @param {string} link - ID del link de pago
   */
  const checkPaymentStatus = useCallback(async (link) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getPaymentLinkStatus(link || paymentLink);

      if (result.success) {
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [paymentLink]);

  /**
   * Limpiar estado del pago
   */
  const clearPayment = useCallback(() => {
    setPaymentLink(null);
    setPaymentUrl(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    paymentLink,
    paymentUrl,
    initiatePayment,
    checkPaymentStatus,
    clearPayment,
    formatAmount,
  };
};

export default usePayment;
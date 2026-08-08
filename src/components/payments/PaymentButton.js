import React, { useState } from 'react';
import { usePayment } from '../../hooks/usePayment';
import { toast } from 'react-toastify';

function PaymentButton({ amount, description, reference, onSuccess, onError }) {
  const { loading, error, paymentUrl, initiatePayment } = usePayment();
  const [showModal, setShowModal] = useState(false);

  const handlePayment = async () => {
    const result = await initiatePayment({
      amount,
      description,
      reference,
      callbackUrl: `${window.location.origin}/payment/callback`,
    });

    if (result.success) {
      setShowModal(true);
      if (onSuccess) onSuccess(result);
    } else {
      toast.error('Error al crear link de pago');
      if (onError) onError(result.error);
    }
  };

  const copyPaymentLink = () => {
    if (paymentUrl) {
      navigator.clipboard.writeText(paymentUrl);
      toast.success('Link de pago copiado');
    }
  };

  return (
    <>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-3 px-6 rounded-lg disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-negro" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </span>
        ) : (
          'Pagar con Bold'
        )}
      </button>

      {/* Modal con link de pago */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-dorado-oscuro">
            <h3 className="text-xl font-cormorant text-dorado mb-4">
              Link de Pago Creado
            </h3>
            
            <p className="text-dorado-oscuro mb-4">
              Comparte este link con el cliente para que realice el pago:
            </p>

            <div className="bg-gray-800 rounded p-3 mb-4">
              <p className="text-dorado-claro text-sm break-all">
                {paymentUrl}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyPaymentLink}
                className="flex-1 bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded"
              >
                Copiar Link
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-dorado-claro font-bold py-2 px-4 rounded"
              >
                Cerrar
              </button>
            </div>

            <p className="text-dorado-oscuro text-sm mt-4 text-center">
              El link expira en 30 minutos
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}
    </>
  );
}

export default PaymentButton;
import React, { useState } from 'react';

function CallWaiterButton({ onSubmit }) {
  const [open, setOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const closeModal = () => {
    setOpen(false);
    setTableNumber('');
    setMessage('');
    setSent(false);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const number = parseInt(tableNumber, 10);
    if (!number || number < 1) {
      setError('Ingrese el número de mesa');
      return;
    }

    setSending(true);
    setError('');
    const result = await onSubmit({ tableNumber: number, message });
    setSending(false);

    if (result && result.success) {
      setSent(true);
    } else {
      setError((result && result.error) || 'No se pudo enviar el llamado');
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Llamar al mesero"
        className="fixed bottom-6 left-6 z-40 bg-surface-2 border border-dorado/50 hover:bg-dorado hover:text-negro text-dorado-claro font-bold py-3 px-5 rounded-full shadow-[0_8px_24px_-6px_rgb(var(--color-dorado)/0.5)] flex items-center space-x-2 hover-lift animate-fade-in-up"
      >
        <span aria-hidden="true">🔔</span>
        <span className="text-sm">Llamar al mesero</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-label="Llamar al mesero"
            className="bg-surface-2 border border-dorado-oscuro/40 rounded-lg w-full max-w-sm p-5"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-cormorant text-2xl font-bold text-dorado">
                Llamar al mesero
              </h2>
              <button
                onClick={closeModal}
                aria-label="Cerrar"
                className="text-dorado-oscuro hover:text-dorado text-xl"
              >
                ✕
              </button>
            </div>

            {sent ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3" aria-hidden="true">✅</div>
                <p className="text-dorado-claro mb-1">¡Ya avisamos a nuestro camarero!</p>
                <p className="text-dorado-oscuro text-sm mb-4">
                  En unos segundos atenderá su mesa.
                </p>
                <button
                  onClick={closeModal}
                  className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-6 rounded"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label className="block text-dorado-oscuro text-sm mb-1" htmlFor="call-table">
                  Número de mesa *
                </label>
                <input
                  id="call-table"
                  type="number"
                  min="1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ej: 5"
                  className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none mb-3"
                />

                <label className="block text-dorado-oscuro text-sm mb-1" htmlFor="call-message">
                  Motivo (opcional)
                </label>
                <input
                  id="call-message"
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ej: Necesitamos la cuenta, servilletas..."
                  className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none mb-3"
                />

                {error && (
                  <p className="text-rojo text-sm mb-3" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2.5 rounded disabled:opacity-50"
                >
                  {sending ? 'Enviando...' : '🔔 Avisar al camarero'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default CallWaiterButton;

import React, { useEffect, useState } from 'react';
import { FallbackProps } from 'react-error-boundary';
import axios from 'axios';
import { FetchData } from '@/utils/FetchData';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const reportError = async () => {
    setSending(true);
    try {
      /* await axios.post('/logs', {
        endpoint: typeof window !== 'undefined' ? window.location.pathname : undefined,
        metodo: 'CLIENT',
        error_mensaje: String(error?.message),
        error_detalle: String(error?.stack),
      }); */

      await FetchData('logs', 'POST', {
        endpoint: typeof window !== 'undefined' ? window.location.pathname : undefined,
        metodo: 'CLIENT',
        error_mensaje: String(error?.message),
        error_detalle: String(error?.stack)
      });
      setSent(true);
    } catch (e) {
      console.error('Error reporting client error', e);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    // Intentar enviar automáticamente una vez al montar el fallback
    reportError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyDetails = async () => {
    const text = `${error?.message}\n\n${error?.stack}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error('Clipboard failed', e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white dark:bg-gray-800 border rounded-lg shadow-md p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <svg
            className="w-10 h-10 text-red-500"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 9v4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 17h.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-400"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Algo salió mal</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Se produjo un error inesperado. Puedes reintentar o copiar los detalles para
            compartirlos.
          </p>

          <div className="mt-4">
            <div className="bg-gray-50 dark:bg-gray-900 border rounded p-3">
              <p className="text-sm text-red-700 dark:text-red-300 truncate">{error?.message}</p>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={resetErrorBoundary}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              >
                Reintentar
              </button>

              <button
                onClick={reportError}
                disabled={sending}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm"
              >
                {sending ? 'Enviando…' : sent ? 'Reportado' : 'Reportar'}
              </button>

              <button
                onClick={copyDetails}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm"
              >
                Copiar detalles
              </button>

              <button
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="ml-auto px-2 py-1 text-xs text-gray-500 hover:underline"
              >
                {detailsOpen ? 'Ocultar detalles' : 'Ver detalles'}
              </button>
            </div>

            {detailsOpen && (
              <pre className="mt-3 max-h-64 overflow-auto text-xs text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border rounded p-3 whitespace-pre-wrap">
                {error?.stack}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;

import { useEffect } from 'react';
import { toast } from 'sonner';
import { sanitizeError, formatErrorForDisplay } from '@/utils/ErrorFormatter';

export const GlobalErrorHandler = () => {
  useEffect(() => {
    // Manejar errores no capturados de JavaScript
    const handleUnhandledError = (event: ErrorEvent) => {
      console.error('❌ Error no capturado:', event.error);

      // No mostrar toast para errores que ya fueron manejados por React Error Boundaries
      if (!event.error?.handledByReact) {
        try {
          // Formatear el error de forma segura
          const sanitized = sanitizeError(event.error);
          const errorMessage = typeof sanitized === 'string' ? sanitized : sanitized.message;

          toast.error('Ha ocurrido un error inesperado', {
            description:
              process.env.NODE_ENV === 'development'
                ? errorMessage
                : 'Nuestro equipo ha sido notificado',
            duration: 5000
          });
        } catch (toastError) {
          // Fallback si hay error al mostrar el toast
          console.error('Error al mostrar toast:', toastError);
          toast.error('Ha ocurrido un error inesperado', {
            duration: 5000
          });
        }
      }

      // Enviar error al backend en producción
      if (process.env.NODE_ENV === 'production') {
        try {
          const sanitized = sanitizeError(event.error);
          const errorMessage = typeof sanitized === 'string' ? sanitized : sanitized.message;

          fetch(`${import.meta.env.VITE_APP_API_URL}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              endpoint: 'UNHANDLED_ERROR',
              metodo: 'JAVASCRIPT',
              error_mensaje: errorMessage,
              error_detalle: JSON.stringify({
                stack: event.error?.stack,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
              })
            })
          }).catch(() => {}); // Silenciar errores de logging
        } catch (logError) {
          // Silenciar errores de logging
          console.error('Error al enviar log:', logError);
        }
      }
    };

    // Manejar promesas rechazadas no capturadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('❌ Promesa rechazada no capturada:', event.reason);

      try {
        // Formatear el error de forma segura
        const sanitized = sanitizeError(event.reason);
        const errorMessage = typeof sanitized === 'string' ? sanitized : sanitized.message;

        toast.error('Error de conexión o procesamiento', {
          description: errorMessage,
          duration: 5000
        });
      } catch (toastError) {
        // Fallback si hay error al mostrar el toast
        console.error('Error al mostrar toast:', toastError);
        toast.error('Error de conexión o procesamiento', {
          description: 'Verifique su conexión e intente nuevamente',
          duration: 5000
        });
      }

      // Enviar error al backend en producción
      if (process.env.NODE_ENV === 'production') {
        try {
          const sanitized = sanitizeError(event.reason);
          const errorMessage = typeof sanitized === 'string' ? sanitized : sanitized.message;

          fetch(`${import.meta.env.VITE_APP_API_URL}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              endpoint: 'UNHANDLED_REJECTION',
              metodo: 'PROMISE',
              error_mensaje: errorMessage,
              error_detalle: JSON.stringify({
                reason: event.reason,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
              })
            })
          }).catch(() => {}); // Silenciar errores de logging
        } catch (logError) {
          // Silenciar errores de logging
          console.error('Error al enviar log:', logError);
        }
      }

      // Prevenir que el error aparezca en la consola del navegador
      event.preventDefault();
    };

    // Registrar listeners
    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // Este componente no renderiza nada
};

export default GlobalErrorHandler;

import { useCallback } from 'react';
import { sileo as toast } from 'sileo';

/**
 * Hook personalizado para mostrar notificaciones
 * Usa la librería Sileo para mejor UX
 */
export const useNotification = () => {
  const success = useCallback((message: string, description?: string) => {
    toast.success({ title: message, description });
  }, []);

  const error = useCallback((message: string, description?: string) => {
    toast.error({ title: message, description });
  }, []);

  const warning = useCallback((message: string, description?: string) => {
    toast.warning({ title: message, description });
  }, []);

  const info = useCallback((message: string, description?: string) => {
    toast.info({ title: message, description });
    description;
  }, []);

  return {
    success,
    error,
    warning,
    info
  };
};

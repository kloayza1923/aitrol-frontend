import { toast } from 'sonner';
import {
  extractErrorMessage,
  formatErrorForDisplay,
  sanitizeError,
  type FormattedError
} from '@/utils/ErrorFormatter';

interface ErrorHandlerOptions {
  showToast?: boolean;
  fallbackMessage?: string;
  logError?: boolean;
}

interface ErrorHandlerResult {
  userMessage: string;
  originalError: any;
  details: any;
  context: string;
  formattedError?: FormattedError;
}

export const useErrorHandler = () => {
  const handleError = (
    error: any,
    context: string = 'Unknown',
    options: ErrorHandlerOptions = {}
  ): ErrorHandlerResult => {
    const {
      showToast = true,
      fallbackMessage = 'Ha ocurrido un error inesperado',
      logError = true
    } = options;

    // Usar el formatter para obtener el mensaje de forma segura
    let userMessage = fallbackMessage;
    let errorDetails = null;
    let formattedError: FormattedError | undefined;

    // Determinar el mensaje apropiado para el usuario
    const sanitized = sanitizeError(error);
    if (typeof sanitized === 'string') {
      userMessage = sanitized;
    } else {
      formattedError = sanitized;
      userMessage = sanitized.message;
    }

    // Extraer detalles adicionales del error
    if (error?.status) {
      errorDetails = {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        method: error.method
      };

      // Mensajes específicos por código de estado HTTP
      switch (error.status) {
        case 400:
          userMessage = error.message || 'Datos inválidos enviados al servidor';
          break;
        case 401:
          userMessage = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente';
          // Opcional: redirigir al login
          break;
        case 403:
          userMessage = 'No tiene permisos para realizar esta acción';
          break;
        case 404:
          userMessage = 'El recurso solicitado no fue encontrado';
          break;
        case 422:
          userMessage = userMessage || 'Los datos enviados tienen errores de validación';
          break;
        case 500:
          userMessage = 'Error interno del servidor. Contacte al administrador';
          break;
        case 502:
        case 503:
        case 504:
          userMessage = 'El servidor no está disponible temporalmente. Intente más tarde';
          break;
        default:
          if (error.status >= 500) {
            userMessage = 'Error del servidor. Contacte al administrador';
          }
      }
    }

    // Si es un error de red
    if (error?.isNetworkError) {
      userMessage = 'Error de conexión. Verifique su conexión a internet';
    }

    // Log del error para desarrollo
    if (logError) {
      console.error(`❌ Error en ${context}:`, {
        message: userMessage,
        originalError: error,
        details: errorDetails,
        formattedError,
        timestamp: new Date().toISOString()
      });
    }

    // Mostrar toast al usuario si está habilitado
    if (showToast) {
      try {
        toast.error(userMessage, {
          description: process.env.NODE_ENV === 'development' ? `Context: ${context}` : undefined,
          duration: 5000
        });
      } catch (toastError) {
        // Fallback si hay error al mostrar el toast
        console.error('Error al mostrar toast:', toastError);
      }
    }

    // Retornar información estructurada del error
    return {
      userMessage,
      originalError: error,
      details: errorDetails,
      context,
      formattedError
    };
  };

  // Función específica para errores de API
  const handleApiError = (error: any, endpoint: string = '') => {
    return handleError(error, `API: ${endpoint}`, {
      fallbackMessage: 'Error al comunicarse con el servidor'
    });
  };

  // Función para errores de validación
  const handleValidationError = (
    error: any,
    formName: string = ''
  ): ErrorHandlerResult & { fieldErrors?: Record<string, string> } => {
    const result = handleError(error, `Validación: ${formName}`, {
      fallbackMessage: 'Error de validación en el formulario',
      showToast: false // Para errores de validación, mostrar en el formulario
    });

    // Incluir errores por campo si existen
    if (result.formattedError?.fieldErrors) {
      return {
        ...result,
        fieldErrors: result.formattedError.fieldErrors
      };
    }

    return result;
  };

  return {
    handleError,
    handleApiError,
    handleValidationError
  };
};

// Hook para usar con async/await y try/catch más limpio
export const useAsyncError = () => {
  const { handleError } = useErrorHandler();

  const executeAsync = async <T>(
    asyncFn: () => Promise<T>,
    context: string,
    options?: ErrorHandlerOptions
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, context, options);
      return null;
    }
  };

  return { executeAsync, handleError };
};

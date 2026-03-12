import { store } from '../store';
import { dynamicApi } from '../store/api/dynamicApi';

/**
 * Limpia el cache de RTK Query (todo o tags específicos)
 */
export function clearCache(tag?: string) {
  if (tag) {
    // Invalidar tag específico
    store.dispatch(dynamicApi.util.invalidateTags([tag as any]));
    console.log(`🧹 Cache limpiado para tag: ${tag}`);
  } else {
    // Resetear toda la API (limpia todo el caché)
    store.dispatch(dynamicApi.util.resetApiState());
    console.log('🧹 Cache limpiado completo');
  }
}

// Función principal de FetchData que usa RTK Query internamente
const fetchDataFunction = async (
  url: string,
  method: string = 'GET',
  dataBody?: any,
  headers?: HeadersInit,
  cacheTime?: number
): Promise<any> => {
  try {
    // Para GET, usamos query (con caché automático)
    if (method === 'GET') {
      const result = await store.dispatch(
        dynamicApi.endpoints.dynamicQuery.initiate(
          { url, data: dataBody, headers, cacheTime },
          { forceRefetch: false } // Usar caché si está disponible
        )
      );

      if (result.error) {
        throw createErrorFromRTKError(result.error, url, method);
      }

      return result.data;
    }

    // Para POST/PUT/DELETE, usamos mutation
    const result = await store.dispatch(
      dynamicApi.endpoints.dynamicRequest.initiate({
        url,
        method: method as 'POST' | 'PUT' | 'DELETE',
        data: dataBody,
        headers
      })
    );

    if (result.error) {
      throw createErrorFromRTKError(result.error, url, method);
    }

    return result.data;
  } catch (error) {
    // Si ya es un error formateado, re-lanzarlo
    if (error instanceof Error && (error as any).status) {
      throw error;
    }

    // Error de red o desconocido
    const networkError = new Error('Error de conexión. Verifica tu conexión a internet.') as any;
    networkError.isNetworkError = true;
    networkError.originalError = error;

    console.error('❌ FetchData Error:', error);
    throw networkError;
  }
};

/**
 * Convierte un error de RTK Query a nuestro formato de error personalizado
 */
function createErrorFromRTKError(error: any, url: string, method: string): Error {
  let errorMessage = 'Error desconocido';
  let status = 500;
  let errorDetails = null;

  if ('status' in error) {
    status = typeof error.status === 'number' ? error.status : 500;

    if (error.data) {
      errorMessage = error.data.message || error.data.error || error.data.detail || errorMessage;
      errorDetails = error.data;
    } else if (typeof error.error === 'string') {
      errorMessage = error.error;
    }
  }

  const customError = new Error(errorMessage) as any;
  customError.status = status;
  customError.url = url;
  customError.method = method;
  customError.details = errorDetails;

  console.error('❌ FetchData HTTP Error:', {
    status,
    url,
    method,
    message: errorMessage,
    details: errorDetails
  });

  // Log en producción
  if (process.env.NODE_ENV === 'production') {
    try {
      fetch(`${import.meta.env.VITE_APP_API_URL}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: url,
          metodo: method,
          error_mensaje: errorMessage,
          error_detalle: JSON.stringify({
            status,
            url,
            details: errorDetails,
            timestamp: new Date().toISOString()
          })
        })
      }).catch(() => {});
    } catch {}
  }

  return customError;
}

// Exportar como función principal
export const FetchData = Object.assign(fetchDataFunction, {
  // Método POST
  post: (url: string, data?: any, headers?: HeadersInit, cacheTime?: number) => {
    return fetchDataFunction(url, 'POST', data, headers, cacheTime);
  },

  // Método PUT
  put: (url: string, data?: any, headers?: HeadersInit, cacheTime?: number) => {
    return fetchDataFunction(url, 'PUT', data, headers, cacheTime);
  },

  // Método DELETE
  delete: (url: string, data?: any, headers?: HeadersInit, cacheTime?: number) => {
    return fetchDataFunction(url, 'DELETE', data, headers, cacheTime);
  },

  // Método GET (alias explícito)
  get: (url: string, data?: any, headers?: HeadersInit, cacheTime?: number) => {
    return fetchDataFunction(url, 'GET', data, headers, cacheTime);
  }
});

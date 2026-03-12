import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toAbsoluteUrl, sanitizeError, formatErrorForDisplay } from '@/utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Actualiza el state para que la próxima renderización muestre la UI de error
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Registra el error en el estado y envía el error a un servicio de logging
    this.setState({
      error,
      errorInfo
    });

    // Enviar error al backend para logging
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Formatear el error de forma segura
      const formattedError = formatErrorForDisplay(error as any);
      const errorMessage =
        typeof formattedError === 'string' ? formattedError : formattedError.message;

      // Enviar error al endpoint de logging
      const errorData = {
        endpoint: window.location.pathname,
        metodo: 'CLIENT_ERROR',
        error_mensaje: errorMessage,
        error_detalle: JSON.stringify({
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          formattedError: typeof formattedError !== 'string' ? formattedError : undefined
        })
      };

      await fetch(`${import.meta.env.VITE_APP_API_URL}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });
    } catch (logError) {
      console.error('Error al enviar log:', logError);
    }
  };

  handleReload = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, lo usamos
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de error por defecto
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 w-full">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-6">
              <img
                src={toAbsoluteUrl('/media/illustrations/20.svg')}
                className="dark:hidden max-h-[120px] mx-auto"
                alt="Error illustration"
              />
              <img
                src={toAbsoluteUrl('/media/illustrations/20-dark.svg')}
                className="light:hidden max-h-[120px] mx-auto"
                alt="Error illustration"
              />
            </div>

            <span className="badge badge-danger badge-outline mb-3">Error de Aplicación</span>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Oops! Algo salió mal</h3>

            <div className="text-sm text-gray-600 mb-4">
              Se ha producido un error inesperado. Nuestro equipo ha sido notificado
              automáticamente.
            </div>

            {/* Mostrar detalles del error en desarrollo */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Detalles del error (solo en desarrollo)
                </summary>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-96">
                  <div className="text-red-600 mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>

                  {/* Mostrar detalles formateados si es un error de validación */}
                  {(() => {
                    try {
                      const formatted = formatErrorForDisplay(this.state.error as any);
                      if (typeof formatted !== 'string' && formatted.fieldErrors) {
                        return (
                          <div className="text-blue-600 mb-2">
                            <strong>Errores de Validación:</strong>
                            <div className="whitespace-pre-wrap mt-1 bg-white p-1 rounded">
                              {Object.entries(formatted.fieldErrors)
                                .map(([field, err]) => `• ${field}: ${err}`)
                                .join('\n')}
                            </div>
                          </div>
                        );
                      }
                    } catch (e) {
                      console.error('Error al formatear:', e);
                    }
                    return null;
                  })()}

                  {this.state.error.stack && (
                    <div className="text-gray-600 mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1 bg-white p-1 rounded">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div className="text-gray-600">
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1 bg-white p-1 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-2">
              <button onClick={this.handleReload} className="btn btn-primary w-full">
                Recargar Página
              </button>

              <a
                href="/"
                className="btn btn-light w-full inline-block text-center text-sm px-4 py-2 rounded"
              >
                Volver al Inicio
              </a>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Si el problema persiste, contacta al soporte técnico.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

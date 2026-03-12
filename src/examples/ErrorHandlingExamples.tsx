/**
 * EJEMPLO: Cómo capturar y manejar errores correctamente en Horizon ERP
 *
 * Este archivo demuestra las mejores prácticas para:
 * 1. Capturar errores de validación Pydantic
 * 2. Manejar contextos null
 * 3. Mostrar errores de forma segura
 * 4. Registrar errores en producción
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { FetchData } from '@/utils/FetchData';
import { extractErrorMessage, formatErrorForDisplay, sanitizeError } from '@/utils/ErrorFormatter';
import { useSafeContext } from '@/hooks/useSafeContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { AuthContext } from '@/auth';

/**
 * ========== PATRÓN 1: Manejo Simple de Errores ==========
 * Mejor para: Operaciones API simples
 */
export const SimpleErrorHandlingExample = () => {
  const [loading, setLoading] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const user = await FetchData('/users', 'GET');
      toast.success('Usuario cargado');
      return user;
    } catch (error) {
      // ✅ Usar extractErrorMessage para obtener string seguro
      const message = extractErrorMessage(error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={fetchUser} disabled={loading}>
      {loading ? 'Cargando...' : 'Cargar Usuario'}
    </button>
  );
};

/**
 * ========== PATRÓN 2: Validación de Formularios ==========
 * Mejor para: Formularios con errores por campo
 */
export const FormValidationExample = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await FetchData('/auth/register', 'POST', formData);
      toast.success('Registro exitoso');
      return response;
    } catch (error) {
      // ✅ Usar formatErrorForDisplay para obtener errores por campo
      const formatted = formatErrorForDisplay(error);

      if (formatted.isValidationError && formatted.fieldErrors) {
        // Mostrar errores en el formulario por campo
        setFieldErrors(formatted.fieldErrors);
        toast.error('Por favor, corrija los errores en el formulario');
      } else {
        // Error general
        toast.error(formatted.message);
        setFieldErrors({});
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Email"
        />
        {fieldErrors.email && <span className="error">{fieldErrors.email}</span>}
      </div>

      <div>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Contraseña"
        />
        {fieldErrors.password && <span className="error">{fieldErrors.password}</span>}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Registrando...' : 'Registrarse'}
      </button>
    </form>
  );
};

/**
 * ========== PATRÓN 3: Manejo Avanzado con Hook ==========
 * Mejor para: Lógica compleja con múltiples errores
 */
export const AdvancedErrorHandlingExample = () => {
  const { handleError, handleApiError, handleValidationError } = useErrorHandler();
  const [loading, setLoading] = useState(false);

  const createOrder = async (orderData: any) => {
    setLoading(true);
    try {
      const response = await FetchData('/orders', 'POST', orderData);
      toast.success('Orden creada exitosamente');
      return response;
    } catch (error) {
      // Usa el hook para manejar automáticamente
      const result = handleApiError(error, '/orders');

      // Acceder a los detalles si es necesario
      if (result.formattedError?.fieldErrors) {
        console.log('Errores por campo:', result.formattedError.fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={() =>
        createOrder({
          /* data */
        })
      }
      disabled={loading}
    >
      {loading ? 'Creando...' : 'Crear Orden'}
    </button>
  );
};

/**
 * ========== PATRÓN 4: Contextos Seguros ==========
 * Mejor para: Evitar "Cannot destructure property 'x' as it is null"
 */
export const SafeContextExample = () => {
  // ❌ NO HAGAS ESTO (puede tirar error si AuthContext es null):
  // const { currentUser } = useContext(AuthContext);

  // ✅ HAZ ESTO (seguro, nunca tira error):
  const auth = useSafeContext(AuthContext, {
    contextName: 'AuthContext',
    throwOnNull: false,
    defaultValue: { currentUser: null }
  });

  return (
    <div>{auth?.currentUser ? <p>Hola {auth.currentUser.name}</p> : <p>No autenticado</p>}</div>
  );
};

/**
 * ========== PATRÓN 5: Sanitización de Errores ==========
 * Mejor para: Cuando no sabes qué tipo de error es
 */
export const SanitizationExample = () => {
  const handleUnknownError = (error: any) => {
    // ✅ Esto SIEMPRE retorna algo seguro para renderizar
    const safe = sanitizeError(error);

    if (typeof safe === 'string') {
      // Es un string, seguro para mostrar
      toast.error(safe);
    } else {
      // Es un FormattedError con posibles errores por campo
      toast.error(safe.message);
      if (safe.fieldErrors) {
        console.log('Errores por campo:', safe.fieldErrors);
      }
    }
  };

  return <div>{/* Componente de ejemplo */}</div>;
};

/**
 * ========== PATRÓN 6: Hook para Async/Await Limpio ==========
 * Mejor para: Reducir boilerplate con try/catch
 */
export const CleanAsyncExample = () => {
  const { executeAsync } = useErrorHandler() as any; // Necesita useAsyncError
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Ejecuta la función con manejo automático de errores
      const result = await executeAsync(() => FetchData('/data', 'GET'), 'Cargando datos', {
        showToast: false
      });

      if (result) {
        console.log('Datos cargados:', result);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={loadData} disabled={loading}>
      {loading ? 'Cargando...' : 'Cargar Datos'}
    </button>
  );
};

/**
 * ========== PATRÓN 7: Captura de Errores Específicos ==========
 * Mejor para: Tratamiento diferenciado según tipo de error
 */
export const SpecificErrorHandlingExample = () => {
  const handleRequest = async () => {
    try {
      const response = await FetchData('/endpoint', 'POST', {});
      return response;
    } catch (error: any) {
      // Determinar tipo de error
      if (error.status === 422) {
        // Error de validación
        const formatted = formatErrorForDisplay(error);
        console.log('Validación fallida:', formatted.fieldErrors);
      } else if (error.status === 401) {
        // No autorizado
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente');
        // Redirigir a login
      } else if (error.status === 403) {
        // Prohibido
        toast.error('No tiene permisos para esta acción');
      } else if (error.isNetworkError) {
        // Error de red
        toast.error('Error de conexión. Verifica tu internet');
      } else {
        // Error genérico
        const message = extractErrorMessage(error);
        toast.error(message);
      }
    }
  };

  return <button onClick={handleRequest}>Realizar Solicitud</button>;
};

/**
 * ========== RESUMEN ==========
 *
 * NUNCA:
 * ❌ try { console.log(error) } // Puede ser un objeto inseguro
 * ❌ return <div>{error}</div> // Renderizar objetos directamente
 * ❌ const { prop } = useContext(NULL_CONTEXT) // Crash si es null
 * ❌ toast.error(error) // Si error es un objeto, esto falla
 *
 * SIEMPRE:
 * ✅ const message = extractErrorMessage(error)
 * ✅ const formatted = formatErrorForDisplay(error)
 * ✅ const safe = sanitizeError(error)
 * ✅ const context = useSafeContext(CONTEXT, options)
 * ✅ Los errores se capturan automáticamente por GlobalErrorHandler
 *
 * RESULTADO:
 * 🎉 Nunca verás "Objects are not valid as a React child"
 * 🎉 Nunca verás "Cannot destructure property as it is null"
 * 🎉 Todos los errores son formateados y legibles
 * 🎉 El debugging es más fácil con información clara
 */

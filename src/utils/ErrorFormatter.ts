/**
 * Utilidad para formatear y extraer mensajes de errores de diferentes tipos
 * Especialmente para errores de validación de Pydantic y errores de React
 */

export interface PydanticValidationError {
  type: string;
  loc: (string | number)[];
  msg: string;
  input: any;
}

export interface FormattedError {
  message: string;
  details?: string;
  fieldErrors?: Record<string, string>;
  isValidationError: boolean;
}

/**
 * Extrae un mensaje legible de cualquier tipo de error
 */
export const extractErrorMessage = (error: any): string => {
  if (!error) return 'Se produjo un error desconocido';

  // Si es un string, devolverlo directamente
  if (typeof error === 'string') {
    return error;
  }

  // Si es un mensaje de error personalizado
  if (error.message) {
    return error.message;
  }

  // Si es un detail de Pydantic o API
  if (error.detail) {
    if (typeof error.detail === 'string') {
      return error.detail;
    }
    if (Array.isArray(error.detail)) {
      // Es posible que sea un array de errores de validación de Pydantic
      return extractValidationErrors(error.detail).message;
    }
  }

  // Si es un array de errores de validación
  if (Array.isArray(error)) {
    return extractValidationErrors(error).message;
  }

  // Si tiene error.error
  if (error.error) {
    if (typeof error.error === 'string') {
      return error.error;
    }
    if (typeof error.error === 'object') {
      return extractErrorMessage(error.error);
    }
  }

  // Si tiene statusText
  if (error.statusText) {
    return error.statusText;
  }

  // Fallback: convertir a string
  return 'Se produjo un error desconocido';
};

/**
 * Procesa errores de validación de Pydantic
 * Estos suelen tener la forma: [{ type: string, loc: [...], msg: string, input: any }, ...]
 */
export const extractValidationErrors = (
  errors: any[] | PydanticValidationError[]
): FormattedError => {
  if (!Array.isArray(errors) || errors.length === 0) {
    return {
      message: 'Error de validación',
      isValidationError: false
    };
  }

  const fieldErrors: Record<string, string> = {};
  const messages: string[] = [];

  errors.forEach((error) => {
    if (error && typeof error === 'object') {
      // Formato Pydantic
      if (error.loc && error.msg) {
        const fieldName = error.loc.length > 0 ? error.loc[error.loc.length - 1] : 'unknown';
        const message = error.msg || 'Error de validación';

        fieldErrors[String(fieldName)] = message;
        messages.push(`${fieldName}: ${message}`);
      }
      // Otros formatos
      else if (error.message) {
        messages.push(error.message);
      } else if (typeof error === 'string') {
        messages.push(error);
      }
    } else if (typeof error === 'string') {
      messages.push(error);
    }
  });

  return {
    message: messages.length > 0 ? messages[0] : 'Error de validación',
    details: messages.join('\n'),
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    isValidationError: true
  };
};

/**
 * Formatea cualquier tipo de error para renderización segura
 */
export const formatErrorForDisplay = (error: any): FormattedError => {
  // Si es array de errores de validación
  if (Array.isArray(error)) {
    return extractValidationErrors(error);
  }

  // Si es objeto con detalles
  if (error && typeof error === 'object') {
    // Si tiene detail que es array
    if (Array.isArray(error.detail)) {
      return extractValidationErrors(error.detail);
    }

    // Si tiene errores en fields
    if (error.errors && typeof error.errors === 'object') {
      const fieldErrors: Record<string, string> = {};
      const messages: string[] = [];

      Object.entries(error.errors).forEach(([field, err]: [string, any]) => {
        const msg = typeof err === 'string' ? err : extractErrorMessage(err);
        fieldErrors[field] = msg;
        messages.push(`${field}: ${msg}`);
      });

      return {
        message: messages[0] || 'Error de validación',
        details: messages.join('\n'),
        fieldErrors,
        isValidationError: true
      };
    }
  }

  // Caso por defecto
  return {
    message: extractErrorMessage(error),
    isValidationError: false
  };
};

/**
 * Verifica si un error es un objeto que NO debería renderizarse (como un objeto de validación)
 */
export const isUnsafeErrorObject = (error: any): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  // Chequear si tiene la estructura de un error de Pydantic
  if (error.type && error.loc && error.msg && 'input' in error) {
    return true;
  }

  // Si es un array de tales objetos
  if (Array.isArray(error) && error.length > 0) {
    return error.every((e) => e.type && e.loc && e.msg && 'input' in e);
  }

  return false;
};

/**
 * Sanitiza un error asegurando que sea seguro renderizarlo
 */
export const sanitizeError = (error: any): string | FormattedError => {
  if (typeof error === 'string') {
    return error;
  }

  if (isUnsafeErrorObject(error)) {
    return formatErrorForDisplay(error);
  }

  if (error?.message) {
    return error.message;
  }

  return formatErrorForDisplay(error);
};

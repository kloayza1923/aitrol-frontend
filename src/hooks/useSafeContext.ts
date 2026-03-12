/**
 * Hook seguro para usar contextos con manejo de null
 * Previene el error: "Cannot destructure property 'x' of 'React.useContext(...)' as it is null"
 */

import { useContext, useCallback } from 'react';

export interface SafeContextOptions {
  throwOnNull?: boolean;
  defaultValue?: any;
  contextName?: string;
}

/**
 * Hook que proporciona un contexto de forma segura, validando que no sea null
 * Útil para evitar destructuración de contextos null
 */
export const useSafeContext = <T>(
  context: React.Context<T | null> | React.Context<T>,
  options: SafeContextOptions = {}
): T => {
  const { throwOnNull = true, defaultValue = null, contextName = 'Context' } = options;

  const contextValue = useContext(context as React.Context<T>);

  if (contextValue === null || contextValue === undefined) {
    const errorMessage = `${contextName} is not available. Make sure the provider is mounted in the component tree.`;

    if (throwOnNull) {
      console.warn(`⚠️ ${errorMessage}`);
      throw new Error(errorMessage);
    } else {
      console.warn(`⚠️ ${errorMessage} Using default value.`);
      return defaultValue || ({} as T);
    }
  }

  return contextValue as T;
};

/**
 * Hook para desestructuración segura de contextos
 * Permite desestructurar propiedades específicas con valores por defecto
 */
export const useSafeContextDestructure = <T extends Record<string, any>>(
  context: React.Context<T | null>,
  keys: (keyof T)[],
  options: SafeContextOptions = {}
): Partial<T> => {
  const contextValue = useSafeContext<T>(context, {
    ...options,
    throwOnNull: false
  });

  if (!contextValue) {
    // Retornar un objeto vacío con las propiedades pedidas como undefined
    return keys.reduce((acc, key) => {
      acc[key] = undefined;
      return acc;
    }, {} as Partial<T>);
  }

  // Desestructurar solo las keys solicitadas
  const result = {} as Partial<T>;
  keys.forEach((key) => {
    result[key] = contextValue[key];
  });

  return result;
};

/**
 * Hook para manejar de forma segura un contexto que puede ser null
 * Retorna el contexto o null de forma segura
 */
export const useOptionalContext = <T>(context: React.Context<T | null>): T | null => {
  return useContext(context);
};

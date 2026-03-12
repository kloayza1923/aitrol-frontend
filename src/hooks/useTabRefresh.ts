import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

/**
 * Hook que detecta cuando la pestaña actual ha sido actualizada
 * Útil para recargar datos o reinicializar estado del componente
 *
 * @param callback - Función a ejecutar cuando se detecte un refresh
 *
 * @example
 * useTabRefresh(() => {
 *   // Refetch data
 *   fetchUserData();
 * });
 */
export const useTabRefresh = (callback?: () => void) => {
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const refreshKeyRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    const currentRefreshKey = activeTab?.refreshKey;

    // Si el refreshKey cambió, ejecutar el callback
    if (refreshKeyRef.current !== undefined && refreshKeyRef.current !== currentRefreshKey) {
      callback?.();
    }

    // Actualizar referencia
    refreshKeyRef.current = currentRefreshKey;
  }, [tabs, activeTabId, callback]);

  return refreshKeyRef.current;
};

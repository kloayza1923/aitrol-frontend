import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNotification } from './useNotification';
import { RootState } from '@/store';
import { TABS_CONFIG } from '@/store/slices/tabsSlice';

/**
 * Hook que monitorea y notifica sobre límites de pestañas
 * Muestra advertencias cuando se alcanza o excede el límite máximo
 */
export const useTabsLimitWarning = () => {
  const { tabs } = useSelector((state: RootState) => state.tabs);
  const { openNotification } = useNotification();

  useEffect(() => {
    // Verificar si se alcanzó el límite
    const limitReached = localStorage.getItem('tabsLimitReached') === 'true';

    if (limitReached && TABS_CONFIG.ENABLE_LIMIT && TABS_CONFIG.AUTO_CLOSE_OLDEST) {
      openNotification({
        type: 'warning',
        message: 'Límite de pestañas',
        description: `Se ha alcanzado el máximo de ${TABS_CONFIG.MAX_TABS} pestañas. Se cerró la más antigua.`,
        duration: 4
      });
      localStorage.removeItem('tabsLimitReached');
    }

    // Mostrar advertencia cuando se está cerca del límite
    if (TABS_CONFIG.ENABLE_LIMIT && tabs.length === TABS_CONFIG.MAX_TABS - 1) {
      openNotification({
        type: 'info',
        message: 'Advertencia',
        description: `Estás usando ${tabs.length} de ${TABS_CONFIG.MAX_TABS} pestañas disponibles.`,
        duration: 3
      });
    }
  }, [tabs.length, openNotification]);
};

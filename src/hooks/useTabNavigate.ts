import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { openTab, setActiveTab } from '@/store/slices/tabsSlice';
import { RootState } from '@/store';
import { v4 as uuidv4 } from 'uuid';

interface UseTabNavigationOptions {
  enableTabs?: boolean;
  customTitle?: string;
}

export const useTabNavigate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const tabs = useSelector((state: RootState) => state.tabs.tabs);

  // Mapeo de rutas a títulos de tabs
  const routeTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/demo1-dark-sidebar': 'Demo 1 - Dark Sidebar',
    '/dashboard/demo1-light-sidebar': 'Demo 1 - Light Sidebar',
    '/user-management': 'Gestión de Usuarios',
    '/user-management/add': 'Agregar Usuario',
    '/user-management/edit': 'Editar Usuario',
    '/vehicle-management': 'Gestión de Vehículos',
    '/vehicle-management/add': 'Agregar Vehículo',
    '/vehicle-management/edit': 'Editar Vehículo',
    '/order-management': 'Gestión de Órdenes',
    '/order-management/add': 'Nueva Orden',
    '/order-management/edit': 'Editar Orden',
    '/client-management': 'Gestión de Clientes',
    '/client-management/add': 'Agregar Cliente',
    '/client-management/edit': 'Editar Cliente',
    '/inventory/products': 'Productos',
    '/inventory/categories': 'Categorías',
    '/inventory/purchases': 'Compras',
    '/inventory/sales': 'Ventas',
    '/accounting/diario': 'Diario',
    '/accounting/plan-cuentas': 'Plan de Cuentas',
    '/accounting/libro-mayor': 'Libro Mayor'
  };

  const getTabTitle = (path: string, customTitle?: string): string => {
    if (customTitle) return customTitle;
    return (
      routeTitles[path] ||
      path.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').toUpperCase() ||
      'Nueva Pestaña'
    );
  };

  const navigateToTab = useCallback(
    (path: string, options?: UseTabNavigationOptions) => {
      if (!path) return;

      const { enableTabs = false, customTitle } = options || {};

      if (!enableTabs) {
        // Pasar estado indicando que no debe abrir tab
        navigate(path, { state: { skipTab: true } });
        return;
      }

      // Verificar si ya existe una tab con este path
      const existingTab = tabs.find((tab) => tab.path === path);

      if (existingTab) {
        // Si ya existe, solo activarla
        dispatch(setActiveTab(existingTab.id));
        navigate(path);
      } else {
        // Crear nueva tab
        const tabId = uuidv4();
        const title = getTabTitle(path, customTitle);

        dispatch(
          openTab({
            id: tabId,
            title,
            path,
            closable: true
          })
        );

        navigate(path);
      }
    },
    [dispatch, navigate, tabs]
  );

  return { navigateToTab, getTabTitle };
};

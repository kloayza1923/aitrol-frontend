import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { openTab } from '@/store/slices/tabsSlice';
import { RootState } from '@/store';
import { v4 as uuidv4 } from 'uuid';

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

export const useTabNavigation = (enableAutoTab = true) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { tabs } = useSelector((state: RootState) => state.tabs);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enableAutoTab) return;

    const path = location.pathname;

    // Verificar si se debe saltar la creación de tab
    const state = location.state as any;
    if (state?.skipTab) {
      return;
    }

    // No crear tabs para rutas de autenticación
    if (path.includes('/auth')) {
      return;
    }

    // Verificar si ya existe una tab con este path
    const existingTab = tabs.find((tab) => tab.path === path);

    if (!existingTab) {
      // Obtener el título de la ruta
      const title =
        routeTitles[path] ||
        path.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') ||
        'Nueva Pestaña';

      dispatch(
        openTab({
          id: uuidv4(),
          title: title.charAt(0).toUpperCase() + title.slice(1),
          path,
          closable: true
        })
      );

      initializedRef.current = true;
    }
  }, [location.pathname, dispatch, tabs, enableAutoTab]);
};

// Función auxiliar para registrar nuevas rutas dinámicamente
export const getTabTitle = (path: string): string => {
  return (
    routeTitles[path] ||
    path.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') ||
    'Nueva Pestaña'
  );
};

// Para agregar dinámicamente nuevas rutas
export const registerRouteTitle = (path: string, title: string) => {
  routeTitles[path] = title;
};

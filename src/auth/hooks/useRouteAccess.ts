import { useMemo } from 'react';
import { useGetUserMenuQuery } from '@/store/api/menuSlice';
import { useAuthContext } from '../useAuthContext';

interface MenuItemWithPath {
  id: number;
  path?: string;
  children?: MenuItemWithPath[];
  [key: string]: any;
}

/**
 * Hook para validar si el usuario tiene acceso a una ruta específica
 * Basado en el menú que trae de la base de datos
 */
export const useRouteAccess = (routePath: string) => {
  const formatedRoutePath =
    routePath.endsWith('/') && routePath.length > 1 ? routePath.slice(0, -1) : routePath;
  const { currentUser } = useAuthContext();
  const { data: userMenu = [], isLoading } = useGetUserMenuQuery(currentUser?.id || 0, {
    skip: !currentUser?.id
  });

  // Extraer todas las rutas permitidas del menú
  const allowedPaths = useMemo(() => {
    const paths = new Set<string>();

    const extractPaths = (items: MenuItemWithPath[]) => {
      items.forEach((item) => {
        if (item.path) {
          // Normalizar la ruta removiendo trailing slash
          let normalizedPath =
            item.path.endsWith('/') && item.path.length > 1 ? item.path.slice(0, -1) : item.path;

          paths.add(normalizedPath);

          // Si contiene parámetros dinámicos, extraer la ruta base
          // Ej: /order-edit/:id → /order-edit
          if (normalizedPath.includes(':')) {
            const basePath = normalizedPath.split(':')[0];
            const cleanBasePath =
              basePath.endsWith('/') && basePath.length > 1 ? basePath.slice(0, -1) : basePath;
            paths.add(cleanBasePath);
          }
        }
        if (item.children && Array.isArray(item.children)) {
          extractPaths(item.children);
        }
      });
    };

    if (userMenu.length > 0) {
      extractPaths(userMenu);
    }

    return paths;
  }, [userMenu]);

  // Validar si la ruta actual está permitida
  const hasAccess = useMemo(() => {
    if (!formatedRoutePath || isLoading) return false;

    // Verificar coincidencia exacta
    if (allowedPaths.has(formatedRoutePath)) {
      return true;
    }

    // Verificar coincidencia con rutas dinámicas
    // Ej: /order-edit/123 coincide con ruta base /order-edit
    for (const allowedPath of allowedPaths) {
      if (allowedPath === '/') continue; // Evitar que "/" coincida con todas las rutas

      const currentPathSegments = formatedRoutePath.split('/').filter((s) => s !== '');
      const allowedPathSegments = allowedPath.split('/').filter((s) => s !== '');

      // Si la ruta permitida tiene menos o igual segmentos que la ruta actual
      if (
        allowedPathSegments.length > 0 &&
        currentPathSegments.length >= allowedPathSegments.length
      ) {
        // Comparar cada segmento hasta la longitud de la ruta permitida
        let matches = true;
        for (let i = 0; i < allowedPathSegments.length; i++) {
          if (currentPathSegments[i] !== allowedPathSegments[i]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          return true;
        }
      }
    }

    // Verificar rutas relacionadas (ej: si tienes /order-management, accedes a /order-edit)
    const routesRelationship: Record<string, string[]> = {
      '/order-management': ['/order-edit', '/order-view'],
      '/employee-management': ['/employee-edit', '/employee-view'],
      '/client-management': ['/client-edit', '/client-view'],
      '/product-management': ['/product-edit', '/product-view'],
      '/inventory/products-management': ['/inventory/product-edit', '/inventory/product-view']
    };

    for (const [parentRoute, relatedRoutes] of Object.entries(routesRelationship)) {
      if (allowedPaths.has(parentRoute)) {
        for (const relatedRoute of relatedRoutes) {
          const relatedSegments = relatedRoute.split('/').filter((s) => s !== '');
          const currentSegments = formatedRoutePath.split('/').filter((s) => s !== '');

          if (currentSegments.length >= relatedSegments.length) {
            let matches = true;
            for (let i = 0; i < relatedSegments.length; i++) {
              if (currentSegments[i] !== relatedSegments[i]) {
                matches = false;
                break;
              }
            }
            if (matches) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }, [formatedRoutePath, allowedPaths, isLoading]);

  return {
    hasAccess,
    isLoading,
    allowedPaths
  };
};

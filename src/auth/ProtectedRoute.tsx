import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ScreenLoader } from '@/components/loaders';
import { useRouteAccess } from './hooks/useRouteAccess';

/**
 * Componente que protege una ruta validando si el usuario tiene acceso
 * basado en los permisos obtenidos del menú en la base de datos
 */
const ProtectedRoute = () => {
  const location = useLocation();
  const { hasAccess, isLoading } = useRouteAccess(location.pathname);

  if (isLoading) {
    return <ScreenLoader />;
  }
  // Si no tiene acceso, redirigir a página de error 403
  if (!hasAccess) {
    return <Navigate to="/error/403" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export { ProtectedRoute };

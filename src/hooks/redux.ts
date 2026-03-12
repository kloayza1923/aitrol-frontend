import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';

// Hooks tipados para usar en toda la aplicación
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Hook para obtener información de autenticación
export const useAuth = () => {
  return useAppSelector((state) => state.auth);
};

// Hook para operaciones de autenticación
export const useAuthActions = () => {
  const dispatch = useAppDispatch();

  return {
    // Los actions los importaremos cuando sea necesario
  };
};

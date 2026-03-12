// src/hooks/useLoadUserMenu.ts
import { useEffect } from 'react';
import { useGetUserMenuQuery } from '@/store/api/menuSlice';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadMenuFromStorage } from '@/store/slices/menuSlice';
import { useMenus } from '@/providers';

const useLoadUserMenu = (usuarioId: number | null) => {
  const dispatch = useAppDispatch();
  const menuState = useAppSelector((state) => state.menu);
  const { setMenuConfig } = useMenus();

  // RTK Query hook - se cachea automáticamente por 1 hora
  const {
    data: menuData,
    isLoading,
    isError,
    error
  } = useGetUserMenuQuery(usuarioId, {
    skip: !usuarioId // No hacer query si no hay usuarioId
  });

  useEffect(() => {
    if (!usuarioId) return;

    // Cargar menú desde localStorage al inicio
    dispatch(loadMenuFromStorage());
  }, [usuarioId, dispatch]);

  useEffect(() => {
    // Cuando llegan datos del servidor, actualizar el estado
    if (menuData && !isLoading && !isError) {
      setMenuConfig('primary', menuData);
    }
  }, [menuData, isLoading, isError, dispatch]);

  useEffect(() => {
    // Log de errores
    if (isError && error) {
      console.error('Error cargando menú de usuario:', error);
    }
  }, [isError, error]);

  return {
    menu: menuState.primary,
    isLoading,
    isError,
    error
  };
};

export default useLoadUserMenu;

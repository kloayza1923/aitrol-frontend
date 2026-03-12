import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Interface para el menú
interface MenuItem {
  id: number;
  name: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
  [key: string]: any;
}

interface MenuState {
  primary: MenuItem[];
  secondary: MenuItem[];
  isLoaded: boolean;
  lastLoadedUserId: number | null;
}

const initialState: MenuState = {
  primary: [],
  secondary: [],
  isLoaded: false,
  lastLoadedUserId: null
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setMenuConfig: (
      state,
      action: PayloadAction<{
        type: 'primary' | 'secondary';
        menu: MenuItem[];
        usuarioId?: number;
      }>
    ) => {
      const { type, menu, usuarioId } = action.payload;
      state[type] = menu;
      state.isLoaded = true;
      if (usuarioId) {
        state.lastLoadedUserId = usuarioId;
      }

      // Sincronizar con localStorage
      localStorage.setItem(`menu_${type}`, JSON.stringify(menu));
    },
    clearMenu: (state) => {
      state.primary = [];
      state.secondary = [];
      state.isLoaded = false;
      state.lastLoadedUserId = null;

      // Limpiar localStorage
      localStorage.removeItem('menu_primary');
      localStorage.removeItem('menu_secondary');
    },
    loadMenuFromStorage: (state) => {
      // Cargar desde localStorage al inicializar
      try {
        const primaryMenu = localStorage.getItem('menu_primary');
        const secondaryMenu = localStorage.getItem('menu_secondary');

        if (primaryMenu) {
          state.primary = JSON.parse(primaryMenu);
          state.isLoaded = true;
        }
        if (secondaryMenu) {
          state.secondary = JSON.parse(secondaryMenu);
        }
      } catch (error) {
        console.error('Error loading menu from localStorage:', error);
      }
    }
  }
});

export const { setMenuConfig, clearMenu, loadMenuFromStorage } = menuSlice.actions;

export default menuSlice.reducer;

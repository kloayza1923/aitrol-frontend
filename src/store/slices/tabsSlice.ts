import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Configuración de límites de pestañas
export const TABS_CONFIG = {
  MAX_TABS: 4, // Máximo de pestañas abiertas simultáneamente
  ENABLE_LIMIT: true, // Habilitar/deshabilitar el límite
  AUTO_CLOSE_OLDEST: true // Cerrar automáticamente la más antigua
};

export interface Tab {
  id: string;
  title: string;
  path: string;
  closable?: boolean;
  refreshKey?: number;
  createdAt?: number; // Timestamp para rastrear la más antigua
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
}

const initialState: TabsState = {
  tabs: [],
  activeTabId: null
};

/**
 * Extrae la ruta base sin parámetros dinámicos
 * Ejemplo: /order-edit/123 → /order-edit/
 * Esto permite que rutas del mismo tipo (ej: edit con diferentes IDs) compartan pestaña
 */
const getBasePath = (path: string): string => {
  // Detectar si la ruta tiene un ID numérico al final
  // Rutas como /order-edit/123 se convierten a /order-edit/
  const segments = path.split('/').filter(Boolean);

  if (segments.length > 0) {
    // Si el último segmento es un número, es probablemente un ID
    const lastSegment = segments[segments.length - 1];
    if (/^\d+$/.test(lastSegment)) {
      // Remover el último segmento (el ID) y devolver la ruta base
      return '/' + segments.slice(0, -1).join('/') + '/';
    }
  }

  return path;
};

const tabsSlice = createSlice({
  name: 'tabs',
  initialState,
  reducers: {
    openTab: (state, action: PayloadAction<Tab>) => {
      const tab = action.payload;
      const basePath = getBasePath(tab.path);

      // Buscar una pestaña existente que tenga la misma ruta base
      const existingTab = state.tabs.find((t) => getBasePath(t.path) === basePath);

      if (!existingTab) {
        // Verificar límite de pestañas
        if (TABS_CONFIG.ENABLE_LIMIT && state.tabs.length >= TABS_CONFIG.MAX_TABS) {
          if (TABS_CONFIG.AUTO_CLOSE_OLDEST) {
            // Cerrar la pestaña más antigua (la que se abrió primero)
            const oldestTab = state.tabs.reduce((oldest, current) => {
              return (oldest.createdAt || 0) > (current.createdAt || 0) ? current : oldest;
            });

            const oldestIndex = state.tabs.indexOf(oldestTab);
            if (oldestIndex !== -1) {
              state.tabs.splice(oldestIndex, 1);
            }
          } else {
            // No abrir la nueva pestaña
            localStorage.setItem('tabsLimitReached', 'true');
            return;
          }
        }

        // Agregar timestamp de creación
        tab.createdAt = Date.now();
        state.tabs.push(tab);
        state.activeTabId = tab.id;
      } else {
        // Si existe una pestaña del mismo tipo, actualizar su path con el nuevo ID
        // Esto permite navegar entre diferentes registros (ej: /order-edit/123 → /order-edit/456)
        // sin abrir una nueva pestaña
        existingTab.path = tab.path;
        existingTab.title = tab.title; // También actualizar el título si cambió
        state.activeTabId = existingTab.id;
      }

      localStorage.setItem('activeTabs', JSON.stringify(state.tabs));
      localStorage.setItem('activeTabId', state.activeTabId || '');
      localStorage.removeItem('tabsLimitReached');
    },

    closeTab: (state, action: PayloadAction<string>) => {
      const tabId = action.payload;
      const tabIndex = state.tabs.findIndex((t) => t.id === tabId);

      if (tabIndex !== -1) {
        state.tabs.splice(tabIndex, 1);
      }

      if (state.activeTabId === tabId) {
        state.activeTabId = state.tabs[tabIndex - 1]?.id || state.tabs[0]?.id || null;
      }

      localStorage.setItem('activeTabs', JSON.stringify(state.tabs));
      if (state.activeTabId) {
        localStorage.setItem('activeTabId', state.activeTabId);
      }
    },

    closeAllTabs: (state) => {
      state.tabs = [];
      state.activeTabId = null;
      localStorage.removeItem('activeTabs');
      localStorage.removeItem('activeTabId');
    },

    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTabId = action.payload;
      localStorage.setItem('activeTabId', action.payload);
    },

    closeOtherTabs: (state, action: PayloadAction<string>) => {
      const tabId = action.payload;
      const tab = state.tabs.find((t) => t.id === tabId);
      if (tab) {
        state.tabs = [tab];
        state.activeTabId = tabId;
      }
      localStorage.setItem('activeTabs', JSON.stringify(state.tabs));
      localStorage.setItem('activeTabId', tabId);
    },

    closeRightTabs: (state, action: PayloadAction<string>) => {
      const tabId = action.payload;
      const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
      if (tabIndex !== -1) {
        state.tabs = state.tabs.slice(0, tabIndex + 1);
      }
      state.activeTabId = tabId;
      localStorage.setItem('activeTabs', JSON.stringify(state.tabs));
      localStorage.setItem('activeTabId', tabId);
    },

    restoreTabs: (state, action: PayloadAction<{ tabs: Tab[]; activeTabId: string | null }>) => {
      state.tabs = action.payload.tabs;
      state.activeTabId = action.payload.activeTabId;
    },

    refreshTab: (state, action: PayloadAction<string>) => {
      const tabId = action.payload;
      const tab = state.tabs.find((t) => t.id === tabId);
      if (tab) {
        tab.refreshKey = (tab.refreshKey || 0) + 1;
      }
    }
  }
});

export const {
  openTab,
  closeTab,
  closeAllTabs,
  setActiveTab,
  closeOtherTabs,
  closeRightTabs,
  restoreTabs,
  refreshTab
} = tabsSlice.actions;

export default tabsSlice.reducer;

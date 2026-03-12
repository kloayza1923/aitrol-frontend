import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  } | null;
  token: string | null;
  sucursal: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  sucursal: null,
  isAuthenticated: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthState['user'];
        token: string;
        sucursal?: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.sucursal = action.payload.sucursal || null;
      state.isAuthenticated = true;

      // Sincronizar con localStorage
      localStorage.setItem('auth', JSON.stringify(action.payload));
      if (action.payload.sucursal) {
        localStorage.setItem('sucursal', action.payload.sucursal);
      }
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.sucursal = null;
      state.isAuthenticated = false;

      // Limpiar localStorage
      localStorage.removeItem('auth');
      localStorage.removeItem('sucursal');
    },
    setSucursal: (state, action: PayloadAction<string>) => {
      state.sucursal = action.payload;
      localStorage.setItem('sucursal', action.payload);
    }
  }
});

export const { setCredentials, clearCredentials, setSucursal } = authSlice.actions;

export default authSlice.reducer;

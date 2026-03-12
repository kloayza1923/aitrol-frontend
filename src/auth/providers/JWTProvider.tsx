import axios from 'axios';
// @ts-ignore
import { jwtDecode } from 'jwt-decode';
import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useEffect,
  useState
} from 'react';
import * as authHelper from '../_helpers';
import { type AuthModel, type UserModel } from '@/auth';
import { FetchData } from '@/utils/FetchData';
import { store, persistor } from '@/store';
import { apiSlice } from '@/store/api/apiSlice';
import { clearMenu } from '@/store/slices/menuSlice';
import { clearCredentials } from '@/store/slices/authSlice';
import { closeAllTabs } from '@/store/slices/tabsSlice';

const API_URL = import.meta.env.VITE_APP_API_URL;
export const LOGIN_URL = `${API_URL}/login`;

interface AuthContextProps {
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  auth: AuthModel | undefined;
  saveAuth: (auth: AuthModel | undefined) => void;
  currentUser: UserModel | undefined;
  setCurrentUser: Dispatch<SetStateAction<UserModel | undefined>>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  verify: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

const AuthProvider = ({ children }: PropsWithChildren) => {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<AuthModel | undefined>(authHelper.getAuth());
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>();
  const [verifying, setVerifying] = useState(false); // Evitar múltiples llamadas

  // Configurar axios con token
  useEffect(() => {
    if (auth?.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [auth]);

  // Guardar auth en localStorage
  const saveAuth = (auth: AuthModel | undefined) => {
    setAuth(auth);
    if (auth) {
      authHelper.setAuth(auth);
      localStorage.setItem('auth', JSON.stringify(auth));
    } else {
      authHelper.removeAuth();
      localStorage.removeItem('auth');
    }
  };

  // Decodificar token y verificar expiración
  const decodeToken = (token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded.exp && decoded.exp < now) return null;
      return decoded;
    } catch {
      return null;
    }
  };

  // Obtener info del usuario desde token
  const getUserFromToken = () => {
    if (!auth?.token) return null;
    const decoded = decodeToken(auth.token);
    if (!decoded) return null;
    return {
      id: decoded.id,
      nombre_usuario: decoded.sub
    };
  };

  // Login
  const login = async (email: string, password: string) => {
    try {
      const { data: auth } = await axios.post<AuthModel>(LOGIN_URL, { email, password });
      saveAuth(auth);
      // Obtener información completa del usuario y sus sucursales
      try {
        const userData = await FetchData('/user', 'GET');
        setCurrentUser(userData as any);
        // guardar sucursales en localStorage para evitar llamadas repetidas
        if (userData && (userData as any).sucursales) {
          localStorage.setItem('sucursales', JSON.stringify((userData as any).sucursales));
          // si no hay sucursal seleccionada, seleccionar la primera
          if (!localStorage.getItem('sucursal') && (userData as any).sucursales.length > 0) {
            const firstId = (userData as any).sucursales[0].id;
            localStorage.setItem('sucursal', String(firstId));
          }
        }
        return userData;
      } catch (err) {
        // fallback: set token-derived auth
        setCurrentUser(auth as any);
        return auth;
      }
    } catch (error) {
      saveAuth(undefined);
      throw new Error(`Error ${error}`);
    }
  };

  // Logout
  const logout = () => {
    saveAuth(undefined);
    setCurrentUser(undefined);

    // Limpiar caché de Redux y RTK Query
    store.dispatch(apiSlice.util.resetApiState());
    store.dispatch(clearMenu());
    store.dispatch(clearCredentials());
    store.dispatch(closeAllTabs());

    // Limpiar datos de sesión del localStorage
    localStorage.removeItem('menu_primary');
    localStorage.removeItem('menu_secondary');
    localStorage.removeItem('sucursal');
    localStorage.removeItem('punto_emision');
    localStorage.removeItem('sucursales');
    localStorage.removeItem('activeTabs');
    localStorage.removeItem('activeTabId');
    localStorage.removeItem('tabsLimitReached');

    // Purgar persistencia de Redux para evitar datos de usuario anterior
    persistor.purge();
  };

  // Verificar token y actualizar usuario
  const verify = async () => {
    if (verifying) return; // evitar llamadas concurrentes
    setVerifying(true);

    const tokenUser = getUserFromToken();
    if (tokenUser) {
      setCurrentUser(tokenUser);
      try {
        const data = await FetchData('/user', 'GET', null, {}, 30);
        setCurrentUser((prev) => ({ ...prev, ...data }));
      } catch {
        console.log('No se pudo obtener info del usuario');
      }
    } else {
      logout();
    }

    setVerifying(false);
    setLoading(false);
  };

  // ✅ Solo ejecutar verify() una vez al montar la app
  useEffect(() => {
    verify();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        loading,
        setLoading,
        auth,
        saveAuth,
        currentUser,
        setCurrentUser,
        login,
        logout,
        verify
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };

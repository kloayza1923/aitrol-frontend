import { useState, useCallback } from 'react';
import { useNotification } from './useNotification';
/* import { toast } from 'sileo'; */

interface UseDataGridCrudOptions {
  endpoint: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useDataGridCrud = ({ endpoint, onSuccess, onError }: UseDataGridCrudOptions) => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [params, setParams] = useState<Record<string, any>>({});
  const notification = useNotification();

  // Helper para construir query params (sin useCallback para evitar bucles)
  const buildQueryParams = (customParams: any = {}) => {
    const session = JSON.parse(localStorage.getItem('auth') || '{}');
    const sucursalId = localStorage.getItem('sucursal');

    return {
      page: page + 1,
      limit: pageSize,
      search,
      ...params,
      ...customParams,
      ...(sucursalId && { id_sucursal: Number(sucursalId) }),
      ...(session.id && { id_usuario: Number(session.id) })
    };
  };

  // Helper para preparar body
  const prepareBody = useCallback((data: any) => {
    if (!data) return {};

    const session = JSON.parse(localStorage.getItem('auth') || '{}');
    const sucursalId = localStorage.getItem('sucursal');

    if (data instanceof FormData) {
      if (sucursalId) {
        data.append('id_sucursal', String(sucursalId));
        data.append('sis_sucursal_id', String(sucursalId));
      }
      if (session.id) {
        data.append('id_usuario', String(session.id));
        data.append('usuario_crea', String(session.id));
        data.append('usuario_actualiza', String(session.id));
      }
      return data;
    }

    return {
      ...data,
      ...(sucursalId && { id_sucursal: Number(sucursalId) }),
      ...(session.id && { id_usuario: Number(session.id) })
    };
  }, []);

  // Función fetch personalizada
  const apiCall = async (url: string, options: any = {}) => {
    const baseURL = import.meta.env.VITE_APP_API_URL || 'http://localhost:3000';
    const session = JSON.parse(localStorage.getItem('auth') || '{}');

    const defaultHeaders: any = {
      'Content-Type': 'application/json',
      ...(session.token && { Authorization: `Bearer ${session.token}` }),
      ...(session.id && { 'X-User': String(session.id) })
    };

    const response = await fetch(`${baseURL}/${url}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Cargar datos
  const loadData = async (customPage?: number, customPageSize?: number) => {
    setLoading(true);
    try {
      const currentPage = customPage !== undefined ? customPage : page;
      const currentPageSize = customPageSize !== undefined ? customPageSize : pageSize;

      const session = JSON.parse(localStorage.getItem('auth') || '{}');
      const sucursalId = localStorage.getItem('sucursal');

      const queryParams = {
        page: currentPage + 1,
        limit: currentPageSize,
        search,
        ...params,
        ...(sucursalId && { id_sucursal: Number(sucursalId) }),
        ...(session.id && { id_usuario: Number(session.id) })
      };

      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });

      const data = await apiCall(`${endpoint}?${searchParams.toString()}`);

      const rowsData = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const total = data?.total || data?.count || rowsData.length;

      setRows(rowsData);
      setTotalRows(total);
    } catch (error) {
      console.error('Error loading data:', error);
      notification.error(
        'Error cargando datos',
        error instanceof Error ? error.message : undefined
      );
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar detalle
  const loadDetail = async (id: number) => {
    try {
      const result = await apiCall(`${endpoint}/${id}`);
      return result;
    } catch (error) {
      console.error('Error loading detail:', error);
      notification.error(
        'Error cargando detalle',
        error instanceof Error ? error.message : undefined
      );
      throw error;
    }
  };

  // Crear
  const create = async (data: any) => {
    try {
      const body = prepareBody(data);
      const options: any = {
        method: 'POST',
        body: body instanceof FormData ? body : JSON.stringify(body)
      };

      if (body instanceof FormData) {
        options.headers = {}; // Let browser set Content-Type with boundary
      }

      const result = await apiCall(endpoint, options);

      if (result.mensaje || result.message) {
        notification.success('Registro creado', result.mensaje || result.message);
        onSuccess?.();
        await loadData();
        return result;
      } else {
        throw new Error(result.detail || 'Error creando registro');
      }
    } catch (error: any) {
      console.error('Error creating:', error);
      const message = error.message || 'Error creando registro';
      notification.error(message);
      onError?.(error);
      throw error;
    }
  };

  // Actualizar
  const update = async (id: number, data: any) => {
    try {
      const body = prepareBody(data);
      const options: any = {
        method: 'PUT',
        body: body instanceof FormData ? body : JSON.stringify(body)
      };

      if (body instanceof FormData) {
        options.headers = {};
      }

      const result = await apiCall(`${endpoint}/${id}`, options);

      if (result.mensaje || result.message) {
        notification.success('Registro actualizado', result.mensaje || result.message);
        onSuccess?.();
        await loadData();
        return result;
      } else {
        throw new Error(result.detail || 'Error actualizando registro');
      }
    } catch (error: any) {
      console.error('Error updating:', error);
      const message = error.message || 'Error actualizando registro';
      notification.error('Error actualizando registro', message);
      onError?.(error);
      throw error;
    }
  };

  // Eliminar
  const remove = async (id: number) => {
    try {
      const result = await apiCall(`${endpoint}/${id}`, { method: 'DELETE' });

      if (result.mensaje || result.message) {
        notification.success('Registro eliminado');
        onSuccess?.();
        await loadData();
        return result;
      } else {
        throw new Error(result.detail || 'Error eliminando registro');
      }
    } catch (error: any) {
      console.error('Error deleting:', error);
      const message = error.message || 'Error eliminando registro';
      notification.error('Error eliminando registro', message);
      onError?.(error);
      throw error;
    }
  };

  return {
    // Data
    rows,
    totalRows,

    // Loading states
    loading,

    // Pagination
    page,
    pageSize,
    setPage,
    setPageSize,

    // Search & filters
    search,
    setSearch,
    params,
    setParams,

    // Operations
    loadData,
    loadDetail,
    create,
    update,
    remove,

    // Utils
    buildQueryParams,
    prepareBody
  };
};

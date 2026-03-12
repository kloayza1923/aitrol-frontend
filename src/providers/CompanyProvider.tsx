import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FetchData } from '@/utils/FetchData';

interface Company {
  id_empresa?: number;
  ruc?: string;
  razon_social?: string;
  nombre_comercial?: string | null;
  direccion_matriz?: string | null;
  contribuyente_especial?: string | null;
  obligado_contabilidad?: boolean;
  logo?: string | null;
  firma?: string | null;
  clave_firma?: string | null;
  favicon?: string | null;
}

interface CompanyContextProps {
  company: Company | null;
  loading: boolean;
  error: string | null;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextProps | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany debe ser usado dentro de CompanyProvider');
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await FetchData('sis/empresa', 'GET');

      if (Array.isArray(data) && data.length > 0) {
        setCompany(data[0]);
      } else if (data && !Array.isArray(data)) {
        setCompany(data);
      } else {
        setError('No se encontró información de la empresa');
      }
    } catch (err: any) {
      console.error('Error al cargar empresa:', err);
      setError(err.message || 'Error al cargar la empresa');
      // Set default company with static logo as fallback
      setCompany({
        logo: '/media/app/logo.jpg',
        razon_social: 'Horizon ERP'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const refreshCompany = async () => {
    await fetchCompany();
  };

  const value: CompanyContextProps = {
    company,
    loading,
    error,
    refreshCompany
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
};

import React, { useEffect, useState } from 'react';
import { FetchData } from '@/utils/FetchData';
import { useErrorHandler, useAsyncError } from '@/hooks/useErrorHandler';

interface ExampleComponentProps {
  endpoint?: string;
}

const ExampleComponent: React.FC<ExampleComponentProps> = ({ endpoint = 'example' }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { handleApiError } = useErrorHandler();
  const { executeAsync } = useAsyncError();

  // Método 1: Usando try/catch tradicional con handleApiError
  const fetchDataTraditional = async () => {
    setLoading(true);
    try {
      const response = await FetchData(endpoint, 'GET');
      setData(response);
    } catch (error) {
      // Manejo de error que muestra toast y registra el error
      handleApiError(error, endpoint);
    } finally {
      setLoading(false);
    }
  };

  // Método 2: Usando el hook useAsyncError (más limpio)
  const fetchDataWithHook = async () => {
    setLoading(true);
    const response = await executeAsync(
      () => FetchData(endpoint, 'GET'),
      `Cargando datos de ${endpoint}`,
      {
        fallbackMessage: 'No se pudieron cargar los datos',
        showToast: true
      }
    );

    if (response) {
      setData(response);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDataWithHook();
  }, [endpoint]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <h3>Componente con Manejo de Errores Mejorado</h3>
      <button onClick={fetchDataTraditional}>Cargar con try/catch tradicional</button>
      <button onClick={fetchDataWithHook} className="ml-2">
        Cargar con hook de errores
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};

export default ExampleComponent;

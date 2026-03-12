import { useEffect, useRef, useState } from 'react';

interface RouteConfig {
  path: string;
  title: string;
  icon?: string;
  parent_path?: string;
}

/**
 * Hook para sincronizar rutas del frontend con la BD
 * Se ejecuta una sola vez cuando la aplicación inicia
 *
 * Uso:
 * const { synced, loading, error } = useSyncRoutes(routes);
 */
export const useSyncRoutes = (routes: RouteConfig[]) => {
  const synced = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ejecutar sincronización solo una vez
    if (synced.current || routes.length === 0) {
      return;
    }

    const syncRoutesWithDB = async () => {
      try {
        setLoading(true);
        synced.current = true;

        const response = await fetch('/menu/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ routes })
        });

        if (!response.ok) {
          throw new Error(`Error sincronizando rutas: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Rutas sincronizadas:', data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        console.error('❌ Error sincronizando rutas:', message);
        synced.current = false; // Permitir reintentos
      } finally {
        setLoading(false);
      }
    };

    syncRoutesWithDB();
  }, [routes]);

  return { synced: synced.current, loading, error };
};

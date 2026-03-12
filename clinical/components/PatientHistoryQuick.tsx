'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useConsultaStore } from '@/store/consultaStore';

type HistorialResponse = {
  id: number;
  fecha_hora?: string;
  tipo_encuentro?: string;
  diagnostico_principal?: string;
  resumen?: string;
  motivo_consulta?: string;
};

export default function PatientHistoryQuick() {
  const { paciente, setHistorial } = useConsultaStore();

  const { data: historialData, isLoading } = useQuery({
    queryKey: ['paciente-historial', paciente?.id],
    queryFn: async () => {
      if (!paciente?.id) return [];
      const response = await api.get(`/salud/encuentros`, {
        params: { paciente_id: paciente.id, limit: 5 },
      });
      const items = (response.data?.items || response.data || []) as HistorialResponse[];
      setHistorial(
        items.map((item) => ({
          id: item.id,
          fecha: item.fecha_hora || '',
          tipo: item.tipo_encuentro || 'CONSULTA',
          diagnosticoPrincipal: item.diagnostico_principal,
          resumen: item.resumen || item.motivo_consulta,
        }))
      );
      return items;
    },
    enabled: Boolean(paciente?.id),
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const historial = historialData || [];

  return (
    <div className="rounded-2xl border border-white/10 bg-panel shadow-panel animate-rise">
      <div className="px-5 pt-5 pb-3 border-b border-white/10">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted">Historial</div>
        <h3 className="text-lg font-semibold">Ultimas consultas</h3>
      </div>

      <div className="p-5">
        {!paciente && (
          <div className="text-center py-4 text-sm text-muted">
            Seleccione un paciente
          </div>
        )}

        {paciente && isLoading && (
          <div className="text-center py-4 text-sm text-muted">
            Cargando historial...
          </div>
        )}

        {paciente && !isLoading && historial.length === 0 && (
          <div className="text-center py-4">
            <svg className="w-8 h-8 mx-auto text-muted/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-muted">Sin historial previo</p>
          </div>
        )}

        {historial.length > 0 && (
          <div className="space-y-3">
            {historial.map((item, index) => (
              <div
                key={item.id}
                className="relative pl-4 border-l-2 border-white/10 hover:border-accent/50 transition-colors"
              >
                <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-panel border-2 border-white/20"></div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-ink-contrast">
                      {formatDate(item.fecha_hora)}
                    </div>
                    <div className="text-[10px] text-muted uppercase">
                      {item.tipo_encuentro || 'Consulta'}
                    </div>
                    {item.diagnostico_principal && (
                      <div className="text-xs text-accent mt-1 truncate">
                        {item.diagnostico_principal}
                      </div>
                    )}
                    {item.motivo_consulta && !item.diagnostico_principal && (
                      <div className="text-xs text-muted mt-1 truncate">
                        {item.motivo_consulta}
                      </div>
                    )}
                  </div>
                  {index === 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-accent/20 text-accent shrink-0">
                      Ultima
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PacienteSidebar } from '@/types/health';

/** Normaliza alergias / antecedentes a un array de strings legibles. */
function normalizeList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)));
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => `${k}: ${v}`
    );
  }
  if (typeof value === 'string') return [value];
  return [];
}

export default function ClinicalSidebar({ pacienteId }: { pacienteId: number | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: async () => {
      if (!pacienteId) return null;
      const response = await api.get(`/health/paciente/${pacienteId}`);
      return response.data as PacienteSidebar;
    },
    enabled: Boolean(pacienteId)
  });

  const alergias = normalizeList(data?.alergias);
  const antecedentes = normalizeList(data?.antecedentes);

  return (
    <div className="rounded-2xl border border-white/10 bg-panel shadow-panel sticky top-6">
      <div className="px-6 pt-6 pb-2">
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted">Paciente</div>
        <h2 className="text-xl">{data?.persona?.nombre_completo || 'Seleccione paciente'}</h2>
      </div>
      <div className="px-6 pb-6 grid gap-4">
        {isLoading && <div className="text-xs text-muted">Cargando...</div>}
        {!isLoading && data && (
          <>
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted">
                Identificacion
              </div>
              <div className="text-sm">{data.persona?.identificacion || '-'}</div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted">Alergias</div>
              {alergias.length === 0 ? (
                <div className="text-xs text-muted">Sin datos</div>
              ) : (
                <ul className="mt-1 grid gap-0.5">
                  {alergias.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-danger">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted">Antecedentes</div>
              {antecedentes.length === 0 ? (
                <div className="text-xs text-muted">Sin datos</div>
              ) : (
                <ul className="mt-1 grid gap-0.5">
                  {antecedentes.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-muted shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

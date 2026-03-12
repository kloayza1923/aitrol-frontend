'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SignoVitalItem } from '@/types/health';

export default function BiometriaFloating({ pacienteId }: { pacienteId: number | null }) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('TA');
  const [valor, setValor] = useState('');
  const [unidad, setUnidad] = useState('');

  const { data } = useQuery({
    queryKey: ['signos', pacienteId],
    queryFn: async () => {
      if (!pacienteId) return [];
      const response = await api.get('/health/signos-vitales', {
        params: { paciente_id: pacienteId, limit: 20 }
      });
      return response.data.items as SignoVitalItem[];
    },
    enabled: Boolean(pacienteId)
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!pacienteId) return null;
      const response = await api.post('/health/signos-vitales', {
        paciente_id: pacienteId,
        nombre,
        valor,
        unidad
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signos', pacienteId] });
      setValor('');
    }
  });

  const chartPoints = useMemo(() => {
    if (!data || data.length === 0) return '';
    const values = data.map((item) => Number(item.valor)).filter((val) => !Number.isNaN(val));
    if (values.length === 0) return '';
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    return values
      .map((val, index) => {
        const x = (index / (values.length - 1 || 1)) * 280 + 10;
        const y = 70 - ((val - min) / (max - min || 1)) * 60;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data]);

  return (
    <div className="static mt-5 z-20 w-full rounded-2xl border border-white/10 bg-panel p-4 shadow-panel lg:fixed lg:right-6 lg:bottom-6 lg:mt-0 lg:w-[320px] lg:animate-rise">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted">Biometria</div>
          <strong className="text-sm">Tendencias vitales</strong>
        </div>
      </div>
      <svg className="w-full h-20" viewBox="0 0 300 80">
        <polyline points={chartPoints} fill="none" stroke="#4be3b6" strokeWidth="2" />
      </svg>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted">Nombre</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast focus:border-white/30 focus:outline-none"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted">Valor</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast focus:border-white/30 focus:outline-none"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-muted">Unidad</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast focus:border-white/30 focus:outline-none"
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
          />
        </div>
      </div>
      <button
        className="mt-3 w-full rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-[#041b14]"
        onClick={() => mutation.mutate()}
      >
        Guardar
      </button>
    </div>
  );
}

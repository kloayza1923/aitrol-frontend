'use client';

import { useConsultaStore, SignosVitales } from '@/store/consultaStore';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type VitalConfig = {
  key: keyof SignosVitales;
  label: string;
  unit: string;
  min?: number;
  max?: number;
  warningMin?: number;
  warningMax?: number;
  placeholder?: string;
};

const vitalsConfig: VitalConfig[] = [
  { key: 'temperatura',            label: 'Temp',     unit: '°C',   min: 35, max: 42,  warningMin: 36, warningMax: 37.5, placeholder: '36.5' },
  { key: 'presionSistolica',       label: 'PAS',      unit: 'mmHg', min: 60, max: 250, warningMin: 90, warningMax: 140,  placeholder: '120'  },
  { key: 'presionDiastolica',      label: 'PAD',      unit: 'mmHg', min: 40, max: 150, warningMin: 60, warningMax: 90,   placeholder: '80'   },
  { key: 'frecuenciaCardiaca',     label: 'FC',       unit: 'lpm',  min: 30, max: 220, warningMin: 60, warningMax: 100,  placeholder: '72'   },
  { key: 'frecuenciaRespiratoria', label: 'FR',       unit: 'rpm',  min: 8,  max: 40,  warningMin: 12, warningMax: 20,   placeholder: '16'   },
  { key: 'saturacionOxigeno',      label: 'SpO2',     unit: '%',    min: 70, max: 100, warningMin: 95, warningMax: 100,  placeholder: '98'   },
  { key: 'peso',                   label: 'Peso',     unit: 'kg',   min: 1,  max: 300, placeholder: '70'  },
  { key: 'talla',                  label: 'Talla',    unit: 'cm',   min: 30, max: 250, placeholder: '170' },
  { key: 'glicemia',               label: 'Glicemia', unit: 'mg/dL',min: 20, max: 600, warningMin: 70, warningMax: 100, placeholder: '90' },
];

type TriajeResponse = {
  id: number;
  paciente_id: number;
  fecha_hora?: string | null;
  temperatura?: number | null;
  presion_sistolica?: number | null;
  presion_diastolica?: number | null;
  frecuencia_cardiaca?: number | null;
  frecuencia_respiratoria?: number | null;
  saturacion_oxigeno?: number | null;
  peso?: number | null;
  talla?: number | null;
  glicemia?: number | null;
  nivel_dolor?: number | null;
  clasificacion?: string | null;
  observaciones?: string | null;
};

const CLASIFICACION_COLORS: Record<string, string> = {
  ROJO:    'border-red-500/40 bg-red-500/15 text-red-400',
  NARANJA: 'border-orange-500/40 bg-orange-500/15 text-orange-400',
  AMARILLO:'border-yellow-500/40 bg-yellow-500/15 text-yellow-300',
  VERDE:   'border-emerald-500/40 bg-emerald-500/15 text-emerald-400',
  AZUL:    'border-blue-500/40 bg-blue-500/15 text-blue-400',
};

function getVitalStatus(value: string, config: VitalConfig): 'normal' | 'warning' | 'danger' | 'empty' {
  if (!value || value.trim() === '') return 'empty';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 'empty';
  if (config.min !== undefined && numValue < config.min) return 'danger';
  if (config.max !== undefined && numValue > config.max) return 'danger';
  if (config.warningMin !== undefined && config.warningMax !== undefined) {
    if (numValue < config.warningMin || numValue > config.warningMax) return 'warning';
  }
  return 'normal';
}

function getStatusStyles(status: 'normal' | 'warning' | 'danger' | 'empty') {
  switch (status) {
    case 'normal':  return 'border-accent/30 bg-accent/5';
    case 'warning': return 'border-amber-500/30 bg-amber-500/5';
    case 'danger':  return 'border-danger/30 bg-danger/5';
    default:        return 'border-white/10 bg-ink-2';
  }
}

function getIndicatorColor(status: 'normal' | 'warning' | 'danger' | 'empty') {
  switch (status) {
    case 'normal':  return 'bg-accent';
    case 'warning': return 'bg-amber-500';
    case 'danger':  return 'bg-danger';
    default:        return 'bg-transparent';
  }
}

function toStr(val: number | null | undefined): string {
  if (val === null || val === undefined) return '';
  return String(val);
}

function formatFechaHora(fechaHora?: string | null): string {
  if (!fechaHora) return '';
  try {
    return new Date(fechaHora).toLocaleString('es-EC', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return fechaHora;
  }
}

export default function VitalsPanel() {
  const { paciente, cita, signosVitales, setSignoVital, setSignosVitales } = useConsultaStore();
  const [loadedTriajeId, setLoadedTriajeId] = useState<number | null>(null);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  // Track which patient we last loaded triaje for to avoid re-populating on re-renders
  const lastLoadedPatientRef = useRef<number | null>(null);

  // Fetch the most recent triaje for the current patient
  const { data: triajeData, isLoading: triajeLoading } = useQuery({
    queryKey: ['triaje-paciente', paciente?.id, cita?.id],
    queryFn: async () => {
      if (!paciente?.id) return null;
      const response = await api.get('/salud/triajes', {
        params: {
          paciente_id: paciente.id,
          limit: 1,
          // Prefer triaje linked to the current appointment when available
          ...(cita?.id ? { cita_id: cita.id } : {})
        }
      });
      const items: TriajeResponse[] = response.data?.items || response.data || [];
      return items[0] ?? null;
    },
    enabled: Boolean(paciente?.id),
    staleTime: 30_000
  });

  // Populate signosVitales from triaje when data arrives or patient changes
  useEffect(() => {
    if (!triajeData) return;
    // Already loaded this exact triaje record — don't overwrite manual edits
    if (loadedTriajeId === triajeData.id && lastLoadedPatientRef.current === paciente?.id) return;

    lastLoadedPatientRef.current = paciente?.id ?? null;
    setLoadedTriajeId(triajeData.id);
    setLoadedAt(triajeData.fecha_hora ?? null);

    setSignosVitales({
      temperatura:             toStr(triajeData.temperatura),
      presionSistolica:        toStr(triajeData.presion_sistolica),
      presionDiastolica:       toStr(triajeData.presion_diastolica),
      frecuenciaCardiaca:      toStr(triajeData.frecuencia_cardiaca),
      frecuenciaRespiratoria:  toStr(triajeData.frecuencia_respiratoria),
      saturacionOxigeno:       toStr(triajeData.saturacion_oxigeno),
      peso:                    toStr(triajeData.peso),
      talla:                   toStr(triajeData.talla),
      glicemia:                toStr(triajeData.glicemia),
    });
  }, [triajeData, paciente?.id, loadedTriajeId, setSignosVitales]);

  // Reset tracking when patient changes so next patient loads cleanly
  useEffect(() => {
    if (paciente?.id !== lastLoadedPatientRef.current) {
      setLoadedTriajeId(null);
      setLoadedAt(null);
    }
  }, [paciente?.id]);

  // Auto-calculate IMC when peso or talla change
  useEffect(() => {
    const peso = parseFloat(signosVitales.peso);
    const tallaCm = parseFloat(signosVitales.talla);
    if (!isNaN(peso) && !isNaN(tallaCm) && tallaCm > 0) {
      const tallaM = tallaCm / 100;
      const imc = (peso / (tallaM * tallaM)).toFixed(1);
      if (signosVitales.imc !== imc) {
        setSignosVitales({ imc });
      }
    }
  }, [signosVitales.peso, signosVitales.talla, signosVitales.imc, setSignosVitales]);

  const getImcCategory = (imc: string) => {
    const value = parseFloat(imc);
    if (isNaN(value)) return { label: '', color: '' };
    if (value < 18.5) return { label: 'Bajo peso', color: 'text-amber-400' };
    if (value < 25)   return { label: 'Normal',    color: 'text-accent'    };
    if (value < 30)   return { label: 'Sobrepeso', color: 'text-amber-400' };
    return              { label: 'Obesidad',  color: 'text-danger'    };
  };

  const imcCategory = getImcCategory(signosVitales.imc);
  const nivelDolor  = triajeData?.nivel_dolor  ?? null;
  const clasificacion = triajeData?.clasificacion ?? null;

  const getDolorColor = (nivel: number) => {
    if (nivel <= 3) return 'text-accent';
    if (nivel <= 6) return 'text-amber-400';
    return 'text-danger';
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-panel shadow-panel animate-rise">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted">Biometria</div>
            <h3 className="text-lg font-semibold">Signos vitales</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-[10px] text-muted">Normal</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 ml-2" />
            <span className="text-[10px] text-muted">Alerta</span>
            <span className="w-2 h-2 rounded-full bg-danger ml-2" />
            <span className="text-[10px] text-muted">Crítico</span>
          </div>
        </div>

        {/* Triaje source indicator */}
        {triajeLoading && paciente?.id && (
          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
            <div className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            Cargando signos del triaje…
          </div>
        )}
        {!triajeLoading && loadedTriajeId && loadedAt && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-accent">
            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Cargado del triaje · {formatFechaHora(loadedAt)}
          </div>
        )}
        {!triajeLoading && paciente?.id && !loadedTriajeId && (
          <div className="mt-2 text-[10px] text-muted">
            Sin triaje registrado — ingrese los valores manualmente
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Vital signs grid */}
        <div className="grid grid-cols-3 gap-3">
          {vitalsConfig.map((config) => {
            const value = signosVitales[config.key];
            const status = getVitalStatus(value, config);
            return (
              <div key={config.key} className="relative">
                <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">
                  {config.label}
                </label>
                <div className={`relative rounded-lg border transition-colors ${getStatusStyles(status)}`}>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full bg-transparent px-3 py-2 text-sm text-ink-contrast focus:outline-none"
                    placeholder={config.placeholder}
                    value={value}
                    onChange={(e) => setSignoVital(config.key, e.target.value)}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted">
                    {config.unit}
                  </span>
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${getIndicatorColor(status)}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* IMC */}
        {signosVitales.imc && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wide text-muted">IMC calculado</span>
                <div className="text-lg font-semibold text-ink-contrast">{signosVitales.imc}</div>
              </div>
              {imcCategory.label && (
                <span className={`text-sm font-medium ${imcCategory.color}`}>{imcCategory.label}</span>
              )}
            </div>
          </div>
        )}

        {/* Dolor + Clasificación de triaje (read-only, from triaje record) */}
        {(nivelDolor !== null || clasificacion) && (
          <div className="mt-4 pt-4 border-t border-white/10 grid gap-3">
            {nivelDolor !== null && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted mb-1">Dolor EVA</div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-semibold ${getDolorColor(nivelDolor)}`}>
                    {nivelDolor}/10
                  </span>
                  <div className="flex gap-0.5 flex-1">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-3 rounded-sm ${
                          i < nivelDolor
                            ? nivelDolor <= 3 ? 'bg-accent' : nivelDolor <= 6 ? 'bg-amber-500' : 'bg-danger'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {clasificacion && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wide text-muted">Clasificación</span>
                <span className={`rounded-lg border px-3 py-0.5 text-xs font-bold ${CLASIFICACION_COLORS[clasificacion] ?? 'border-white/20 text-muted'}`}>
                  {clasificacion}
                </span>
                {triajeData?.observaciones && (
                  <span
                    className="text-[10px] text-muted truncate max-w-[140px]"
                    title={triajeData.observaciones}
                  >
                    {triajeData.observaciones}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

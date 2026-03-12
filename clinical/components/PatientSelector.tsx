'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useConsultaStore, PacienteInfo, CitaInfo } from '@/store/consultaStore';

type CitaConPaciente = {
  id: number;
  paciente_id: number;
  personal_id: number;
  fecha_hora: string;
  motivo?: string | null;
  tipo?: string | null;
  estado: string;
  duracion_minutos?: number | null;
  sala_id?: number | null;
  paciente?: {
    id: number;
    nombre_completo: string;
    codigo_paciente?: string | null;
  } | null;
  doctor?: {
    id: number;
    nombre_completo: string;
    especialidad?: string | null;
    codigo_personal?: string | null;
  } | null;
};

type PacienteSearchResult = {
  id: number;
  codigo_paciente?: string | null;
  tipo_sangre?: string | null;
  alergias?: string[] | null;
  antecedentes?: Record<string, string> | null;
  persona?: {
    nombre_completo?: string | null;
    identificacion?: string | null;
    sexo?: string | null;
    fecha_nacimiento?: string | null;
    telefono_movil?: string | null;
    email?: string | null;
  } | null;
};

type TabMode = 'citas' | 'busqueda';

export default function PatientSelector() {
  const { showPatientSelector, setShowPatientSelector, setPaciente, setCita } = useConsultaStore();
  const [mode, setMode] = useState<TabMode>('citas');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: citasData, isLoading: citasLoading } = useQuery({
    queryKey: ['citas-hoy'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get('/salud/citas', {
        params: { fecha: today, estado: 'PENDIENTE,EN_ESPERA,CONFIRMADA' }
      });
      return response.data?.items || response.data || [];
    },
    enabled: showPatientSelector && mode === 'citas'
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['pacientes-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const response = await api.get('/salud/pacientes', {
        params: { search: debouncedQuery, limit: 10 }
      });
      return response.data?.items || response.data || [];
    },
    enabled: showPatientSelector && mode === 'busqueda' && debouncedQuery.length >= 2
  });

  const handleSelectCita = useCallback(
    (cita: CitaConPaciente) => {
      if (!cita.paciente) return;

      const pacienteInfo: PacienteInfo = {
        id: cita.paciente.id,
        codigoPaciente: cita.paciente.codigo_paciente,
        nombreCompleto: cita.paciente.nombre_completo
      };

      const citaInfo: CitaInfo = {
        id: cita.id,
        fechaHora: cita.fecha_hora,
        motivo: cita.motivo,
        tipo: cita.tipo,
        estado: cita.estado,
        duracionMinutos: cita.duracion_minutos,
        doctor: cita.doctor
          ? {
              id: cita.doctor.id,
              nombreCompleto: cita.doctor.nombre_completo,
              especialidad: cita.doctor.especialidad
            }
          : undefined
      };

      setPaciente(pacienteInfo);
      setCita(citaInfo);
      setShowPatientSelector(false);
    },
    [setPaciente, setCita, setShowPatientSelector]
  );

  const handleSelectPaciente = useCallback(
    (paciente: PacienteSearchResult) => {
      const pacienteInfo: PacienteInfo = {
        id: paciente.id,
        codigoPaciente: paciente.codigo_paciente,
        nombreCompleto: paciente.persona?.nombre_completo || 'Sin nombre',
        tipoSangre: paciente.tipo_sangre,
        alergias: paciente.alergias,
        antecedentes: paciente.antecedentes,
        identificacion: paciente.persona?.identificacion,
        sexo: paciente.persona?.sexo,
        fechaNacimiento: paciente.persona?.fecha_nacimiento,
        telefono: paciente.persona?.telefono_movil,
        email: paciente.persona?.email
      };

      setPaciente(pacienteInfo);
      setCita(null);
      setShowPatientSelector(false);
    },
    [setPaciente, setCita, setShowPatientSelector]
  );

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--:--';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'CONFIRMADA':
        return 'bg-accent/20 text-accent';
      case 'EN_ESPERA':
        return 'bg-amber-500/20 text-amber-400';
      case 'PENDIENTE':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-white/10 text-muted';
    }
  };

  if (!showPatientSelector) return null;

  const citas = (citasData as CitaConPaciente[]) || [];
  const pacientes = (searchResults as PacienteSearchResult[]) || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => setShowPatientSelector(false)}
    >
      <div
        className="w-[min(680px,94vw)] max-h-[85vh] rounded-2xl border border-white/10 bg-panel shadow-panelLg overflow-hidden animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted">Iniciar consulta</div>
          <h2 className="text-2xl">Seleccionar paciente</h2>
        </div>

        <div className="flex border-b border-white/10">
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              mode === 'citas'
                ? 'text-accent border-b-2 border-accent bg-white/5'
                : 'text-muted hover:text-ink-contrast'
            }`}
            onClick={() => setMode('citas')}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Citas del dia
            </span>
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              mode === 'busqueda'
                ? 'text-accent border-b-2 border-accent bg-white/5'
                : 'text-muted hover:text-ink-contrast'
            }`}
            onClick={() => setMode('busqueda')}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Buscar paciente
            </span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {mode === 'busqueda' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre o cedula..."
                className="w-full rounded-xl border border-white/10 bg-ink-2 px-4 py-3 text-sm text-ink-contrast placeholder:text-muted focus:border-accent/50 focus:outline-none transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {mode === 'citas' && (
            <>
              {citasLoading && <div className="text-center py-8 text-muted">Cargando citas...</div>}
              {!citasLoading && citas.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-muted mb-2">No hay citas pendientes para hoy</div>
                  <button
                    className="text-accent text-sm hover:underline"
                    onClick={() => setMode('busqueda')}
                  >
                    Buscar paciente manualmente
                  </button>
                </div>
              )}
              <div className="grid gap-3">
                {citas.map((cita) => (
                  <button
                    key={cita.id}
                    className="w-full text-left rounded-xl border border-white/10 bg-ink-2 p-4 hover:border-accent/30 hover:bg-white/5 transition-all group"
                    onClick={() => handleSelectCita(cita)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-ink-contrast truncate">
                            {cita.paciente?.nombre_completo || 'Sin nombre'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getEstadoColor(cita.estado)}`}
                          >
                            {cita.estado}
                          </span>
                        </div>
                        <div className="text-xs text-muted">
                          {cita.paciente?.codigo_paciente || `#${cita.paciente?.id}`}
                        </div>
                        {cita.motivo && (
                          <div className="text-xs text-muted mt-1 truncate">
                            Motivo: {cita.motivo}
                          </div>
                        )}
                        {cita.doctor && (
                          <div className="text-xs text-muted mt-1">
                            Dr. {cita.doctor.nombre_completo} • {cita.doctor.especialidad}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-semibold text-accent">
                          {formatTime(cita.fecha_hora)}
                        </div>
                        <div className="text-[10px] text-muted uppercase">
                          {cita.tipo || 'Consulta'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="text-[10px] text-muted">Cita #{cita.id}</div>
                      <span className="text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                        Seleccionar →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {mode === 'busqueda' && (
            <>
              {searchLoading && debouncedQuery.length >= 2 && (
                <div className="text-center py-8 text-muted">Buscando...</div>
              )}
              {!searchLoading && debouncedQuery.length >= 2 && pacientes.length === 0 && (
                <div className="text-center py-8 text-muted">No se encontraron pacientes</div>
              )}
              {debouncedQuery.length < 2 && (
                <div className="text-center py-8 text-muted">
                  Ingrese al menos 2 caracteres para buscar
                </div>
              )}
              <div className="grid gap-3">
                {pacientes.map((paciente) => (
                  <button
                    key={paciente.id}
                    className="w-full text-left rounded-xl border border-white/10 bg-ink-2 p-4 hover:border-accent/30 hover:bg-white/5 transition-all group"
                    onClick={() => handleSelectPaciente(paciente)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink-contrast truncate mb-1">
                          {paciente.persona?.nombre_completo || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-muted">
                          {paciente.persona?.identificacion || 'Sin cedula'}
                        </div>
                        {paciente.tipo_sangre && (
                          <div className="text-xs text-muted mt-1">
                            Tipo de sangre: {paciente.tipo_sangre}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-muted">
                          #{paciente.codigo_paciente || paciente.id}
                        </div>
                        <span className="text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity mt-2 inline-block">
                          Seleccionar →
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex justify-end">
          <button
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-ink-contrast hover:bg-white/5 transition-colors"
            onClick={() => setShowPatientSelector(false)}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

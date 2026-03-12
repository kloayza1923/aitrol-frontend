'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import LoginPanel from '@/components/LoginPanel';
import AppHeader from '@/components/AppHeader';
import PatientSelector from '@/components/PatientSelector';
import { useAuth } from '@/components/AuthProvider';
import { useConsultaStore } from '@/store/consultaStore';
import { api } from '@/lib/api';
import {
  LOCALE_DEFAULT,
  DURACION_CITA_DEFAULT,
  HORA_INICIO_AGENDA,
  SLOTS_AGENDA,
  APP_NAME,
} from '@/lib/constants';

type CitaResumen = {
  id: number;
  fecha_hora: string;
  duracion_minutos?: number | null;
  motivo?: string | null;
  tipo?: string | null;
  estado: string;
  paciente?: {
    id: number;
    nombre_completo: string;
    codigo_paciente?: string | null;
  } | null;
};

const estadoColor = (estado: string) => {
  switch (estado.toUpperCase()) {
    case 'CONFIRMADA':
      return 'bg-accent/20 text-accent';
    case 'EN_ESPERA':
      return 'bg-amber-500/20 text-amber-400';
    case 'PENDIENTE':
      return 'bg-blue-500/20 text-blue-400';
    case 'REALIZADA':
      return 'bg-emerald-500/20 text-emerald-400';
    default:
      return 'bg-white/10 text-muted';
  }
};

export default function HomePage() {
  const { token, userName } = useAuth();
  const { setShowPatientSelector } = useConsultaStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const { data: citasData, isLoading: citasLoading } = useQuery({
    queryKey: ['dashboard-citas-hoy'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get('/salud/citas', {
        params: { fecha: today }
      });
      return (response.data?.items || response.data || []) as CitaResumen[];
    },
    enabled: Boolean(token)
  });

  const {
    citas,
    proximasCitas,
    resumen,
    proximaCita,
    fechaHoy,
    semanaDias,
    citasPorDia,
    horarioEstimado,
    totalMinutos
  } = useMemo(() => {
    const citasList = (citasData || []).slice().sort((a, b) => {
      return new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime();
    });

    const ahora = Date.now();
    const proximas = citasList.filter((cita) => {
      return new Date(cita.fecha_hora).getTime() >= ahora;
    });

    const countByEstado = (estado: string) =>
      citasList.filter((cita) => cita.estado?.toUpperCase() === estado).length;

    const today = new Date();
    const todayLabel = today.toLocaleDateString(LOCALE_DEFAULT, {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });

    const dayIndex = (today.getDay() + 6) % 7;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayIndex);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDays = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date;
    });

    const sameDay = (left: Date, right: Date) =>
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate();

    const citasByDay = weekDays.map((day) =>
      citasList.filter((cita) => sameDay(new Date(cita.fecha_hora), day))
    );

    const totalMinutes = citasList.reduce((acc, cita) => {
      const value = cita.duracion_minutos ?? DURACION_CITA_DEFAULT;
      return acc + value;
    }, 0);

    const firstCita = citasList[0];
    const lastCita = citasList[citasList.length - 1];
    const horario =
      firstCita && lastCita
        ? {
            inicio: new Date(firstCita.fecha_hora),
            fin: new Date(lastCita.fecha_hora)
          }
        : null;

    return {
      citas: citasList,
      proximasCitas: proximas.slice(0, 5),
      resumen: {
        total: citasList.length,
        pendientes: countByEstado('PENDIENTE'),
        enEspera: countByEstado('EN_ESPERA'),
        pendientesTotal: countByEstado('PENDIENTE') + countByEstado('EN_ESPERA'),
        confirmadas: countByEstado('CONFIRMADA'),
        realizadas: countByEstado('REALIZADA')
      },
      proximaCita: proximas[0] || null,
      fechaHoy: todayLabel,
      semanaDias: weekDays,
      citasPorDia: citasByDay,
      horarioEstimado: horario,
      totalMinutos: totalMinutes
    };
  }, [citasData]);

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString(LOCALE_DEFAULT, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--:--';
    }
  };

  const formatDay = (date: Date) =>
    date.toLocaleDateString(LOCALE_DEFAULT, { weekday: 'short', day: '2-digit' });

  const formatHour = (value: number) => `${value.toString().padStart(2, '0')}:00`;

  const formatRange = (start?: Date | null, end?: Date | null) => {
    if (!start || !end) return 'Sin horario asignado';
    const startLabel = start.toLocaleTimeString(LOCALE_DEFAULT, {
      hour: '2-digit',
      minute: '2-digit'
    });
    const endLabel = end.toLocaleTimeString(LOCALE_DEFAULT, {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${startLabel} - ${endLabel}`;
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen grid grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:px-12 lg:py-14 items-center">
        <div className="grid gap-6 max-w-[600px]">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted">{APP_NAME}</div>
          <h1 className="text-4xl lg:text-5xl font-semibold">Panel medico de alto rendimiento</h1>
          <p className="text-muted text-base lg:text-lg">
            Flujo clinico optimizado para doctores. Gestione consultas, diagnosticos, recetas y
            ordenes en una interfaz unificada.
          </p>

          <div className="grid gap-4 sm:grid-cols-3 mt-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-ink-contrast mb-1">Historias</h3>
              <p className="text-xs text-muted">Gestion centralizada de historias clinicas</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-badge-med/20 flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-badge-med"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-ink-contrast mb-1">Recetas</h3>
              <p className="text-xs text-muted">Prescripcion rapida con plantillas</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-badge-lab/20 flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-badge-lab"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-ink-contrast mb-1">Ordenes</h3>
              <p className="text-xs text-muted">Lab e imagenologia integrados</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              Tiempo real
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-badge-cie"></span>
              CIE-10 integrado
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-badge-rx"></span>
              Trazabilidad completa
            </div>
          </div>
        </div>

        <div className="w-full max-w-[420px] justify-self-end">
          <LoginPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      <AppHeader />
      <PatientSelector />

      <div className="grid gap-6 px-5 py-6 lg:px-6">
        <section className="rounded-3xl border border-white/10 bg-panel shadow-panel p-6 lg:p-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="grid gap-5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted">
                {APP_NAME}
              </div>
              <span className="rounded-full border border-white/10 bg-ink-2 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted">
                {fechaHoy}
              </span>
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-semibold">
                Bienvenido {userName ? userName.split(' ')[0] : ''}
              </h1>
              <p className="text-sm text-muted mt-2 max-w-[520px]">
                Tu jornada clinica en un vistazo: agenda, prioridades y resumen operativo.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-ink-2 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Citas hoy</div>
                <div className="text-2xl font-semibold text-ink-contrast mt-2">
                  {citasLoading ? '--' : resumen.total}
                </div>
                <div className="text-xs text-muted mt-1">Agenda total del dia</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-ink-2 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Pendientes</div>
                <div className="text-2xl font-semibold text-ink-contrast mt-2">
                  {citasLoading ? '--' : resumen.pendientesTotal}
                </div>
                <div className="text-xs text-muted mt-1">Pendientes + en espera</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-ink-2 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
                  Confirmadas
                </div>
                <div className="text-2xl font-semibold text-ink-contrast mt-2">
                  {citasLoading ? '--' : resumen.confirmadas}
                </div>
                <div className="text-xs text-muted mt-1">
                  Realizadas: {citasLoading ? '--' : resumen.realizadas}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-xl bg-accent/20 hover:bg-accent/30 text-accent px-4 py-2.5 text-sm font-semibold transition-colors"
                onClick={() => setShowPatientSelector(true)}
              >
                Seleccionar paciente
              </button>
              <a
                href="/consulta"
                className="rounded-xl border border-white/10 bg-ink-2 px-4 py-2.5 text-sm font-semibold text-ink-contrast hover:bg-white/10 transition-colors"
              >
                Ir a consulta
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-ink-2 p-5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted">Proxima cita</div>
              {proximaCita ? (
                <div className="mt-4 grid gap-3">
                  <div className="text-2xl font-semibold text-ink-contrast">
                    {formatTime(proximaCita.fecha_hora)}
                  </div>
                  <div className="text-sm text-muted">
                    {proximaCita.paciente?.nombre_completo || 'Paciente sin nombre'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoColor(proximaCita.estado)}`}
                    >
                      {proximaCita.estado}
                    </span>
                    {proximaCita.tipo && (
                      <span className="text-xs text-muted">{proximaCita.tipo}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-muted">Sin citas programadas.</div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-ink-2 p-5 grid gap-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted">
                Horarios asignados
              </div>
              <div className="text-sm text-ink-contrast">
                {formatRange(horarioEstimado?.inicio, horarioEstimado?.fin)}
              </div>
              <div className="text-xs text-muted">
                Carga estimada: {citasLoading ? '--' : Math.round(totalMinutos / 60)}h{' '}
                {citasLoading ? '' : `${totalMinutos % 60}m`}
              </div>
              <div className="text-[11px] text-muted">Agenda basada en las citas registradas.</div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-3xl border border-white/10 bg-panel shadow-panel p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted">Calendario</div>
                <h2 className="text-xl font-semibold">Agenda semanal</h2>
              </div>
              <div className="text-xs text-muted">{fechaHoy}</div>
            </div>

            <div className="mt-4 md:hidden grid gap-3">
              {citasLoading && <div className="text-sm text-muted">Cargando agenda...</div>}
              {!citasLoading && proximasCitas.length === 0 && (
                <div className="text-sm text-muted">No hay citas pendientes para hoy.</div>
              )}
              {proximasCitas.map((cita) => (
                <div
                  key={cita.id}
                  className="rounded-xl border border-white/10 bg-ink-2 p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-ink-contrast">
                      {formatTime(cita.fecha_hora)}
                    </div>
                    <div className="text-xs text-muted">
                      {cita.paciente?.nombre_completo || 'Paciente sin nombre'}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoColor(cita.estado)}`}
                  >
                    {cita.estado}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 hidden md:block">
              <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-0 text-xs text-muted">
                <div></div>
                {semanaDias.map((day) => (
                  <div key={day.toISOString()} className="px-2 py-2 text-center">
                    {formatDay(day)}
                  </div>
                ))}
              </div>

              <div className="relative grid grid-cols-[80px_repeat(7,1fr)] border-t border-white/10">
                <div className="border-r border-white/10">
                  {Array.from({ length: SLOTS_AGENDA }).map((_, index) => {
                    const hour = HORA_INICIO_AGENDA + index;
                    return (
                      <div
                        key={hour}
                        className="h-16 px-3 flex items-start pt-1 text-[11px] text-muted"
                      >
                        {formatHour(hour)}
                      </div>
                    );
                  })}
                </div>

                {semanaDias.map((day, dayIndex) => (
                  <div key={day.toISOString()} className="border-r border-white/10 relative">
                    {Array.from({ length: SLOTS_AGENDA }).map((_, index) => (
                      <div key={index} className="h-16 border-b border-white/5"></div>
                    ))}
                    {(citasPorDia[dayIndex] || []).map((cita) => {
                      const start = new Date(cita.fecha_hora);
                      const startMinutes = start.getHours() * 60 + start.getMinutes();
                      const gridStart = HORA_INICIO_AGENDA * 60;
                      const top = Math.max(startMinutes - gridStart, 0);
                      const duration = cita.duracion_minutos ?? DURACION_CITA_DEFAULT;
                      const height = Math.max(duration, 20);
                      return (
                        <div
                          key={cita.id}
                          className="absolute left-1 right-1 rounded-xl bg-accent/20 border border-accent/30 p-2 text-[11px] text-ink-contrast shadow-md"
                          style={{ top: `${(top / 60) * 64}px`, height: `${(height / 60) * 64}px` }}
                        >
                          <div className="font-semibold truncate">
                            {formatTime(cita.fecha_hora)}
                          </div>
                          <div className="text-[10px] text-muted truncate">
                            {cita.paciente?.nombre_completo || 'Paciente sin nombre'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-panel shadow-panel p-5 lg:p-6 grid gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted">Prioridades</div>
              <h2 className="text-lg font-semibold">Mis alertas</h2>
            </div>

            <div className="grid gap-3">
              <div className="rounded-xl border border-white/10 bg-ink-2 p-4">
                <div className="text-xs text-muted">En espera</div>
                <div className="text-lg font-semibold text-ink-contrast">
                  {citasLoading ? '--' : resumen.enEspera}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-ink-2 p-4">
                <div className="text-xs text-muted">Pendientes</div>
                <div className="text-lg font-semibold text-ink-contrast">
                  {citasLoading ? '--' : resumen.pendientes}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-ink-2 p-4">
                <div className="text-xs text-muted">Confirmadas</div>
                <div className="text-lg font-semibold text-ink-contrast">
                  {citasLoading ? '--' : resumen.confirmadas}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-ink-2 p-4 text-xs text-muted">
              Tip: abre una consulta desde la agenda para iniciar la evolucion clinica.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

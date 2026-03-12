'use client';

import { useConsultaStore } from '@/store/consultaStore';
import { useClinicalStore } from '@/store/clinicalStore';

export default function ConsultaHeader() {
  const { paciente, cita, setShowPatientSelector } = useConsultaStore();
  const { sucursales, sucursalId } = useClinicalStore();

  const sucursalActual = sucursales.find((s) => s.id === sucursalId);

  const calcularEdad = (fechaNacimiento?: string | null) => {
    if (!fechaNacimiento) return null;
    try {
      const nacimiento = new Date(fechaNacimiento);
      const hoy = new Date();
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mesActual = hoy.getMonth();
      const mesNacimiento = nacimiento.getMonth();
      if (
        mesActual < mesNacimiento ||
        (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())
      ) {
        edad--;
      }
      return edad;
    } catch {
      return null;
    }
  };

  const formatFecha = (fecha?: string | null) => {
    if (!fecha) return null;
    try {
      return new Date(fecha).toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  const edad = calcularEdad(paciente?.fechaNacimiento);

  return (
    <header className="rounded-2xl border border-white/10 bg-panel shadow-panel animate-rise">
      <div className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            {paciente ? (
              <span className="text-xl font-bold text-accent">
                {paciente.nombreCompleto.charAt(0).toUpperCase()}
              </span>
            ) : (
              <svg
                className="w-6 h-6 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </div>
          <div>
            {paciente ? (
              <>
                <h1 className="text-xl font-semibold text-ink-contrast">
                  {paciente.nombreCompleto}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted mt-1">
                  <span>{paciente.identificacion || paciente.codigoPaciente || `#${paciente.id}`}</span>
                  {edad !== null && (
                    <>
                      <span className="text-white/20">|</span>
                      <span>{edad} años</span>
                    </>
                  )}
                  {paciente.sexo && (
                    <>
                      <span className="text-white/20">|</span>
                      <span>{paciente.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
                    </>
                  )}
                  {paciente.tipoSangre && (
                    <>
                      <span className="text-white/20">|</span>
                      <span className="text-red-400">{paciente.tipoSangre}</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-muted">Sin paciente seleccionado</h1>
                <p className="text-xs text-muted mt-1">Seleccione un paciente para iniciar</p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {cita && (
            <div className="rounded-xl border border-white/10 bg-ink-2 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted">Cita</div>
              <div className="text-sm font-medium text-ink-contrast">
                {formatFecha(cita.fechaHora)} - {cita.tipo || 'Consulta'}
              </div>
            </div>
          )}

          {paciente?.alergias && paciente.alergias.length > 0 && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-danger">Alergias</div>
              <div className="text-sm font-medium text-danger">
                {paciente.alergias.slice(0, 2).join(', ')}
                {paciente.alergias.length > 2 && ` +${paciente.alergias.length - 2}`}
              </div>
            </div>
          )}

          {sucursalActual && (
            <div className="rounded-xl border border-white/10 bg-ink-2 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted">Sucursal</div>
              <div className="text-sm font-medium text-ink-contrast">
                {sucursalActual.codigo || `#${sucursalActual.id}`}
              </div>
            </div>
          )}

          <button
            className="rounded-xl bg-accent/20 hover:bg-accent/30 text-accent px-4 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2"
            onClick={() => setShowPatientSelector(true)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            {paciente ? 'Cambiar' : 'Seleccionar'}
          </button>
        </div>
      </div>
    </header>
  );
}

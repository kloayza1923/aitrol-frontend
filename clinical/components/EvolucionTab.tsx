'use client';

import { useConsultaStore } from '@/store/consultaStore';
import ClinicalEditor from './ClinicalEditor';

export default function EvolucionTab() {
  const {
    motivoConsulta,
    enfermedadActual,
    revisionSistemas,
    resumen,
    planTratamiento,
    setMotivoConsulta,
    setEnfermedadActual,
    setRevisionSistemas,
    setResumen,
    setPlanTratamiento,
    setEvolucionJSON,
  } = useConsultaStore();

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">
            Motivo de consulta *
          </label>
          <input
            type="text"
            placeholder="Razon principal de la visita..."
            className="w-full rounded-xl border border-white/10 bg-ink-2 px-4 py-2.5 text-sm text-ink-contrast placeholder:text-muted focus:border-accent/50 focus:outline-none transition-colors"
            value={motivoConsulta}
            onChange={(e) => setMotivoConsulta(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">
            Enfermedad actual
          </label>
          <textarea
            placeholder="Descripcion de la enfermedad actual, inicio, evolucion..."
            className="w-full rounded-xl border border-white/10 bg-ink-2 px-4 py-2.5 text-sm text-ink-contrast placeholder:text-muted focus:border-accent/50 focus:outline-none transition-colors resize-none"
            rows={3}
            value={enfermedadActual}
            onChange={(e) => setEnfermedadActual(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">
            Revision por sistemas
          </label>
          <textarea
            placeholder="Hallazgos por sistemas..."
            className="w-full rounded-xl border border-white/10 bg-ink-2 px-4 py-2.5 text-sm text-ink-contrast placeholder:text-muted focus:border-accent/50 focus:outline-none transition-colors resize-none"
            rows={2}
            value={revisionSistemas}
            onChange={(e) => setRevisionSistemas(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">
            Plan de tratamiento
          </label>
          <textarea
            placeholder="Indicaciones terapeuticas..."
            className="w-full rounded-xl border border-white/10 bg-ink-2 px-4 py-2.5 text-sm text-ink-contrast placeholder:text-muted focus:border-accent/50 focus:outline-none transition-colors resize-none"
            rows={2}
            value={planTratamiento}
            onChange={(e) => setPlanTratamiento(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">
            Resumen
          </label>
          <textarea
            placeholder="Resumen general de la consulta..."
            className="w-full rounded-xl border border-white/10 bg-ink-2 px-4 py-2.5 text-sm text-ink-contrast placeholder:text-muted focus:border-accent/50 focus:outline-none transition-colors resize-none"
            rows={2}
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
          />
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted mb-2">
          Notas de evolucion (Editor avanzado)
        </div>
        <div className="text-[10px] text-muted mb-3">
          Use comandos: <span className="text-accent">/cie</span> diagnostico, <span className="text-badge-med">/med</span> medicamento, <span className="text-badge-lab">/lab</span> laboratorio, <span className="text-badge-rx">/rx</span> imagenologia
        </div>
        <ClinicalEditor onJSONChange={setEvolucionJSON} />
      </div>
    </div>
  );
}

'use client';

import { useConsultaStore } from '@/store/consultaStore';

export default function ConsultaSummary() {
  const {
    paciente,
    signosVitales,
    diagnosticos,
    recetaItems,
    ordenesLab,
    ordenesRx,
    setActiveTab,
    removeDiagnostico,
    removeRecetaItem,
    removeOrdenLab,
    removeOrdenRx,
  } = useConsultaStore();

  const hasSignosVitales = Object.values(signosVitales).some((v) => v && v.trim() !== '');
  const totalItems = diagnosticos.length + recetaItems.length + ordenesLab.length + ordenesRx.length;

  if (!paciente) {
    return (
      <div className="rounded-2xl border border-white/10 bg-panel shadow-panel animate-rise">
        <div className="px-5 pt-5 pb-4 border-b border-white/10">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted">Resumen</div>
          <h3 className="text-lg font-semibold">Consulta</h3>
        </div>
        <div className="p-5 text-center">
          <svg className="w-12 h-12 mx-auto text-muted/50 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm text-muted">
            Seleccione un paciente para comenzar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-panel shadow-panel animate-rise sticky top-6">
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted">Resumen</div>
            <h3 className="text-lg font-semibold">Consulta</h3>
          </div>
          {totalItems > 0 && (
            <span className="px-2 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold">
              {totalItems} items
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
        {hasSignosVitales && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted mb-2">
              Signos Vitales
            </div>
            <div className="flex flex-wrap gap-2">
              {signosVitales.temperatura && (
                <span className="px-2 py-1 rounded-lg bg-white/5 text-xs text-ink-contrast">
                  T: {signosVitales.temperatura}°C
                </span>
              )}
              {(signosVitales.presionSistolica || signosVitales.presionDiastolica) && (
                <span className="px-2 py-1 rounded-lg bg-white/5 text-xs text-ink-contrast">
                  PA: {signosVitales.presionSistolica || '-'}/{signosVitales.presionDiastolica || '-'}
                </span>
              )}
              {signosVitales.frecuenciaCardiaca && (
                <span className="px-2 py-1 rounded-lg bg-white/5 text-xs text-ink-contrast">
                  FC: {signosVitales.frecuenciaCardiaca}
                </span>
              )}
              {signosVitales.saturacionOxigeno && (
                <span className="px-2 py-1 rounded-lg bg-white/5 text-xs text-ink-contrast">
                  SpO2: {signosVitales.saturacionOxigeno}%
                </span>
              )}
            </div>
          </div>
        )}

        {diagnosticos.length > 0 && (
          <div>
            <button
              className="text-[10px] uppercase tracking-wide text-muted mb-2 hover:text-accent transition-colors flex items-center gap-1"
              onClick={() => setActiveTab('diagnosticos')}
            >
              Diagnosticos ({diagnosticos.length})
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="space-y-1.5">
              {diagnosticos.map((diag) => (
                <div
                  key={diag.id}
                  className="flex items-center justify-between rounded-lg bg-badge-cie/10 px-2.5 py-1.5 group"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono text-badge-cie mr-1.5">
                      {diag.codigoCie10}
                    </span>
                    <span className="text-xs text-ink-contrast truncate">
                      {diag.descripcion.substring(0, 30)}...
                    </span>
                  </div>
                  <button
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-danger/10 text-muted hover:text-danger transition-all"
                    onClick={() => removeDiagnostico(diag.id)}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {recetaItems.length > 0 && (
          <div>
            <button
              className="text-[10px] uppercase tracking-wide text-muted mb-2 hover:text-accent transition-colors flex items-center gap-1"
              onClick={() => setActiveTab('receta')}
            >
              Medicamentos ({recetaItems.length})
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="space-y-1.5">
              {recetaItems.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between rounded-lg bg-badge-med/10 px-2.5 py-1.5 group"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-ink-contrast truncate block">
                      {med.nombre}
                    </span>
                    <span className="text-[10px] text-muted">
                      {med.dosis} - {med.frecuencia}
                    </span>
                  </div>
                  <button
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-danger/10 text-muted hover:text-danger transition-all"
                    onClick={() => removeRecetaItem(med.id)}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {ordenesLab.length > 0 && (
          <div>
            <button
              className="text-[10px] uppercase tracking-wide text-muted mb-2 hover:text-accent transition-colors flex items-center gap-1"
              onClick={() => setActiveTab('ordenes')}
            >
              Lab ({ordenesLab.length})
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="space-y-1.5">
              {ordenesLab.map((orden) => (
                <div
                  key={orden.id}
                  className="flex items-center justify-between rounded-lg bg-badge-lab/10 px-2.5 py-1.5 group"
                >
                  <span className="text-xs text-ink-contrast truncate">
                    {orden.tipoSolicitud}
                  </span>
                  <button
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-danger/10 text-muted hover:text-danger transition-all"
                    onClick={() => removeOrdenLab(orden.id)}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {ordenesRx.length > 0 && (
          <div>
            <button
              className="text-[10px] uppercase tracking-wide text-muted mb-2 hover:text-accent transition-colors flex items-center gap-1"
              onClick={() => setActiveTab('ordenes')}
            >
              Imagenologia ({ordenesRx.length})
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="space-y-1.5">
              {ordenesRx.map((orden) => (
                <div
                  key={orden.id}
                  className="flex items-center justify-between rounded-lg bg-badge-rx/10 px-2.5 py-1.5 group"
                >
                  <span className="text-xs text-ink-contrast truncate">
                    {orden.estudio}
                  </span>
                  <button
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-danger/10 text-muted hover:text-danger transition-all"
                    onClick={() => removeOrdenRx(orden.id)}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalItems === 0 && !hasSignosVitales && (
          <div className="text-center py-4">
            <svg className="w-8 h-8 mx-auto text-muted/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-xs text-muted">
              Agregue datos a la consulta
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

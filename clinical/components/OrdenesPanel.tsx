'use client';

import { useState } from 'react';
import { useConsultaStore, OrdenLab, OrdenRx, generateId } from '@/store/consultaStore';
import { EXAMENES_LAB_COMUNES, ESTUDIOS_RX_COMUNES } from '@/lib/constants';

type OrdenType = 'lab' | 'rx';

export default function OrdenesPanel() {
  const { ordenesLab, ordenesRx, addOrdenLab, removeOrdenLab, addOrdenRx, removeOrdenRx } =
    useConsultaStore();
  const [activeType, setActiveType] = useState<OrdenType>('lab');
  const [labForm, setLabForm] = useState({
    tipoSolicitud: '',
    prioridad: 'NORMAL' as 'NORMAL' | 'ALTA' | 'URGENTE',
    observaciones: ''
  });
  const [rxForm, setRxForm] = useState({
    estudio: '',
    prioridad: 'NORMAL' as 'NORMAL' | 'ALTA' | 'URGENTE',
    observaciones: ''
  });

  const handleAddLab = () => {
    if (!labForm.tipoSolicitud.trim()) return;

    const newOrden: OrdenLab = {
      id: generateId(),
      tipoSolicitud: labForm.tipoSolicitud,
      prioridad: labForm.prioridad,
      observaciones: labForm.observaciones
    };

    addOrdenLab(newOrden);
    setLabForm({ tipoSolicitud: '', prioridad: 'NORMAL', observaciones: '' });
  };

  const handleAddRx = () => {
    if (!rxForm.estudio.trim()) return;

    const newOrden: OrdenRx = {
      id: generateId(),
      estudio: rxForm.estudio,
      prioridad: rxForm.prioridad,
      observaciones: rxForm.observaciones
    };

    addOrdenRx(newOrden);
    setRxForm({ estudio: '', prioridad: 'NORMAL', observaciones: '' });
  };

  const handleQuickAddLab = (tipo: string) => {
    const newOrden: OrdenLab = {
      id: generateId(),
      tipoSolicitud: tipo,
      prioridad: 'NORMAL',
      observaciones: ''
    };
    addOrdenLab(newOrden);
  };

  const handleQuickAddRx = (estudio: string) => {
    const newOrden: OrdenRx = {
      id: generateId(),
      estudio: estudio,
      prioridad: 'NORMAL',
      observaciones: ''
    };
    addOrdenRx(newOrden);
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'URGENTE':
        return 'bg-danger/20 text-danger border-danger/30';
      case 'ALTA':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-accent/20 text-accent border-accent/30';
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex border-b border-white/10">
        <button
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeType === 'lab' ? 'text-badge-lab' : 'text-muted hover:text-ink-contrast'
          }`}
          onClick={() => setActiveType('lab')}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
            Laboratorio
            {ordenesLab.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-badge-lab/20 text-badge-lab">
                {ordenesLab.length}
              </span>
            )}
          </span>
          {activeType === 'lab' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-badge-lab" />
          )}
        </button>
        <button
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeType === 'rx' ? 'text-badge-rx' : 'text-muted hover:text-ink-contrast'
          }`}
          onClick={() => setActiveType('rx')}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Imagenologia
            {ordenesRx.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-badge-rx/20 text-badge-rx">
                {ordenesRx.length}
              </span>
            )}
          </span>
          {activeType === 'rx' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-badge-rx" />
          )}
        </button>
      </div>

      {activeType === 'lab' && (
        <div className="space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted mb-2">
              Examenes frecuentes
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMENES_LAB_COMUNES.map((examen) => {
                const isAdded = ordenesLab.some((o) => o.tipoSolicitud === examen);
                return (
                  <button
                    key={examen}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isAdded
                        ? 'bg-badge-lab/20 text-badge-lab border border-badge-lab/30'
                        : 'bg-white/5 text-muted hover:bg-white/10 hover:text-ink-contrast border border-white/10'
                    }`}
                    onClick={() => !isAdded && handleQuickAddLab(examen)}
                    disabled={isAdded}
                  >
                    {isAdded && (
                      <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {examen}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-ink-2 p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted mb-3">
              Agregar orden personalizada
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Tipo de examen o solicitud..."
                  className="w-full rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-ink-contrast placeholder:text-muted focus:outline-none"
                  value={labForm.tipoSolicitud}
                  onChange={(e) => setLabForm({ ...labForm, tipoSolicitud: e.target.value })}
                />
              </div>
              <div>
                <select
                  className="w-full rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-ink-contrast focus:outline-none"
                  value={labForm.prioridad}
                  onChange={(e) =>
                    setLabForm({
                      ...labForm,
                      prioridad: e.target.value as typeof labForm.prioridad
                    })
                  }
                >
                  <option value="NORMAL">Prioridad Normal</option>
                  <option value="ALTA">Prioridad Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Observaciones..."
                  className="w-full rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-ink-contrast placeholder:text-muted focus:outline-none"
                  value={labForm.observaciones}
                  onChange={(e) => setLabForm({ ...labForm, observaciones: e.target.value })}
                />
              </div>
            </div>
            <button
              className="mt-3 w-full rounded-lg bg-badge-lab/20 hover:bg-badge-lab/30 text-badge-lab px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
              onClick={handleAddLab}
              disabled={!labForm.tipoSolicitud.trim()}
            >
              Agregar orden
            </button>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted mb-3">
              Ordenes de laboratorio ({ordenesLab.length})
            </div>
            {ordenesLab.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted">
                Seleccione examenes o agregue ordenes personalizadas
              </div>
            ) : (
              <div className="space-y-2">
                {ordenesLab.map((orden) => (
                  <div
                    key={orden.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-ink-2 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPrioridadColor(orden.prioridad)}`}
                      >
                        {orden.prioridad}
                      </span>
                      <span className="text-sm text-ink-contrast">{orden.tipoSolicitud}</span>
                    </div>
                    <button
                      className="p-1 rounded hover:bg-danger/10 text-muted hover:text-danger transition-colors"
                      onClick={() => removeOrdenLab(orden.id)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeType === 'rx' && (
        <div className="space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted mb-2">
              Estudios frecuentes
            </div>
            <div className="flex flex-wrap gap-2">
              {ESTUDIOS_RX_COMUNES.map((estudio) => {
                const isAdded = ordenesRx.some((o) => o.estudio === estudio);
                return (
                  <button
                    key={estudio}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isAdded
                        ? 'bg-badge-rx/20 text-badge-rx border border-badge-rx/30'
                        : 'bg-white/5 text-muted hover:bg-white/10 hover:text-ink-contrast border border-white/10'
                    }`}
                    onClick={() => !isAdded && handleQuickAddRx(estudio)}
                    disabled={isAdded}
                  >
                    {isAdded && (
                      <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {estudio}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-ink-2 p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted mb-3">
              Agregar estudio personalizado
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Nombre del estudio..."
                  className="w-full rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-ink-contrast placeholder:text-muted focus:outline-none"
                  value={rxForm.estudio}
                  onChange={(e) => setRxForm({ ...rxForm, estudio: e.target.value })}
                />
              </div>
              <div>
                <select
                  className="w-full rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-ink-contrast focus:outline-none"
                  value={rxForm.prioridad}
                  onChange={(e) =>
                    setRxForm({ ...rxForm, prioridad: e.target.value as typeof rxForm.prioridad })
                  }
                >
                  <option value="NORMAL">Prioridad Normal</option>
                  <option value="ALTA">Prioridad Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Observaciones..."
                  className="w-full rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-ink-contrast placeholder:text-muted focus:outline-none"
                  value={rxForm.observaciones}
                  onChange={(e) => setRxForm({ ...rxForm, observaciones: e.target.value })}
                />
              </div>
            </div>
            <button
              className="mt-3 w-full rounded-lg bg-badge-rx/20 hover:bg-badge-rx/30 text-badge-rx px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
              onClick={handleAddRx}
              disabled={!rxForm.estudio.trim()}
            >
              Agregar estudio
            </button>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted mb-3">
              Ordenes de imagenologia ({ordenesRx.length})
            </div>
            {ordenesRx.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted">
                Seleccione estudios o agregue ordenes personalizadas
              </div>
            ) : (
              <div className="space-y-2">
                {ordenesRx.map((orden) => (
                  <div
                    key={orden.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-ink-2 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPrioridadColor(orden.prioridad)}`}
                      >
                        {orden.prioridad}
                      </span>
                      <span className="text-sm text-ink-contrast">{orden.estudio}</span>
                    </div>
                    <button
                      className="p-1 rounded hover:bg-danger/10 text-muted hover:text-danger transition-colors"
                      onClick={() => removeOrdenRx(orden.id)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

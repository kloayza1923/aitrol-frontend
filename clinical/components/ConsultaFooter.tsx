'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useConsultaStore } from '@/store/consultaStore';
import { FinalizeResponse } from '@/types/health';
import { toast } from '@/store/toastStore';

export default function ConsultaFooter() {
  const {
    paciente,
    diagnosticos,
    getPayload,
    isSaving,
    setIsSaving,
    resetConsulta,
    setShowPatientSelector,
  } = useConsultaStore();

  const [showConfirmNew, setShowConfirmNew] = useState(false);

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const payload = getPayload();
      const response = await api.post<FinalizeResponse>('/health/finalizar', payload);
      return response.data;
    },
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: (data) => {
      setIsSaving(false);
      toast.success(`Consulta finalizada exitosamente. Encuentro ID: ${data.encuentro_id}`);
      resetConsulta();
      setShowPatientSelector(true);
    },
    onError: (error) => {
      setIsSaving(false);
      console.error('Error al finalizar:', error);
      toast.error('Error al finalizar la consulta. Intente nuevamente.');
    },
  });

  const canFinalize = paciente && diagnosticos.length > 0;

  const handleFinalize = () => {
    if (!canFinalize) {
      toast.warning('Debe seleccionar un paciente y agregar al menos un diagnostico');
      return;
    }
    finalizeMutation.mutate();
  };

  const handleNewConsulta = () => {
    setShowConfirmNew(true);
  };

  const handleConfirmNew = () => {
    setShowConfirmNew(false);
    resetConsulta();
    setShowPatientSelector(true);
  };

  return (
    <footer className="rounded-2xl border border-white/10 bg-panel shadow-panel animate-rise">
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-muted">
          {paciente ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                Paciente seleccionado
              </span>
              <span className="text-white/20">|</span>
              <span>{diagnosticos.length} diagnostico(s)</span>
            </>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Seleccione un paciente para continuar
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showConfirmNew ? (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              <span className="text-xs text-amber-400">¿Descartar cambios?</span>
              <button
                className="rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-3 py-1 text-xs font-semibold transition-colors"
                onClick={handleConfirmNew}
              >
                Sí, nueva consulta
              </button>
              <button
                className="rounded-lg hover:bg-white/10 text-muted px-2 py-1 text-xs transition-colors"
                onClick={() => setShowConfirmNew(false)}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink-contrast hover:bg-white/5 transition-colors"
              onClick={handleNewConsulta}
            >
              Nueva consulta
            </button>
          )}

          <button
            className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-2 ${
              canFinalize
                ? 'bg-accent text-[#041b14] hover:bg-accent/90'
                : 'bg-white/10 text-muted cursor-not-allowed'
            }`}
            onClick={handleFinalize}
            disabled={!canFinalize || isSaving}
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Finalizar consulta
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useConsultaStore, DiagnosticoConsulta, generateId } from '@/store/consultaStore';

type DiagnosticoSearch = {
  id: number;
  codigo_cie10: string;
  descripcion: string;
};

export default function DiagnosticosPanel() {
  const { diagnosticos, addDiagnostico, updateDiagnostico, removeDiagnostico } = useConsultaStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<'PRINCIPAL' | 'SECUNDARIO' | 'PRESUNTIVO'>('PRINCIPAL');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['diagnosticos-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const response = await api.get('/health/diagnosticos', {
        params: { search: debouncedQuery, limit: 10 },
      });
      return (response.data?.items || response.data || []) as DiagnosticoSearch[];
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleSelectDiagnostico = (item: DiagnosticoSearch) => {
    const exists = diagnosticos.some((d) => d.diagnosticoId === item.id);
    if (exists) return;

    const hasPrincipal = diagnosticos.some((d) => d.tipoDiagnostico === 'PRINCIPAL');
    const tipo = !hasPrincipal ? 'PRINCIPAL' : selectedTipo === 'PRINCIPAL' ? 'SECUNDARIO' : selectedTipo;

    const newDiag: DiagnosticoConsulta = {
      id: generateId(),
      diagnosticoId: item.id,
      codigoCie10: item.codigo_cie10,
      descripcion: item.descripcion,
      tipoDiagnostico: tipo,
      observaciones: '',
    };

    addDiagnostico(newDiag);
    setSearchQuery('');
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'PRINCIPAL':
        return 'bg-accent/20 text-accent border-accent/30';
      case 'SECUNDARIO':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'PRESUNTIVO':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-white/10 text-muted border-white/10';
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">
              Buscar diagnostico (CIE-10)
            </label>
            <input
              type="text"
              placeholder="Ej: J06, gripe, diabetes..."
              className="w-full rounded-xl border border-white/10 bg-ink-2 px-4 py-2.5 text-sm text-ink-contrast placeholder:text-muted focus:border-accent/50 focus:outline-none transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">
              Tipo
            </label>
            <select
              className="rounded-xl border border-white/10 bg-ink-2 px-3 py-2.5 text-sm text-ink-contrast focus:border-accent/50 focus:outline-none"
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value as typeof selectedTipo)}
            >
              <option value="PRINCIPAL">Principal</option>
              <option value="SECUNDARIO">Secundario</option>
              <option value="PRESUNTIVO">Presuntivo</option>
            </select>
          </div>
        </div>

        {debouncedQuery.length >= 2 && (
          <div className="rounded-xl border border-white/10 bg-ink-2 overflow-hidden">
            {isLoading && (
              <div className="px-4 py-3 text-sm text-muted">Buscando...</div>
            )}
            {!isLoading && searchResults && searchResults.length === 0 && (
              <div className="px-4 py-3 text-sm text-muted">Sin resultados</div>
            )}
            {searchResults && searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto">
                {searchResults.map((item) => {
                  const alreadyAdded = diagnosticos.some((d) => d.diagnosticoId === item.id);
                  return (
                    <button
                      key={item.id}
                      className={`w-full text-left px-4 py-2.5 text-sm border-b border-white/5 last:border-0 transition-colors ${
                        alreadyAdded
                          ? 'bg-accent/10 text-accent cursor-default'
                          : 'hover:bg-white/5 text-ink-contrast'
                      }`}
                      onClick={() => !alreadyAdded && handleSelectDiagnostico(item)}
                      disabled={alreadyAdded}
                    >
                      <span className="font-mono text-xs text-accent mr-2">
                        {item.codigo_cie10}
                      </span>
                      {item.descripcion}
                      {alreadyAdded && (
                        <span className="ml-2 text-[10px] text-accent">Agregado</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted mb-3">
          Diagnosticos agregados ({diagnosticos.length})
        </div>

        {diagnosticos.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
            <svg className="w-8 h-8 mx-auto text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-sm text-muted">
              Busque y seleccione diagnosticos CIE-10
            </p>
          </div>
        )}

        <div className="space-y-3">
          {diagnosticos.map((diag) => (
            <div
              key={diag.id}
              className="rounded-xl border border-white/10 bg-ink-2 p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-accent font-semibold">
                      {diag.codigoCie10}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getTipoColor(diag.tipoDiagnostico)}`}>
                      {diag.tipoDiagnostico}
                    </span>
                  </div>
                  <p className="text-sm text-ink-contrast">{diag.descripcion}</p>
                </div>
                <button
                  className="p-1.5 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition-colors"
                  onClick={() => removeDiagnostico(diag.id)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="rounded-lg border border-white/10 bg-panel px-2 py-1 text-xs text-ink-contrast focus:outline-none"
                  value={diag.tipoDiagnostico}
                  onChange={(e) => updateDiagnostico(diag.id, { tipoDiagnostico: e.target.value as DiagnosticoConsulta['tipoDiagnostico'] })}
                >
                  <option value="PRINCIPAL">Principal</option>
                  <option value="SECUNDARIO">Secundario</option>
                  <option value="PRESUNTIVO">Presuntivo</option>
                </select>
                <input
                  type="text"
                  placeholder="Observaciones..."
                  className="flex-1 rounded-lg border border-white/10 bg-panel px-2 py-1 text-xs text-ink-contrast placeholder:text-muted focus:outline-none"
                  value={diag.observaciones}
                  onChange={(e) => updateDiagnostico(diag.id, { observaciones: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

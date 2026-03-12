'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useConsultaStore, RecetaItem, generateId } from '@/store/consultaStore';
import { FRECUENCIAS_COMUNES, VIAS_COMUNES, DURACIONES_COMUNES } from '@/lib/constants';

type MedicamentoSearch = {
  producto_id: number;
  nombre: string;
  medicamento_id?: number | null;
  principio_activo?: string | null;
  concentracion?: string | null;
  presentacion?: string | null;
  via_administracion?: string | null;
};

export default function RecetaBuilder() {
  const { recetaMotivo, recetaDiagnostico, recetaItems, setRecetaMotivo, setRecetaDiagnostico, addRecetaItem, updateRecetaItem, removeRecetaItem, diagnosticos } = useConsultaStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedMed, setSelectedMed] = useState<MedicamentoSearch | null>(null);
  const [formData, setFormData] = useState({
    dosis: '',
    via: 'Oral',
    frecuencia: 'Cada 8 horas',
    duracion: '7 dias',
    cantidad: 1,
    indicaciones: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['medicamentos-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const response = await api.get('/health/medicamentos', {
        params: { search: debouncedQuery, limit: 10 },
      });
      return (response.data?.items || response.data || []) as MedicamentoSearch[];
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleSelectMedicamento = (med: MedicamentoSearch) => {
    setSelectedMed(med);
    setShowForm(true);
    setSearchQuery('');
    setFormData({
      dosis: med.concentracion || '',
      via: med.via_administracion || 'Oral',
      frecuencia: 'Cada 8 horas',
      duracion: '7 dias',
      cantidad: 1,
      indicaciones: '',
    });
  };

  const handleAddMedicamento = () => {
    if (!selectedMed) return;

    const newItem: RecetaItem = {
      id: generateId(),
      productoId: selectedMed.producto_id,
      medicamentoId: selectedMed.medicamento_id,
      nombre: selectedMed.nombre,
      dosis: formData.dosis,
      via: formData.via,
      frecuencia: formData.frecuencia,
      duracion: formData.duracion,
      cantidad: formData.cantidad,
      indicaciones: formData.indicaciones,
    };

    addRecetaItem(newItem);
    setShowForm(false);
    setSelectedMed(null);
    setFormData({
      dosis: '',
      via: 'Oral',
      frecuencia: 'Cada 8 horas',
      duracion: '7 dias',
      cantidad: 1,
      indicaciones: '',
    });
  };

  const diagPrincipal = diagnosticos.find((d) => d.tipoDiagnostico === 'PRINCIPAL');

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">
            Motivo de la receta
          </label>
          <input
            type="text"
            placeholder="Tratamiento para..."
            className="w-full rounded-xl border border-white/10 bg-ink-2 px-4 py-2.5 text-sm text-ink-contrast placeholder:text-muted focus:border-accent/50 focus:outline-none"
            value={recetaMotivo}
            onChange={(e) => setRecetaMotivo(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">
            Diagnostico asociado
          </label>
          <input
            type="text"
            placeholder={diagPrincipal ? diagPrincipal.descripcion : 'Diagnostico...'}
            className="w-full rounded-xl border border-white/10 bg-ink-2 px-4 py-2.5 text-sm text-ink-contrast placeholder:text-muted focus:border-accent/50 focus:outline-none"
            value={recetaDiagnostico}
            onChange={(e) => setRecetaDiagnostico(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">
          Buscar medicamento
        </label>
        <input
          type="text"
          placeholder="Ej: paracetamol, ibuprofeno..."
          className="w-full rounded-xl border border-white/10 bg-ink-2 px-4 py-2.5 text-sm text-ink-contrast placeholder:text-muted focus:border-accent/50 focus:outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {debouncedQuery.length >= 2 && (
          <div className="mt-2 rounded-xl border border-white/10 bg-ink-2 overflow-hidden">
            {isLoading && (
              <div className="px-4 py-3 text-sm text-muted">Buscando...</div>
            )}
            {!isLoading && searchResults && searchResults.length === 0 && (
              <div className="px-4 py-3 text-sm text-muted">Sin resultados</div>
            )}
            {searchResults && searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto">
                {searchResults.map((med) => (
                  <button
                    key={med.producto_id}
                    className="w-full text-left px-4 py-2.5 text-sm border-b border-white/5 last:border-0 hover:bg-white/5 text-ink-contrast transition-colors"
                    onClick={() => handleSelectMedicamento(med)}
                  >
                    <div className="font-medium">{med.nombre}</div>
                    {(med.principio_activo || med.presentacion) && (
                      <div className="text-xs text-muted mt-0.5">
                        {med.principio_activo} {med.concentracion && `- ${med.concentracion}`} {med.presentacion && `(${med.presentacion})`}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && selectedMed && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-ink-contrast">{selectedMed.nombre}</div>
              <div className="text-xs text-muted">{selectedMed.principio_activo}</div>
            </div>
            <button
              className="p-1.5 rounded-lg hover:bg-white/10 text-muted"
              onClick={() => setShowForm(false)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">Dosis</label>
              <input
                type="text"
                placeholder="500mg"
                className="w-full rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-ink-contrast focus:outline-none"
                value={formData.dosis}
                onChange={(e) => setFormData({ ...formData, dosis: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">Via</label>
              <select
                className="w-full rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-ink-contrast focus:outline-none"
                value={formData.via}
                onChange={(e) => setFormData({ ...formData, via: e.target.value })}
              >
                {VIAS_COMUNES.map((via) => (
                  <option key={via} value={via}>{via}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">Frecuencia</label>
              <select
                className="w-full rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-ink-contrast focus:outline-none"
                value={formData.frecuencia}
                onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value })}
              >
                {FRECUENCIAS_COMUNES.map((freq) => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">Duracion</label>
              <select
                className="w-full rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-ink-contrast focus:outline-none"
                value={formData.duracion}
                onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
              >
                {DURACIONES_COMUNES.map((dur) => (
                  <option key={dur} value={dur}>{dur}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                className="w-full rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-ink-contrast focus:outline-none"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">Indicaciones</label>
              <input
                type="text"
                placeholder="Con alimentos..."
                className="w-full rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-ink-contrast focus:outline-none"
                value={formData.indicaciones}
                onChange={(e) => setFormData({ ...formData, indicaciones: e.target.value })}
              />
            </div>
          </div>

          <button
            className="mt-4 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-[#041b14] hover:bg-accent/90 transition-colors"
            onClick={handleAddMedicamento}
          >
            Agregar a la receta
          </button>
        </div>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted mb-3">
          Medicamentos en receta ({recetaItems.length})
        </div>

        {recetaItems.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
            <svg className="w-8 h-8 mx-auto text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm text-muted">
              Busque medicamentos para agregar a la receta
            </p>
          </div>
        )}

        <div className="space-y-3">
          {recetaItems.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-ink-2 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-ink-contrast">{item.nombre}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-muted">Dosis:</span>{' '}
                      <span className="text-ink-contrast">{item.dosis || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted">Via:</span>{' '}
                      <span className="text-ink-contrast">{item.via}</span>
                    </div>
                    <div>
                      <span className="text-muted">Frecuencia:</span>{' '}
                      <span className="text-ink-contrast">{item.frecuencia}</span>
                    </div>
                    <div>
                      <span className="text-muted">Duracion:</span>{' '}
                      <span className="text-ink-contrast">{item.duracion}</span>
                    </div>
                  </div>
                  {item.indicaciones && (
                    <div className="mt-2 text-xs text-muted">
                      <span className="text-accent">Indicaciones:</span> {item.indicaciones}
                    </div>
                  )}
                </div>
                <button
                  className="p-1.5 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition-colors"
                  onClick={() => removeRecetaItem(item.id)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

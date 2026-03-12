'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { ClinicalBadge } from '@/lib/tiptap/clinicalBadge';
import { SlashCommand } from '@/lib/tiptap/slashCommand';
import { DiagnosticoItem, MedicamentoItem } from '@/types/health';
import { api } from '@/lib/api';

export type CanvasMeta = {
  motive: string;
  resumen: string;
  plan: string;
};

type CommandState = {
  type: 'cie' | 'med' | 'lab' | 'rx';
  range: { from: number; to: number };
} | null;

type TipoDiagnostico = 'PRINCIPAL' | 'SECUNDARIO' | 'PRESUNTIVO';

type ClinicalEditorProps = {
  onJSONChange: (json: Record<string, unknown>) => void;
};

const TIPO_DIAGNOSTICO_OPTIONS: TipoDiagnostico[] = ['PRINCIPAL', 'SECUNDARIO', 'PRESUNTIVO'];

const KIND_COLORS: Record<string, string> = {
  cie: 'bg-badge-cie/20 border-badge-cie/40 text-badge-cie',
  med: 'bg-badge-med/20 border-badge-med/40 text-badge-med',
  lab: 'bg-badge-lab/20 border-badge-lab/40 text-badge-lab',
  rx:  'bg-badge-rx/20  border-badge-rx/40  text-badge-rx',
};

export default function ClinicalEditor({ onJSONChange }: ClinicalEditorProps) {
  const [commandState, setCommandState] = useState<CommandState>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<DiagnosticoItem | MedicamentoItem>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Record<string, string>>({});
  const [tipoDiagnostico, setTipoDiagnostico] = useState<TipoDiagnostico>('PRINCIPAL');
  const [selectedMed, setSelectedMed] = useState<MedicamentoItem | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ClinicalBadge,
      SlashCommand.configure({
        onCommand: ({ item, range }) => {
          setCommandState({ type: item.action, range });
          setQuery('');
          setResults([]);
          setError(null);
          setMeta({});
          setSelectedMed(null);
          setTipoDiagnostico('PRINCIPAL');
        }
      })
    ],
    content: '<p>Escribe la evolucion clinica. Usa / para comandos.</p>',
    onUpdate: ({ editor }) => {
      onJSONChange(editor.getJSON());
    }
  });

  // Auto-focus the search input when the panel opens
  useEffect(() => {
    if (commandState?.type === 'cie' || commandState?.type === 'med') {
      const id = setTimeout(() => searchInputRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [commandState]);

  // Close modal on Escape
  useEffect(() => {
    if (!commandState) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commandState]);

  // Debounced auto-search as user types
  useEffect(() => {
    if (!query.trim() || !commandState) return;
    const timer = setTimeout(() => { doSearch(query); }, 350);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, commandState?.type]);

  // Reset selected med when results change (new search)
  useEffect(() => {
    setSelectedMed(null);
  }, [results]);

  const title = useMemo(() => {
    if (!commandState) return '';
    if (commandState.type === 'cie') return 'Buscar diagnóstico CIE-10';
    if (commandState.type === 'med') return 'Agregar medicamento';
    if (commandState.type === 'lab') return 'Orden de laboratorio';
    return 'Orden de imagenología';
  }, [commandState]);

  const handleClose = () => {
    setCommandState(null);
    setQuery('');
    setResults([]);
    setError(null);
    setMeta({});
    setSelectedMed(null);
    setTipoDiagnostico('PRINCIPAL');
  };

  const doSearch = useCallback(async (term: string) => {
    if (!commandState || !term.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (commandState.type === 'cie') {
        const response = await api.get('/health/diagnosticos', {
          params: { search: term, limit: 10 }
        });
        setResults(response.data.items || []);
      }
      if (commandState.type === 'med') {
        const response = await api.get('/health/medicamentos', {
          params: { search: term, limit: 10 }
        });
        setResults(response.data.items || []);
      }
    } catch {
      setError('Error al buscar. Verifique su conexión e intente de nuevo.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [commandState]);

  const insertBadge = useCallback((payload: {
    kind: 'cie' | 'med' | 'lab' | 'rx';
    refId?: number | null;
    label: string;
    meta?: Record<string, unknown> | null;
  }) => {
    if (!editor || !commandState) return;
    editor
      .chain()
      .focus()
      .deleteRange(commandState.range)
      .insertContent({
        type: 'clinicalBadge',
        attrs: {
          kind: payload.kind,
          refId: payload.refId ?? null,
          label: payload.label,
          meta: payload.meta ?? null
        }
      })
      .run();
    handleClose();
  }, [editor, commandState]);

  // Called when user clicks a search result
  const handleSelectResult = useCallback((item: DiagnosticoItem | MedicamentoItem) => {
    if (!commandState) return;
    if (commandState.type === 'cie') {
      const diag = item as DiagnosticoItem;
      insertBadge({
        kind: 'cie',
        refId: diag.id,
        label: `${diag.codigo_cie10} ${diag.descripcion}`,
        meta: { tipo_diagnostico: tipoDiagnostico }
      });
    }
    if (commandState.type === 'med') {
      // Don't insert yet — let user review / adjust dosage then confirm
      setSelectedMed(item as MedicamentoItem);
    }
  }, [commandState, tipoDiagnostico, insertBadge]);

  // Final insert for med after dosage fields are confirmed
  const handleInsertMed = useCallback(() => {
    if (!selectedMed || !commandState) return;
    insertBadge({
      kind: 'med',
      refId: selectedMed.medicamento_id ?? selectedMed.producto_id,
      label: selectedMed.nombre,
      meta: {
        producto_id: selectedMed.producto_id,
        medicamento_id: selectedMed.medicamento_id ?? null,
        dosis: meta.dosis || '',
        via: meta.via || selectedMed.via_administracion || '',
        frecuencia: meta.frecuencia || '',
        duracion: meta.duracion || '',
        cantidad: meta.cantidad ? Number(meta.cantidad) : null,
        indicaciones: meta.indicaciones || ''
      }
    });
  }, [selectedMed, commandState, meta, insertBadge]);

  const handleQuickInsert = useCallback(() => {
    if (!commandState) return;
    if (commandState.type === 'lab') {
      insertBadge({
        kind: 'lab',
        label: meta.tipo_solicitud || 'Orden de laboratorio',
        meta: {
          tipo_solicitud: meta.tipo_solicitud || '',
          prioridad: meta.prioridad || 'NORMAL',
          observaciones: meta.observaciones || ''
        }
      });
    }
    if (commandState.type === 'rx') {
      insertBadge({
        kind: 'rx',
        label: meta.estudio || 'Orden imagenología',
        meta: {
          estudio: meta.estudio || '',
          prioridad: meta.prioridad || 'NORMAL',
          observaciones: meta.observaciones || ''
        }
      });
    }
  }, [commandState, meta, insertBadge]);

  const setMetaField = (key: string, value: string) =>
    setMeta((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="rounded-2xl border border-white/10 bg-panel shadow-panel overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-panel-2 px-6 py-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted">Clinical Canvas</div>
          <div className="text-xs text-muted">
            Use{' '}
            <span className="text-badge-cie">/cie</span>,{' '}
            <span className="text-badge-med">/med</span>,{' '}
            <span className="text-badge-lab">/lab</span>,{' '}
            <span className="text-badge-rx">/rx</span>{' '}
            para insertar elementos clínicos
          </div>
        </div>
      </div>

      {/* Editor area */}
      <div className="px-6 py-5 min-h-[360px]">
        {editor && <EditorContent editor={editor} />}
      </div>

      {/* Command modal */}
      {commandState && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/70"
          onClick={handleClose}
        >
          <div
            className="w-[min(540px,94vw)] rounded-2xl border border-white/10 bg-panel p-5 shadow-panelLg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">{title}</h3>
              <button
                className="text-muted hover:text-ink-contrast transition-colors text-xl leading-none"
                onClick={handleClose}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            {/* ── CIE / MED: search panel ── */}
            {(commandState.type === 'cie' || commandState.type === 'med') && (
              <div className="grid gap-3">

                {/* Search input */}
                <div>
                  <label className="text-xs text-muted">Buscar</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      ref={searchInputRef}
                      className="flex-1 rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast placeholder:text-muted focus:border-white/30 focus:outline-none"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          doSearch(query);
                        }
                      }}
                      placeholder={
                        commandState.type === 'cie'
                          ? 'Código o nombre del diagnóstico…'
                          : 'Nombre genérico o comercial…'
                      }
                    />
                    <button
                      className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-[#041b14] disabled:opacity-50"
                      onClick={() => doSearch(query)}
                      disabled={loading || !query.trim()}
                    >
                      {loading ? '…' : 'Buscar'}
                    </button>
                  </div>
                </div>

                {/* CIE-10: tipo diagnóstico */}
                {commandState.type === 'cie' && (
                  <div>
                    <label className="text-xs text-muted">Tipo de diagnóstico</label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {TIPO_DIAGNOSTICO_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setTipoDiagnostico(opt)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            tipoDiagnostico === opt
                              ? 'border-accent bg-accent/20 text-accent'
                              : 'border-white/20 text-muted hover:border-white/40 hover:text-ink-contrast'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* MED: dosage fields */}
                {commandState.type === 'med' && (
                  <>
                    {/* Selected med chip */}
                    {selectedMed && (
                      <div className="flex items-center gap-2 rounded-xl border border-badge-med/40 bg-badge-med/10 px-3 py-2">
                        <span className="text-xs text-badge-med font-semibold flex-1 truncate">
                          ✓ {selectedMed.nombre}
                          {selectedMed.concentracion ? ` · ${selectedMed.concentracion}` : ''}
                          {selectedMed.forma_farmaceutica ? ` · ${selectedMed.forma_farmaceutica}` : ''}
                        </span>
                        <button
                          className="text-muted hover:text-ink-contrast text-xs"
                          onClick={() => setSelectedMed(null)}
                        >
                          cambiar
                        </button>
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-muted">Dosis</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast placeholder:text-muted focus:border-white/30 focus:outline-none"
                          value={meta.dosis || ''}
                          placeholder="Ej: 500mg"
                          onChange={(e) => setMetaField('dosis', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted">Frecuencia</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast placeholder:text-muted focus:border-white/30 focus:outline-none"
                          value={meta.frecuencia || ''}
                          placeholder="Ej: cada 8h"
                          onChange={(e) => setMetaField('frecuencia', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted">Vía</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast placeholder:text-muted focus:border-white/30 focus:outline-none"
                          value={meta.via || ''}
                          placeholder="Ej: Oral"
                          onChange={(e) => setMetaField('via', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted">Duración</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast placeholder:text-muted focus:border-white/30 focus:outline-none"
                          value={meta.duracion || ''}
                          placeholder="Ej: 7 días"
                          onChange={(e) => setMetaField('duracion', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted">Cantidad</label>
                        <input
                          type="number"
                          min={1}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast placeholder:text-muted focus:border-white/30 focus:outline-none"
                          value={meta.cantidad || ''}
                          placeholder="Unidades"
                          onChange={(e) => setMetaField('cantidad', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted">Indicaciones</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast placeholder:text-muted focus:border-white/30 focus:outline-none"
                          value={meta.indicaciones || ''}
                          placeholder="Ej: con alimentos"
                          onChange={(e) => setMetaField('indicaciones', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {commandState.type === 'med' && selectedMed && (
                    <button
                      className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-[#041b14]"
                      onClick={handleInsertMed}
                    >
                      Insertar medicamento
                    </button>
                  )}
                  <button
                    className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-ink-contrast hover:border-white/40 transition-colors"
                    onClick={handleClose}
                  >
                    Cancelar
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {error}
                  </div>
                )}

                {/* Results list */}
                <div className="grid gap-1.5 max-h-52 overflow-y-auto pr-0.5">
                  {loading && (
                    <div className="text-xs text-muted py-2 text-center animate-pulse">
                      Buscando…
                    </div>
                  )}
                  {!loading && results.length === 0 && query.trim() && !error && (
                    <div className="text-xs text-muted py-2 text-center">
                      Sin resultados para "{query}"
                    </div>
                  )}
                  {!loading && results.map((item) => {
                    const isSelected =
                      commandState.type === 'med' &&
                      selectedMed &&
                      (item as MedicamentoItem).producto_id === selectedMed.producto_id;

                    return (
                      <button
                        key={
                          'id' in item
                            ? `cie-${item.id}`
                            : `med-${item.producto_id}`
                        }
                        className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
                          isSelected
                            ? 'border-badge-med/50 bg-badge-med/15 text-ink-contrast'
                            : 'border-white/10 hover:border-white/30 hover:bg-white/5 text-ink-contrast'
                        }`}
                        onClick={() => handleSelectResult(item)}
                      >
                        {'codigo_cie10' in item ? (
                          <span>
                            <span className="font-mono text-accent mr-2">{item.codigo_cie10}</span>
                            {item.descripcion}
                          </span>
                        ) : (
                          <span>
                            <span className="font-semibold">{item.nombre}</span>
                            {item.principio_activo && (
                              <span className="text-muted ml-2 text-xs">{item.principio_activo}</span>
                            )}
                            {item.concentracion && (
                              <span className="text-muted ml-1 text-xs">· {item.concentracion}</span>
                            )}
                            {item.forma_farmaceutica && (
                              <span className="text-muted ml-1 text-xs">· {item.forma_farmaceutica}</span>
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── LAB / RX: quick order panel ── */}
            {(commandState.type === 'lab' || commandState.type === 'rx') && (
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {commandState.type === 'lab' ? (
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted">Tipo de solicitud</label>
                      <input
                        className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast placeholder:text-muted focus:border-white/30 focus:outline-none"
                        value={meta.tipo_solicitud || ''}
                        placeholder="Ej: Biometría hemática, Glucosa basal…"
                        autoFocus
                        onChange={(e) => setMetaField('tipo_solicitud', e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted">Estudio</label>
                      <input
                        className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast placeholder:text-muted focus:border-white/30 focus:outline-none"
                        value={meta.estudio || ''}
                        placeholder="Ej: Radiografía tórax PA, Eco abdominal…"
                        autoFocus
                        onChange={(e) => setMetaField('estudio', e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-muted">Prioridad</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast focus:border-white/30 focus:outline-none"
                      value={meta.prioridad || 'NORMAL'}
                      onChange={(e) => setMetaField('prioridad', e.target.value)}
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="ALTA">Alta</option>
                      <option value="URGENTE">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-muted">Observaciones</label>
                    <textarea
                      className="mt-1 w-full rounded-xl border border-white/10 bg-ink-2 px-3 py-2 text-sm text-ink-contrast placeholder:text-muted focus:border-white/30 focus:outline-none resize-none"
                      value={meta.observaciones || ''}
                      placeholder="Indicaciones adicionales…"
                      onChange={(e) => setMetaField('observaciones', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-[#041b14] disabled:opacity-50"
                    onClick={handleQuickInsert}
                    disabled={
                      commandState.type === 'lab' ? !meta.tipo_solicitud?.trim() : !meta.estudio?.trim()
                    }
                  >
                    Insertar orden
                  </button>
                  <button
                    className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-ink-contrast hover:border-white/40 transition-colors"
                    onClick={handleClose}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

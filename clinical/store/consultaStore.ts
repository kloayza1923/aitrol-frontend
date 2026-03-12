import { create } from 'zustand';

export type SignosVitales = {
  temperatura: string;
  presionSistolica: string;
  presionDiastolica: string;
  frecuenciaCardiaca: string;
  frecuenciaRespiratoria: string;
  saturacionOxigeno: string;
  peso: string;
  talla: string;
  imc: string;
  glicemia: string;
};

export type DiagnosticoConsulta = {
  id: string;
  diagnosticoId: number;
  codigoCie10: string;
  descripcion: string;
  tipoDiagnostico: 'PRINCIPAL' | 'SECUNDARIO' | 'PRESUNTIVO';
  observaciones: string;
};

export type RecetaItem = {
  id: string;
  productoId: number;
  medicamentoId?: number | null;
  nombre: string;
  dosis: string;
  via: string;
  frecuencia: string;
  duracion: string;
  cantidad: number;
  indicaciones: string;
};

export type OrdenLab = {
  id: string;
  tipoSolicitud: string;
  prioridad: 'NORMAL' | 'ALTA' | 'URGENTE';
  observaciones: string;
};

export type OrdenRx = {
  id: string;
  estudio: string;
  prioridad: 'NORMAL' | 'ALTA' | 'URGENTE';
  observaciones: string;
};

export type PacienteInfo = {
  id: number;
  codigoPaciente?: string | null;
  nombreCompleto: string;
  tipoSangre?: string | null;
  alergias?: string[] | null;
  antecedentes?: Record<string, string> | null;
  identificacion?: string | null;
  sexo?: string | null;
  fechaNacimiento?: string | null;
  telefono?: string | null;
  email?: string | null;
};

export type DoctorInfo = {
  id: number;
  nombreCompleto: string;
  especialidad?: string | null;
  codigoPersonal?: string | null;
};

export type CitaInfo = {
  id: number;
  fechaHora: string;
  motivo?: string | null;
  tipo?: string | null;
  estado: string;
  duracionMinutos?: number | null;
  doctor?: DoctorInfo;
};

export type HistorialItem = {
  id: number;
  fecha: string;
  tipo: string;
  diagnosticoPrincipal?: string | null;
  resumen?: string | null;
};

type ConsultaTab = 'evolucion' | 'diagnosticos' | 'ordenes' | 'receta';

interface ConsultaState {
  paciente: PacienteInfo | null;
  cita: CitaInfo | null;
  historial: HistorialItem[];

  motivoConsulta: string;
  enfermedadActual: string;
  revisionSistemas: string;
  resumen: string;
  planTratamiento: string;
  evolucionJSON: Record<string, unknown>;

  signosVitales: SignosVitales;

  diagnosticos: DiagnosticoConsulta[];

  recetaMotivo: string;
  recetaDiagnostico: string;
  recetaItems: RecetaItem[];

  ordenesLab: OrdenLab[];
  ordenesRx: OrdenRx[];

  activeTab: ConsultaTab;
  isSaving: boolean;
  isDirty: boolean;
  showPatientSelector: boolean;

  setPaciente: (paciente: PacienteInfo | null) => void;
  setCita: (cita: CitaInfo | null) => void;
  setHistorial: (historial: HistorialItem[]) => void;

  setMotivoConsulta: (value: string) => void;
  setEnfermedadActual: (value: string) => void;
  setRevisionSistemas: (value: string) => void;
  setResumen: (value: string) => void;
  setPlanTratamiento: (value: string) => void;
  setEvolucionJSON: (json: Record<string, unknown>) => void;

  setSignoVital: (key: keyof SignosVitales, value: string) => void;
  setSignosVitales: (vitals: Partial<SignosVitales>) => void;

  addDiagnostico: (diagnostico: DiagnosticoConsulta) => void;
  updateDiagnostico: (id: string, data: Partial<DiagnosticoConsulta>) => void;
  removeDiagnostico: (id: string) => void;

  setRecetaMotivo: (value: string) => void;
  setRecetaDiagnostico: (value: string) => void;
  addRecetaItem: (item: RecetaItem) => void;
  updateRecetaItem: (id: string, data: Partial<RecetaItem>) => void;
  removeRecetaItem: (id: string) => void;

  addOrdenLab: (orden: OrdenLab) => void;
  updateOrdenLab: (id: string, data: Partial<OrdenLab>) => void;
  removeOrdenLab: (id: string) => void;

  addOrdenRx: (orden: OrdenRx) => void;
  updateOrdenRx: (id: string, data: Partial<OrdenRx>) => void;
  removeOrdenRx: (id: string) => void;

  setActiveTab: (tab: ConsultaTab) => void;
  setIsSaving: (value: boolean) => void;
  setShowPatientSelector: (value: boolean) => void;

  resetConsulta: () => void;
  getPayload: () => Record<string, unknown>;
}

const initialSignosVitales: SignosVitales = {
  temperatura: '',
  presionSistolica: '',
  presionDiastolica: '',
  frecuenciaCardiaca: '',
  frecuenciaRespiratoria: '',
  saturacionOxigeno: '',
  peso: '',
  talla: '',
  imc: '',
  glicemia: '',
};

const initialState = {
  paciente: null,
  cita: null,
  historial: [],
  motivoConsulta: '',
  enfermedadActual: '',
  revisionSistemas: '',
  resumen: '',
  planTratamiento: '',
  evolucionJSON: {},
  signosVitales: { ...initialSignosVitales },
  diagnosticos: [],
  recetaMotivo: '',
  recetaDiagnostico: '',
  recetaItems: [],
  ordenesLab: [],
  ordenesRx: [],
  activeTab: 'evolucion' as ConsultaTab,
  isSaving: false,
  isDirty: false,
  showPatientSelector: false,
};

export const useConsultaStore = create<ConsultaState>((set, get) => ({
  ...initialState,

  setPaciente: (paciente) => set({ paciente, isDirty: true }),
  setCita: (cita) => set({ cita }),
  setHistorial: (historial) => set({ historial }),

  setMotivoConsulta: (value) => set({ motivoConsulta: value, isDirty: true }),
  setEnfermedadActual: (value) => set({ enfermedadActual: value, isDirty: true }),
  setRevisionSistemas: (value) => set({ revisionSistemas: value, isDirty: true }),
  setResumen: (value) => set({ resumen: value, isDirty: true }),
  setPlanTratamiento: (value) => set({ planTratamiento: value, isDirty: true }),
  setEvolucionJSON: (json) => set({ evolucionJSON: json, isDirty: true }),

  setSignoVital: (key, value) =>
    set((state) => ({
      signosVitales: { ...state.signosVitales, [key]: value },
      isDirty: true,
    })),
  setSignosVitales: (vitals) =>
    set((state) => ({
      signosVitales: { ...state.signosVitales, ...vitals },
      isDirty: true,
    })),

  addDiagnostico: (diagnostico) =>
    set((state) => ({
      diagnosticos: [...state.diagnosticos, diagnostico],
      isDirty: true,
    })),
  updateDiagnostico: (id, data) =>
    set((state) => ({
      diagnosticos: state.diagnosticos.map((d) =>
        d.id === id ? { ...d, ...data } : d
      ),
      isDirty: true,
    })),
  removeDiagnostico: (id) =>
    set((state) => ({
      diagnosticos: state.diagnosticos.filter((d) => d.id !== id),
      isDirty: true,
    })),

  setRecetaMotivo: (value) => set({ recetaMotivo: value, isDirty: true }),
  setRecetaDiagnostico: (value) => set({ recetaDiagnostico: value, isDirty: true }),
  addRecetaItem: (item) =>
    set((state) => ({
      recetaItems: [...state.recetaItems, item],
      isDirty: true,
    })),
  updateRecetaItem: (id, data) =>
    set((state) => ({
      recetaItems: state.recetaItems.map((r) =>
        r.id === id ? { ...r, ...data } : r
      ),
      isDirty: true,
    })),
  removeRecetaItem: (id) =>
    set((state) => ({
      recetaItems: state.recetaItems.filter((r) => r.id !== id),
      isDirty: true,
    })),

  addOrdenLab: (orden) =>
    set((state) => ({
      ordenesLab: [...state.ordenesLab, orden],
      isDirty: true,
    })),
  updateOrdenLab: (id, data) =>
    set((state) => ({
      ordenesLab: state.ordenesLab.map((o) =>
        o.id === id ? { ...o, ...data } : o
      ),
      isDirty: true,
    })),
  removeOrdenLab: (id) =>
    set((state) => ({
      ordenesLab: state.ordenesLab.filter((o) => o.id !== id),
      isDirty: true,
    })),

  addOrdenRx: (orden) =>
    set((state) => ({
      ordenesRx: [...state.ordenesRx, orden],
      isDirty: true,
    })),
  updateOrdenRx: (id, data) =>
    set((state) => ({
      ordenesRx: state.ordenesRx.map((o) =>
        o.id === id ? { ...o, ...data } : o
      ),
      isDirty: true,
    })),
  removeOrdenRx: (id) =>
    set((state) => ({
      ordenesRx: state.ordenesRx.filter((o) => o.id !== id),
      isDirty: true,
    })),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsSaving: (value) => set({ isSaving: value }),
  setShowPatientSelector: (value) => set({ showPatientSelector: value }),

  resetConsulta: () => set({ ...initialState }),

  getPayload: () => {
    const state = get();
    return {
      paciente_id: state.paciente?.id,
      cita_id: state.cita?.id,
      motivo_consulta: state.motivoConsulta,
      enfermedad_actual: state.enfermedadActual,
      revision_sistemas: state.revisionSistemas,
      resumen: state.resumen,
      plan_tratamiento: state.planTratamiento,
      evolucion: state.evolucionJSON,
      receta_motivo: state.recetaMotivo,
      receta_diagnostico: state.recetaDiagnostico,
      diagnosticos: state.diagnosticos.map((d) => ({
        diagnostico_id: d.diagnosticoId,
        tipo_diagnostico: d.tipoDiagnostico,
        observaciones: d.observaciones,
      })),
      receta_detalle: state.recetaItems.map((r) => ({
        producto_id: r.productoId,
        medicamento_id: r.medicamentoId,
        dosis: r.dosis,
        via: r.via,
        frecuencia: r.frecuencia,
        duracion: r.duracion,
        cantidad: r.cantidad,
        indicaciones: r.indicaciones,
      })),
      ordenes_laboratorio: state.ordenesLab.map((o) => ({
        tipo_solicitud: o.tipoSolicitud,
        prioridad: o.prioridad,
        observaciones: o.observaciones,
      })),
      ordenes_imagenologia: state.ordenesRx.map((o) => ({
        estudio: o.estudio,
        prioridad: o.prioridad,
        observaciones: o.observaciones,
      })),
    };
  },
}));

export const generateId = () => Math.random().toString(36).substring(2, 9);

export type DiagnosticoItem = {
  id: number;
  codigo_cie10: string;
  descripcion: string;
};

export type MedicamentoItem = {
  producto_id: number;
  nombre: string;
  codigo_barra?: string | null;
  descripcion?: string | null;
  unidad_medida?: string | null;
  precio_venta?: number | null;
  medicamento_id?: number | null;
  principio_activo?: string | null;
  concentracion?: string | null;
  presentacion?: string | null;
  via_administracion?: string | null;
  requiere_receta?: boolean | null;
  controlado?: boolean | null;
};

export type PacienteSidebar = {
  id: number;
  codigo_paciente?: string | null;
  tipo_sangre?: string | null;
  alergias?: Record<string, string> | string[] | null;
  antecedentes?: Record<string, string> | string[] | null;
  persona?: {
    nombre_completo?: string | null;
    identificacion?: string | null;
    sexo?: string | null;
    fecha_nacimiento?: string | null;
  } | null;
};

export type SignoVitalItem = {
  id: number;
  paciente_id: number;
  nombre: string;
  valor: string;
  unidad?: string | null;
  fecha_hora?: string | null;
};

export type FinalizeResponse = {
  encuentro_id: number;
  consulta_id: number;
  historia_id: number;
  receta_id?: number | null;
  ordenes_laboratorio?: number[];
  ordenes_imagenologia?: number[];
  cita_actualizada?: number | null;
};

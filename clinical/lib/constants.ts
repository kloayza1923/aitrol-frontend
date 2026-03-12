// ─── Agenda ───────────────────────────────────────────────────────────────────
export const HORA_INICIO_AGENDA = 7;
export const HORA_FIN_AGENDA = 19;
export const DURACION_CITA_DEFAULT = 30; // minutos
export const SLOTS_AGENDA = HORA_FIN_AGENDA - HORA_INICIO_AGENDA + 1; // 13

// ─── Localización ─────────────────────────────────────────────────────────────
export const LOCALE_DEFAULT = 'es-EC';

// ─── App identity ─────────────────────────────────────────────────────────────
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Aitrol Clinical';
export const APP_LOGO_URL = process.env.NEXT_PUBLIC_APP_LOGO_URL || '';

// ─── Órdenes de laboratorio ───────────────────────────────────────────────────
export const EXAMENES_LAB_COMUNES: string[] = [
  'Hemograma completo',
  'Glucosa en ayunas',
  'Perfil lipidico',
  'Creatinina',
  'Urea',
  'Acido urico',
  'Perfil hepatico',
  'TSH',
  'Orina completa',
  'PCR',
];

// ─── Órdenes de imagenología ──────────────────────────────────────────────────
export const ESTUDIOS_RX_COMUNES: string[] = [
  'Radiografia de torax PA',
  'Radiografia de torax LAT',
  'Ecografia abdominal',
  'Ecografia pelvica',
  'Tomografia craneal',
  'Resonancia magnetica',
  'Electrocardiograma',
  'Ecocardiograma',
];

// ─── Receta ────────────────────────────────────────────────────────────────────
export const FRECUENCIAS_COMUNES: string[] = [
  'Cada 6 horas',
  'Cada 8 horas',
  'Cada 12 horas',
  'Cada 24 horas',
  'Una vez al dia',
  'Dos veces al dia',
  'Tres veces al dia',
];

export const VIAS_COMUNES: string[] = [
  'Oral',
  'Sublingual',
  'Intramuscular',
  'Intravenosa',
  'Topica',
  'Rectal',
  'Inhalada',
];

export const DURACIONES_COMUNES: string[] = [
  '3 dias',
  '5 dias',
  '7 dias',
  '10 dias',
  '14 dias',
  '21 dias',
  '30 dias',
];

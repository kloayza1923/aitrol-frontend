import * as yup from 'yup';

export const personaSchema = yup.object().shape({
  tipo_identificacion: yup.string().required('Tipo de identificación es requerido'),
  identificacion: yup.string().required('Identificación es requerida'),
  primer_nombre: yup.string().nullable(),
  segundo_nombre: yup.string().nullable(),
  primer_apellido: yup.string().nullable(),
  segundo_apellido: yup.string().nullable(),
  fecha_nacimiento: yup.date().nullable().typeError('Fecha inválida'),
  sexo: yup.string().nullable(),
  lugar_nacimiento: yup.string().nullable(),
  nacionalidad: yup.string().nullable(),
  estado_civil: yup.string().nullable(),
  direccion: yup.string().nullable(),
  telefono_local: yup.string().nullable(),
  telefono_movil: yup.string().nullable(),
  email: yup.string().email('Email inválido').nullable(),
  foto_url: yup.string().nullable(),
  grupo_etnico: yup.string().nullable()
});

export const aseguradoraSchema = yup.object().shape({
  nombre: yup.string().required('Nombre es requerido'),
  tipo: yup.string().nullable(),
  codigo: yup.string().nullable(),
  direccion: yup.string().nullable(),
  telefono: yup.string().nullable(),
  email: yup.string().email('Email inválido').nullable()
});

export const pacienteSchema = yup.object().shape({
  persona_id: yup
    .number()
    .required('Persona ID es requerido')
    .typeError('Persona ID debe ser un número'),
  codigo_paciente: yup.string().nullable(),
  tipo_sangre: yup.string().nullable(),
  alergias: yup.object().nullable(),
  antecedentes: yup.object().nullable(),
  nombre_contacto_legal: yup.string().nullable(),
  telefono_contacto_legal: yup.string().nullable()
});

export const personalSchema = yup.object().shape({
  persona_id: yup
    .number()
    .required('Persona ID es requerido')
    .typeError('Persona ID debe ser un número'),
  codigo_personal: yup.string().nullable(),
  tipo_personal: yup.string().nullable(),
  especialidad: yup.string().nullable(),
  registro_senescyt: yup.string().nullable(),
  registro_msp: yup.string().nullable(),
  licencia_activa: yup.boolean().nullable(),
  disponibilidad: yup.object().nullable(),
  correo_institucional: yup.string().email('Email inválido').nullable(),
  telefono_institucional: yup.string().nullable()
});

export const cie10Schema = yup.object().shape({
  codigo: yup.string().required('El código CIE-10 es requerido'),
  nombre: yup.string().required('El nombre / diagnóstico es requerido'),
  descripcion: yup.string().nullable(),
  categoria: yup.string().nullable(),
  capitulo: yup.string().nullable(),
  tipo: yup.string().nullable(),
  estado: yup.string().nullable()
});

export const medicamentoSchema = yup.object().shape({
  codigo: yup.string().nullable(),
  nombre_generico: yup.string().required('El nombre genérico es requerido'),
  nombre_comercial: yup.string().nullable(),
  principio_activo: yup.string().nullable(),
  forma_farmaceutica: yup.string().nullable(),
  concentracion: yup.string().nullable(),
  via_administracion: yup.string().nullable(),
  categoria_terapeutica: yup.string().nullable(),
  presentacion: yup.string().nullable(),
  unidad_medida: yup.string().nullable(),
  codigo_atc: yup.string().nullable(),
  requiere_receta: yup.boolean().nullable(),
  estado: yup.string().nullable()
});

export default {
  personaSchema,
  aseguradoraSchema,
  pacienteSchema,
  personalSchema,
  cie10Schema,
  medicamentoSchema
};

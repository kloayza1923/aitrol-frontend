import * as Yup from 'yup';

export const permissionSchema = Yup.object().shape({
  empleado_id: Yup.number().required('El empleado es obligatorio'),
  tipo_permiso: Yup.string().required('El tipo de permiso es obligatorio'),
  fecha_inicio: Yup.date().required('La fecha de inicio es obligatoria'),
  fecha_fin: Yup.date()
    .required('La fecha de fin es obligatoria')
    .min(Yup.ref('fecha_inicio'), 'La fecha de fin no puede ser anterior a la fecha de inicio'),
  motivo: Yup.string().max(255, 'El motivo no puede exceder 255 caracteres')
});

export const roleSchema = Yup.object().shape({
  tipo_rol: Yup.string().required('El tipo de rol es obligatorio'),
  mes_correspondiente: Yup.number()
    .required('El mes correspondiente es obligatorio')
    .min(1, 'El mes debe ser entre 1 y 12')
    .max(12, 'El mes debe ser entre 1 y 12'),
  anio_correspondiente: Yup.number()
    .required('El año correspondiente es obligatorio')
    .min(2000, 'El año debe ser posterior a 2000')
    .max(new Date().getFullYear(), 'El año no puede ser mayor al año actual'),
  empleados: Yup.array().of(Yup.number()).min(1, 'Debe seleccionar al menos un empleado')
});
export const permissionRequestSchema = Yup.object().shape({
  empleado_id: Yup.number()
    .required('El empleado es obligatorio')
    .min(1, 'El empleado es obligatorio'),
  tipo_permiso: Yup.string().required('El tipo de permiso es obligatorio'),
  fecha_inicio: Yup.date()
    .required('La fecha de inicio es obligatoria')
    .min(new Date(), 'La fecha de inicio no puede ser en el pasado'),
  fecha_fin: Yup.date()
    .required('La fecha de fin es obligatoria')
    .min(Yup.ref('fecha_inicio'), 'La fecha de fin no puede ser anterior a la fecha de inicio'),
  motivo: Yup.string().max(255, 'El motivo no puede exceder 255 caracteres')
});

export const vacationSchema = Yup.object().shape({
  empleado_id: Yup.number().required('El empleado es obligatorio'),
  fecha_inicio: Yup.date().required('La fecha de inicio es obligatoria'),
  fecha_fin: Yup.date()
    .required('La fecha de fin es obligatoria')
    .min(Yup.ref('fecha_inicio'), 'La fecha de fin no puede ser anterior a la fecha de inicio'),
  dias_solicitados: Yup.number()
    .required('Los días solicitados son obligatorios')
    .min(1, 'Debe solicitar al menos 1 día')
    .max(30, 'No puede solicitar más de 30 días a la vez'),
  motivo: Yup.string().max(255, 'El motivo no puede exceder 255 caracteres')
});

export const areaSchema = Yup.object().shape({
  nombre: Yup.string()
    .required('El nombre del área es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: Yup.string().max(255, 'La descripción no puede exceder 255 caracteres')
});
export const employeeSchema = Yup.object().shape({
  nombres: Yup.string()
    .required('Los nombres son obligatorios')
    .max(100, 'Los nombres no pueden exceder 100 caracteres'),
  apellidos: Yup.string()
    .required('Los apellidos son obligatorios')
    .max(100, 'Los apellidos no pueden exceder 100 caracteres'),
  fecha_ingreso: Yup.date().required('La fecha de ingreso es obligatoria'),
  cedula: Yup.string()
    .required('La cédula es obligatoria')
    .max(13, 'La cédula no puede exceder 13 caracteres'),
  sueldo_basico: Yup.number()
    .required('El sueldo básico es obligatorio')
    .min(0, 'El sueldo básico no puede ser negativo'),
  area_id: Yup.number().required('El área es obligatoria'),
  cargo: Yup.string()
    .required('El cargo es obligatorio')
    .max(100, 'El cargo no puede exceder 100 caracteres'),
  fecha_nacimiento: Yup.date()
    .required('La fecha de nacimiento es obligatoria')
    .max(new Date(), 'La fecha de nacimiento no puede ser en el futuro'),
  direccion: Yup.string().max(255, 'La dirección no puede exceder 255 caracteres'),
  telefono: Yup.string().max(20, 'El teléfono no puede exceder 20 caracteres'),
  email: Yup.string()
    .required('El correo electrónico es obligatorio')
    .email('El correo electrónico no es válido')
    .max(100, 'El correo electrónico no puede exceder 100 caracteres'),
  cuenta_bancaria: Yup.string()
    .required('La cuenta bancaria es obligatoria')
    .max(30, 'La cuenta bancaria no puede exceder 30 caracteres'),
  tipo_cuenta_bancaria: Yup.string()
    .required('El tipo de cuenta bancaria es obligatorio')
    .max(20, 'El tipo de cuenta bancaria no puede exceder 20 caracteres'),
  usuario_id: Yup.number().required('El usuario es obligatorio'),
  acumula: Yup.boolean().required('El campo acumula es obligatorio'),
  hora_entrada: Yup.string().required('La hora de entrada es obligatoria'),
  hora_salida: Yup.string().required('La hora de salida es obligatoria'),
  cargo_id: Yup.number().required('El cargo es obligatorio')
});
export const hierarchicalLevelSchema = Yup.object().shape({
  nombre: Yup.string()
    .required('El nombre es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: Yup.string().max(255, 'La descripción no puede exceder 255 caracteres'),
  estado: Yup.boolean().required('El estado es obligatorio'),
  nivel_orden: Yup.number()
    .required('El nivel/orden es obligatorio')
    .min(1, 'El nivel/orden debe ser al menos 1')
});
export const cargoSchema = Yup.object().shape({
  nombre: Yup.string()
    .required('El nombre es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: Yup.string().max(255, 'La descripción no puede exceder 255 caracteres'),
  nivel_jerarquico_id: Yup.number()
    .required('El nivel jerárquico es obligatorio')
    .min(1, 'Debe seleccionar un nivel jerárquico válido')
    .typeError('El nivel jerárquico es obligatorio'),
  estado: Yup.boolean().required('El estado es obligatorio'),
  sueldo_minimo: Yup.number()
    .required('El sueldo mínimo es obligatorio')
    .min(0, 'El sueldo mínimo no puede ser negativo'),
  sueldo_maximo: Yup.number()
    .required('El sueldo máximo es obligatorio')
    .min(Yup.ref('sueldo_minimo'), 'El sueldo máximo debe ser mayor o igual al sueldo mínimo')
});
export const contractSchema = Yup.object().shape({
  empleado_id: Yup.number()
    .required('El empleado es obligatorio')
    .min(1, 'El empleado es obligatorio'),
  cargo_id: Yup.number().required('El cargo es obligatorio').min(1, 'El cargo es obligatorio'),
  fecha_inicio: Yup.date().required('La fecha de inicio es obligatoria'),
  fecha_fin: Yup.date()
    .nullable()
    .min(Yup.ref('fecha_inicio'), 'La fecha de fin debe ser posterior a la fecha de inicio')
    .notRequired(),
  sueldo_base: Yup.number()
    .required('El sueldo base es obligatorio')
    .min(400, 'El sueldo base no puede ser menor a 400'),
  tipo_contrato: Yup.string()
    .required('El tipo de contrato es obligatorio')
    .max(50, 'El tipo de contrato no puede exceder 50 caracteres'),
  estado: Yup.string()
    .required('El estado es obligatorio')
    .oneOf(['Activo', 'Inactivo'], 'El estado debe ser Activo o Inactivo'),
  observaciones: Yup.string()
    .max(255, 'Las observaciones no pueden exceder 255 caracteres')
    .notRequired()
});

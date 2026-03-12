import * as Yup from 'yup';
export const userSchema = Yup.object({
  nombre: Yup.string().required('El nombre es obligatorio'),
  email: Yup.string().email('Email inválido').required('El email es obligatorio'),
  nombre_usuario: Yup.string().required('El nombre de usuario es obligatorio'),
  apellido: Yup.string().required('El apellido es obligatorio'),
  fecha_nacimiento: Yup.date()
    .required('La fecha de nacimiento es obligatoria')
    .typeError('Fecha inválida (YYYY-MM-DD)')
    .max(new Date(), 'La fecha de nacimiento no puede ser en el futuro')
    .min(new Date(1900, 0, 1), 'La fecha de nacimiento no puede ser antes de 1900-01-01'),
  telefono: Yup.string().required('El teléfono es obligatorio').nullable(),
  rol_id: Yup.number().required('El rol es obligatorio').nullable()
});

export const notificationSchema = Yup.object({
  tipo: Yup.string().required('El tipo es obligatorio'),
  titulo: Yup.string().required('El título es obligatorio'),
  mensaje: Yup.string().required('El mensaje es obligatorio'),
  estado: Yup.string()
    .oneOf(['activo', 'inactivo', 'archivado'], 'Estado inválido')
    .required('El estado es obligatorio')
});

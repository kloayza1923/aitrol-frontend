import * as Yup from 'yup';

// ======================
//  Áreas
// ======================
export const areaSchema = Yup.object({
  nombre: Yup.string()
    .required('El nombre es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  descripcion: Yup.string()
    .required('La descripción es obligatoria')
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(255, 'La descripción no puede superar 255 caracteres')
});

// ======================
//  Marcas
// ======================
export const brandSchema = Yup.object({
  nombre: Yup.string()
    .required('El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  descripcion: Yup.string()
    .required('La descripción es obligatoria')
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(255, 'La descripción no puede superar 255 caracteres')
});

// ======================
//  Categorías
// ======================
export const categorySchema = Yup.object({
  nombre: Yup.string()
    .required('El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  descripcion: Yup.string()
    .required('La descripción es obligatoria')
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(255, 'La descripción no puede superar 255 caracteres')
});

// ======================
//  Clientes
// ======================
export const clientsSchema = Yup.object({
  nombre: Yup.string()
    .required('El nombre es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'El nombre no puede superar 200 caracteres'),
  identificacion: Yup.string()
    .required('El campo identificación es obligatorio')
    .matches(/^[0-9]+$/, 'La identificación solo puede contener números')
    .min(10, 'La identificación debe tener al menos 10 dígitos')
    .max(13, 'La identificación no puede superar 13 dígitos'),
  direccion: Yup.string()
    .required('La dirección es obligatoria')
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(300, 'La dirección no puede superar 300 caracteres'),
  telefono: Yup.string()
    .required('El teléfono es obligatorio')
    .matches(/^[0-9]{7,15}$/, 'El teléfono debe tener entre 7 y 15 dígitos'),
  email: Yup.string()
    .required('El email es obligatorio')
    .email('Debe ser un email válido')
    .max(150, 'El email no puede superar 150 caracteres'),
  contribuyente_especial: Yup.string()
    .nullable()
    .matches(/^[0-9]*$/, 'Solo puede contener números')
    .max(20, 'No puede superar 20 caracteres'),
  obligado_contabilidad: Yup.string()
    .nullable()
    .oneOf(['SI', 'NO', ''], 'El valor debe ser SI o NO'),
  tipo_identificacion: Yup.string()
    .nullable()
    .oneOf(['04', '05', '06', '07', '08', ''], 'Tipo de identificación inválido'),
  lista_precio_id: Yup.number().nullable().optional()
});

// ======================
//  Perchas
// ======================
export const perchaSchema = Yup.object({
  nombre: Yup.string()
    .required('El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  codigo: Yup.string()
    .required('El código es obligatorio')
    .matches(
      /^[A-Za-z0-9_-]+$/,
      'El código solo puede contener letras, números, guiones y guiones bajos'
    ),
  descripcion: Yup.string()
    .required('El campo descripción es obligatorio')
    .min(5, 'La descripción debe tener al menos 5 caracteres'),
  almacen_id: Yup.number()
    .required('El campo almacén es obligatorio')
    .integer('El ID debe ser un número entero')
    .positive('El ID debe ser un número positivo')
});

// ======================
//  Productos
// ======================
export const productSchema = Yup.object({
  nombre: Yup.string()
    .required('El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  codigo: Yup.string()
    .required('El código es obligatorio')
    .matches(
      /^[A-Za-z0-9_-]+$/,
      'El código solo puede contener letras, números, guiones y guiones bajos'
    ),
  descripcion: Yup.string()
    .required('El campo descripción es obligatorio')
    .min(5, 'La descripción debe tener al menos 5 caracteres'),
  marca_id: Yup.number()
    .required('La marca es obligatoria')
    .integer('La marca debe ser un número entero')
    .positive('La marca debe ser un número positivo'),
  categoria_id: Yup.number()
    .required('El campo categoría es requerido')
    .integer('La categoría debe ser un número entero')
    .positive('La categoría debe ser un número positivo')
});

// ======================
//  Proveedores
// ======================
export const supplierSchema = Yup.object({
  razon_social: Yup.string()
    .required('La razón social es obligatoria')
    .min(3, 'La razón social debe tener al menos 3 caracteres')
    .max(150, 'La razón social no puede superar 150 caracteres'),
  nombre_contacto: Yup.string()
    .required('El nombre del contacto es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  ruc: Yup.string()
    .required('El RUC es obligatorio')
    .matches(/^[0-9]+$/, 'El RUC solo puede contener números')
    .length(13, 'El RUC debe tener exactamente 13 dígitos'),
  telefono: Yup.string()
    .required('El teléfono es obligatorio')
    .matches(/^[0-9]{7,15}$/, 'El teléfono debe tener entre 7 y 15 dígitos'),
  email: Yup.string().required('El email es obligatorio').email('Debe ser un email válido')
});

// ======================
//  almacenes
// ======================
export const warehouseSchema = Yup.object({
  nombre: Yup.string()
    .required('El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  ubicacion: Yup.string()
    .required('La descripción es obligatoria')
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(255, 'La descripción no puede superar 255 caracteres')
});

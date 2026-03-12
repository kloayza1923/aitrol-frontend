import { Container } from '@/components/container';
import { useState, useEffect } from 'react';
import { FetchData } from '@/utils/FetchData';
import { CameraIcon } from 'lucide-react';
import { employeeSchema } from '@/validations/tthValidations';
import { useFormik } from 'formik';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { useNotification } from '@/hooks';

const EmployeeCreate = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [jefes, setJefes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const notification = useNotification();
  const formik = useFormik({
    initialValues: {
      cedula: '',
      nombres: '',
      apellidos: '',
      fecha_nacimiento: '',
      direccion: '',
      telefono: '',
      email: '',
      fecha_ingreso: '',
      cargo: '',
      sueldo_basico: '',
      area_id: '',
      jefe_id: '',
      foto: null as File | null,
      cuenta_bancaria: '',
      tipo_cuenta_bancaria: '',
      fecha_salida: '',
      acumula: false,
      p_hipotecario: 0,
      p_quirografario: 0,
      seguro_priv: 0,
      usuario_id: null as number | null,
      hora_entrada: null as string | null,
      hora_salida: null as string | null,
      cargo_id: null as number | null
    },
    validationSchema: employeeSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setLoading(true);

      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          formData.append(key, value as any);
        }
      });

      try {
        const res = await FetchData('/rrhh/empleados', 'POST', formData);
        if (res.mensaje) {
          notification.success('Empleado creado exitosamente', res.mensaje);
          resetForm();
          setPreview(null);
        } else {
          notification.error('Error creando empleado, por favor intente nuevamente');
        }
      } catch (error) {
        console.error('Error al crear empleado:', error);
        notification.error('Error al crear empleado, por favor intente nuevamente');
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    }
  });
  useEffect(() => {
    console.log(formik.values);
    console.log(formik.errors);
  }, [formik.values]);

  useEffect(() => {
    const loadData = async () => {
      const areasData = await FetchData('/rrhh/areas');
      setAreas(areasData || []);
      const jefesData = await FetchData('/rrhh/empleados');
      setJefes(jefesData || []);
      const usuariosData = await FetchData('/users');
      setUsuarios(usuariosData || []);
      const cargosData = await FetchData('/rrhh/cargos');
      setCargos(cargosData || []);
      console.log(cargosData);
    };
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      formik.setFieldValue('foto', file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <Container>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Crear Nuevo Empleado</h2>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Card Datos Personales */}
        <div className="p-6 rounded-2xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Datos Personales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Cédula"
              name="cedula"
              value={formik.values.cedula}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.cedula && Boolean(formik.errors.cedula)}
              helperText={formik.touched.cedula && formik.errors.cedula}
              fullWidth
            />
            <TextField
              label="Nombres"
              name="nombres"
              value={formik.values.nombres}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.nombres && Boolean(formik.errors.nombres)}
              helperText={formik.touched.nombres && formik.errors.nombres}
              fullWidth
            />
            <TextField
              label="Apellidos"
              name="apellidos"
              value={formik.values.apellidos}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.apellidos && Boolean(formik.errors.apellidos)}
              helperText={formik.touched.apellidos && formik.errors.apellidos}
              fullWidth
            />
            <TextField
              label="Fecha de Nacimiento"
              name="fecha_nacimiento"
              type="date"
              value={formik.values.fecha_nacimiento}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.fecha_nacimiento && Boolean(formik.errors.fecha_nacimiento)}
              helperText={formik.touched.fecha_nacimiento && formik.errors.fecha_nacimiento}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Usuario"
              name="usuario_id"
              select
              value={formik.values.usuario_id || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.usuario_id && Boolean(formik.errors.usuario_id)}
              helperText={formik.touched.usuario_id && formik.errors.usuario_id}
              fullWidth
            >
              <MenuItem value="">Seleccione un usuario</MenuItem>
              {usuarios.map((usuario) => (
                <MenuItem key={usuario.id} value={usuario.id}>
                  {usuario.nombre}
                </MenuItem>
              ))}
            </TextField>
          </div>

          {/* Foto */}
          <div className="mt-4">
            <span className="block text-sm font-medium">Foto</span>
            <div className="flex items-center gap-4 mt-2">
              <label className="cursor-pointer">
                <div className="w-32 h-32 rounded-lg border flex items-center justify-center bg-gray-50 hover:bg-gray-100">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Vista previa"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <CameraIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Card Datos de Contacto */}
        <div className="p-6 rounded-2xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Datos de Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Dirección"
              name="direccion"
              value={formik.values.direccion}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.direccion && Boolean(formik.errors.direccion)}
              helperText={formik.touched.direccion && formik.errors.direccion}
              fullWidth
            />
            <TextField
              label="Teléfono"
              name="telefono"
              value={formik.values.telefono}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.telefono && Boolean(formik.errors.telefono)}
              helperText={formik.touched.telefono && formik.errors.telefono}
              fullWidth
            />
            <TextField
              label="Correo Electrónico"
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              fullWidth
            />
          </div>
        </div>

        {/* Card Datos Laborales */}
        <div className="bg-color p-6 rounded-2xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Datos Laborales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Fecha de Ingreso"
              name="fecha_ingreso"
              type="date"
              value={formik.values.fecha_ingreso}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.fecha_ingreso && Boolean(formik.errors.fecha_ingreso)}
              helperText={formik.touched.fecha_ingreso && formik.errors.fecha_ingreso}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Cargo"
              name="cargo"
              value={formik.values.cargo}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.cargo && Boolean(formik.errors.cargo)}
              helperText={formik.touched.cargo && formik.errors.cargo}
              fullWidth
            />
            <TextField
              label="Sueldo Básico"
              name="sueldo_basico"
              type="number"
              value={formik.values.sueldo_basico}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.sueldo_basico && Boolean(formik.errors.sueldo_basico)}
              helperText={formik.touched.sueldo_basico && formik.errors.sueldo_basico}
              fullWidth
            />
            <TextField
              label="Área"
              name="area_id"
              select
              value={formik.values.area_id || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.area_id && Boolean(formik.errors.area_id)}
              helperText={formik.touched.area_id && formik.errors.area_id}
              fullWidth
            >
              <MenuItem value="">Seleccione un área</MenuItem>
              {areas.map((area) => (
                <MenuItem key={area.id} value={area.id}>
                  {area.nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Cuenta Bancaria"
              name="cuenta_bancaria"
              value={formik.values.cuenta_bancaria}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.cuenta_bancaria && Boolean(formik.errors.cuenta_bancaria)}
              helperText={formik.touched.cuenta_bancaria && formik.errors.cuenta_bancaria}
              fullWidth
            />
            <TextField
              label="Tipo de Cuenta Bancaria"
              name="tipo_cuenta_bancaria"
              select
              value={formik.values.tipo_cuenta_bancaria || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.tipo_cuenta_bancaria && Boolean(formik.errors.tipo_cuenta_bancaria)
              }
              helperText={formik.touched.tipo_cuenta_bancaria && formik.errors.tipo_cuenta_bancaria}
              fullWidth
            >
              <MenuItem value="">Seleccione un tipo de cuenta</MenuItem>
              <MenuItem value="Ahorros">Ahorros</MenuItem>
              <MenuItem value="Corriente">Corriente</MenuItem>
            </TextField>
            <TextField
              label="Préstamo Hipotecario"
              name="p_hipotecario"
              type="number"
              value={formik.values.p_hipotecario}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.p_hipotecario && Boolean(formik.errors.p_hipotecario)}
              helperText={formik.touched.p_hipotecario && formik.errors.p_hipotecario}
              fullWidth
            />
            <TextField
              label="Préstamo Quirografario"
              name="p_quirografario"
              type="number"
              value={formik.values.p_quirografario}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.p_quirografario && Boolean(formik.errors.p_quirografario)}
              helperText={formik.touched.p_quirografario && formik.errors.p_quirografario}
              fullWidth
            />
            <TextField
              label="Seguro Privado"
              name="seguro_priv"
              type="number"
              value={formik.values.seguro_priv}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.seguro_priv && Boolean(formik.errors.seguro_priv)}
              helperText={formik.touched.seguro_priv && formik.errors.seguro_priv}
              fullWidth
            />
            <TextField
              label="Fecha Salida"
              name="fecha_salida"
              type="date"
              value={formik.values.fecha_salida || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.fecha_salida && Boolean(formik.errors.fecha_salida)}
              helperText={formik.touched.fecha_salida && formik.errors.fecha_salida}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <label className="flex items-center">
              <input
                type="checkbox"
                name="acumula"
                checked={formik.values.acumula}
                onChange={(e) => formik.setFieldValue('acumula', e.target.checked)}
                className="checkbox"
              />
              <span className="ml-2">Acumula IEES</span>
            </label>
            <TextField
              label="Jefe Inmediato"
              name="jefe_id"
              select
              value={formik.values.jefe_id || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.jefe_id && Boolean(formik.errors.jefe_id)}
              helperText={formik.touched.jefe_id && formik.errors.jefe_id}
              fullWidth
            >
              <MenuItem value="">Seleccione un jefe</MenuItem>
              {jefes.map((jefe) => (
                <MenuItem key={jefe.id} value={jefe.id}>
                  {jefe.nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Cargo"
              name="cargo_id"
              select
              value={formik.values.cargo_id || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.cargo_id && Boolean(formik.errors.cargo_id)}
              helperText={formik.touched.cargo_id && formik.errors.cargo_id}
              fullWidth
            >
              <MenuItem value="">Seleccione un cargo</MenuItem>
              {cargos.map((cargo) => (
                <MenuItem key={cargo.id} value={cargo.id}>
                  {cargo.nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Hora de Entrada"
              name="hora_entrada"
              type="time"
              value={formik.values.hora_entrada || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.hora_entrada && Boolean(formik.errors.hora_entrada)}
              helperText={formik.touched.hora_entrada && formik.errors.hora_entrada}
              fullWidth
            />
            <TextField
              label="Hora de Salida"
              name="hora_salida"
              type="time"
              value={formik.values.hora_salida || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.hora_salida && Boolean(formik.errors.hora_salida)}
              helperText={formik.touched.hora_salida && formik.errors.hora_salida}
              fullWidth
            />
          </div>
        </div>

        {/* Botón */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? 'Guardando...' : 'Crear Empleado'}
          </button>
        </div>
      </form>
    </Container>
  );
};

export default EmployeeCreate;

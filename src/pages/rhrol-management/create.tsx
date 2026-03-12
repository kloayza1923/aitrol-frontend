import { Container } from '@/components/container';
import { useEffect, useState } from 'react';
import { FetchData } from '@/utils/FetchData';
import { Button, MenuItem, TextField, Checkbox, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { roleSchema } from '@/validations/tthValidations';
import { useFormik } from 'formik';

interface Empleado {
  id: number;
  nombres: string;
  cedula: string;
  sueldo_basico?: number; // Added optional sueldo_basico property
}

const CrearRolPago = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      tipo_rol: 'Mensual',
      mes_correspondiente: '',
      anio_correspondiente: new Date().getFullYear().toString(),
      empleados: [] as number[] // Explicitly define empleados as an array of numbers
    },
    validationSchema: roleSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const payload = {
        ...values,
        empleados: empleados
          .filter((emp) => values.empleados.includes(emp.id))
          .map((emp) => ({
            empleado_id: emp.id,
            sueldo_basico: emp.sueldo_basico || 0
          }))
      };

      try {
        const res = await FetchData('/rrhh/roles_pago', 'POST', payload);
        if (res.mensaje) {
          toast.success(res.mensaje);
          navigate(`/rhrol-management`);
        }
      } catch (error) {
        console.error(error);
        toast.error('Error al generar el rol de pago');
      } finally {
        setSubmitting(false);
      }
    }
  });

  useEffect(() => {
    const getEmpleados = async () => {
      const data: Empleado[] = await FetchData('/rrhh/empleados', 'GET', { estado: 'activo' });
      setEmpleados(data || []);
      formik.setFieldValue(
        'empleados',
        data.map((emp) => emp.id)
      );
    };
    getEmpleados();
  }, []);

  const handleSelectEmpleado = (event: React.ChangeEvent<{ value: unknown }>) => {
    const { value } = event.target;
    formik.setFieldValue(
      'empleados',
      typeof value === 'string' ? value.split(',').map(Number) : (value as number[])
    );
  };

  const meses = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  return (
    <Container>
      <h2 className="text-xl font-bold mb-4">Crear Rol de Pago</h2>

      <form onSubmit={formik.handleSubmit}>
        {/* Tipo de Rol */}
        <TextField
          select
          label="Tipo de Rol"
          name="tipo_rol"
          value={formik.values.tipo_rol}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.tipo_rol && Boolean(formik.errors.tipo_rol)}
          helperText={formik.touched.tipo_rol && formik.errors.tipo_rol}
          fullWidth
          sx={{ mb: 2 }}
        >
          <MenuItem value="Mensual">Mensual</MenuItem>
          <MenuItem value="Quincenal">Quincenal</MenuItem>
        </TextField>

        {/* Mes Correspondiente */}
        <TextField
          select
          label="Mes Correspondiente"
          name="mes_correspondiente"
          value={formik.values.mes_correspondiente}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.mes_correspondiente && Boolean(formik.errors.mes_correspondiente)}
          helperText={formik.touched.mes_correspondiente && formik.errors.mes_correspondiente}
          fullWidth
          sx={{ mb: 2 }}
        >
          {meses.map((mes) => (
            <MenuItem key={mes.value} value={mes.value}>
              {mes.label}
            </MenuItem>
          ))}
        </TextField>

        {/* Año Correspondiente */}
        <TextField
          type="number"
          label="Año Correspondiente"
          name="anio_correspondiente"
          value={formik.values.anio_correspondiente}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.anio_correspondiente && Boolean(formik.errors.anio_correspondiente)}
          helperText={formik.touched.anio_correspondiente && formik.errors.anio_correspondiente}
          fullWidth
          sx={{ mb: 2 }}
        />

        {/* Empleados */}
        <TextField
          select
          label="Seleccionar Empleados"
          name="empleados"
          value={formik.values.empleados}
          onChange={handleSelectEmpleado}
          onBlur={formik.handleBlur}
          error={formik.touched.empleados && Boolean(formik.errors.empleados)}
          helperText={formik.touched.empleados && formik.errors.empleados}
          fullWidth
          SelectProps={{
            multiple: true,
            renderValue: (selected) =>
              empleados
                .filter((emp) => (selected as number[]).includes(emp.id))
                .map((emp) => emp.nombres)
                .join(', ')
          }}
          sx={{ mb: 2 }}
        >
          {empleados.map((emp) => (
            <MenuItem key={emp.id} value={emp.id}>
              <Checkbox checked={formik.values.empleados.includes(emp.id)} />
              <ListItemText primary={`${emp.nombres} (${emp.cedula})`} />
            </MenuItem>
          ))}
        </TextField>

        {/* Botón */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => formik.handleSubmit()}
          disabled={!formik.isValid || formik.isSubmitting}
          fullWidth
        >
          {formik.isSubmitting ? 'Generando...' : 'Generar Rol'}
        </Button>
      </form>
    </Container>
  );
};

export default CrearRolPago;

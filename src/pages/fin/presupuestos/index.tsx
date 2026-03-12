import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import {
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Grid,
  Chip
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import * as yup from 'yup';

type Presupuesto = {
  id?: number;
  nombre: string;
  descripcion: string;
  anio: number | '';
  periodo: string;
  tipo: string;
  monto_total: number | '';
  monto_ejecutado?: number;
  monto_disponible?: number;
  porcentaje_ejecucion?: number;
  estado: string;
};

const presupuestoSchema = yup.object().shape({
  nombre: yup.string().required('El nombre es requerido'),
  anio: yup.number().required('El año es requerido').positive().integer(),
  tipo: yup.string().required('El tipo es requerido'),
  monto_total: yup.number().required('El monto total es requerido').positive()
});

const PresupuestosManagement = () => {
  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 2, minWidth: 200 },
    { field: 'anio', headerName: 'Año', flex: 0.8, minWidth: 80 },
    { field: 'periodo', headerName: 'Periodo', flex: 1, minWidth: 100 },
    { field: 'tipo', headerName: 'Tipo', flex: 1, minWidth: 120 },
    {
      field: 'monto_total',
      headerName: 'Monto Total',
      flex: 1.2,
      minWidth: 130,
      renderCell: (params) =>
        `$${Number(params.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    },
    {
      field: 'monto_ejecutado',
      headerName: 'Ejecutado',
      flex: 1.2,
      minWidth: 130,
      renderCell: (params) =>
        `$${Number(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    },
    {
      field: 'monto_disponible',
      headerName: 'Disponible',
      flex: 1.2,
      minWidth: 130,
      renderCell: (params) =>
        `$${Number(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    },
    {
      field: 'porcentaje_ejecucion',
      headerName: '% Ejecución',
      flex: 1,
      minWidth: 110,
      renderCell: (params) => `${Number(params.value || 0).toFixed(1)}%`
    },
    {
      field: 'estado',
      headerName: 'Estado',
      flex: 1,
      minWidth: 110,
      renderCell: (params) => {
        const colors: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
          ACTIVO: 'success',
          INACTIVO: 'default',
          APROBADO: 'info',
          RECHAZADO: 'error'
        };
        return <Chip label={params.value} color={colors[params.value] || 'default'} size="small" />;
      }
    }
  ];

  return (
    <Container>
      <CrudDataGrid<Presupuesto>
        title="Presupuestos"
        endpoint="/fin/presupuestos"
        mode="crud"
        schema={presupuestoSchema}
        columns={columns}
        defaultFormValues={{
          nombre: '',
          descripcion: '',
          anio: new Date().getFullYear(),
          periodo: 'ANUAL',
          tipo: 'GENERAL',
          monto_total: '',
          estado: 'ACTIVO'
        }}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Nombre"
                  name="nombre"
                  value={formValues.nombre}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={Boolean(errors?.nombre)}
                  helperText={errors?.nombre}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descripción"
                  name="descripcion"
                  value={formValues.descripcion}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Año"
                  name="anio"
                  type="number"
                  value={formValues.anio}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={Boolean(errors?.anio)}
                  helperText={errors?.anio}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Periodo</InputLabel>
                  <Select
                    name="periodo"
                    value={formValues.periodo}
                    onChange={handleChange}
                    label="Periodo"
                  >
                    <MenuItem value="MENSUAL">MENSUAL</MenuItem>
                    <MenuItem value="TRIMESTRAL">TRIMESTRAL</MenuItem>
                    <MenuItem value="ANUAL">ANUAL</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth margin="normal" error={Boolean(errors?.tipo)}>
                  <InputLabel>Tipo</InputLabel>
                  <Select name="tipo" value={formValues.tipo} onChange={handleChange} label="Tipo">
                    <MenuItem value="INGRESOS">INGRESOS</MenuItem>
                    <MenuItem value="EGRESOS">EGRESOS</MenuItem>
                    <MenuItem value="GENERAL">GENERAL</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Monto Total"
                  name="monto_total"
                  type="number"
                  value={formValues.monto_total}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={Boolean(errors?.monto_total)}
                  helperText={errors?.monto_total}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estado"
                    value={formValues.estado}
                    onChange={handleChange}
                    label="Estado"
                  >
                    <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                    <MenuItem value="INACTIVO">INACTIVO</MenuItem>
                    <MenuItem value="APROBADO">APROBADO</MenuItem>
                    <MenuItem value="RECHAZADO">RECHAZADO</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </>
        )}
      />
    </Container>
  );
};

export default PresupuestosManagement;
